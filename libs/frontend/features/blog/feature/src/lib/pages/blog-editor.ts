import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { HlmFieldImports } from '@kuetelabs/frontend/ui/components/field';
import { HlmInputImports } from '@kuetelabs/frontend/ui/components/input';
import { HlmTextareaImports } from '@kuetelabs/frontend/ui/components/textarea';
import { BlogAdminStore } from '@kuetelabs/frontend/features/blog/data-access';
import {
  BLOG_SLUG_PATTERN,
  type CreateBlogPostDto,
  estimateReadingMinutes,
  slugify,
} from '@kuetelabs/shared/domain';
import { renderMarkdown } from '../markdown';

/**
 * Create and edit a post.
 *
 * The route is `blog/new` or `blog/:id`; `id` arrives as a routed input and is
 * `'new'` for a fresh post. Saving goes through the API — `blog_posts` has no client
 * write policy — and publishing is a separate button because it needs a separate
 * permission.
 */
@Component({
  selector: 'lib-blog-editor',
  imports: [
    ReactiveFormsModule,
    ...HlmCardImports,
    ...HlmFieldImports,
    ...HlmInputImports,
    ...HlmTextareaImports,
    ...HlmButtonImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 p-4">
      <form [formGroup]="form" (ngSubmit)="save()">
        <section hlmCard>
          <div hlmCardHeader class="flex-row items-start justify-between gap-4">
            <div>
              <h2 hlmCardTitle>{{ isNew() ? 'New post' : 'Edit post' }}</h2>
              <p hlmCardDescription>
                Markdown body. {{ readingMinutes() }} min read, {{ characterCount() }} characters.
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <button hlmBtn variant="ghost" type="button" (click)="cancel()">Cancel</button>
              <button hlmBtn type="submit" [disabled]="form.invalid || store.saving()">
                {{ store.saving() ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </div>

          <div hlmCardContent class="flex flex-col gap-6">
            @if (store.error(); as error) {
              <p class="text-destructive text-sm" role="alert">{{ error }}</p>
            }

            <hlm-field-group>
              <hlm-field>
                <label hlmFieldLabel for="title">Title</label>
                <input
                  hlmInput
                  id="title"
                  formControlName="title"
                  placeholder="Row level security in practice"
                  (blur)="proposeSlug()"
                />
              </hlm-field>

              <hlm-field>
                <label hlmFieldLabel for="slug">Slug</label>
                <input hlmInput id="slug" formControlName="slug" placeholder="row-level-security" />
                <p class="text-muted-foreground text-xs">
                  The URL segment: /blog/{{ form.controls.slug.value || 'your-post' }}. Lower-case
                  words separated by single hyphens.
                </p>
              </hlm-field>

              <hlm-field>
                <label hlmFieldLabel for="excerpt">Excerpt</label>
                <textarea
                  hlmTextarea
                  id="excerpt"
                  rows="2"
                  formControlName="excerpt"
                  placeholder="One or two sentences for the card and the meta description."
                ></textarea>
              </hlm-field>

              <hlm-field>
                <label hlmFieldLabel for="tags">Tags</label>
                <input hlmInput id="tags" formControlName="tags" placeholder="supabase, angular" />
                <p class="text-muted-foreground text-xs">Comma separated, up to ten.</p>
              </hlm-field>

              <hlm-field>
                <label hlmFieldLabel for="coverImageUrl">Cover image URL</label>
                <input
                  hlmInput
                  id="coverImageUrl"
                  formControlName="coverImageUrl"
                  placeholder="https://…"
                />
              </hlm-field>

              <hlm-field>
                <label hlmFieldLabel for="content">Body</label>
                <textarea
                  hlmTextarea
                  id="content"
                  rows="18"
                  class="font-mono text-sm"
                  formControlName="content"
                ></textarea>
              </hlm-field>
            </hlm-field-group>

            <div class="flex items-center gap-2">
              <button hlmBtn variant="outline" size="sm" type="button" (click)="togglePreview()">
                {{ previewOpen() ? 'Hide preview' : 'Show preview' }}
              </button>
            </div>

            @if (previewOpen()) {
              <div class="border-border rounded-lg border p-6">
                <div [innerHTML]="preview()"></div>
              </div>
            }
          </div>
        </section>
      </form>
    </div>
  `,
})
export class BlogEditor {
  protected readonly store = inject(BlogAdminStore);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  /** `'new'` for a fresh post, otherwise the post id. */
  public readonly id = input.required<string>();

  protected readonly isNew = computed(() => this.id() === 'new');
  protected readonly previewOpen = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    slug: ['', [Validators.required, Validators.pattern(BLOG_SLUG_PATTERN)]],
    excerpt: ['', Validators.maxLength(400)],
    tags: [''],
    coverImageUrl: [''],
    content: ['', Validators.required],
  });

  private readonly body = signal('');

  protected readonly preview = computed(() => renderMarkdown(this.body()));
  protected readonly readingMinutes = computed(() => estimateReadingMinutes(this.body()));
  protected readonly characterCount = computed(() => this.body().length);

  constructor() {
    // Load whatever the route points at. `edit(null)` clears the editor, so
    // navigating from a post to "new" does not leave the previous body behind.
    effect(() => {
      void this.store.edit(this.isNew() ? null : this.id());
    });

    // Fill the form when the post arrives. `emitEvent: false` because this is not
    // the author typing — it is the initial value.
    effect(() => {
      const post = this.store.editing();
      if (!post) {
        return;
      }
      this.form.setValue(
        {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? '',
          tags: post.tags.join(', '),
          coverImageUrl: post.coverImageUrl ?? '',
          content: post.content,
        },
        { emitEvent: false },
      );
      this.body.set(post.content);
    });

    // The preview and the counters read a signal rather than the control directly,
    // because a reactive control is not one.
    this.form.controls.content.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.body.set(value ?? ''));
  }

  /** Fills an empty slug from the title. Never overwrites one the author typed. */
  protected proposeSlug(): void {
    const slug = this.form.controls.slug;
    if (!slug.value.trim()) {
      slug.setValue(slugify(this.form.controls.title.value));
    }
  }

  protected togglePreview(): void {
    this.previewOpen.update((open) => !open);
  }

  protected cancel(): void {
    void this.router.navigateByUrl(this.listUrl());
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const fields = {
      title: value.title.trim(),
      slug: value.slug.trim(),
      content: value.content,
      excerpt: value.excerpt.trim() || undefined,
      coverImageUrl: value.coverImageUrl.trim() || undefined,
      tags: value.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    // A new post starts as a draft; an edit sends no status at all, so the stored
    // one is left alone. Publishing is its own action with its own permission, and
    // putting `status` in this payload would route around it.
    const dto: CreateBlogPostDto | Omit<CreateBlogPostDto, 'status'> = this.isNew()
      ? { ...fields, status: 'draft' }
      : fields;

    const saved = await this.store.save(this.isNew() ? null : this.id(), dto);

    // Only leave on success: on a duplicate slug the author needs the form back,
    // with the message the store captured.
    if (saved) {
      void this.router.navigateByUrl(this.listUrl());
    }
  }

  /** The index lives one segment up from both `new` and `:id`. */
  private listUrl(): string {
    const url = this.router.url.split('?')[0];
    return url.slice(0, url.lastIndexOf('/')) || '/';
  }
}

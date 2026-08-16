import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { HlmBadgeImports } from '@kuetelabs/frontend/ui/components/badge';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmSkeletonImports } from '@kuetelabs/frontend/ui/components/skeleton';
import { injectCopyResolver } from '@kuetelabs/frontend/ui/i18n';
import { BlogStore } from '@kuetelabs/frontend/features/blog/data-access';
import { renderMarkdown } from '../markdown';

/**
 * One article, at /blog/:slug.
 *
 * `slug` arrives as a routed input, so the app mounting this must use
 * `withComponentInputBinding()` — both apps here do. It is an input rather than a
 * snapshot read because Angular reuses this component when navigating from one post
 * to another, and `ngOnInit` would not run a second time.
 */
@Component({
  selector: 'lib-blog-post',
  imports: [DatePipe, RouterLink, ...HlmBadgeImports, ...HlmButtonImports, ...HlmSkeletonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <a hlmBtn variant="ghost" size="sm" class="-ml-3" routerLink="/blog">
        {{ t()('blog.post.back', '← All posts') }}
      </a>

      @if (store.postLoading()) {
        <div class="mt-8 flex flex-col gap-4">
          <div hlmSkeleton class="h-10 w-3/4"></div>
          <div hlmSkeleton class="h-4 w-40"></div>
          <div hlmSkeleton class="h-64 w-full"></div>
        </div>
      } @else if (store.postMissing()) {
        <!--
          Rendered in place rather than redirected, so the address bar keeps the URL
          that was asked for — the same choice the app-level 404 makes.
        -->
        <div class="py-16 text-center">
          <h1 class="text-2xl font-semibold tracking-tight">
            {{ t()('blog.post.notFoundTitle', 'This post does not exist') }}
          </h1>
          <p class="text-muted-foreground mt-3 text-sm text-pretty">
            {{ t()('blog.post.notFoundBody', 'It may have been unpublished, or the link may be wrong.') }}
          </p>
          <a hlmBtn class="mt-8" routerLink="/blog">
            {{ t()('blog.post.notFoundAction', 'Back to the blog') }}
          </a>
        </div>
      } @else if (store.post(); as post) {
        <article class="mt-8">
          <header class="flex flex-col gap-4">
            <div class="flex flex-wrap items-center gap-2">
              @for (tag of post.tags; track tag) {
                <span hlmBadge variant="secondary" class="text-[10px]">{{ tag }}</span>
              }
            </div>

            <h1 class="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {{ post.title }}
            </h1>

            @if (post.excerpt) {
              <p class="text-muted-foreground text-lg text-pretty">{{ post.excerpt }}</p>
            }

            <p class="text-muted-foreground text-xs">
              @if (post.publishedAt) {
                <time [attr.datetime]="post.publishedAt">
                  {{ post.publishedAt | date: 'longDate' }}
                </time>
                <span aria-hidden="true"> · </span>
              }
              {{ t()('blog.readingTime', post.readingMinutes + ' min read', { minutes: post.readingMinutes }) }}
            </p>
          </header>

          @if (post.coverImageUrl) {
            <img
              [src]="post.coverImageUrl"
              alt=""
              class="border-border mt-8 aspect-video w-full rounded-xl border object-cover"
            />
          }

          <!--
            The body is markdown rendered to a fixed set of tags, escaped before any
            transform runs — see markdown.ts. Angular's sanitizer is the second layer.
          -->
          <div class="mt-10" [innerHTML]="body()"></div>
        </article>
      } @else if (store.error(); as error) {
        <p class="text-destructive mt-8 text-sm" role="alert">{{ error }}</p>
      }
    </div>
  `,
})
export class BlogPost {
  protected readonly store = inject(BlogStore);
  protected readonly t = injectCopyResolver();
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  public readonly slug = input.required<string>();

  protected readonly body = computed(() => renderMarkdown(this.store.post()?.content ?? ''));

  constructor() {
    // Loads on first render and on every slug change. Runs on the server as well;
    // the store holds a pending task open so SSR waits for the article rather than
    // serializing an empty shell — which is the whole point of a server-rendered blog.
    effect(() => {
      void this.store.loadPost(this.slug());
    });

    // Title and description are set here, not in route data: they come from the row.
    // Setting them during the server render is what puts them in the served HTML.
    effect(() => {
      const post = this.store.post();
      if (!post) {
        return;
      }
      this.title.setTitle(post.title);
      if (post.excerpt) {
        this.meta.updateTag({ name: 'description', content: post.excerpt });
      }
    });
  }
}

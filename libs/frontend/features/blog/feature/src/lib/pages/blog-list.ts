import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HlmBadgeImports } from '@kuetelabs/frontend/ui/components/badge';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmInputImports } from '@kuetelabs/frontend/ui/components/input';
import { HlmSkeletonImports } from '@kuetelabs/frontend/ui/components/skeleton';
import { injectCopyResolver } from '@kuetelabs/frontend/ui/i18n';
import { BlogStore } from '@kuetelabs/frontend/features/blog/data-access';

/**
 * The public feed at /blog.
 *
 * Copy goes through `injectCopyResolver()` with a literal fallback rather than the
 * transloco pipe, so the page still renders in an app that never called
 * `provideI18n()` — the same rule the error and landing screens follow.
 */
@Component({
  selector: 'lib-blog-list',
  imports: [
    DatePipe,
    RouterLink,
    ...HlmBadgeImports,
    ...HlmButtonImports,
    ...HlmInputImports,
    ...HlmSkeletonImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <header class="mx-auto max-w-2xl text-center">
        <p class="text-primary text-xs font-medium tracking-widest uppercase">
          {{ t()('blog.eyebrow', 'Blog') }}
        </p>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {{ t()('blog.list.heading', 'Notes from the team') }}
        </h1>
        <p class="text-muted-foreground mt-4 text-pretty">
          {{ t()('blog.list.description', 'Product updates, engineering notes, and the occasional opinion.') }}
        </p>
      </header>

      <div class="mx-auto mt-10 flex max-w-2xl flex-col gap-4">
        <label class="sr-only" for="blog-search">
          {{ t()('blog.list.searchLabel', 'Search posts') }}
        </label>
        <input
          hlmInput
          id="blog-search"
          type="search"
          [placeholder]="t()('blog.list.searchPlaceholder', 'Search posts…')"
          (input)="store.search($any($event.target).value)"
        />

        @if (store.tags().length) {
          <div class="flex flex-wrap items-center justify-center gap-2">
            <button
              hlmBtn
              size="sm"
              [variant]="store.tag() === null ? 'default' : 'outline'"
              (click)="store.filterByTag(null)"
            >
              {{ t()('blog.list.allTags', 'All') }}
            </button>
            @for (tag of store.tags(); track tag) {
              <button
                hlmBtn
                size="sm"
                [variant]="store.tag() === tag ? 'default' : 'outline'"
                (click)="store.filterByTag(tag)"
              >
                {{ tag }}
              </button>
            }
          </div>
        }
      </div>

      @if (store.error(); as error) {
        <p class="text-destructive mt-10 text-center text-sm" role="alert">{{ error }}</p>
      }

      @if (store.loading()) {
        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (placeholder of skeletons; track placeholder) {
            <div class="border-border flex flex-col gap-3 rounded-xl border p-5">
              <div hlmSkeleton class="h-4 w-20"></div>
              <div hlmSkeleton class="h-6 w-full"></div>
              <div hlmSkeleton class="h-16 w-full"></div>
            </div>
          }
        </div>
      } @else if (store.isEmpty()) {
        <p class="text-muted-foreground mt-16 text-center text-sm">
          {{ t()('blog.list.empty', 'Nothing published yet. Check back soon.') }}
        </p>
      } @else {
        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (post of store.entities(); track post.id) {
            <article
              class="border-border hover:border-primary/40 group relative flex flex-col overflow-hidden rounded-xl border transition-colors"
            >
              @if (post.coverImageUrl) {
                <img
                  [src]="post.coverImageUrl"
                  alt=""
                  class="aspect-video w-full object-cover"
                  loading="lazy"
                />
              }

              <div class="flex flex-1 flex-col gap-3 p-5">
                <div class="flex flex-wrap items-center gap-2">
                  @for (tag of post.tags; track tag) {
                    <span hlmBadge variant="secondary" class="text-[10px]">{{ tag }}</span>
                  }
                </div>

                <h2 class="text-lg leading-snug font-semibold tracking-tight text-balance">
                  <a
                    class="after:absolute after:inset-0 group-hover:underline"
                    [routerLink]="['/blog', post.slug]"
                  >
                    {{ post.title }}
                  </a>
                </h2>

                @if (post.excerpt) {
                  <p class="text-muted-foreground line-clamp-3 text-sm text-pretty">
                    {{ post.excerpt }}
                  </p>
                }

                <p class="text-muted-foreground mt-auto pt-2 text-xs">
                  @if (post.publishedAt) {
                    <time [attr.datetime]="post.publishedAt">
                      {{ post.publishedAt | date: 'mediumDate' }}
                    </time>
                    <span aria-hidden="true"> · </span>
                  }
                  {{ t()('blog.readingTime', post.readingMinutes + ' min read', { minutes: post.readingMinutes }) }}
                </p>
              </div>
            </article>
          }
        </div>

        @if (store.hasMore()) {
          <div class="mt-12 flex justify-center">
            <button hlmBtn variant="outline" [disabled]="store.loadingMore()" (click)="store.loadMore()">
              {{
                store.loadingMore()
                  ? t()('blog.list.loading', 'Loading…')
                  : t()('blog.list.loadMore', 'Load more')
              }}
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class BlogList implements OnInit {
  protected readonly store = inject(BlogStore);
  protected readonly t = injectCopyResolver();

  /** Card placeholders while the first page is in flight. */
  protected readonly skeletons = [0, 1, 2, 3, 4, 5];

  ngOnInit(): void {
    // Runs on the server too. The store registers a pending task around the query,
    // which is what makes SSR wait for it instead of serializing an empty feed.
    void this.store.load();
  }
}

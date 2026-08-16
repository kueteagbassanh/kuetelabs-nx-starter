import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HlmBadgeImports } from '@kuetelabs/frontend/ui/components/badge';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { HlmInputImports } from '@kuetelabs/frontend/ui/components/input';
import { HlmTableImports } from '@kuetelabs/frontend/ui/components/table';
import { HasPermission } from '@kuetelabs/frontend/data-access/supabase';
import { BlogAdminStore } from '@kuetelabs/frontend/features/blog/data-access';
import { BLOG_POST_STATUSES, type BlogPostStatus } from '@kuetelabs/shared/domain';

/**
 * The authoring index.
 *
 * Everything here is behind a permission twice over: `*libHasPermission` decides
 * what renders, and the API re-checks the same claim on the request. Only the
 * second one is security.
 */
@Component({
  selector: 'lib-blog-admin-list',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ...HlmCardImports,
    ...HlmTableImports,
    ...HlmBadgeImports,
    ...HlmButtonImports,
    ...HlmInputImports,
    HasPermission,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 p-4">
      <section hlmCard>
        <div hlmCardHeader class="flex-row items-center justify-between gap-4">
          <div>
            <h2 hlmCardTitle>Posts</h2>
            <p hlmCardDescription>
              {{ store.publishedCount() }} published, {{ store.draftCount() }} draft(s).
              Publishing is a separate permission from writing.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <input
              hlmInput
              type="search"
              placeholder="Search posts"
              class="w-56"
              [ngModel]="store.search()"
              (ngModelChange)="store.setSearch($event)"
            />
            <a *libHasPermission="'blog.write'" hlmBtn routerLink="new">New post</a>
          </div>
        </div>

        <div hlmCardContent class="flex flex-col gap-4">
          <div class="flex flex-wrap items-center gap-2">
            <button
              hlmBtn
              size="sm"
              [variant]="store.status() === null ? 'default' : 'outline'"
              (click)="store.filterByStatus(null)"
            >
              All
            </button>
            @for (status of statuses; track status) {
              <button
                hlmBtn
                size="sm"
                [variant]="store.status() === status ? 'default' : 'outline'"
                (click)="store.filterByStatus(status)"
              >
                {{ status }}
              </button>
            }
          </div>

          @if (store.error(); as error) {
            <p class="text-destructive text-sm" role="alert">{{ error }}</p>
          }

          @if (store.loading()) {
            <p class="text-muted-foreground py-6 text-sm">Loading posts…</p>
          } @else if (store.entities().length === 0) {
            <p class="text-muted-foreground py-6 text-sm">
              No posts match. Write one, or clear the filters.
            </p>
          } @else {
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh>Title</th>
                    <th hlmTh>Status</th>
                    <th hlmTh>Updated</th>
                    <th hlmTh class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @for (post of store.entities(); track post.id) {
                    <tr hlmTr>
                      <td hlmTd>
                        <div class="flex flex-col">
                          <span class="font-medium">{{ post.title }}</span>
                          <span class="text-muted-foreground font-mono text-xs">/{{ post.slug }}</span>
                        </div>
                      </td>
                      <td hlmTd>
                        <span
                          hlmBadge
                          [variant]="post.status === 'published' ? 'default' : 'secondary'"
                        >
                          {{ post.status }}
                        </span>
                      </td>
                      <td hlmTd class="text-muted-foreground text-xs">
                        {{ post.updatedAt | date: 'medium' }}
                      </td>
                      <td hlmTd class="text-right">
                        <a hlmBtn variant="ghost" size="sm" [routerLink]="[post.id]">Edit</a>

                        <button
                          *libHasPermission="'blog.publish'"
                          hlmBtn
                          variant="ghost"
                          size="sm"
                          (click)="store.setPublished(post.id, post.status !== 'published')"
                        >
                          {{ post.status === 'published' ? 'Unpublish' : 'Publish' }}
                        </button>

                        <button
                          *libHasPermission="'blog.write'"
                          hlmBtn
                          variant="ghost"
                          size="sm"
                          class="text-destructive"
                          (click)="remove(post.id, post.title)"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </section>
    </div>
  `,
})
export class BlogAdminList implements OnInit {
  protected readonly store = inject(BlogAdminStore);
  protected readonly statuses: readonly BlogPostStatus[] = BLOG_POST_STATUSES;

  ngOnInit(): void {
    void this.store.load();
  }

  /** Deleting an article is not undoable, so it asks first. */
  protected remove(id: string, title: string): void {
    if (globalThis.confirm?.(`Delete "${title}"? This cannot be undone.`)) {
      void this.store.remove(id);
    }
  }
}

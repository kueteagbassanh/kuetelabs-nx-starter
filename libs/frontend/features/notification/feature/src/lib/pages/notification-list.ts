import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { HlmBadgeImports } from '@kuetelabs/frontend/ui/components/badge';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { NotificationsStore } from '@kuetelabs/frontend/features/notification/data-access';
import type { AppNotification } from '@kuetelabs/shared/domain';

@Component({
  selector: 'lib-notification-list',
  imports: [DatePipe, ...HlmCardImports, ...HlmButtonImports, ...HlmBadgeImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 p-4">
      <section hlmCard>
        <div hlmCardHeader class="flex-row items-center justify-between">
          <div>
            <h2 hlmCardTitle>Notifications</h2>
            <p hlmCardDescription>
              {{ store.unreadCount() }} unread of {{ store.entities().length }}
            </p>
          </div>
          @if (store.hasUnread()) {
            <button hlmBtn variant="outline" size="sm" (click)="store.markAllRead()">
              Mark all read
            </button>
          }
        </div>

        <div hlmCardContent class="flex flex-col gap-2">
          @if (store.error(); as error) {
            <p class="text-destructive text-sm" role="alert">{{ error }}</p>
          }

          @for (item of store.entities(); track item.id) {
            <article
              class="border-border flex items-start justify-between gap-4 rounded-md border p-3"
              [class.bg-muted]="!item.read"
            >
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium">{{ item.title }}</span>
                  <span hlmBadge variant="outline" class="font-mono text-[10px]">{{ item.type }}</span>
                </div>
                @if (item.body) {
                  <p class="text-muted-foreground text-sm">{{ item.body }}</p>
                }
                <time class="text-muted-foreground text-xs" [attr.datetime]="item.createdAt">
                  {{ item.createdAt | date: 'medium' }}
                </time>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                @if (item.actionUrl) {
                  <button hlmBtn variant="ghost" size="sm" (click)="open(item)">View</button>
                }
                @if (!item.read) {
                  <button hlmBtn variant="ghost" size="sm" (click)="store.markRead(item.id)">
                    Mark read
                  </button>
                }
                <button hlmBtn variant="ghost" size="sm" (click)="store.dismiss(item.id)">
                  Dismiss
                </button>
              </div>
            </article>
          } @empty {
            <p class="text-muted-foreground py-8 text-center text-sm">
              No notifications. Role changes, invites, and account changes appear here.
            </p>
          }
        </div>
      </section>
    </div>
  `,
})
export class NotificationList implements OnInit {
  protected readonly store = inject(NotificationsStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.store.load();
  }

  protected open(item: AppNotification): void {
    if (!item.read) {
      void this.store.markRead(item.id);
    }
    if (item.actionUrl) {
      void this.router.navigateByUrl(item.actionUrl);
    }
  }
}

import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBell, lucideCheckCheck } from '@ng-icons/lucide';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmDropdownMenuImports } from '@kuetelabs/frontend/ui/components/dropdown-menu';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { ToastService } from '@kuetelabs/frontend/ui/toast';
import { NotificationsStore } from '@kuetelabs/frontend/features/notification/data-access';
import type { AppNotification } from '@kuetelabs/shared/domain';

/**
 * Bell + unread badge for the dashboard header, provided to the layout through
 * DASHBOARD_HEADER_ACTIONS so the layout itself stays app-agnostic.
 *
 * Also owns the toast-on-arrival behaviour: the store is data-access and may not
 * depend on a UI lib, so the bridge between "a row arrived" and "show a toast"
 * belongs here, in the feature layer.
 */
@Component({
  selector: 'lib-notification-bell',
  imports: [...HlmButtonImports, ...HlmDropdownMenuImports, NgIcon, HlmIcon],
  providers: [provideIcons({ lucideBell, lucideCheckCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      hlmBtn
      variant="ghost"
      size="icon"
      class="relative"
      [hlmDropdownMenuTrigger]="notificationMenu"
      [attr.aria-label]="
        store.unreadCount() > 0
          ? store.unreadCount() + ' unread notifications'
          : 'Notifications'
      "
    >
      <ng-icon hlm name="lucideBell" />
      @if (store.unreadCount(); as count) {
        <span
          class="bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium"
          aria-hidden="true"
        >
          {{ count > 9 ? '9+' : count }}
        </span>
      }
    </button>

    <ng-template #notificationMenu>
      <hlm-dropdown-menu class="w-80">
        <div class="flex items-center justify-between px-2 py-1.5">
          <span class="text-sm font-medium">Notifications</span>
          @if (store.hasUnread()) {
            <button hlmBtn variant="ghost" size="xs" (click)="store.markAllRead()">
              <ng-icon hlm name="lucideCheckCheck" />
              Mark all read
            </button>
          }
        </div>
        <div hlmDropdownMenuSeparator></div>

        @for (item of store.entities(); track item.id) {
          <button
            hlmDropdownMenuItem
            class="flex-col items-start gap-0.5"
            [class.opacity-60]="item.read"
            (click)="open(item)"
          >
            <span class="flex w-full items-center gap-2">
              @if (!item.read) {
                <span class="bg-primary size-1.5 shrink-0 rounded-full" aria-hidden="true"></span>
              }
              <span class="truncate text-sm font-medium">{{ item.title }}</span>
            </span>
            @if (item.body) {
              <span class="text-muted-foreground line-clamp-2 text-xs">{{ item.body }}</span>
            }
          </button>
        } @empty {
          <p class="text-muted-foreground px-2 py-6 text-center text-sm">
            Nothing yet. Role changes and invites show up here.
          </p>
        }
      </hlm-dropdown-menu>
    </ng-template>
  `,
})
export class NotificationBell {
  protected readonly store = inject(NotificationsStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      const arrival = this.store.lastArrival();
      if (!arrival) {
        return;
      }
      // untracked: acknowledging clears the signal this effect reads, and the toast
      // call itself must not register dependencies.
      untracked(() => {
        this.toast.info(arrival.title, {
          description: arrival.body ?? undefined,
          action: arrival.actionUrl
            ? { label: 'View', onClick: () => void this.router.navigateByUrl(arrival.actionUrl as string) }
            : undefined,
        });
        this.store.acknowledgeArrival();
      });
    });
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

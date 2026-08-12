import { ChangeDetectionStrategy, Component, afterNextRender, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideX } from '@ng-icons/lucide';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { LandingNavLink } from './landing-nav-link';
import type { LandingAnnouncement } from '../landing.model';

const STORAGE_PREFIX = 'landing-announcement:';

/**
 * Thin strip above the header for a release note or a promo.
 *
 * The dismissal is read in `afterNextRender` rather than in the constructor: a
 * dismissed bar must not remove itself *during* hydration, or the client tree
 * stops matching the server markup.
 */
@Component({
  selector: 'lib-landing-announcement-bar',
  imports: [LandingNavLink, NgIcon, HlmIcon],
  providers: [provideIcons({ lucideX, lucideArrowRight })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let item = announcement();
    @if (!dismissed()) {
      <div
        class="bg-primary text-primary-foreground relative isolate flex items-center justify-center gap-3 px-10 py-2 text-center text-xs sm:text-sm"
      >
        <p class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>{{ item.message }}</span>
          @if (item.link) {
            <lib-landing-nav-link
              [link]="item.link"
              linkClass="inline-flex items-center gap-1 font-medium underline underline-offset-4 hover:opacity-80"
            />
          }
        </p>

        @if (item.dismissible !== false) {
          <button
            type="button"
            class="absolute end-2 inline-flex size-7 items-center justify-center rounded-md transition-colors hover:bg-black/10 dark:hover:bg-white/10"
            (click)="dismiss()"
          >
            <ng-icon hlm name="lucideX" size="sm" />
            <span class="sr-only">Dismiss announcement</span>
          </button>
        }
      </div>
    }
  `,
})
export class LandingAnnouncementBar {
  public readonly announcement = input.required<LandingAnnouncement>();

  protected readonly dismissed = signal(false);

  constructor() {
    afterNextRender(() => {
      if (this.readStorage()) {
        this.dismissed.set(true);
      }
    });
  }

  protected dismiss(): void {
    this.dismissed.set(true);
    try {
      localStorage.setItem(this.storageKey(), '1');
    } catch {
      // Storage is optional — the bar still stays closed for this page view.
    }
  }

  private storageKey(): string {
    return `${STORAGE_PREFIX}${this.announcement().id ?? this.announcement().message}`;
  }

  private readStorage(): boolean {
    try {
      return localStorage.getItem(this.storageKey()) === '1';
    } catch {
      return false;
    }
  }
}

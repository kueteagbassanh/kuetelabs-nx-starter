import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BrnSheetContent } from '@spartan-ng/brain/sheet';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBookOpen, lucideGithub, lucideMenu } from '@ng-icons/lucide';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { HlmButton } from '@kuetelabs/frontend/ui/components/button';
import { HlmSheetImports } from '@kuetelabs/frontend/ui/components/sheet';
import { DOCS_HEADER_ACTIONS, DOCS_LAYOUT_CONFIG } from '../docs-layout.config';
import { DocsSidebarNav } from './docs-sidebar-nav';

/**
 * Sticky docs header: mobile nav trigger, wordmark, and app-provided actions.
 *
 * The mobile tree lives here rather than in the layout because the sheet trigger has
 * to sit inside `<hlm-sheet>` to reach it through the element injector.
 */
@Component({
  selector: 'lib-docs-header',
  imports: [
    RouterLink,
    NgComponentOutlet,
    NgIcon,
    HlmIcon,
    HlmButton,
    BrnSheetContent,
    DocsSidebarNav,
    ...HlmSheetImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideBookOpen, lucideGithub, lucideMenu })],
  host: {
    class:
      'bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 block w-full border-b backdrop-blur',
  },
  template: `
    <div
      class="mx-auto flex h-14 max-w-(--breakpoint-2xl) items-center gap-2 px-4"
    >
      <hlm-sheet side="left" #mobileNav="hlmSheet">
        <button
          hlmSheetTrigger
          hlmBtn
          variant="ghost"
          size="icon-sm"
          class="lg:hidden"
        >
          <ng-icon hlm size="sm" name="lucideMenu" />
          <span class="sr-only">Open documentation navigation</span>
        </button>

        <hlm-sheet-content *brnSheetContent class="w-72 sm:max-w-xs">
          <div class="flex h-full flex-col gap-6 overflow-y-auto px-6 py-4">
            <a
              [routerLink]="config.homePath"
              (click)="mobileNav.close()"
              class="flex items-center gap-2 font-semibold"
            >
              <ng-icon
                hlm
                size="sm"
                name="lucideBookOpen"
                class="text-primary"
              />
              {{ config.title }}
            </a>
            <lib-docs-sidebar-nav (navigated)="mobileNav.close()" />
          </div>
        </hlm-sheet-content>
      </hlm-sheet>

      <a
        [routerLink]="config.homePath"
        class="flex items-center gap-2 font-semibold"
      >
        <ng-icon hlm size="sm" name="lucideBookOpen" class="text-primary" />
        <span>{{ config.title }}</span>
      </a>
      @if (config.version) {
        <span
          class="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium"
          aria-label="Version"
        >
          {{ config.version }}
        </span>
      }

      <div class="ms-auto flex items-center gap-1">
        @for (action of headerActions; track action) {
          <ng-container *ngComponentOutlet="action" />
        }
        @if (config.repositoryUrl) {
          <a
            hlmBtn
            variant="ghost"
            size="icon-sm"
            [href]="config.repositoryUrl"
            target="_blank"
            rel="noreferrer noopener"
          >
            <ng-icon hlm size="sm" name="lucideGithub" />
            <span class="sr-only">Source repository</span>
          </a>
        }
      </div>
    </div>
  `,
})
export class DocsHeader {
  protected readonly config = inject(DOCS_LAYOUT_CONFIG);
  /** Empty unless the app provides DOCS_HEADER_ACTIONS. */
  protected readonly headerActions = inject(DOCS_HEADER_ACTIONS);
}

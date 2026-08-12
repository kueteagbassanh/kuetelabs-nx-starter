import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideExternalLink } from '@ng-icons/lucide';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { HlmCollapsibleImports } from '@kuetelabs/frontend/ui/components/collapsible';
import { DocsNavStore } from '../docs-nav.store';

/**
 * The docs tree. Rendered twice — in the desktop rail and inside the mobile sheet —
 * so it owns no positioning of its own; the caller places it.
 */
@Component({
  selector: 'lib-docs-sidebar-nav',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgTemplateOutlet,
    NgIcon,
    HlmIcon,
    ...HlmCollapsibleImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideChevronDown, lucideExternalLink })],
  template: `
    <nav class="flex flex-col gap-4 text-sm" aria-label="Documentation">
      @for (section of docsNav.sections(); track section.label) {
        @if (section.collapsible) {
          <hlm-collapsible
            [expanded]="section.defaultOpen ?? true"
            class="group/section block"
          >
            <button
              hlmCollapsibleTrigger
              class="text-foreground hover:bg-accent/50 flex w-full items-center justify-between rounded-md px-2 py-1.5 font-medium"
            >
              {{ section.label }}
              <ng-icon
                hlm
                size="sm"
                name="lucideChevronDown"
                class="text-muted-foreground transition-transform group-data-[state=open]/section:rotate-180"
              />
            </button>
            <hlm-collapsible-content>
              <ng-container
                *ngTemplateOutlet="
                  linksTpl;
                  context: { $implicit: section.items }
                "
              />
            </hlm-collapsible-content>
          </hlm-collapsible>
        } @else {
          <div>
            <div class="text-foreground px-2 py-1.5 font-medium">
              {{ section.label }}
            </div>
            <ng-container
              *ngTemplateOutlet="
                linksTpl;
                context: { $implicit: section.items }
              "
            />
          </div>
        }
      }
    </nav>

    <ng-template #linksTpl let-items>
      <ul class="border-border/60 ms-2 flex flex-col border-s">
        @for (item of items; track item.path + item.label) {
          <li class="flex">
            @if (item.external) {
              <a
                [href]="item.path"
                target="_blank"
                rel="noreferrer noopener"
                class="text-muted-foreground hover:text-foreground -ms-px flex flex-1 items-center gap-1.5 border-s border-transparent px-3 py-1.5 transition-colors"
              >
                {{ item.label }}
                <ng-icon hlm size="xs" name="lucideExternalLink" />
              </a>
            } @else {
              <a
                [routerLink]="item.path"
                routerLinkActive="border-primary! text-foreground! font-medium"
                [routerLinkActiveOptions]="{ exact: true }"
                ariaCurrentWhenActive="page"
                (click)="navigated.emit()"
                class="text-muted-foreground hover:text-foreground hover:border-border -ms-px flex flex-1 items-center gap-2 border-s border-transparent px-3 py-1.5 transition-colors"
              >
                <span>{{ item.label }}</span>
                @if (item.badge) {
                  <span
                    class="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[0.625rem] leading-none font-medium tracking-wide uppercase"
                  >
                    {{ item.badge }}
                  </span>
                }
              </a>
            }
          </li>
        }
      </ul>
    </ng-template>
  `,
})
export class DocsSidebarNav {
  protected readonly docsNav = inject(DocsNavStore);

  /** Raised on every internal link click, so the mobile sheet can close itself. */
  readonly navigated = output<void>();
}

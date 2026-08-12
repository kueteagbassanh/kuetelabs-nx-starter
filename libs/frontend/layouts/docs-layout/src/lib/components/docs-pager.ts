import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideArrowRight } from '@ng-icons/lucide';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { DocsNavStore } from '../docs-nav.store';

/**
 * Prev/next through the sidebar's reading order.
 *
 * Renders nothing on a page that is not in the tree — a stray route would otherwise
 * pick up whichever neighbours happened to be first.
 */
@Component({
  selector: 'lib-docs-pager',
  imports: [RouterLink, NgIcon, HlmIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideArrowLeft, lucideArrowRight })],
  template: `
    @if (docsNav.previousPage(); as previous) {
      <a
        [routerLink]="previous.path"
        class="hover:bg-accent/50 hover:border-border group flex flex-col gap-1 rounded-lg border p-4 transition-colors"
      >
        <span class="text-muted-foreground flex items-center gap-1.5 text-xs">
          <ng-icon
            hlm
            size="xs"
            name="lucideArrowLeft"
            class="transition-transform group-hover:-translate-x-0.5"
          />
          Previous
        </span>
        <span class="font-medium">{{ previous.label }}</span>
      </a>
    } @else {
      <span></span>
    }

    @if (docsNav.nextPage(); as next) {
      <a
        [routerLink]="next.path"
        class="hover:bg-accent/50 hover:border-border group flex flex-col items-end gap-1 rounded-lg border p-4 text-end transition-colors"
      >
        <span class="text-muted-foreground flex items-center gap-1.5 text-xs">
          Next
          <ng-icon
            hlm
            size="xs"
            name="lucideArrowRight"
            class="transition-transform group-hover:translate-x-0.5"
          />
        </span>
        <span class="font-medium">{{ next.label }}</span>
      </a>
    }
  `,
  host: {
    // `grid` and `hidden` are both display utilities, so leaving both in the static
    // class list would let Tailwind's output order decide which wins. Bind them as
    // mutually exclusive instead.
    class: 'gap-4 sm:grid-cols-2',
    '[class.grid]': 'hasNeighbours()',
    '[class.hidden]': '!hasNeighbours()',
  },
})
export class DocsPager {
  protected readonly docsNav = inject(DocsNavStore);

  protected readonly hasNeighbours = computed(
    () => !!this.docsNav.previousPage() || !!this.docsNav.nextPage(),
  );
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun } from '@ng-icons/lucide';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { ThemeStore } from '../theme.store';

/**
 * Light/dark switch for the marketing header.
 *
 * Both icons are always in the DOM and swapped with CSS on `.dark`, so the
 * server-rendered markup matches whatever the pre-hydration script picked and
 * hydration never sees a different tree.
 */
@Component({
  selector: 'lib-theme-toggle',
  imports: [...HlmButtonImports, NgIcon, HlmIcon],
  providers: [provideIcons({ lucideSun, lucideMoon })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      hlmBtn
      variant="ghost"
      size="icon-sm"
      type="button"
      [attr.aria-pressed]="theme.isDark()"
      (click)="theme.toggle()"
    >
      <!--
        The spans do the hiding: ng-icon ships its own :host display rule, which
        outranks a "hidden" utility placed directly on the element.
      -->
      <span class="dark:hidden">
        <ng-icon hlm name="lucideSun" size="sm" />
      </span>
      <span class="hidden dark:block">
        <ng-icon hlm name="lucideMoon" size="sm" />
      </span>
      <span class="sr-only">Toggle dark mode</span>
    </button>
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeStore);
}

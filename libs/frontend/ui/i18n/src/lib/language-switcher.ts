import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideLanguages } from '@ng-icons/lucide';
import { TranslocoDirective } from '@jsverse/transloco';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmDropdownMenuImports } from '@kuetelabs/frontend/ui/components/dropdown-menu';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { LocaleStore } from './locale.store';

/**
 * Language picker. Mount it wherever an app wants it — the dashboard header via
 * `DASHBOARD_HEADER_ACTIONS`, or a landing/docs header action.
 *
 * Options are labelled with each language's endonym, never a translated name, so
 * the list stays readable no matter which language is currently active.
 */
@Component({
  selector: 'lib-language-switcher',
  imports: [
    TranslocoDirective,
    NgIcon,
    HlmIcon,
    ...HlmButtonImports,
    ...HlmDropdownMenuImports,
  ],
  providers: [provideIcons({ lucideLanguages, lucideCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      <button
        hlmBtn
        [variant]="variant()"
        [size]="size()"
        [hlmDropdownMenuTrigger]="languageMenu"
        [attr.aria-label]="t('common.selectLanguage')"
        [title]="t('common.language')"
      >
        <ng-icon hlm name="lucideLanguages" />
      </button>

      <ng-template #languageMenu>
        <hlm-dropdown-menu class="w-44">
          <span class="text-muted-foreground px-2 py-1.5 text-xs">
            {{ t('common.language') }}
          </span>
          <div hlmDropdownMenuSeparator></div>

          @for (locale of store.available(); track locale.code) {
            <button
              hlmDropdownMenuItem
              class="justify-between"
              [attr.aria-current]="locale.code === store.code() ? 'true' : null"
              (click)="store.setLocale(locale.code)"
            >
              <span>{{ locale.label }}</span>
              @if (locale.code === store.code()) {
                <ng-icon hlm name="lucideCheck" class="size-4" aria-hidden="true" />
              }
            </button>
          }
        </hlm-dropdown-menu>
      </ng-template>
    </ng-container>
  `,
})
export class LanguageSwitcher {
  protected readonly store = inject(LocaleStore);

  /** Match the surrounding header: `ghost` in a toolbar, `outline` standalone. */
  public readonly variant = input<'ghost' | 'outline'>('ghost');

  /**
   * Trigger size. The dashboard and docs headers run `icon`; the marketing
   * header sits on a 16-unit bar and uses `icon-sm`, matching its theme toggle.
   */
  public readonly size = input<'icon' | 'icon-sm'>('icon');
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMenu, lucideX } from '@ng-icons/lucide';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { I18N_ENABLED, LanguageSwitcher, injectCopyResolver } from '@kuetelabs/frontend/ui/i18n';
import { LANDING_CONFIG, type LandingAction } from '../landing.model';
import { LANDING_BRAND_ICONS } from '../landing-icons';
import { LandingNavLink } from './landing-nav-link';
import { ThemeToggle } from './theme-toggle';

/**
 * Sticky marketing header: brand, nav, theme switch, and call-to-action buttons
 * on desktop; the same nav collapsed into a disclosure panel below `md`.
 *
 * Every link and button comes from `LANDING_CONFIG` — add a nav entry by editing
 * the app's config object, not this template.
 */
@Component({
  selector: 'lib-landing-layout-header',
  imports: [
    RouterLink,
    LandingNavLink,
    ThemeToggle,
    LanguageSwitcher,
    NgIcon,
    HlmIcon,
    ...HlmButtonImports,
  ],
  providers: [provideIcons({ ...LANDING_BRAND_ICONS, lucideMenu, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // A custom element carries no implicit semantics, so the landmark is explicit.
    role: 'banner',
    class:
      'border-border/60 bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 block w-full border-b backdrop-blur',
  },
  template: `
    <div class="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
      <a
        [routerLink]="config.brand.url ?? '/'"
        class="flex items-center gap-2 font-semibold tracking-tight"
        (click)="menuOpen.set(false)"
      >
        <span
          class="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg"
        >
          @if (config.brand.icon) {
            <ng-icon hlm [name]="config.brand.icon" size="sm" />
          } @else {
            <span class="text-sm font-bold">{{ config.brand.name.charAt(0) }}</span>
          }
        </span>
        <span>{{ config.brand.name }}</span>
      </a>

      <nav class="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="Main">
        @for (link of config.nav; track link.label) {
          <lib-landing-nav-link
            [link]="link"
            linkClass="text-muted-foreground hover:text-foreground hover:bg-muted/60 inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors"
          />
        }
      </nav>

      <div class="ms-auto flex items-center gap-2 md:ms-0">
        <!--
          Only when the app called provideI18n(): the switcher injects
          TranslocoService, which throws in an app that never configured i18n,
          and this layout has to keep rendering for one that hasn't.
        -->
        @if (i18nEnabled) {
          <lib-language-switcher size="icon-sm" />
        }
        <lib-theme-toggle />

        @for (action of config.actions; track action.label) {
          @if (action.desktopOnly) {
            <span class="hidden sm:contents">
              <a
                hlmBtn
                size="sm"
                [variant]="action.variant ?? 'default'"
                [routerLink]="action.url"
                [fragment]="action.fragment"
              >
                {{ t()(action.label) }}
              </a>
            </span>
          } @else {
            <a
              hlmBtn
              size="sm"
              [variant]="action.variant ?? 'default'"
              [routerLink]="action.url"
              [fragment]="action.fragment"
            >
              {{ t()(action.label) }}
            </a>
          }
        }

        <button
          hlmBtn
          variant="ghost"
          size="icon-sm"
          type="button"
          class="md:hidden"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="landing-mobile-nav"
          (click)="menuOpen.set(!menuOpen())"
        >
          <ng-icon hlm [name]="menuOpen() ? 'lucideX' : 'lucideMenu'" size="sm" />
          <span class="sr-only">
            {{ menuOpen() ? t()('common.closeMenu') : t()('common.openMenu') }}
          </span>
        </button>
      </div>
    </div>

    @if (menuOpen()) {
      <div id="landing-mobile-nav" class="border-border/60 bg-background border-t md:hidden">
        <nav class="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6" aria-label="Main">
          @for (link of config.nav; track link.label) {
            <lib-landing-nav-link
              [link]="link"
              linkClass="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-3 py-2.5 text-sm transition-colors flex items-center gap-1"
            />
          }

          @if (mobileActions().length) {
            <div class="mt-3 flex flex-col gap-2 border-t pt-3">
              @for (action of mobileActions(); track action.label) {
                <a
                  hlmBtn
                  [variant]="action.variant ?? 'default'"
                  [routerLink]="action.url"
                  [fragment]="action.fragment"
                >
                  {{ action.label }}
                </a>
              }
            </div>
          }
        </nav>
      </div>
    }
  `,
})
export class LandingLayoutHeader {
  protected readonly config = inject(LANDING_CONFIG);
  protected readonly menuOpen = signal(false);
  protected readonly t = injectCopyResolver();

  /** Whether `provideI18n()` ran. Constant for the app's lifetime, so not a signal. */
  protected readonly i18nEnabled = inject(I18N_ENABLED, { optional: true }) ?? false;

  /** Actions the top bar hides on small screens get a full-width row in the drawer. */
  protected readonly mobileActions = computed<LandingAction[]>(() =>
    this.config.actions.filter((action) => action.desktopOnly),
  );

  constructor() {
    // Close the drawer when a link inside it navigates. Listening to the router
    // rather than to clicks means keyboard activation closes it too.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }
}

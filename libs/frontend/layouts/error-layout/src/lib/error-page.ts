import { Location, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArchiveX,
  lucideArrowLeft,
  lucideCircleAlert,
  lucideCircleHelp,
  lucideCompass,
  lucideConstruction,
  lucideGauge,
  lucideHourglass,
  lucideHouse,
  lucideLifeBuoy,
  lucideLockKeyhole,
  lucideLogIn,
  lucideRefreshCw,
  lucideServerCrash,
  lucideServerOff,
  lucideShieldBan,
  lucideTriangleAlert,
  lucideWifiOff,
  lucideWrench,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmEmptyImports } from '@kuetelabs/frontend/ui/components/empty';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { injectCopyResolver } from '@kuetelabs/frontend/ui/i18n';
import { ErrorContainer } from './error-container';
import { ERROR_CATALOG, resolveErrorCode } from './error.catalog';
import { ERROR_PAGES_CONFIG } from './error.config';
import type { ErrorAction, ErrorCode, ErrorDefinition } from './error.model';

const ACTION_ICONS: Record<ErrorAction['kind'], string> = {
  home: 'lucideHouse',
  back: 'lucideArrowLeft',
  retry: 'lucideRefreshCw',
  login: 'lucideLogIn',
  support: 'lucideLifeBuoy',
};

/**
 * The one component behind every error screen.
 *
 * `code` is a normal signal input, so with `withComponentInputBinding()` it is fed
 * by route `data` (`data: { code: 404 }`) or by a route param (`error/:code`) with
 * no extra wiring. Everything else — copy, glyph, buttons — is looked up in
 * `ERROR_CATALOG` and overridden per app through `ERROR_PAGES_CONFIG`.
 */
@Component({
  selector: 'lib-error-page',
  imports: [ErrorContainer, RouterLink, NgIcon, HlmIcon, ...HlmButtonImports, ...HlmEmptyImports],
  providers: [
    provideIcons({
      lucideArchiveX,
      lucideArrowLeft,
      lucideCircleAlert,
      lucideCircleHelp,
      lucideCompass,
      lucideConstruction,
      lucideGauge,
      lucideHourglass,
      lucideHouse,
      lucideLifeBuoy,
      lucideLockKeyhole,
      lucideLogIn,
      lucideRefreshCw,
      lucideServerCrash,
      lucideServerOff,
      lucideShieldBan,
      lucideTriangleAlert,
      lucideWifiOff,
      lucideWrench,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-error-container [inline]="inline()">
      <hlm-empty>
        <hlm-empty-header>
          @if (definition().tone === 'destructive') {
            <hlm-empty-media variant="icon" class="bg-destructive/10 text-destructive">
              <ng-icon hlm [name]="definition().icon" aria-hidden="true" />
            </hlm-empty-media>
          } @else {
            <hlm-empty-media variant="icon">
              <ng-icon hlm [name]="definition().icon" aria-hidden="true" />
            </hlm-empty-media>
          }

          @if (statusLabel(); as status) {
            <p class="text-muted-foreground font-mono text-xs tracking-widest uppercase">
              {{ status }}
            </p>
          }

          <h1 hlmEmptyTitle>{{ definition().title }}</h1>
          <p hlmEmptyDescription>{{ definition().description }}</p>
        </hlm-empty-header>

        <hlm-empty-content>
          @if (code() === 'offline') {
            <!-- The one screen whose accuracy changes without a navigation. -->
            <p
              class="text-sm font-medium"
              [class.text-muted-foreground]="!online()"
              [class.text-primary]="online()"
              role="status"
              aria-live="polite"
            >
              {{ connectionLabel() }}
            </p>
          }

          <div class="flex flex-wrap items-center justify-center gap-2">
            @for (action of actions(); track action.kind) {
              @switch (action.kind) {
                @case ('home') {
                  <a hlmBtn [variant]="action.variant ?? 'default'" [routerLink]="config.homePath">
                    <ng-icon hlm [name]="iconFor(action)" aria-hidden="true" />
                    {{ action.label }}
                  </a>
                }
                @case ('login') {
                  <a
                    hlmBtn
                    [variant]="action.variant ?? 'default'"
                    [routerLink]="config.loginPath"
                    [queryParams]="loginQueryParams()"
                  >
                    <ng-icon hlm [name]="iconFor(action)" aria-hidden="true" />
                    {{ action.label }}
                  </a>
                }
                @case ('support') {
                  <a
                    hlmBtn
                    [variant]="action.variant ?? 'default'"
                    [href]="config.supportUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ng-icon hlm [name]="iconFor(action)" aria-hidden="true" />
                    {{ action.label }}
                  </a>
                }
                @default {
                  <button
                    hlmBtn
                    type="button"
                    [variant]="action.variant ?? 'default'"
                    (click)="run(action)"
                  >
                    <ng-icon hlm [name]="iconFor(action)" aria-hidden="true" />
                    {{ action.label }}
                  </button>
                }
              }
            }
          </div>

          @if (definition().hint; as hint) {
            <p class="text-muted-foreground text-xs text-balance">{{ hint }}</p>
          }
        </hlm-empty-content>
      </hlm-empty>
    </lib-error-container>
  `,
})
export class ErrorPage {
  protected readonly config = inject(ERROR_PAGES_CONFIG);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * Which screen to render. Accepts anything — a route param arrives as the string
   * `'404'`, route data as the number `404` — and unknown values fall back to the
   * generic screen rather than rendering nothing.
   */
  public readonly code = input<ErrorCode, unknown>('unknown', { transform: resolveErrorCode });

  /** Forwarded to the container; set on routes mounted inside the dashboard shell. */
  public readonly inline = input(false, { transform: booleanAttribute });

  protected readonly online = signal(true);

  /**
   * Starts false so the first client render matches the prerendered HTML — `web`
   * prerenders every one of these routes, and resolving this during construction
   * would add a button the server never emitted, which is a hydration mismatch.
   * Filled in after the first render instead.
   *
   * `history.length` is the only signal available after a hard landing on an error
   * URL, and it counts entries from other origins too — so this is a best-effort
   * check that mainly stops "Go back" appearing on a freshly opened tab.
   */
  private readonly canGoBack = signal(false);

  /**
   * Translations for the catalog, which holds plain strings a template pipe
   * cannot reach. Falls through to the built-in English when the app never
   * called `provideI18n()` — this lib has to render in an unconfigured app.
   */
  private readonly copy = injectCopyResolver();

  /**
   * Built-in English, then the translation, then an explicit per-app override —
   * in that order of increasing authority. An app that hard-codes copy through
   * `provideErrorPages({ catalog })` means it, so that wins over the catalogue's
   * translation; everything it left alone gets translated normally.
   */
  protected readonly definition = computed<ErrorDefinition>(() => {
    const code = this.code();
    const base = ERROR_CATALOG[code];
    const override = this.config.catalog[code];
    const t = this.copy();

    return {
      ...base,
      ...override,
      title: override?.title ?? t(`errors.${code}.title`, base.title),
      description:
        override?.description ??
        t(`errors.${code}.description`, base.description),
      hint:
        override?.hint ??
        (base.hint ? t(`errors.${code}.hint`, base.hint) : undefined),
      // Only translate the built-in buttons: a custom action list is the app's
      // own copy, and its labels are not in this lib's message files.
      actions: override?.actions
        ? override.actions
        : base.actions.map((action) => ({
            ...action,
            label: t(`errors.${code}.actions.${action.kind}`, action.label),
          })),
    };
  });

  protected readonly statusLabel = computed(() => {
    const status = this.definition().status;
    if (!this.config.showStatusCode || !status) {
      return '';
    }
    return this.copy()('errors.status', `Error ${status}`, { code: status });
  });

  /** Live connection state on the offline screen; changes without a navigation. */
  protected readonly connectionLabel = computed(() =>
    this.online()
      ? this.copy()(
          'errors.offlineStatus.online',
          "You're back online — try again.",
        )
      : this.copy()('errors.offlineStatus.offline', 'Still no connection.'),
  );

  /** Drops actions that cannot work here: no support URL, no history to go back to. */
  protected readonly actions = computed(() =>
    this.definition().actions.filter((action) => {
      if (action.kind === 'support') {
        return Boolean(this.config.supportUrl);
      }
      if (action.kind === 'back') {
        return this.canGoBack();
      }
      return true;
    }),
  );

  protected readonly loginQueryParams = computed(() => {
    const returnUrl = this.returnUrl();
    return returnUrl ? { returnUrl } : {};
  });

  constructor() {
    // Browser-only state, resolved after the first render so hydration sees the
    // same DOM the prerender produced.
    afterNextRender(() => {
      this.canGoBack.set(window.history.length > 1);

      const sync = () => this.online.set(navigator.onLine);
      sync();
      window.addEventListener('online', sync);
      window.addEventListener('offline', sync);
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('online', sync);
        window.removeEventListener('offline', sync);
      });
    });

    effect(() => {
      if (this.config.setDocumentTitle) {
        this.title.setTitle(`${this.definition().title} · ${this.config.appName}`);
      }
    });
  }

  protected iconFor(action: ErrorAction): string {
    return ACTION_ICONS[action.kind];
  }

  protected run(action: ErrorAction): void {
    if (action.kind === 'back') {
      this.location.back();
      return;
    }
    if (action.kind === 'retry' && this.isBrowser) {
      window.location.reload();
    }
  }

  /**
   * Same rule as the auth guards: a `returnUrl` is only honoured when it is a
   * single-slash absolute path. `//evil.example` is a protocol-relative URL, so
   * forwarding it unchecked would turn this page into an open redirect.
   */
  private returnUrl(): string | null {
    const candidate = this.route.snapshot.queryParamMap.get('returnUrl');
    return candidate?.startsWith('/') && !candidate.startsWith('//') ? candidate : null;
  }
}

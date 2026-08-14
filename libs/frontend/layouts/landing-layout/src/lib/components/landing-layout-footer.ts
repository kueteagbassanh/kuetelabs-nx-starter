import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { HlmInputImports } from '@kuetelabs/frontend/ui/components/input';
import { injectCopyResolver } from '@kuetelabs/frontend/ui/i18n';
import { LANDING_CONFIG } from '../landing.model';
import { LANDING_BRAND_ICONS, LANDING_SOCIAL_ICONS } from '../landing-icons';
import { LandingNavLink } from './landing-nav-link';

/**
 * Site footer: brand blurb and socials, link columns, an optional newsletter
 * form, then the legal strip. All of it is driven by `LANDING_CONFIG.footer`.
 *
 * The newsletter form is a stub — it acknowledges the address and posts
 * nowhere. Wire it to the API (Resend lives behind `apps/api`) before shipping.
 */
@Component({
  selector: 'lib-landing-layout-footer',
  imports: [RouterLink, LandingNavLink, NgIcon, HlmIcon, ...HlmButtonImports, ...HlmInputImports],
  providers: [provideIcons({ ...LANDING_BRAND_ICONS, ...LANDING_SOCIAL_ICONS })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // A custom element carries no implicit semantics, so the landmark is explicit.
    role: 'contentinfo',
    class: 'border-border/60 bg-muted/30 block border-t',
  },
  template: `
    <div class="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div class="grid gap-10 lg:grid-cols-12">
        <div class="lg:col-span-4">
          <a [routerLink]="config.brand.url ?? '/'" class="flex items-center gap-2 font-semibold">
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

          @if (footer.description) {
            <p class="text-muted-foreground mt-4 max-w-sm text-sm leading-relaxed">
              {{ t()(footer.description) }}
            </p>
          }

          @if (footer.socials?.length) {
            <ul class="mt-6 flex items-center gap-2">
              @for (social of footer.socials; track social.label) {
                <li>
                  <a
                    [href]="social.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-muted-foreground hover:text-foreground hover:border-border border-border/60 flex size-9 items-center justify-center rounded-lg border transition-colors"
                  >
                    <ng-icon hlm [name]="social.icon" size="sm" />
                    <span class="sr-only">{{ social.label }}</span>
                  </a>
                </li>
              }
            </ul>
          }
        </div>

        <div class="grid gap-8 sm:grid-cols-3 lg:col-span-5">
          @for (column of footer.columns; track column.label) {
            <nav [attr.aria-label]="t()(column.label)">
              <h2 class="text-sm font-medium">{{ t()(column.label) }}</h2>
              <ul class="mt-4 flex flex-col gap-3">
                @for (link of column.links; track link.label) {
                  <li>
                    <lib-landing-nav-link
                      [link]="link"
                      linkClass="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
                    />
                  </li>
                }
              </ul>
            </nav>
          }
        </div>

        @if (footer.newsletter; as newsletter) {
          <div class="lg:col-span-3">
            <h2 class="text-sm font-medium">{{ t()(newsletter.heading) }}</h2>
            @if (newsletter.description) {
              <p class="text-muted-foreground mt-4 text-sm leading-relaxed">
                {{ t()(newsletter.description) }}
              </p>
            }

            <form class="mt-4 flex flex-col gap-2" (submit)="subscribe($event, email)">
              <label class="sr-only" for="landing-newsletter-email">
                {{ t()('common.emailAddress') }}
              </label>
              <input
                hlmInput
                #email
                id="landing-newsletter-email"
                type="email"
                required
                autocomplete="email"
                class="w-full"
                [placeholder]="t()(newsletter.placeholder ?? 'you@company.com')"
              />
              <button hlmBtn type="submit" size="sm">
                {{ t()(newsletter.cta ?? 'common.subscribe') }}
              </button>
            </form>

            <p class="text-muted-foreground mt-2 text-xs" aria-live="polite">
              @if (subscribed(); as address) {
                {{ t()('common.newsletterThanks', undefined, { email: address }) }}
              } @else {
                {{ t()('common.newsletterNoSpam') }}
              }
            </p>
          </div>
        }
      </div>

      <div
        class="border-border/60 mt-12 flex flex-col-reverse items-center gap-4 border-t pt-6 sm:flex-row sm:justify-between"
      >
        <p class="text-muted-foreground text-xs">{{ copyright() }}</p>

        @if (footer.legal?.length) {
          <ul class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            @for (link of footer.legal; track link.label) {
              <li>
                <lib-landing-nav-link
                  [link]="link"
                  linkClass="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
                />
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
})
export class LandingLayoutFooter {
  protected readonly config = inject(LANDING_CONFIG);
  protected readonly footer = this.config.footer;
  protected readonly t = injectCopyResolver();

  protected readonly subscribed = signal<string | null>(null);

  /**
   * Translate first, then substitute `{year}` — the placeholder has to survive
   * into whichever language's string is chosen. Reads `t()` so a language change
   * recomputes it.
   */
  protected readonly copyright = computed(() =>
    this.t()(
      this.footer.copyright ?? `© {year} ${this.config.brand.name}. All rights reserved.`,
    ).replace('{year}', String(new Date().getFullYear())),
  );

  protected subscribe(event: Event, input: HTMLInputElement): void {
    event.preventDefault();
    if (!input.value) {
      return;
    }
    this.subscribed.set(input.value);
    input.value = '';
  }
}

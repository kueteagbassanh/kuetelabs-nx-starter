import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoDirective } from '@kuetelabs/frontend/ui/i18n';

/** Social proof strip. Wordmarks stand in for customer logos in the starter. */
@Component({
  selector: 'app-landing-logo-cloud',
  imports: [TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'border-border/60 block border-y' },
  template: `
    <div class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8" *transloco="let t">
      <p class="text-muted-foreground text-center text-xs tracking-widest uppercase">
        {{ t('landing.logoCloud.trustedBy') }}
      </p>
      <ul
        class="mt-6 grid grid-cols-2 items-center gap-6 sm:grid-cols-3 lg:grid-cols-6"
        aria-label="Customers"
      >
        @for (company of companies; track company) {
          <li
            class="text-muted-foreground/70 text-center text-lg font-semibold tracking-tight transition-colors hover:text-foreground"
          >
            {{ company }}
          </li>
        }
      </ul>
    </div>
  `,
})
export class LandingLogoCloud {
  protected readonly companies = [
    'Northwind',
    'Contoso',
    'Initech',
    'Umbrella',
    'Globex',
    'Soylent',
  ];
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmAccordionImports } from '@kuetelabs/frontend/ui/components/accordion';
import { LandingSection } from '@kuetelabs/frontend/layouts/landing-layout';
import { TranslocoDirective } from '@kuetelabs/frontend/ui/i18n';

/** Objection handling, one question per accordion item. */
@Component({
  selector: 'app-landing-faq',
  imports: [LandingSection, TranslocoDirective, RouterLink, ...HlmAccordionImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      <lib-landing-section
        id="faq"
        [eyebrow]="t('landing.faq.eyebrow')"
        [heading]="t('landing.faq.heading')"
      >
        <div class="mx-auto max-w-3xl">
          <div hlmAccordion type="single">
            @for (id of faqIds; track id) {
              <div hlmAccordionItem>
                <hlm-accordion-trigger>
                  {{ t('landing.faq.items.' + id + '.question') }}
                </hlm-accordion-trigger>
                <hlm-accordion-content>
                  <p class="text-muted-foreground leading-relaxed">
                    {{ t('landing.faq.items.' + id + '.answer') }}
                  </p>
                </hlm-accordion-content>
              </div>
            }
          </div>

          <p class="text-muted-foreground mt-8 text-center text-sm">
            {{ t('landing.faq.stillDeciding') }}
            <a routerLink="/contact" class="text-foreground underline underline-offset-4">
              {{ t('landing.faq.talkToHuman') }}
            </a>
            {{ t('landing.faq.weAnswer') }}
          </p>
        </div>
      </lib-landing-section>
    </ng-container>
  `,
})
export class LandingFaq {
  /** Order only; the questions and answers live in `src/app/i18n/*.json`. */
  protected readonly faqIds = [
    'database',
    'permissions',
    'revoke',
    'designSystem',
    'freeTier',
    'downtime',
  ];
}

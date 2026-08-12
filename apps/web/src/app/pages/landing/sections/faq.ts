import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmAccordionImports } from '@kuetelabs/frontend/ui/components/accordion';
import { LandingSection } from '@kuetelabs/frontend/layouts/landing-layout';

interface QuestionAndAnswer {
  question: string;
  answer: string;
}

/** Objection handling, one question per accordion item. */
@Component({
  selector: 'app-landing-faq',
  imports: [LandingSection, RouterLink, ...HlmAccordionImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-landing-section
      id="faq"
      eyebrow="FAQ"
      heading="Questions we get before the first call"
    >
      <div class="mx-auto max-w-3xl">
        <div hlmAccordion type="single">
          @for (item of faqs; track item.question) {
            <div hlmAccordionItem>
              <hlm-accordion-trigger>{{ item.question }}</hlm-accordion-trigger>
              <hlm-accordion-content>
                <p class="text-muted-foreground leading-relaxed">{{ item.answer }}</p>
              </hlm-accordion-content>
            </div>
          }
        </div>

        <p class="text-muted-foreground mt-8 text-center text-sm">
          Still deciding?
          <a routerLink="/contact" class="text-foreground underline underline-offset-4">
            Talk to a human
          </a>
          — we answer within a business day.
        </p>
      </div>
    </lib-landing-section>
  `,
})
export class LandingFaq {
  protected readonly faqs: QuestionAndAnswer[] = [
    {
      question: 'Do I have to move my database?',
      answer:
        'No. Nimbus connects to your existing Postgres and generates types from your schema. Your data stays where it is, and you keep every extension and migration you already rely on.',
    },
    {
      question: 'How are permissions actually enforced?',
      answer:
        'Permissions are stamped into the access token and enforced by row-level security in the database. The UI uses the same claims to decide what to render, but the database is the thing that says no.',
    },
    {
      question: 'What happens when I revoke access?',
      answer:
        'The grant is removed and audited immediately, and disabling a user signs them out of every session globally rather than waiting for a token to expire.',
    },
    {
      question: 'Can I use my own design system?',
      answer:
        'Yes. Every surface reads from a small set of design tokens, so a palette change or a font swap propagates through components, charts, and dark mode without touching a component file.',
    },
    {
      question: 'Is there a free tier for side projects?',
      answer:
        'Starter is free for up to five people and 10,000 automated runs a month, with no card required. Most side projects never leave it.',
    },
    {
      question: 'How do you handle downtime?',
      answer:
        'Growth and Enterprise plans publish a rolling uptime figure and a public status page. Enterprise adds a 99.99% SLA with service credits and a named contact during incidents.',
    },
  ];
}

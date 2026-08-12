import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideQuote } from '@ng-icons/lucide';
import { HlmAvatarImports } from '@kuetelabs/frontend/ui/components/avatar';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { LandingSection } from '@kuetelabs/frontend/layouts/landing-layout';

interface Testimonial {
  quote: string;
  name: string;
  initials: string;
  role: string;
}

/** Customer quotes. Fictional people — swap in real ones before launch. */
@Component({
  selector: 'app-landing-testimonials',
  imports: [LandingSection, NgIcon, HlmIcon, ...HlmCardImports, ...HlmAvatarImports],
  providers: [provideIcons({ lucideQuote })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-landing-section
      id="customers"
      [muted]="true"
      eyebrow="Customers"
      heading="Teams stopped rebuilding the same four systems"
    >
      <div class="grid gap-4 lg:grid-cols-3">
        @for (testimonial of testimonials; track testimonial.name) {
          <figure hlmCard class="h-full">
            <div hlmCardContent class="flex h-full flex-col gap-6 pt-6">
              <ng-icon hlm name="lucideQuote" size="base" class="text-primary/40" />
              <blockquote class="flex-1 text-sm leading-relaxed text-pretty">
                {{ testimonial.quote }}
              </blockquote>
              <figcaption class="flex items-center gap-3">
                <hlm-avatar>
                  <span hlmAvatarFallback>{{ testimonial.initials }}</span>
                </hlm-avatar>
                <div class="text-sm">
                  <p class="font-medium">{{ testimonial.name }}</p>
                  <p class="text-muted-foreground text-xs">{{ testimonial.role }}</p>
                </div>
              </figcaption>
            </div>
          </figure>
        }
      </div>
    </lib-landing-section>
  `,
})
export class LandingTestimonials {
  protected readonly testimonials: Testimonial[] = [
    {
      quote:
        'We deleted an entire internal service the week we moved to Nimbus. Roles, invites, and the audit trail came for free, and the on-call rotation got noticeably quieter.',
      name: 'Amara Osei',
      initials: 'AO',
      role: 'VP Engineering, Northwind',
    },
    {
      quote:
        'The permissions model is the first one our security reviewer signed off on without a follow-up meeting. Checks live in the database, not in a component nobody remembers.',
      name: 'Rafael Duarte',
      initials: 'RD',
      role: 'Staff Engineer, Contoso',
    },
    {
      quote:
        'Design shipped a new palette on a Tuesday and every chart, badge, and dark-mode surface followed. That used to be a two-sprint migration for us.',
      name: 'Nina Kowalski',
      initials: 'NK',
      role: 'Head of Design, Globex',
    },
  ];
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideQuote } from '@ng-icons/lucide';
import { HlmAvatarImports } from '@kuetelabs/frontend/ui/components/avatar';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { LandingSection } from '@kuetelabs/frontend/layouts/landing-layout';
import { TranslocoDirective } from '@kuetelabs/frontend/ui/i18n';

interface Testimonial {
  /** Keys `landing.testimonials.items.<id>.quote` / `.role`. */
  id: string;
  /** A person's name and their initials are not translated. */
  name: string;
  initials: string;
}

/** Customer quotes. Fictional people — swap in real ones before launch. */
@Component({
  selector: 'app-landing-testimonials',
  imports: [
    LandingSection,
    TranslocoDirective,
    NgIcon,
    HlmIcon,
    ...HlmCardImports,
    ...HlmAvatarImports,
  ],
  providers: [provideIcons({ lucideQuote })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      <lib-landing-section
        id="customers"
        [muted]="true"
        [eyebrow]="t('landing.testimonials.eyebrow')"
        [heading]="t('landing.testimonials.heading')"
      >
        <div class="grid gap-4 lg:grid-cols-3">
          @for (testimonial of testimonials; track testimonial.id) {
            <figure hlmCard class="h-full">
              <div hlmCardContent class="flex h-full flex-col gap-6 pt-6">
                <ng-icon hlm name="lucideQuote" size="base" class="text-primary/40" />
                <blockquote class="flex-1 text-sm leading-relaxed text-pretty">
                  {{ t('landing.testimonials.items.' + testimonial.id + '.quote') }}
                </blockquote>
                <figcaption class="flex items-center gap-3">
                  <hlm-avatar>
                    <span hlmAvatarFallback>{{ testimonial.initials }}</span>
                  </hlm-avatar>
                  <div class="text-sm">
                    <p class="font-medium">{{ testimonial.name }}</p>
                    <p class="text-muted-foreground text-xs">
                      {{ t('landing.testimonials.items.' + testimonial.id + '.role') }}
                    </p>
                  </div>
                </figcaption>
              </div>
            </figure>
          }
        </div>
      </lib-landing-section>
    </ng-container>
  `,
})
export class LandingTestimonials {
  protected readonly testimonials: Testimonial[] = [
    { id: 'amara', name: 'Amara Osei', initials: 'AO' },
    { id: 'rafael', name: 'Rafael Duarte', initials: 'RD' },
    { id: 'nina', name: 'Nina Kowalski', initials: 'NK' },
  ];
}

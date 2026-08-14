import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBuilding2, lucideHeadset, lucideMail } from '@ng-icons/lucide';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { HlmInputImports } from '@kuetelabs/frontend/ui/components/input';
import { HlmLabelImports } from '@kuetelabs/frontend/ui/components/label';
import { HlmTextareaImports } from '@kuetelabs/frontend/ui/components/textarea';
import { LandingSection } from '@kuetelabs/frontend/layouts/landing-layout';
import { TranslocoDirective } from '@kuetelabs/frontend/ui/i18n';

/**
 * Second page under the landing layout — proof that the shell hosts more than
 * the home page, and the target of every "talk to sales" button.
 *
 * The form is a stub: it validates natively and acknowledges locally. Point it
 * at `apps/api` (which holds the Resend key) when you make it real.
 */
@Component({
  selector: 'app-contact',
  imports: [
    LandingSection,
    TranslocoDirective,
    NgIcon,
    HlmIcon,
    ...HlmCardImports,
    ...HlmButtonImports,
    ...HlmInputImports,
    ...HlmLabelImports,
    ...HlmTextareaImports,
  ],
  providers: [provideIcons({ lucideMail, lucideHeadset, lucideBuilding2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      <lib-landing-section
        align="start"
        [headingLevel]="1"
        [eyebrow]="t('contact.eyebrow')"
        [heading]="t('contact.heading')"
        [description]="t('contact.description')"
      >
        <div class="grid gap-8 lg:grid-cols-5">
          <section hlmCard class="lg:col-span-3">
            <div hlmCardHeader>
              <h2 hlmCardTitle>{{ t('contact.form.title') }}</h2>
              <p hlmCardDescription>{{ t('contact.form.description') }}</p>
            </div>

            <div hlmCardContent>
              <form class="flex flex-col gap-4" (submit)="send($event)">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="flex flex-col gap-2">
                    <label hlmLabel for="contact-name">{{ t('contact.form.name') }}</label>
                    <input hlmInput id="contact-name" name="name" required autocomplete="name" />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label hlmLabel for="contact-email">{{ t('contact.form.email') }}</label>
                    <input
                      hlmInput
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      autocomplete="email"
                    />
                  </div>
                </div>

                <div class="flex flex-col gap-2">
                  <label hlmLabel for="contact-company">{{ t('contact.form.company') }}</label>
                  <input hlmInput id="contact-company" name="company" autocomplete="organization" />
                </div>

                <div class="flex flex-col gap-2">
                  <label hlmLabel for="contact-message">{{ t('contact.form.message') }}</label>
                  <textarea
                    hlmTextarea
                    id="contact-message"
                    name="message"
                    rows="5"
                    required
                    [placeholder]="t('contact.form.messagePlaceholder')"
                  ></textarea>
                </div>

                <div class="flex items-center gap-4">
                  <button hlmBtn type="submit">{{ t('contact.form.send') }}</button>
                  <p class="text-muted-foreground text-sm" aria-live="polite">
                    @if (sent()) {
                      {{ t('contact.form.sent') }}
                    }
                  </p>
                </div>
              </form>
            </div>
          </section>

          <div class="flex flex-col gap-4 lg:col-span-2">
            @for (channel of channels; track channel.id) {
              <section hlmCard>
                <div hlmCardHeader>
                  <span
                    class="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg"
                  >
                    <ng-icon hlm [name]="channel.icon" size="sm" />
                  </span>
                  <h2 hlmCardTitle>{{ t('contact.channels.' + channel.id + '.title') }}</h2>
                  <p hlmCardDescription>
                    {{ t('contact.channels.' + channel.id + '.description') }}
                  </p>
                </div>
                <div hlmCardContent>
                  <!-- An address, not copy: the same in every language. -->
                  <p class="text-sm font-medium">{{ channel.detail }}</p>
                </div>
              </section>
            }
          </div>
        </div>
      </lib-landing-section>
    </ng-container>
  `,
})
export class Contact {
  protected readonly sent = signal(false);

  /** Ids and contact details; the wording is `contact.channels.<id>.*`. */
  protected readonly channels = [
    { id: 'sales', icon: 'lucideMail', detail: 'sales@nimbus.example' },
    { id: 'support', icon: 'lucideHeadset', detail: 'support@nimbus.example' },
    { id: 'office', icon: 'lucideBuilding2', detail: '18 Rue des Lilas, Lomé, Togo' },
  ];

  protected send(event: Event): void {
    event.preventDefault();
    (event.target as HTMLFormElement).reset();
    this.sent.set(true);
  }
}

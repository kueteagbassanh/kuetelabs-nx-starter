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
    <lib-landing-section
      align="start"
      [headingLevel]="1"
      eyebrow="Contact"
      heading="Tell us what you are building"
      description="Sales questions, security reviews, migration plans — a real engineer reads every message and replies within one business day."
    >
      <div class="grid gap-8 lg:grid-cols-5">
        <section hlmCard class="lg:col-span-3">
          <div hlmCardHeader>
            <h2 hlmCardTitle>Send a message</h2>
            <p hlmCardDescription>No chatbot, no drip campaign.</p>
          </div>

          <div hlmCardContent>
            <form class="flex flex-col gap-4" (submit)="send($event)">
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label hlmLabel for="contact-name">Name</label>
                  <input hlmInput id="contact-name" name="name" required autocomplete="name" />
                </div>
                <div class="flex flex-col gap-2">
                  <label hlmLabel for="contact-email">Work email</label>
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
                <label hlmLabel for="contact-company">Company</label>
                <input hlmInput id="contact-company" name="company" autocomplete="organization" />
              </div>

              <div class="flex flex-col gap-2">
                <label hlmLabel for="contact-message">How can we help?</label>
                <textarea
                  hlmTextarea
                  id="contact-message"
                  name="message"
                  rows="5"
                  required
                  placeholder="We are moving 40 engineers off an in-house admin tool…"
                ></textarea>
              </div>

              <div class="flex items-center gap-4">
                <button hlmBtn type="submit">Send message</button>
                <p class="text-muted-foreground text-sm" aria-live="polite">
                  @if (sent()) {
                    Thanks — we'll reply within one business day.
                  }
                </p>
              </div>
            </form>
          </div>
        </section>

        <div class="flex flex-col gap-4 lg:col-span-2">
          @for (channel of channels; track channel.title) {
            <section hlmCard>
              <div hlmCardHeader>
                <span
                  class="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg"
                >
                  <ng-icon hlm [name]="channel.icon" size="sm" />
                </span>
                <h2 hlmCardTitle>{{ channel.title }}</h2>
                <p hlmCardDescription>{{ channel.description }}</p>
              </div>
              <div hlmCardContent>
                <p class="text-sm font-medium">{{ channel.detail }}</p>
              </div>
            </section>
          }
        </div>
      </div>
    </lib-landing-section>
  `,
})
export class Contact {
  protected readonly sent = signal(false);

  protected readonly channels = [
    {
      icon: 'lucideMail',
      title: 'Sales',
      description: 'Pricing, procurement, and security questionnaires.',
      detail: 'sales@nimbus.example',
    },
    {
      icon: 'lucideHeadset',
      title: 'Support',
      description: 'Existing customers, 24/5 with weekend on-call for incidents.',
      detail: 'support@nimbus.example',
    },
    {
      icon: 'lucideBuilding2',
      title: 'Office',
      description: 'Visits by appointment.',
      detail: '18 Rue des Lilas, Lomé, Togo',
    },
  ];

  protected send(event: Event): void {
    event.preventDefault();
    (event.target as HTMLFormElement).reset();
    this.sent.set(true);
  }
}

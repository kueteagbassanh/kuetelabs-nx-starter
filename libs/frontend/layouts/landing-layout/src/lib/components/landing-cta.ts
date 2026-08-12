import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import type { LandingCallToAction } from '../landing.model';

/**
 * Pre-footer conversion band. Part of the shell rather than of any one page, so
 * every route under the layout ends on the same ask.
 */
@Component({
  selector: 'lib-landing-cta',
  imports: [RouterLink, ...HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @let content = cta();
    <div class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div
        class="border-border/60 from-primary/10 relative overflow-hidden rounded-2xl border bg-linear-to-br via-transparent to-transparent px-6 py-12 text-center sm:px-12"
      >
        @if (content.eyebrow) {
          <p class="text-primary text-xs font-medium tracking-widest uppercase">
            {{ content.eyebrow }}
          </p>
        }

        <h2 class="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {{ content.heading }}
        </h2>

        @if (content.description) {
          <p class="text-muted-foreground mx-auto mt-4 max-w-xl text-pretty">
            {{ content.description }}
          </p>
        }

        <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          @for (action of content.actions; track action.label) {
            @if (action.external) {
              <a
                hlmBtn
                size="lg"
                [variant]="action.variant ?? 'default'"
                [href]="action.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ action.label }}
              </a>
            } @else {
              <a
                hlmBtn
                size="lg"
                [variant]="action.variant ?? 'default'"
                [routerLink]="action.url"
                [fragment]="action.fragment"
              >
                {{ action.label }}
              </a>
            }
          }
        </div>

        @if (content.note) {
          <p class="text-muted-foreground mt-4 text-xs">{{ content.note }}</p>
        }
      </div>
    </div>
  `,
})
export class LandingCta {
  public readonly cta = input.required<LandingCallToAction>();
}

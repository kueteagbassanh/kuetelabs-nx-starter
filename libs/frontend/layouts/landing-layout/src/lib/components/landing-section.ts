import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * The one-and-only vertical rhythm of a marketing page: consistent padding, a
 * consistent max width, and an optional eyebrow/heading/description stack.
 * Pages project their content into it, so no page hand-rolls a `<section>` and
 * they cannot drift apart.
 *
 * Set `id` on the host to make it an anchor target — the host reserves
 * `scroll-mt` for the sticky header, so `#pricing` does not land under it.
 */
@Component({
  selector: 'lib-landing-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block scroll-mt-20' },
  template: `
    <div [class]="bandClass()">
      <div class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      @if (eyebrow() || heading() || description()) {
        <div class="flex flex-col gap-4" [class]="headerAlignClass()">
          @if (eyebrow(); as text) {
            <p class="text-primary text-xs font-medium tracking-widest uppercase">{{ text }}</p>
          }
          @if (heading(); as text) {
            @if (headingLevel() === 1) {
              <h1 [class]="headingClass()">{{ text }}</h1>
            } @else {
              <h2 [class]="headingClass()">{{ text }}</h2>
            }
          }
          @if (description(); as text) {
            <p class="text-muted-foreground max-w-2xl text-pretty">{{ text }}</p>
          }
        </div>
      }

        <div [class]="contentSpacingClass()">
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class LandingSection {
  public readonly eyebrow = input<string>();
  public readonly heading = input<string>();
  public readonly description = input<string>();
  public readonly align = input<'start' | 'center'>('center');
  /** Tints the band so alternating sections read as separate zones. */
  public readonly muted = input(false);
  /**
   * Sections are `h2` because the page's `h1` belongs to its hero. A page with
   * no hero — `/contact` — sets this to 1 so it still has exactly one `h1`.
   */
  public readonly headingLevel = input<1 | 2>(2);

  protected readonly headingClass = computed(() =>
    this.headingLevel() === 1
      ? 'text-3xl font-semibold tracking-tight text-balance sm:text-4xl'
      : 'text-2xl font-semibold tracking-tight text-balance sm:text-3xl',
  );

  protected readonly bandClass = computed(() =>
    this.muted() ? 'bg-muted/30 border-border/60 border-y' : '',
  );

  protected readonly headerAlignClass = computed(() =>
    this.align() === 'center' ? 'items-center text-center mx-auto max-w-3xl' : 'items-start',
  );

  protected readonly contentSpacingClass = computed(() =>
    this.eyebrow() || this.heading() || this.description() ? 'mt-12' : '',
  );
}

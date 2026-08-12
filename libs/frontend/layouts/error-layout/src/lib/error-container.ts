import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';

/**
 * Chrome for an error screen: a centered, readable column and nothing else.
 *
 * Unlike `AuthContainer` this projects content instead of hosting a
 * `<router-outlet>`. Auth screens are a flow that shares one frame; error screens
 * are terminal, so making the page own its frame lets the very same component
 * serve `/error/404` and the app-level `**` wildcard without a nested wildcard
 * route — which Angular resolves awkwardly, since `**` swallows every segment.
 *
 * Exported so an app can wrap a bespoke error screen in the same frame.
 */
@Component({
  selector: 'lib-error-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'shellClasses()' },
  template: `
    <div class="flex w-full max-w-md flex-col items-center">
      <ng-content />
    </div>
  `,
})
export class ErrorContainer {
  /**
   * Fill the parent instead of the viewport. Set this when the route is mounted
   * inside the dashboard shell, where `min-h-svh` would push the sidebar's own
   * content area into a scrollbar.
   */
  public readonly inline = input(false, { transform: booleanAttribute });

  protected readonly shellClasses = computed(() =>
    this.inline()
      ? 'flex w-full flex-1 flex-col items-center justify-center px-6 py-16 text-center'
      : 'bg-background flex min-h-svh w-full flex-col items-center justify-center p-6 text-center md:p-10',
  );
}

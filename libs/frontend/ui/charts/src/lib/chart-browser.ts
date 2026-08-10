import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Charts render through Unovis, which needs the DOM. `apps/web` prerenders, so an
 * unguarded chart fails the build — every chart component gates on this and shows a
 * same-height placeholder on the server to avoid layout shift on hydration.
 */
export function injectIsBrowser(): boolean {
  return isPlatformBrowser(inject(PLATFORM_ID));
}

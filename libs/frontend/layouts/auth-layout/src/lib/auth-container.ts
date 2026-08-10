import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Chrome for the auth screens: a centered column that keeps the card readable at
 * every width. Deliberately holds no auth logic — the pages live in
 * @kuetelabs/frontend/features/auth/feature so this stays a layout.
 */
@Component({
  selector: 'lib-auth-container',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-background flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div class="flex w-full max-w-sm flex-col gap-4">
        <router-outlet />
      </div>
    </div>
  `,
})
export class AuthContainer {}

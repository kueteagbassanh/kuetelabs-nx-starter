//create auth container component
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'lib-auth-container',
  standalone: true,
  imports: [RouterModule],
  template: `<div
    class="flex min-h-svh w-full items-center justify-center p-6 md:p-10"
  >
    <div class="w-full max-w-sm">
      <router-outlet />
    </div>
  </div>`,
})
export class AuthContainer {}

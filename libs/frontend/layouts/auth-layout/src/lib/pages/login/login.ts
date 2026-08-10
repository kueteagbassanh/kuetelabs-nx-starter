import { Component } from '@angular/core';
import { LoginForm } from './login-form';
@Component({
  selector: 'lib-auth-login',
  standalone: true,
  imports: [LoginForm],
  template: `<div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
			<div class="w-full max-w-sm">
				<lib-login-form />
			</div>
		</div>`,
})
export class AuthLogin {
  
}
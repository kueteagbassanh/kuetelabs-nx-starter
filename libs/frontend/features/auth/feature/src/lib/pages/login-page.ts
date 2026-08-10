import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { Provider } from '@supabase/supabase-js';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { HlmFieldImports } from '@kuetelabs/frontend/ui/components/field';
import { HlmInputImports } from '@kuetelabs/frontend/ui/components/input';
import { AuthStore } from '@kuetelabs/frontend/data-access/supabase';
import { AUTH_PAGES_CONFIG } from '../auth.config';
import { OauthButtons } from '../oauth-buttons';

@Component({
  selector: 'lib-login-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    OauthButtons,
    ...HlmCardImports,
    ...HlmFieldImports,
    ...HlmInputImports,
    ...HlmButtonImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-card>
      <hlm-card-header>
        <h1 hlmCardTitle>Sign in to {{ config.appName }}</h1>
        <p hlmCardDescription>Enter your email and password to continue.</p>
      </hlm-card-header>

      <div hlmCardContent class="flex flex-col gap-4">
        <lib-oauth-buttons [busy]="busy()" (chosen)="withProvider($event)" />

        <form [formGroup]="form" (ngSubmit)="submit()">
          <hlm-field-group>
            <hlm-field>
              <label hlmFieldLabel for="email">Email</label>
              <input
                hlmInput
                id="email"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
                formControlName="email"
              />
              <hlm-field-error validator="required">Email is required.</hlm-field-error>
              <hlm-field-error validator="email">Enter a valid email address.</hlm-field-error>
            </hlm-field>

            <hlm-field>
              <div class="flex items-center">
                <label hlmFieldLabel for="password">Password</label>
                <a
                  class="ml-auto text-sm underline-offset-4 hover:underline"
                  routerLink="../forgot-password"
                >
                  Forgot password?
                </a>
              </div>
              <input
                hlmInput
                id="password"
                type="password"
                autocomplete="current-password"
                formControlName="password"
              />
              <hlm-field-error validator="required">Password is required.</hlm-field-error>
            </hlm-field>

            @if (error(); as message) {
              <p class="text-destructive text-sm" role="alert">{{ message }}</p>
            }

            <button hlmBtn type="submit" class="w-full" [disabled]="form.invalid || busy()">
              {{ busy() ? 'Signing in…' : 'Sign in' }}
            </button>
          </hlm-field-group>
        </form>
      </div>

      @if (config.signupEnabled) {
        <div hlmCardFooter class="justify-center text-sm">
          <span class="text-muted-foreground">No account?</span>
          <a class="ml-1 underline underline-offset-4" routerLink="../signup">Create one</a>
        </div>
      }
    </hlm-card>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  protected readonly config = inject(AUTH_PAGES_CONFIG);

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();
    const { error } = await this.auth.signInWithPassword(email, password);

    this.busy.set(false);
    if (error) {
      // Supabase returns the same message for unknown email and wrong password,
      // which is what you want — distinguishing them enumerates accounts.
      this.error.set(error.message);
      return;
    }
    await this.router.navigateByUrl(this.config.redirectAfterLogin);
  }

  protected async withProvider(provider: Provider): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await this.auth.signInWithOAuth(provider, redirectTo);
    if (error) {
      this.busy.set(false);
      this.error.set(error.message);
    }
    // On success the browser is navigating away; leave busy set.
  }
}

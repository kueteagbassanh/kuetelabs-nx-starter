import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { HlmFieldImports } from '@kuetelabs/frontend/ui/components/field';
import { HlmInputImports } from '@kuetelabs/frontend/ui/components/input';
import { AuthStore } from '@kuetelabs/frontend/data-access/supabase';

@Component({
  selector: 'lib-forgot-password-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ...HlmCardImports,
    ...HlmFieldImports,
    ...HlmInputImports,
    ...HlmButtonImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-card>
      <hlm-card-header>
        <h1 hlmCardTitle>Reset your password</h1>
        <p hlmCardDescription>We'll email you a link to choose a new one.</p>
      </hlm-card-header>

      <div hlmCardContent>
        @if (sent()) {
          <p class="text-sm">
            If an account exists for <strong>{{ form.getRawValue().email }}</strong>, a reset link is
            on its way. The link expires in one hour.
          </p>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()">
            <hlm-field-group>
              <hlm-field>
                <label hlmFieldLabel for="email">Email</label>
                <input
                  hlmInput
                  id="email"
                  type="email"
                  autocomplete="email"
                  formControlName="email"
                />
                <hlm-field-error validator="required">Email is required.</hlm-field-error>
                <hlm-field-error validator="email">Enter a valid email address.</hlm-field-error>
              </hlm-field>

              @if (error(); as message) {
                <p class="text-destructive text-sm" role="alert">{{ message }}</p>
              }

              <button hlmBtn type="submit" class="w-full" [disabled]="form.invalid || busy()">
                {{ busy() ? 'Sending…' : 'Send reset link' }}
              </button>
            </hlm-field-group>
          </form>
        }
      </div>

      <div hlmCardFooter class="justify-center text-sm">
        <a class="underline underline-offset-4" routerLink="../login">Back to sign in</a>
      </div>
    </hlm-card>
  `,
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthStore);
  private readonly fb = inject(FormBuilder);

  protected readonly busy = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);

    const { email } = this.form.getRawValue();
    const { error } = await this.auth.resetPasswordForEmail(
      email,
      `${window.location.origin}/auth/reset-password`,
    );

    this.busy.set(false);
    if (error) {
      this.error.set(error.message);
      return;
    }
    // Always the same confirmation, sent or not: anything else tells an attacker
    // which addresses have accounts.
    this.sent.set(true);
  }
}

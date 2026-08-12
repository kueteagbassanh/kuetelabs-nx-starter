import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  type AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { Provider } from '@supabase/supabase-js';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { HlmFieldImports } from '@kuetelabs/frontend/ui/components/field';
import { HlmInputImports } from '@kuetelabs/frontend/ui/components/input';
import { AuthStore } from '@kuetelabs/frontend/data-access/supabase';
import { TranslocoDirective } from '@kuetelabs/frontend/ui/i18n';
import { AUTH_PAGES_CONFIG } from '../auth.config';
import { OauthButtons } from '../oauth-buttons';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'lib-signup-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    OauthButtons,
    TranslocoDirective,
    ...HlmCardImports,
    ...HlmFieldImports,
    ...HlmInputImports,
    ...HlmButtonImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-card *transloco="let t">
      <hlm-card-header>
        <h1 hlmCardTitle>{{ t('auth.signup.title', { app: config.appName }) }}</h1>
        <p hlmCardDescription>{{ t('auth.signup.description') }}</p>
      </hlm-card-header>

      <div hlmCardContent class="flex flex-col gap-4">
        @if (sent()) {
          <!-- Split around the address rather than interpolated into one string:
               the <strong> has to sit mid-sentence, and the two halves let a
               translation put it wherever that language needs it. -->
          <p class="text-sm">
            {{ t('auth.signup.sentBefore') }}
            <strong>{{ form.getRawValue().email }}</strong>
            {{ t('auth.signup.sentAfter') }}
          </p>
        } @else {
          <lib-oauth-buttons [busy]="busy()" (chosen)="withProvider($event)" />

          <form [formGroup]="form" (ngSubmit)="submit()">
            <hlm-field-group>
              <hlm-field>
                <label hlmFieldLabel for="fullName">{{ t('auth.fields.fullName') }}</label>
                <input hlmInput id="fullName" autocomplete="name" formControlName="fullName" />
              </hlm-field>

              <hlm-field>
                <label hlmFieldLabel for="email">{{ t('auth.fields.email') }}</label>
                <input
                  hlmInput
                  id="email"
                  type="email"
                  autocomplete="email"
                  formControlName="email"
                />
                <hlm-field-error validator="required">
                  {{ t('auth.fields.emailRequired') }}
                </hlm-field-error>
                <hlm-field-error validator="email">
                  {{ t('auth.fields.emailInvalid') }}
                </hlm-field-error>
              </hlm-field>

              <hlm-field>
                <label hlmFieldLabel for="password">{{ t('auth.fields.password') }}</label>
                <input
                  hlmInput
                  id="password"
                  type="password"
                  autocomplete="new-password"
                  formControlName="password"
                />
                <hlm-field-error validator="required">
                  {{ t('auth.fields.passwordRequired') }}
                </hlm-field-error>
                <hlm-field-error validator="minlength">
                  {{ t('auth.fields.passwordMinLength', { min: config.passwordMinLength }) }}
                </hlm-field-error>
              </hlm-field>

              <hlm-field>
                <label hlmFieldLabel for="confirmPassword">
                  {{ t('auth.fields.confirmPassword') }}
                </label>
                <input
                  hlmInput
                  id="confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  formControlName="confirmPassword"
                />
              </hlm-field>

              @if (form.errors?.['passwordMismatch'] && form.touched) {
                <p class="text-destructive text-sm">
                  {{ t('auth.fields.passwordsDoNotMatch') }}
                </p>
              }
              @if (error(); as message) {
                <p class="text-destructive text-sm" role="alert">{{ message }}</p>
              }

              <button hlmBtn type="submit" class="w-full" [disabled]="form.invalid || busy()">
                {{ busy() ? t('auth.signup.submitting') : t('auth.signup.submit') }}
              </button>
            </hlm-field-group>
          </form>
        }
      </div>

      <div hlmCardFooter class="justify-center text-sm">
        <span class="text-muted-foreground">{{ t('auth.signup.haveAccount') }}</span>
        <a class="ml-1 underline underline-offset-4" routerLink="../login">
          {{ t('auth.signup.signIn') }}
        </a>
      </div>
    </hlm-card>
  `,
})
export class SignupPage {
  private readonly auth = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  protected readonly config = inject(AUTH_PAGES_CONFIG);

  protected readonly busy = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      fullName: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(this.config.passwordMinLength)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);

    const { email, password, fullName } = this.form.getRawValue();
    const { error } = await this.auth.signUp(email, password, fullName || undefined);

    this.busy.set(false);
    if (error) {
      this.error.set(error.message);
      return;
    }
    // Supabase returns success whether or not the address is new, so the copy is
    // deliberately neutral: it never reveals that an account already exists.
    this.sent.set(true);
  }

  protected async withProvider(provider: Provider): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    const { error } = await this.auth.signInWithOAuth(
      provider,
      `${window.location.origin}/auth/callback`,
    );
    if (error) {
      this.busy.set(false);
      this.error.set(error.message);
    }
  }
}

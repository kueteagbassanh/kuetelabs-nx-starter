import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  type AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { HlmFieldImports } from '@kuetelabs/frontend/ui/components/field';
import { HlmInputImports } from '@kuetelabs/frontend/ui/components/input';
import { AuthStore } from '@kuetelabs/frontend/data-access/supabase';
import { TranslocoDirective } from '@kuetelabs/frontend/ui/i18n';
import { AUTH_PAGES_CONFIG } from '../auth.config';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  return group.get('password')?.value === group.get('confirmPassword')?.value
    ? null
    : { passwordMismatch: true };
}

@Component({
  selector: 'lib-reset-password-page',
  imports: [
    ReactiveFormsModule,
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
        <h1 hlmCardTitle>{{ t('auth.resetPassword.title') }}</h1>
        <p hlmCardDescription>
          {{
            hasSession()
              ? t('auth.resetPassword.descriptionReady')
              : t('auth.resetPassword.descriptionNoSession')
          }}
        </p>
      </hlm-card-header>

      <div hlmCardContent>
        @if (hasSession()) {
          <form [formGroup]="form" (ngSubmit)="submit()">
            <hlm-field-group>
              <hlm-field>
                <label hlmFieldLabel for="password">
                  {{ t('auth.resetPassword.newPassword') }}
                </label>
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
                {{ busy() ? t('auth.resetPassword.submitting') : t('auth.resetPassword.submit') }}
              </button>
            </hlm-field-group>
          </form>
        } @else {
          <p class="text-muted-foreground text-sm">
            {{ t('auth.resetPassword.needsRecoverySession') }}
          </p>
        }
      </div>
    </hlm-card>
  `,
})
export class ResetPasswordPage implements OnInit {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  protected readonly config = inject(AUTH_PAGES_CONFIG);

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  /** The reset link signs the user in, so a session is the proof they hold it. */
  protected readonly hasSession = this.auth.isAuthenticated;

  protected readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(this.config.passwordMinLength)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  ngOnInit(): void {
    // Supabase may still be exchanging the recovery code when this mounts.
    void this.auth.refreshClaims();
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);

    const { error } = await this.auth.updatePassword(this.form.getRawValue().password);

    this.busy.set(false);
    if (error) {
      this.error.set(error.message);
      return;
    }
    await this.router.navigateByUrl(this.config.redirectAfterLogin);
  }
}

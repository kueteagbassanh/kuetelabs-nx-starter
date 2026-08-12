import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { Provider } from '@supabase/supabase-js';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { HlmFieldImports } from '@kuetelabs/frontend/ui/components/field';
import { HlmInputImports } from '@kuetelabs/frontend/ui/components/input';
import { AuthStore } from '@kuetelabs/frontend/data-access/supabase';
import { TranslocoDirective } from '@kuetelabs/frontend/ui/i18n';
import { AUTH_PAGES_CONFIG } from '../auth.config';
import { OauthButtons } from '../oauth-buttons';

@Component({
  selector: 'lib-login-page',
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
        <h1 hlmCardTitle>{{ t('auth.login.title', { app: config.appName }) }}</h1>
        <p hlmCardDescription>{{ t('auth.login.description') }}</p>
      </hlm-card-header>

      <div hlmCardContent class="flex flex-col gap-4">
        <lib-oauth-buttons [busy]="busy()" (chosen)="withProvider($event)" />

        <form [formGroup]="form" (ngSubmit)="submit()">
          <hlm-field-group>
            <hlm-field>
              <label hlmFieldLabel for="email">{{ t('auth.fields.email') }}</label>
              <input
                hlmInput
                id="email"
                type="email"
                autocomplete="email"
                [placeholder]="t('auth.fields.emailPlaceholder')"
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
              <div class="flex items-center">
                <label hlmFieldLabel for="password">{{ t('auth.fields.password') }}</label>
                <a
                  class="ml-auto text-sm underline-offset-4 hover:underline"
                  routerLink="../forgot-password"
                >
                  {{ t('auth.login.forgotPassword') }}
                </a>
              </div>
              <input
                hlmInput
                id="password"
                type="password"
                autocomplete="current-password"
                formControlName="password"
              />
              <hlm-field-error validator="required">
                {{ t('auth.fields.passwordRequired') }}
              </hlm-field-error>
            </hlm-field>

            @if (error(); as message) {
              <p class="text-destructive text-sm" role="alert">{{ message }}</p>
            }

            <button hlmBtn type="submit" class="w-full" [disabled]="form.invalid || busy()">
              {{ busy() ? t('auth.login.submitting') : t('auth.login.submit') }}
            </button>
          </hlm-field-group>
        </form>
      </div>

      @if (config.signupEnabled) {
        <div hlmCardFooter class="justify-center text-sm">
          <span class="text-muted-foreground">{{ t('auth.login.noAccount') }}</span>
          <a class="ml-1 underline underline-offset-4" routerLink="../signup">
            {{ t('auth.login.createOne') }}
          </a>
        </div>
      }
    </hlm-card>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  protected readonly config = inject(AUTH_PAGES_CONFIG);

  /**
   * Where authenticatedGuard was headed when it interrupted. Only same-origin
   * relative paths are honoured — an absolute URL here would be an open redirect.
   */
  private returnUrl(): string {
    const requested = this.route.snapshot.queryParamMap.get('returnUrl');
    return requested?.startsWith('/') && !requested.startsWith('//')
      ? requested
      : this.config.redirectAfterLogin;
  }

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
    await this.router.navigateByUrl(this.returnUrl());
  }

  protected async withProvider(provider: Provider): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    // Carry the destination through the provider round trip.
    const returnUrl = encodeURIComponent(this.returnUrl());
    const redirectTo = `${window.location.origin}/auth/callback?returnUrl=${returnUrl}`;
    const { error } = await this.auth.signInWithOAuth(provider, redirectTo);
    if (error) {
      this.busy.set(false);
      this.error.set(error.message);
    }
    // On success the browser is navigating away; leave busy set.
  }
}

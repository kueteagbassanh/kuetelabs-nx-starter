import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { AuthStore } from '@kuetelabs/frontend/data-access/supabase';
import { TranslocoDirective } from '@kuetelabs/frontend/ui/i18n';
import { AUTH_PAGES_CONFIG } from '../auth.config';

/**
 * Landing point for every redirect Supabase sends back: OAuth, email confirmation,
 * and recovery links. Trades the `code` parameter for a session, then forwards.
 */
@Component({
  selector: 'lib-callback-page',
  imports: [RouterLink, TranslocoDirective, ...HlmCardImports, ...HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-card *transloco="let t">
      <hlm-card-header>
        <h1 hlmCardTitle>
          {{ error() ? t('auth.callback.failedTitle') : t('auth.callback.title') }}
        </h1>
        <!-- The provider's own error text is passed through untranslated: it comes
             from Supabase at runtime and has no key in these files. -->
        <p hlmCardDescription>{{ error() ?? t('auth.callback.description') }}</p>
      </hlm-card-header>

      @if (error()) {
        <div hlmCardContent>
          <a hlmBtn variant="outline" class="w-full" routerLink="../login">
            {{ t('auth.callback.backToLogin') }}
          </a>
        </div>
      }
    </hlm-card>
  `,
})
export class CallbackPage implements OnInit {
  private readonly auth = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly config = inject(AUTH_PAGES_CONFIG);

  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;

    // The provider reports its own failures here rather than in the code exchange.
    const providerError = params.get('error_description') ?? params.get('error');
    if (providerError) {
      this.error.set(providerError);
      return;
    }

    const code = params.get('code');
    if (code) {
      const { error } = await this.auth.exchangeCodeForSession(code);
      if (error) {
        this.error.set(error.message);
        return;
      }
    }

    // Recovery links must land on the reset form, not the app.
    const requested = params.get('returnUrl');
    const safeReturn =
      requested?.startsWith('/') && !requested.startsWith('//')
        ? requested
        : this.config.redirectAfterLogin;
    const target = params.get('type') === 'recovery' ? '../reset-password' : safeReturn;

    await this.router.navigate([target], {
      relativeTo: params.get('type') === 'recovery' ? this.route : null,
    });
  }
}

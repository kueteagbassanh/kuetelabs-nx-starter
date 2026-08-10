import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { AuthStore } from '@kuetelabs/frontend/data-access/supabase';
import { AUTH_PAGES_CONFIG } from '../auth.config';

/**
 * Landing point for every redirect Supabase sends back: OAuth, email confirmation,
 * and recovery links. Trades the `code` parameter for a session, then forwards.
 */
@Component({
  selector: 'lib-callback-page',
  imports: [RouterLink, ...HlmCardImports, ...HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-card>
      <hlm-card-header>
        <h1 hlmCardTitle>{{ error() ? 'Sign-in failed' : 'Signing you in…' }}</h1>
        <p hlmCardDescription>
          {{ error() ?? 'One moment while we finish setting up your session.' }}
        </p>
      </hlm-card-header>

      @if (error()) {
        <div hlmCardContent>
          <a hlmBtn variant="outline" class="w-full" routerLink="../login">Back to sign in</a>
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
    const target =
      params.get('type') === 'recovery' ? '../reset-password' : this.config.redirectAfterLogin;

    await this.router.navigate([target], {
      relativeTo: params.get('type') === 'recovery' ? this.route : null,
    });
  }
}

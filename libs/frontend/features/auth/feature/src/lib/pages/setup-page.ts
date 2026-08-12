import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { TranslocoDirective } from '@kuetelabs/frontend/ui/i18n';

/**
 * Shown by supabaseConfiguredGuard when no credentials are set, so a freshly cloned
 * starter explains itself instead of throwing an injector error.
 */
@Component({
  selector: 'lib-auth-setup-page',
  imports: [TranslocoDirective, ...HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-card *transloco="let t">
      <hlm-card-header>
        <h1 hlmCardTitle>{{ t('auth.setup.title') }}</h1>
        <p hlmCardDescription>{{ t('auth.setup.description') }}</p>
      </hlm-card-header>

      <div hlmCardContent class="flex flex-col gap-3 text-sm">
        <!-- Prose is translated; the commands and paths inside <code> are literals
             in every language, so each step is split around them. -->
        <ol class="text-muted-foreground list-decimal space-y-1 pl-4">
          <li>
            {{ t('auth.setup.stepRun') }}
            <code class="text-foreground">npx supabase start</code>
          </li>
          <li>
            {{ t('auth.setup.stepCopyBefore') }}
            <code class="text-foreground">anon key</code>
            {{ t('auth.setup.stepCopyMiddle') }}
            <code class="text-foreground">src/environments/environment.ts</code>
          </li>
          <li>{{ t('auth.setup.stepRestart') }}</li>
        </ol>
        <p class="text-muted-foreground">{{ t('auth.setup.anonKeyNote') }}</p>
      </div>
    </hlm-card>
  `,
})
export class AuthSetupPage {}

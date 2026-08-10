import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';

/**
 * Shown by supabaseConfiguredGuard when no credentials are set, so a freshly cloned
 * starter explains itself instead of throwing an injector error.
 */
@Component({
  selector: 'lib-auth-setup-page',
  imports: [...HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-card>
      <hlm-card-header>
        <h1 hlmCardTitle>Supabase isn't configured yet</h1>
        <p hlmCardDescription>Auth needs a project URL and anon key before it can run.</p>
      </hlm-card-header>

      <div hlmCardContent class="flex flex-col gap-3 text-sm">
        <ol class="text-muted-foreground list-decimal space-y-1 pl-4">
          <li>Run <code class="text-foreground">npx supabase start</code></li>
          <li>
            Copy the printed <code class="text-foreground">anon key</code> into
            <code class="text-foreground">src/environments/environment.ts</code>
          </li>
          <li>Restart the dev server</li>
        </ol>
        <p class="text-muted-foreground">
          The anon key is public by design — row level security protects the data, not the secrecy
          of that key.
        </p>
      </div>
    </hlm-card>
  `,
})
export class AuthSetupPage {}

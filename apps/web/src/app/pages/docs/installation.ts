import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HlmTypographyImports } from '@kuetelabs/frontend/ui/components/typography';

@Component({
  selector: 'app-docs-installation',
  imports: [...HlmTypographyImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 hlmH1>Installation</h1>
    <p hlmLead>Clone, install, serve.</p>

    <h2 hlmH2>Requirements</h2>
    <p hlmP>
      Node 22 or newer, and the Supabase CLI if you want the database, auth, and
      realtime running locally.
    </p>

    <h2 hlmH2>Install</h2>
    <p hlmP>
      Run <code hlmCode>npm install</code> at the workspace root. There are no
      scripts in <code hlmCode>package.json</code> — everything goes through
      <code hlmCode>npx nx</code>.
    </p>

    <h3 hlmH3>Environment</h3>
    <p hlmP>
      Copy <code hlmCode>.env.example</code> and fill in the Supabase URL and
      anon key. Without them the app still runs: the guards pass through and
      auth pages divert to <code hlmCode>/auth/setup</code>.
    </p>

    <h2 hlmH2>Run</h2>
    <p hlmP>
      Start the public app with <code hlmCode>npx nx serve web</code>, the back
      office with <code hlmCode>npx nx serve admin</code>, and the API with
      <code hlmCode>npx nx serve api</code>.
    </p>
  `,
})
export class DocsInstallation {}

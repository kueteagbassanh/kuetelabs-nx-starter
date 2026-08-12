import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HlmTypographyImports } from '@kuetelabs/frontend/ui/components/typography';

/**
 * Docs pages are plain markup: spacing comes from the article in DocsLayout, and
 * the "on this page" rail is built by scanning these headings.
 */
@Component({
  selector: 'app-docs-introduction',
  imports: [...HlmTypographyImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 hlmH1>Introduction</h1>
    <p hlmLead>An Nx workspace with the boring parts already wired.</p>

    <h2 hlmH2>What is included</h2>
    <p hlmP>
      Supabase auth with route guards, global roles and permissions, an in-app
      notification centre, charts, a shared theme, and the layouts that hold
      them together.
    </p>

    <h3 hlmH3>Apps</h3>
    <p hlmP>
      <code hlmCode>web</code> is the public Angular app with SSR,
      <code hlmCode>admin</code> is the invite-only back office, and
      <code hlmCode>api</code> is the Nest service that owns everything needing
      a secret key.
    </p>

    <h3 hlmH3>Libraries</h3>
    <p hlmP>
      spartan/ui components are vendored into the repo as buildable libraries,
      so nothing is hidden behind a package boundary — you can read and change
      any component you use.
    </p>

    <h2 hlmH2>Philosophy</h2>
    <p hlmP>
      Configuration over duplication. One shell, many apps: both Angular apps
      mount the same layouts and differ only in what they provide.
    </p>
  `,
})
export class DocsIntroduction {}

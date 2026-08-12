import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';

@Component({
  selector: 'admin-forbidden',
  imports: [RouterLink, ...HlmCardImports, ...HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 p-4">
      <section hlmCard class="max-w-lg">
        <div hlmCardHeader>
          <h2 hlmCardTitle>Not permitted</h2>
          <p hlmCardDescription>
            Your account doesn't hold the permission this page requires. If a role was just granted,
            sign out and back in — permissions travel in the access token.
          </p>
        </div>
        <div hlmCardContent>
          <a hlmBtn variant="outline" routerLink="/">Back to overview</a>
        </div>
      </section>
    </div>
  `,
})
export class Forbidden {}

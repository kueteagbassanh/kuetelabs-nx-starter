import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowUpRight } from '@ng-icons/lucide';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import type { LandingLink } from '../landing.model';

/**
 * Renders one `LandingLink` in whichever of the three forms it asks for, so the
 * header, the mobile drawer, and the footer never repeat the branching:
 *
 * - `external: true` -> plain `<a href>` in a new tab, with a trailing glyph
 * - `fragment` set   -> router link to a section anchor (never marked active,
 *   since every anchor on the home page shares the same `/` path)
 * - otherwise        -> router link with exact active styling
 */
@Component({
  selector: 'lib-landing-nav-link',
  imports: [RouterLink, RouterLinkActive, NgIcon, HlmIcon],
  providers: [provideIcons({ lucideArrowUpRight })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @let item = link();
    @if (item.external) {
      <a [href]="item.url" target="_blank" rel="noopener noreferrer" [class]="linkClass()">
        {{ item.label }}
        <ng-icon hlm name="lucideArrowUpRight" size="xs" class="opacity-60" />
      </a>
    } @else if (item.fragment) {
      <a [routerLink]="item.url" [fragment]="item.fragment" [class]="linkClass()">
        {{ item.label }}
      </a>
    } @else {
      <a
        [routerLink]="item.url"
        routerLinkActive="text-foreground font-medium"
        [routerLinkActiveOptions]="{ exact: true }"
        [class]="linkClass()"
      >
        {{ item.label }}
      </a>
    }
  `,
})
export class LandingNavLink {
  public readonly link = input.required<LandingLink>();
  public readonly linkClass = input<string>('');
}

import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import type { Provider } from '@supabase/supabase-js';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideGithub, lucideMail } from '@ng-icons/lucide';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { TranslocoDirective } from '@kuetelabs/frontend/ui/i18n';
import { AUTH_PAGES_CONFIG } from './auth.config';

const PROVIDER_LABELS: Partial<Record<Provider, { label: string; icon: string }>> = {
  google: { label: 'Google', icon: 'lucideMail' },
  github: { label: 'GitHub', icon: 'lucideGithub' },
};

/** Renders the OAuth buttons the app configured, or nothing when there are none. */
@Component({
  selector: 'lib-oauth-buttons',
  imports: [TranslocoDirective, ...HlmButtonImports, NgIcon, HlmIcon],
  providers: [provideIcons({ lucideGithub, lucideMail })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (providers.length > 0) {
      <ng-container *transloco="let t">
        <div class="flex flex-col gap-2">
          @for (provider of providers; track provider) {
            <button
              hlmBtn
              variant="outline"
              type="button"
              class="w-full"
              [disabled]="busy()"
              (click)="chosen.emit(provider)"
            >
              <ng-icon hlm [name]="iconFor(provider)" />
              <!-- The provider name is a brand and stays as-is in every language. -->
              {{ t('auth.oauth.continueWith', { provider: labelFor(provider) }) }}
            </button>
          }
        </div>
        <div class="flex items-center gap-2">
          <span class="bg-border h-px flex-1"></span>
          <span class="text-muted-foreground text-xs uppercase">{{ t('auth.oauth.or') }}</span>
          <span class="bg-border h-px flex-1"></span>
        </div>
      </ng-container>
    }
  `,
})
export class OauthButtons {
  protected readonly providers = inject(AUTH_PAGES_CONFIG).oauthProviders;

  readonly busy = input(false);
  readonly chosen = output<Provider>();

  protected labelFor(provider: Provider): string {
    return PROVIDER_LABELS[provider]?.label ?? provider;
  }

  protected iconFor(provider: Provider): string {
    return PROVIDER_LABELS[provider]?.icon ?? 'lucideMail';
  }
}

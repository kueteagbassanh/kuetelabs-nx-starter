import { Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowUp } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-spartan-button-preview',
  imports: [HlmButton, NgIcon],
  providers: [provideIcons({ lucideArrowUp })],
  host: { class: 'flex flex-wrap items-center gap-2 md:flex-row' },
  template: `
    <button hlmBtn variant="outline">Button</button>
    <button hlmBtn size="icon" variant="outline">
      <ng-icon name="lucideArrowUp" />
    </button>
  `,
})
export class ButtonPreview {}

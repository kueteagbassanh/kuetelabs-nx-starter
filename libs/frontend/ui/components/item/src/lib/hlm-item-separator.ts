import { Directive } from '@angular/core';
import { BrnSeparator } from '@spartan-ng/brain/separator';
import { hlmSeparatorClass } from '@kuetelabs/frontend/ui/components/separator';
import { classes } from '@kuetelabs/frontend/ui/components/utils';

@Directive({
	selector: '[hlmItemSeparator],hlm-item-separator',
	hostDirectives: [{ directive: BrnSeparator, inputs: ['orientation'] }],
	host: { 'data-slot': 'item-separator' },
})
export class HlmItemSeparator {
	constructor() {
		classes(() => [hlmSeparatorClass, 'my-2']);
	}
}

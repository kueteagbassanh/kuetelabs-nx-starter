import { Directive } from '@angular/core';
import { BrnDialogTitle } from '@spartan-ng/brain/dialog';
import { classes } from '@kuetelabs/frontend/ui/components/utils';

@Directive({
	selector: '[hlmDialogTitle]',
	hostDirectives: [BrnDialogTitle],
	host: {
		'data-slot': 'dialog-title',
	},
})
export class HlmDialogTitle {
	constructor() {
		classes(() => 'text-lg leading-none font-semibold');
	}
}

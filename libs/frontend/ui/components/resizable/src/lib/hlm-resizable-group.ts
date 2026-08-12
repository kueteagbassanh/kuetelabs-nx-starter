import { Directive } from '@angular/core';
import { BrnResizableGroup } from '@spartan-ng/brain/resizable';
import { classes } from '@kuetelabs/frontend/ui/components/utils';

@Directive({
	selector: '[hlmResizableGroup],hlm-resizable-group',
	hostDirectives: [
		{
			directive: BrnResizableGroup,
			inputs: ['direction', 'layout'],
			outputs: ['dragEnd', 'dragStart', 'layoutChange'],
		},
	],
	host: {
		'data-slot': 'resizable-group',
	},
})
export class HlmResizableGroup {
	constructor() {
		classes(() => 'group flex h-full w-full data-[panel-group-direction=vertical]:flex-col');
	}
}

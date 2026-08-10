import { Directive } from '@angular/core';
import { classes } from '@kuetelabs/frontend/ui/components/utils';

@Directive({
	selector: '[hlmBreadcrumbPage]',
	host: {
		'data-slot': 'breadcrumb-page',
		role: 'link',
		'aria-disabled': 'true',
		'aria-current': 'page',
	},
})
export class HlmBreadcrumbPage {
	constructor() {
		classes(() => 'text-foreground font-normal');
	}
}

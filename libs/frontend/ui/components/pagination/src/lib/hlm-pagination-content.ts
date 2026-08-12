import { Directive } from '@angular/core';
import { classes } from '@kuetelabs/frontend/ui/components/utils';

@Directive({
	selector: 'ul[hlmPaginationContent]',
	host: { 'data-slot': 'pagination-content' },
})
export class HlmPaginationContent {
	constructor() {
		classes(() => 'gap-1 flex items-center');
	}
}

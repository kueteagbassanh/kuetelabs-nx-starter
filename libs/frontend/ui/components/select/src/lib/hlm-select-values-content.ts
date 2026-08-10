import { Directive } from '@angular/core';
import { classes } from '@kuetelabs/frontend/ui/components/utils';

@Directive({ selector: '[hlmSelectValuesContent],hlm-select-values-content' })
export class HlmSelectValuesContent {
	constructor() {
		classes(() => 'flex gap-1');
	}
}

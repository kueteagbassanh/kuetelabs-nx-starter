import { Directive } from '@angular/core';
import { classes } from '@kuetelabs/frontend/ui/components/utils';

export const hlmSmall = 'text-sm font-medium leading-none';

@Directive({
	selector: '[hlmSmall]',
})
export class HlmSmall {
	constructor() {
		classes(() => hlmSmall);
	}
}

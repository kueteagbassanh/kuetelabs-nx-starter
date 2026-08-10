import { Directive } from '@angular/core';
import { classes } from '@kuetelabs/frontend/ui/components/utils';

@Directive({
	selector: '[hlmAlertDialogFooter],hlm-alert-dialog-footer',
	host: {
		'data-slot': 'alert-dialog-footer',
	},
})
export class HlmAlertDialogFooter {
	constructor() {
		classes(() => 'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end');
	}
}

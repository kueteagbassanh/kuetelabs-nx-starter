import { Directive } from '@angular/core';
import { classes } from '@kuetelabs/frontend/ui/components/utils';

@Directive({
	selector: 'brn-input-otp[hlmInputOtp], brn-input-otp[hlm]',
	host: { 'data-slot': 'input-otp' },
})
export class HlmInputOtp {
	constructor() {
		classes(() => 'gap-2 flex items-center has-disabled:opacity-50');
	}
}

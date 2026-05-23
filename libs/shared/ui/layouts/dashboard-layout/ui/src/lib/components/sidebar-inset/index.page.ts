import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { AppSidebarInset } from './sidebar-inset/app-sidebar';
import { SiteHeader } from './sidebar-inset/site-header';

@Component({
	selector: 'lib-spartan-sidebar-inset',
	imports: [HlmSidebarImports, SiteHeader, AppSidebarInset],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'block',
	},
	template: `
		<lib-spartan-app-sidebar-inset>
			<main hlmSidebarInset>
				<lib-spartan-site-header-inset />
				<div class="flex flex-1 flex-col gap-4 p-4">
					<div class="grid auto-rows-min gap-4 md:grid-cols-3">
						<div class="bg-muted/50 aspect-video rounded-xl"></div>
						<div class="bg-muted/50 aspect-video rounded-xl"></div>
						<div class="bg-muted/50 aspect-video rounded-xl"></div>
					</div>
					<div class="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min"></div>
				</div>
			</main>
		</lib-spartan-app-sidebar-inset>
	`,
})
export default class SidebarInsetPage {}

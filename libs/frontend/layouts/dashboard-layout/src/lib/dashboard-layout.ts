import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HlmSidebarImports } from '@kuetelabs/frontend/ui/components/sidebar';
import { Sidebar } from './components/sidebar';
import { DASHBOARD_HEADER_ACTIONS } from './header-actions';

@Component({
  selector: 'lib-dashboard-layout',
  imports: [Sidebar, RouterOutlet, NgComponentOutlet, ...HlmSidebarImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-sidebar>
      <main hlmSidebarInset>
        <header class="flex h-12 items-center justify-between px-4">
          <button hlmSidebarTrigger><span class="sr-only">Toggle sidebar</span></button>
          <div class="flex items-center gap-1">
            @for (action of headerActions; track action) {
              <ng-container *ngComponentOutlet="action" />
            }
          </div>
        </header>
        <router-outlet />
      </main>
    </lib-sidebar>
  `,
})
export class DashboardLayout {
  /** Empty unless the app provides DASHBOARD_HEADER_ACTIONS. */
  protected readonly headerActions = inject(DASHBOARD_HEADER_ACTIONS);
}

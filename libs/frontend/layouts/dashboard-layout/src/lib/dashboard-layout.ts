import { Component } from '@angular/core';
import { Sidebar } from './components/sidebar';
import { RouterOutlet } from '@angular/router';
import { HlmSidebarImports } from '@kuetelabs/frontend/ui/components/sidebar';

@Component({
  selector: 'lib-dashboard-layout',
  imports: [Sidebar, RouterOutlet, ...HlmSidebarImports],
  template: ` <lib-sidebar>
    <main hlmSidebarInset>
      <header class="flex h-12 items-center justify-between px-4">
        <button hlmSidebarTrigger><span class="sr-only"></span></button>
      </header>
      <router-outlet />
    </main>
  </lib-sidebar>`,
})
export class DashboardLayout {}

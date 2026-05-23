import { Component, input } from '@angular/core';
import SidebarStickyHeaderPage from './components/sidebar-sticky-header/index.page';
import SidebarInsetPage from './components/sidebar-inset/index.page';

@Component({
  selector: 'lib-dashboard-layout-ui',
  imports: [SidebarStickyHeaderPage, SidebarInsetPage],
  template: `@if (type() === 'sticky') {
    <lib-spartan-sidebar-sticky-header />
  } @else {
    <lib-spartan-sidebar-inset />
  }`,
})
export class DashboardLayoutUi {
  type = input<'default' | 'sticky' | 'inset'>('default');
  mode = input<'light' | 'dark'>('light');
}

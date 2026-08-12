import { InjectionToken } from '@angular/core';

export interface NavigationDropdownItem {
  label: string;
  action: string;
}

export interface NavigationAction {
  icon: string;
  label: string;
  dropdownItems?: NavigationDropdownItem[];
}

export interface NavigationSubItem {
  label: string;
  url: string;
  isActive?: boolean;
}

export interface NavigationItem {
  label: string;
  url?: string;
  icon?: string;
  isActive?: boolean;
  badge?: string;
  children?: NavigationSubItem[];
  defaultOpen?: boolean;
  action?: NavigationAction;
}

export interface NavigationGroup {
  label: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  items: NavigationItem[];
  action?: NavigationAction;
}

export interface SidebarConfig {
  groups: NavigationGroup[];
}

// 🏛️ The global contract key that host applications will fulfill
export const DASHBOARD_MENU_CONFIG = new InjectionToken<SidebarConfig>(
  'DASHBOARD_MENU_CONFIG',
);
import { Component, inject, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { HlmSidebarImports } from '@kuetelabs/frontend/ui/components/sidebar';
import { HlmCollapsibleImports } from '@kuetelabs/frontend/ui/components/collapsible';
import { HlmDropdownMenuImports } from '@kuetelabs/frontend/ui/components/dropdown-menu';
import {
  lucideChevronRight,
  lucideChevronDown,
  lucideEllipsis,
  lucidePlus,
  lucideHouse,
  lucideInbox,
  lucideCalendar,
  lucideSearch,
  lucideSettings,
  lucideFrame,
  lucideChartPie,
  lucideMap,
  lucideBookOpen,
  lucideCode,
  lucideShield,
  lucideBell,
  lucideLifeBuoy,
  lucideSend,
} from '@ng-icons/lucide';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { SidebarStore } from '../sidebar.store';

@Component({
  selector: 'lib-sidebar',
  imports: [
    HlmSidebarImports,
    HlmCollapsibleImports,
    HlmDropdownMenuImports,
    NgIcon,
    HlmIcon,
    NgTemplateOutlet,
  ],
  providers: [
    provideIcons({
      lucideChevronRight,
      lucideChevronDown,
      lucideEllipsis,
      lucidePlus,
      lucideHouse,
      lucideInbox,
      lucideCalendar,
      lucideSearch,
      lucideSettings,
      lucideFrame,
      lucideChartPie,
      lucideMap,
      lucideBookOpen,
      lucideCode,
      lucideShield,
      lucideBell,
      lucideLifeBuoy,
      lucideSend,
    }),
  ],
  template: `
    <div hlmSidebarWrapper>
      <hlm-sidebar>
        <div hlmSidebarContent>
          @for (group of sidebarStore.config().groups; track group.label) {
            <!-- Collapsible group -->
            @if (group.collapsible) {
              <hlm-collapsible
                [expanded]="group.defaultOpen ?? true"
                class="group/collapsible"
              >
                <div hlmSidebarGroup>
                  <button
                    hlmCollapsibleTrigger
                    hlmSidebarGroupLabel
                    class="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
                  >
                    {{ group.label }}
                    <ng-icon
                      hlm
                      name="lucideChevronDown"
                      class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
                    />
                  </button>
                  <hlm-collapsible-content>
                    <ng-container
                      *ngTemplateOutlet="menuTpl; context: { $implicit: group.items }"
                    />
                  </hlm-collapsible-content>
                </div>
              </hlm-collapsible>
            } @else {
              <!-- Static group -->
              <div hlmSidebarGroup>
                <div hlmSidebarGroupLabel>{{ group.label }}</div>
                @if (group.action) {
                  @if (group.action.dropdownItems?.length) {
                    <button
                      hlmSidebarGroupAction
                      [title]="group.action.label"
                      [hlmDropdownMenuTrigger]="groupDropdown"
                    >
                      <ng-icon hlm [name]="group.action.icon" />
                      <span class="sr-only">{{ group.action.label }}</span>
                    </button>
                    <ng-template #groupDropdown>
                      <hlm-dropdown-menu>
                        @for (dropdownItem of group.action.dropdownItems; track dropdownItem.label) {
                          <button hlmDropdownMenuItem (click)="actionClicked.emit(dropdownItem.action)">
                            {{ dropdownItem.label }}
                          </button>
                        }
                      </hlm-dropdown-menu>
                    </ng-template>
                  } @else {
                    <button
                      hlmSidebarGroupAction
                      [title]="group.action.label"
                      (click)="actionClicked.emit(group.action.label)"
                    >
                      <ng-icon hlm [name]="group.action.icon" />
                      <span class="sr-only">{{ group.action.label }}</span>
                    </button>
                  }
                }
                <ng-container
                  *ngTemplateOutlet="menuTpl; context: { $implicit: group.items }"
                />
              </div>
            }
          }
        </div>
      </hlm-sidebar>
      <ng-content />
    </div>

    <!-- Shared menu template -->
    <ng-template #menuTpl let-items>
      <div hlmSidebarGroupContent>
        <ul hlmSidebarMenu>
          @for (item of items; track item.label) {
            <!-- Item with collapsible children -->
            @if (item.children?.length) {
              <hlm-collapsible
                [expanded]="item.defaultOpen ?? false"
                class="group/collapsible"
              >
                <li hlmSidebarMenuItem>
                  <button
                    hlmCollapsibleTrigger
                    hlmSidebarMenuButton
                    class="flex w-full items-center justify-between"
                  >
                    @if (item.icon) {
                      <ng-icon hlm [name]="item.icon" />
                    }
                    <span>{{ item.label }}</span>
                    <ng-icon
                      name="lucideChevronRight"
                      class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
                      hlm
                    />
                  </button>
                  <hlm-collapsible-content>
                    <ul hlmSidebarMenuSub>
                      @for (child of item.children; track child.label) {
                        <li hlmSidebarMenuSubItem>
                          <a
                            hlmSidebarMenuSubButton
                            [href]="child.url"
                            [attr.isActive]="child.isActive || null"
                            class="w-full"
                          >
                            <span>{{ child.label }}</span>
                          </a>
                        </li>
                      }
                    </ul>
                  </hlm-collapsible-content>
                </li>
              </hlm-collapsible>
            } @else {
              <!-- Simple menu item -->
              <li hlmSidebarMenuItem>
                <a
                  hlmSidebarMenuButton
                  [href]="item.url ?? '#'"
                  [isActive]="!!item.isActive"
                >
                  @if (item.icon) {
                    <ng-icon hlm [name]="item.icon" />
                  }
                  <span>{{ item.label }}</span>
                </a>
                @if (item.action) {
                  @if (item.action.dropdownItems?.length) {
                    <button
                      hlmSidebarMenuAction
                      [hlmDropdownMenuTrigger]="itemDropdown"
                    >
                      <ng-icon hlm [name]="item.action.icon" />
                      <span class="sr-only">{{ item.action.label }}</span>
                    </button>
                    <ng-template #itemDropdown>
                      <hlm-dropdown-menu>
                        @for (dropdownItem of item.action.dropdownItems; track dropdownItem.label) {
                          <button hlmDropdownMenuItem (click)="actionClicked.emit(dropdownItem.action)">
                            {{ dropdownItem.label }}
                          </button>
                        }
                      </hlm-dropdown-menu>
                    </ng-template>
                  } @else {
                    <button
                      hlmSidebarMenuAction
                      (click)="actionClicked.emit(item.action.label)"
                    >
                      <ng-icon hlm [name]="item.action.icon" />
                      <span class="sr-only">{{ item.action.label }}</span>
                    </button>
                  }
                }
                @if (item.badge) {
                  <div hlmSidebarMenuBadge>{{ item.badge }}</div>
                }
              </li>
            }
          }
        </ul>
      </div>
    </ng-template>
  `,
})
export class Sidebar {
  protected readonly sidebarStore = inject(SidebarStore);
  actionClicked = output<string>();
}

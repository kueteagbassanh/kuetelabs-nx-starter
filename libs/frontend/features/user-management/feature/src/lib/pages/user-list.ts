import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmBadgeImports } from '@kuetelabs/frontend/ui/components/badge';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { HlmInputImports } from '@kuetelabs/frontend/ui/components/input';
import { HlmTableImports } from '@kuetelabs/frontend/ui/components/table';
import { AuthStore, HasPermission } from '@kuetelabs/frontend/data-access/supabase';
import { UsersStore } from '@kuetelabs/frontend/features/user-management/data-access';
import { APP_ROLES, type AppRole, type ManagedUser } from '@kuetelabs/shared/domain';

@Component({
  selector: 'lib-user-list',
  imports: [
    FormsModule,
    ...HlmCardImports,
    ...HlmTableImports,
    ...HlmBadgeImports,
    ...HlmButtonImports,
    ...HlmInputImports,
    HasPermission,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 p-4">
      <section hlmCard>
        <div hlmCardHeader class="flex-row items-center justify-between gap-4">
          <div>
            <h2 hlmCardTitle>Users</h2>
            <p hlmCardDescription>
              {{ store.total() }} account(s). Role changes go through the API and are audited.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <input
              hlmInput
              type="search"
              placeholder="Search by email"
              [ngModel]="store.search()"
              (ngModelChange)="onSearch($event)"
              class="w-56"
            />
            <button *libHasPermission="'users.invite'" hlmBtn (click)="toggleInvite()">
              Invite user
            </button>
          </div>
        </div>

        @if (inviteOpen()) {
          <div hlmCardContent class="border-border flex items-end gap-2 border-b pb-4">
            <label class="flex flex-col gap-1 text-sm">
              <span class="text-muted-foreground">Email</span>
              <input hlmInput type="email" [(ngModel)]="inviteEmail" class="w-72" />
            </label>
            <button hlmBtn size="sm" [disabled]="!inviteEmail()" (click)="invite()">Send invite</button>
            <button hlmBtn variant="ghost" size="sm" (click)="toggleInvite()">Cancel</button>
          </div>
        }

        <div hlmCardContent>
          @if (store.error(); as error) {
            <p class="text-destructive mb-3 text-sm" role="alert">{{ error }}</p>
          }

          @if (store.loading()) {
            <p class="text-muted-foreground py-6 text-sm">Loading users…</p>
          } @else if (store.isEmpty()) {
            <p class="text-muted-foreground py-6 text-sm">
              No users match. Invite someone, or clear the search.
            </p>
          } @else {
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh>User</th>
                    <th hlmTh>Roles</th>
                    <th hlmTh>Status</th>
                    <th hlmTh class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @for (user of store.entities(); track user.id) {
                    <tr hlmTr>
                      <td hlmTd>
                        <div class="flex flex-col">
                          <span class="font-medium">{{ user.fullName ?? user.email }}</span>
                          <span class="text-muted-foreground text-xs">{{ user.email }}</span>
                        </div>
                      </td>
                      <td hlmTd>
                        <div class="flex flex-wrap gap-1">
                          @if (canAssign()) {
                            @for (role of roles; track role) {
                              <button
                                type="button"
                                hlmBadge
                                [variant]="user.roles.includes(role) ? 'default' : 'outline'"
                                class="cursor-pointer"
                                [attr.aria-pressed]="user.roles.includes(role)"
                                (click)="toggleRole(user, role)"
                              >
                                {{ role }}
                              </button>
                            }
                          } @else {
                            @for (role of user.roles; track role) {
                              <span hlmBadge variant="secondary">{{ role }}</span>
                            } @empty {
                              <span class="text-muted-foreground text-xs">No roles</span>
                            }
                          }
                        </div>
                      </td>
                      <td hlmTd>
                        <span hlmBadge [variant]="user.disabled ? 'destructive' : 'secondary'">
                          {{ user.disabled ? 'Disabled' : 'Active' }}
                        </span>
                      </td>
                      <td hlmTd class="text-right">
                        <button
                          *libHasPermission="'users.disable'"
                          hlmBtn
                          variant="ghost"
                          size="sm"
                          (click)="store.setDisabled(user, !user.disabled)"
                        >
                          {{ user.disabled ? 'Enable' : 'Disable' }}
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </section>
    </div>
  `,
})
export class UserList implements OnInit {
  private readonly auth = inject(AuthStore);
  protected readonly store = inject(UsersStore);
  protected readonly roles = APP_ROLES;

  /**
   * Two ways to check a permission, each where it fits: *libHasPermission for
   * showing or hiding a control, this computed for branching a whole cell.
   */
  protected readonly canAssign = computed(() => this.auth.has('roles.assign'));

  protected readonly inviteOpen = signal(false);
  protected readonly inviteEmail = signal('');

  ngOnInit(): void {
    // rxMethod debounces, so the first call is the initial load too.
    this.store.reload();
  }

  protected onSearch(value: string): void {
    // One call: the store debounces and cancels in-flight requests.
    this.store.setSearch(value);
  }

  protected toggleInvite(): void {
    this.inviteOpen.update((open) => !open);
  }

  protected async invite(): Promise<void> {
    if (await this.store.invite(this.inviteEmail(), [])) {
      this.inviteEmail.set('');
      this.inviteOpen.set(false);
    }
  }

  protected toggleRole(user: ManagedUser, role: AppRole): void {
    void this.store.toggleRole(user, role);
  }
}

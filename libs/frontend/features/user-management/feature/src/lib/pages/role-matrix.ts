import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { HlmBadgeImports } from '@kuetelabs/frontend/ui/components/badge';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { HlmTableImports } from '@kuetelabs/frontend/ui/components/table';
import { UsersStore } from '@kuetelabs/frontend/features/user-management/data-access';
import type { AppPermission, AppRole } from '@kuetelabs/shared/domain';

@Component({
  selector: 'lib-role-matrix',
  imports: [...HlmCardImports, ...HlmTableImports, ...HlmBadgeImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 p-4">
      <section hlmCard>
        <div hlmCardHeader>
          <h2 hlmCardTitle>Roles and permissions</h2>
          <p hlmCardDescription>
            What each role can do. This map lives in the database (role_permissions) and is read by
            the JWT hook — change it with a migration, not from the UI.
          </p>
        </div>

        <div hlmCardContent>
          @if (store.error(); as error) {
            <p class="text-destructive mb-3 text-sm" role="alert">{{ error }}</p>
          }

          @if (store.matrix(); as matrix) {
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh>Permission</th>
                    @for (role of matrix.roles; track role) {
                      <th hlmTh class="text-center">{{ role }}</th>
                    }
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @for (permission of matrix.permissions; track permission) {
                    <tr hlmTr>
                      <td hlmTd class="font-mono text-xs">{{ permission }}</td>
                      @for (role of matrix.roles; track role) {
                        <td hlmTd class="text-center">
                          @if (granted(matrix.granted, role, permission)) {
                            <span hlmBadge aria-label="granted">✓</span>
                          } @else {
                            <span class="text-muted-foreground" aria-label="not granted">–</span>
                          }
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else if (store.loading()) {
            <p class="text-muted-foreground py-6 text-sm">Loading matrix…</p>
          }
        </div>
      </section>
    </div>
  `,
})
export class RoleMatrix implements OnInit {
  protected readonly store = inject(UsersStore);

  ngOnInit(): void {
    void this.store.loadMatrix();
  }

  protected granted(
    map: Record<AppRole, AppPermission[]>,
    role: AppRole,
    permission: AppPermission,
  ): boolean {
    return map[role]?.includes(permission) ?? false;
  }
}

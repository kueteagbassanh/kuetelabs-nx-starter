import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
} from '@angular/core';
import type { AppPermission } from '@kuetelabs/shared/domain';
import { AuthStore } from './auth.store';

/**
 * Structural directive that renders content only when the user holds a permission:
 *
 *   <button *libHasPermission="'roles.assign'" hlmBtn>Assign role</button>
 *   <div *libHasPermission="['users.read', 'roles.read']">…</div>
 *
 * Hiding a control is presentation, not protection — the API and RLS still enforce.
 */
@Directive({ selector: '[libHasPermission]' })
export class HasPermission {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly auth = inject(AuthStore);

  readonly libHasPermission = input.required<AppPermission | AppPermission[]>();

  private rendered = false;

  constructor() {
    effect(() => {
      const required = this.libHasPermission();
      const list = Array.isArray(required) ? required : [required];
      const allowed = list.every((permission) => this.auth.has(permission));

      if (allowed && !this.rendered) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.rendered = true;
      } else if (!allowed && this.rendered) {
        this.viewContainer.clear();
        this.rendered = false;
      }
    });
  }
}

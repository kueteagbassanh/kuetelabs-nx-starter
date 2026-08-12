import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencilLine } from '@ng-icons/lucide';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { HlmBreadcrumbImports } from '@kuetelabs/frontend/ui/components/breadcrumb';
import { DOCS_LAYOUT_CONFIG } from './docs-layout.config';
import { DocsNavStore } from './docs-nav.store';
import { DocsHeader } from './components/docs-header';
import { DocsSidebarNav } from './components/docs-sidebar-nav';
import { DocsToc } from './components/docs-toc';
import { DocsPager } from './components/docs-pager';

/**
 * Three-column documentation shell: tree on the left, article in the middle,
 * "on this page" on the right, mounted by an app as a routed component:
 *
 *   { path: 'docs', component: DocsLayout, children: [...] }
 *
 * Everything variable — title, tree, repo and edit links, TOC depth — comes from
 * `provideDocsLayout()`, so two apps share the shell and differ only in config.
 */
@Component({
  selector: 'lib-docs-layout',
  imports: [
    RouterOutlet,
    NgIcon,
    HlmIcon,
    DocsHeader,
    DocsSidebarNav,
    DocsToc,
    DocsPager,
    ...HlmBreadcrumbImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucidePencilLine })],
  host: { class: 'bg-background text-foreground flex min-h-svh flex-col' },
  template: `
    <lib-docs-header />

    <div
      class="mx-auto flex w-full max-w-(--breakpoint-2xl) items-start gap-8 px-4"
    >
      <!-- Sticky rails scroll independently of the article; both are hidden on
           small screens, where the tree moves into the header's sheet. -->
      <aside
        class="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-56 shrink-0 overflow-y-auto py-8 lg:block"
      >
        <lib-docs-sidebar-nav />
      </aside>

      <main class="min-w-0 flex-1 py-8">
        @if (docsNav.activeSection(); as section) {
          <nav hlmBreadcrumb class="mb-4">
            <ol hlmBreadcrumbList>
              <li hlmBreadcrumbItem>{{ section }}</li>
              <li hlmBreadcrumbSeparator></li>
              <li hlmBreadcrumbItem>
                <span hlmBreadcrumbPage>{{ docsNav.activeLink()?.label }}</span>
              </li>
            </ol>
          </nav>
        }

        <!-- Vertical rhythm lives here, not in every page: the typography directives
             style a heading, they do not space a document. -->
        <article
          #content
          class="max-w-3xl [&_h1]:mb-3 [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:mt-8 [&_h3]:mb-3 [&_h4]:mt-6 [&_h4]:mb-2 [&_li]:leading-7 [&_p]:leading-7 [&_p:not(:first-child)]:mt-4 [&_pre]:my-4 [&_table]:my-6 [&_ul]:my-4"
        >
          <router-outlet />
        </article>

        @if (editUrl(); as url) {
          <a
            [href]="url"
            target="_blank"
            rel="noreferrer noopener"
            class="text-muted-foreground hover:text-foreground mt-10 inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ng-icon hlm size="xs" name="lucidePencilLine" />
            Edit this page
          </a>
        }

        @if (config.pagerEnabled) {
          <lib-docs-pager class="mt-10 max-w-3xl" />
        }
      </main>

      <!-- The column stays reserved across pages so the article does not change
           width when a page has too few headings to fill it — but an app that turns
           the rail off gets the space back. -->
      @if (config.tocEnabled) {
        <aside
          class="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-56 shrink-0 overflow-y-auto py-8 xl:block"
        >
          <lib-docs-toc [contentHost]="contentEl()?.nativeElement ?? null" />
        </aside>
      }
    </div>
  `,
})
export class DocsLayout {
  protected readonly config = inject(DOCS_LAYOUT_CONFIG);
  protected readonly docsNav = inject(DocsNavStore);

  /** The element the TOC scans; the outlet renders into it. */
  protected readonly contentEl = viewChild<ElementRef<HTMLElement>>('content');

  protected readonly editUrl = computed(() => {
    const base = this.config.editBaseUrl;
    if (!base) {
      return undefined;
    }
    // Only pages in the tree map to a source file; a stray route would produce a 404 link.
    const path = this.docsNav.activeLink()?.path;
    return path
      ? `${base.replace(/\/+$/, '')}${path}${this.config.editFileExtension}`
      : undefined;
  });
}

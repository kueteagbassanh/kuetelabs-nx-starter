import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideAlignLeft } from '@ng-icons/lucide';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { DOCS_LAYOUT_CONFIG } from '../docs-layout.config';

export interface DocsTocHeading {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * "On this page", built by reading the rendered article.
 *
 * The article comes from the router outlet, so there is no input to read it from —
 * the headings are scanned out of the DOM and re-scanned on every content change.
 * All of that is browser-only: on the server (and during `web`'s prerender) this
 * renders nothing, and the rail appears after hydration through a signal update
 * rather than a DOM write, which is what keeps hydration clean.
 */
@Component({
  selector: 'lib-docs-toc',
  imports: [NgIcon, HlmIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideAlignLeft })],
  template: `
    @if (visible()) {
      <nav aria-labelledby="docs-toc-label" class="text-sm">
        <p
          id="docs-toc-label"
          class="text-foreground mb-2 flex items-center gap-1.5 px-3 font-medium"
        >
          <ng-icon
            hlm
            size="xs"
            name="lucideAlignLeft"
            class="text-muted-foreground"
          />
          On this page
        </p>
        <ul class="border-border/60 flex flex-col border-s">
          @for (heading of headings(); track heading.id) {
            <li class="flex">
              <a
                [href]="'#' + heading.id"
                (click)="scrollTo($event, heading.id)"
                [style.padding-inline-start.px]="indent(heading.level)"
                [attr.data-active]="activeId() === heading.id ? 'true' : null"
                [attr.aria-current]="activeId() === heading.id ? 'true' : null"
                class="text-muted-foreground hover:text-foreground data-[active]:border-primary data-[active]:text-foreground -ms-px flex-1 border-s border-transparent py-1 pe-3 font-normal transition-colors data-[active]:font-medium"
              >
                {{ heading.text }}
              </a>
            </li>
          }
        </ul>
      </nav>
    }
  `,
})
export class DocsToc {
  /** The element the router outlet renders into. Null until the view exists. */
  readonly contentHost = input<HTMLElement | null>(null);

  private readonly config = inject(DOCS_LAYOUT_CONFIG);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly minLevel = Math.min(...this.config.tocLevels);

  protected readonly headings = signal<DocsTocHeading[]>([]);
  protected readonly activeId = signal<string | null>(null);
  protected readonly visible = computed(
    () =>
      this.config.tocEnabled &&
      this.headings().length >= this.config.tocMinHeadings,
  );

  private observer?: MutationObserver;
  private scanQueued = false;
  private spyQueued = false;

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    const destroyRef = inject(DestroyRef);

    // The first scan waits for the outlet's content to render — on a prerendered
    // page that means after hydration, so we never race the DOM Angular claims.
    afterNextRender(() => this.queueScan());

    effect(() => {
      const host = this.contentHost();
      this.observer?.disconnect();
      if (!host) {
        this.headings.set([]);
        return;
      }
      // Re-scan when the page swaps or a deferred block fills in. Only childList
      // is observed: the scan writes `id` and `scroll-margin-top`, and observing
      // attributes would make it retrigger itself.
      this.observer = new MutationObserver(() => this.queueScan());
      this.observer.observe(host, { childList: true, subtree: true });
      this.queueScan();
    });

    const onScroll = (): void => {
      if (this.spyQueued) {
        return;
      }
      this.spyQueued = true;
      requestAnimationFrame(() => {
        this.spyQueued = false;
        this.syncActive();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
      this.observer?.disconnect();
    });
  }

  protected indent(level: number): number {
    return 12 + (level - this.minLevel) * 12;
  }

  protected scrollTo(event: MouseEvent, id: string): void {
    const target = document.getElementById(id);
    if (!target) {
      return;
    }
    event.preventDefault();
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    target.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    this.activeId.set(id);
    // Keeps the anchor shareable without pushing a history entry per click.
    history.replaceState(null, '', `#${id}`);
  }

  /** Coalesces the bursts of mutations a single navigation produces into one scan. */
  private queueScan(): void {
    if (this.scanQueued) {
      return;
    }
    this.scanQueued = true;
    requestAnimationFrame(() => {
      this.scanQueued = false;
      this.scan();
    });
  }

  private scan(): void {
    const host = this.contentHost();
    if (!host || this.config.tocLevels.length === 0) {
      this.headings.set([]);
      return;
    }

    const selector = this.config.tocLevels
      .map((level) => `h${level}`)
      .join(',');
    const found: DocsTocHeading[] = [];
    const used = new Set<string>();

    for (const element of Array.from(
      host.querySelectorAll<HTMLElement>(selector),
    )) {
      const text = (element.textContent ?? '').trim();
      if (!text) {
        continue;
      }

      let id = element.id;
      if (!id) {
        // Authored ids win; generated ones are de-duplicated so two "Options"
        // headings still get their own anchor.
        id = slugify(text) || `section-${found.length + 1}`;
        let suffix = 2;
        while (used.has(id)) {
          id = `${slugify(text)}-${suffix++}`;
        }
        element.id = id;
      }

      used.add(id);
      // Anchor jumps land under the sticky header instead of behind it.
      element.style.scrollMarginTop = `${this.config.scrollOffset}px`;
      found.push({ id, text, level: Number(element.tagName.slice(1)) });
    }

    this.headings.set(found);
    this.syncActive();
  }

  private syncActive(): void {
    const headings = this.headings();
    if (headings.length === 0) {
      this.activeId.set(null);
      return;
    }

    // Bottom of the page: the last heading can never reach the offset line, so
    // pin it explicitly or it is unreachable.
    const atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 2;
    if (atBottom) {
      this.activeId.set(headings[headings.length - 1].id);
      return;
    }

    let active = headings[0].id;
    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (
        element &&
        element.getBoundingClientRect().top <= this.config.scrollOffset + 1
      ) {
        active = heading.id;
      }
    }
    this.activeId.set(active);
  }
}

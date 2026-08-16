/**
 * A small markdown renderer for post bodies.
 *
 * Deliberately not a dependency: the workspace ships no markdown library, and a
 * blog needs headings, lists, links, emphasis and code fences — not a CommonMark
 * implementation. Swapping in `marked` later is a change to this one file.
 *
 * **The safety rule is escape-first.** Every character of the source is HTML
 * escaped before any markdown transform runs, so authored HTML is shown as text
 * rather than executed, and the tags produced below are the only ones that can
 * reach the DOM. Angular's sanitizer on `[innerHTML]` is then a second layer, not
 * the only one.
 */

/** Tailwind classes per block type, so an article reads like the docs pages. */
const CLASSES = {
  h2: 'scroll-m-20 border-b border-border pb-2 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0',
  h3: 'scroll-m-20 text-xl font-semibold tracking-tight mt-8 mb-3',
  h4: 'scroll-m-20 text-lg font-semibold tracking-tight mt-6 mb-2',
  p: 'leading-7 [&:not(:first-child)]:mt-6',
  ul: 'my-6 ml-6 list-disc [&>li]:mt-2',
  ol: 'my-6 ml-6 list-decimal [&>li]:mt-2',
  blockquote: 'mt-6 border-l-2 border-border pl-6 italic text-muted-foreground',
  pre: 'my-6 overflow-x-auto rounded-lg border border-border bg-muted p-4 text-sm',
  code: 'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
  a: 'font-medium underline underline-offset-4 hover:text-primary',
  hr: 'my-8 border-border',
} as const;

/**
 * Markers for content held back from the markdown pass.
 *
 * Control characters rather than words: they cannot occur in a post, `trim()`
 * does not treat them as whitespace, and escaping leaves them untouched. A marker
 * like ` CODE0 ` fails all three — trimming a block would eat its delimiters, and
 * restoring it would leave stray spaces around the tag.
 */
const CODE_MARK = '\u0001';
const FENCE_MARK = '\u0002';

const CODE_PLACEHOLDER = new RegExp(`${CODE_MARK}(\\d+)${CODE_MARK}`, 'g');
const FENCE_PLACEHOLDER = new RegExp(`^${FENCE_MARK}(\\d+)${FENCE_MARK}$`);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Only absolute http(s), mailto, and in-app paths. Anything else — `javascript:`
 * above all — is left as plain text, because holding an author account is not a
 * licence to run script in a reader's browser.
 */
function safeHref(href: string): string | null {
  const trimmed = href.trim();
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) {
    return trimmed;
  }
  // A single leading slash is an in-app path; two would be protocol-relative.
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  return null;
}

/** Inline spans. Runs on already-escaped text. */
function renderInline(text: string): string {
  const codeSpans: string[] = [];

  // Inline code first: its contents must not be re-processed for emphasis.
  let out = text.replace(/`([^`]+)`/g, (_match, code: string) => {
    codeSpans.push(`<code class="${CLASSES.code}">${code}</code>`);
    return `${CODE_MARK}${codeSpans.length - 1}${CODE_MARK}`;
  });

  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (match, alt: string, src: string) => {
    const href = safeHref(src);
    return href
      ? `<img src="${href}" alt="${alt}" class="my-6 rounded-lg border border-border" loading="lazy" />`
      : match;
  });

  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, target: string) => {
    const href = safeHref(target);
    if (!href) {
      return match;
    }
    // Off-site links open in a new tab; rel guards against tab-nabbing.
    const external = /^https?:\/\//i.test(href);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${href}" class="${CLASSES.a}"${attrs}>${label}</a>`;
  });

  out = out
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|\s)_([^_]+)_/g, '$1<em>$2</em>');

  return out.replace(CODE_PLACEHOLDER, (_match, index: string) => codeSpans[Number(index)]);
}

function renderList(lines: string[], ordered: boolean): string {
  const items = lines
    .map((line) => line.replace(ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/, ''))
    .map((item) => `<li>${renderInline(item)}</li>`)
    .join('');
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag} class="${ordered ? CLASSES.ol : CLASSES.ul}">${items}</${tag}>`;
}

function renderBlock(block: string): string {
  const lines = block.split('\n');

  const heading = /^(#{1,6})\s+(.*)$/.exec(lines[0]);
  if (heading) {
    // h1 is the post title, which the page renders — a body heading starts at h2.
    const level = Math.min(Math.max(heading[1].length, 2), 4);
    const cls = level === 2 ? CLASSES.h2 : level === 3 ? CLASSES.h3 : CLASSES.h4;
    return `<h${level} class="${cls}">${renderInline(heading[2])}</h${level}>`;
  }

  // Blocks arrive escaped, so a quote marker is `&gt;` by the time it gets here —
  // matching on a bare `>` silently turns every quote into a paragraph.
  if (/^\s*&gt;/.test(lines[0])) {
    const quoted = lines.map((line) => line.replace(/^\s*&gt;\s?/, '')).join(' ');
    return `<blockquote class="${CLASSES.blockquote}">${renderInline(quoted)}</blockquote>`;
  }

  if (/^\s*[-*]\s+/.test(lines[0])) {
    return renderList(lines, false);
  }

  if (/^\s*\d+\.\s+/.test(lines[0])) {
    return renderList(lines, true);
  }

  if (/^-{3,}$/.test(lines[0].trim())) {
    return `<hr class="${CLASSES.hr}" />`;
  }

  // A paragraph. Single newlines inside it are soft wraps, as in markdown.
  return `<p class="${CLASSES.p}">${renderInline(lines.join(' '))}</p>`;
}

export function renderMarkdown(source: string): string {
  if (!source?.trim()) {
    return '';
  }

  const fences: string[] = [];

  // Fenced code is pulled out before the document is escaped, so its body is never
  // treated as markdown. It is escaped on its own and put back at the end.
  const withoutFences = source
    .replace(/\r\n/g, '\n')
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang: string, code: string) => {
      fences.push(
        `<pre class="${CLASSES.pre}"><code>${escapeHtml(code.replace(/\n$/, ''))}</code></pre>`,
      );
      return `\n\n${FENCE_MARK}${fences.length - 1}${FENCE_MARK}\n\n`;
    });

  return escapeHtml(withoutFences)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const fence = FENCE_PLACEHOLDER.exec(block);
      return fence ? fences[Number(fence[1])] : renderBlock(block);
    })
    .join('\n');
}

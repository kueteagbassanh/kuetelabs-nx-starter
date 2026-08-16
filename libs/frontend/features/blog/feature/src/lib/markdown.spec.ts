import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  describe('safety', () => {
    it('shows authored HTML as text instead of executing it', () => {
      const html = renderMarkdown('Hello <script>alert(1)</script> world');

      expect(html).not.toContain('<script');
      expect(html).toContain('&lt;script&gt;');
    });

    it('escapes an image tag smuggled into a paragraph', () => {
      const html = renderMarkdown('<img src=x onerror="alert(1)">');

      expect(html).not.toContain('onerror="');
      expect(html).toContain('&lt;img');
    });

    it('refuses a javascript: link and leaves the source text alone', () => {
      const html = renderMarkdown('[click me](javascript:alert(1))');

      expect(html).not.toContain('<a href');
      expect(html).toContain('[click me]');
    });

    it('refuses a protocol-relative URL', () => {
      // //evil.example is a real off-site link that looks like a path.
      expect(renderMarkdown('[x](//evil.example)')).not.toContain('<a href');
    });

    it('keeps http, mailto and in-app paths', () => {
      expect(renderMarkdown('[a](https://angular.dev)')).toContain('href="https://angular.dev"');
      expect(renderMarkdown('[b](mailto:hi@example.com)')).toContain('href="mailto:hi@example.com"');
      expect(renderMarkdown('[c](/docs/installation)')).toContain('href="/docs/installation"');
    });

    it('opens off-site links in a new tab without leaking the opener', () => {
      const html = renderMarkdown('[a](https://angular.dev)');

      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
    });

    it('does not add target to an in-app link', () => {
      expect(renderMarkdown('[c](/docs)')).not.toContain('target="_blank"');
    });
  });

  describe('blocks', () => {
    it('starts body headings at h2, since the page renders the h1', () => {
      const html = renderMarkdown('# A title\n\n## A section');

      expect(html).toContain('<h2');
      expect(html).not.toContain('<h1');
      // Both levels collapse to the same floor, so a post that starts at # or at
      // ## looks the same.
      expect(html.match(/<h2/g)).toHaveLength(2);
    });

    it('renders paragraphs, joining soft wraps', () => {
      const html = renderMarkdown('one\ntwo\n\nthree');

      expect(html).toContain('one two');
      expect(html.match(/<p /g)).toHaveLength(2);
    });

    it('renders unordered and ordered lists', () => {
      expect(renderMarkdown('- a\n- b')).toContain('<ul');
      expect(renderMarkdown('1. a\n2. b')).toContain('<ol');
      expect(renderMarkdown('- a\n- b').match(/<li>/g)).toHaveLength(2);
    });

    it('renders a blockquote', () => {
      expect(renderMarkdown('> quoted')).toContain('<blockquote');
    });

    it('keeps a fenced code block intact and escaped', () => {
      const html = renderMarkdown('```ts\nconst a = 1 < 2;\n```');

      expect(html).toContain('<pre');
      expect(html).toContain('const a = 1 &lt; 2;');
    });

    it('does not treat markdown inside a fence as markdown', () => {
      const html = renderMarkdown('```\n# not a heading\n- not a list\n```');

      expect(html).not.toContain('<h2');
      expect(html).not.toContain('<ul');
      expect(html).toContain('# not a heading');
    });
  });

  describe('inline', () => {
    it('renders inline code without adding spaces around it', () => {
      // The placeholder used to be delimited by spaces, which left "the <code>x</code> ."
      const html = renderMarkdown('use `npx nx build`.');

      expect(html).toContain('use <code');
      expect(html).toContain('</code>.');
    });

    it('leaves emphasis inside inline code alone', () => {
      expect(renderMarkdown('`a * b * c`')).not.toContain('<em>');
    });

    it('renders bold and italic', () => {
      expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>');
      expect(renderMarkdown('some *italic* text')).toContain('<em>italic</em>');
    });

    it('returns an empty string for empty input', () => {
      expect(renderMarkdown('')).toBe('');
      expect(renderMarkdown('   ')).toBe('');
    });
  });
});

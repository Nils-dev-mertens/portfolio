import { describe, expect, test } from 'bun:test';
import { renderMarkdown } from '../packages/data/index.ts';

describe('renderMarkdown', () => {
  test('returns every h2/h3 in reading order, with the anchor ids', async () => {
    const { headings } = await renderMarkdown('## Een\n\n### Twee\n\n## Drie\n');

    expect(headings).toEqual([
      { depth: 2, slug: 'een', text: 'Een' },
      { depth: 3, slug: 'twee', text: 'Twee' },
      { depth: 2, slug: 'drie', text: 'Drie' },
    ]);
  });

  test('links every section heading back to itself, including `#` titles', async () => {
    const { html } = await renderMarkdown('# Titel\n\n## Sectie\n\n### Sub\n');

    expect(html).toMatch(/<h1 id="titel"><a class="heading-anchor" href="#titel"/);
    expect(html).toMatch(/<h2 id="sectie"><a class="heading-anchor" href="#sectie"/);
    expect(html).toMatch(/<h3 id="sub"><a class="heading-anchor" href="#sub"/);
    expect(html.match(/heading-anchor/g)).toHaveLength(3);
  });

  test('renders prose, inline code and fenced code', async () => {
    const { html } = await renderMarkdown('Met `code` en **vet**.\n\n```ts\nconst x = 1;\n```\n');

    expect(html).toContain('<code>code</code>');
    expect(html).toContain('<strong>vet</strong>');
    expect(html).toContain('astro-code');
  });

  test('is empty for an empty body', async () => {
    const { html, headings } = await renderMarkdown('');
    expect(html.trim()).toBe('');
    expect(headings).toEqual([]);
  });
});

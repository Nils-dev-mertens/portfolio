import { createMarkdownProcessor } from '@astrojs/markdown-remark';

export type MarkdownHeading = {
  /** 1 for `#` through 6 for `######`. */
  depth: number;
  /** The anchor id, also used by the table of contents. */
  slug: string;
  text: string;
};

export type RenderedMarkdown = {
  html: string;
  /** Every h1–h6 in the document, in reading order. */
  headings: MarkdownHeading[];
};

let processor: Awaited<ReturnType<typeof createMarkdownProcessor>> | null = null;

/**
 * Adds a clickable `#` in front of every section heading.
 *
 * The headings themselves are `aria-hidden` because the table of contents
 * already reaches every section by keyboard — this is a mouse convenience, not
 * a second navigation scheme. Only the opening tag is touched, so inline
 * markup inside the heading survives untouched.
 */
function withHeadingAnchors(html: string): string {
  return html.replace(
    /<h([1-6]) id="([^"]*)">/g,
    (_match, depth: string, slug: string) =>
      `<h${depth} id="${slug}">` +
      `<a class="heading-anchor" href="#${slug}" aria-hidden="true" tabindex="-1">#</a>`,
  );
}

/**
 * Renders an article body to HTML with Astro's own markdown pipeline, so
 * content stored in the database comes out exactly like markdown compiled at
 * build time (same GFM, smartypants and syntax highlighting defaults).
 *
 * Article pages run on the server, so this is what turns `articles.body` into
 * page content — and the dashboard preview reuses it, which is why a preview
 * cannot drift from the real thing. The returned headings drive the on-page
 * index.
 */
export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  processor ??= await createMarkdownProcessor();
  const { code, metadata } = await processor.render(markdown);
  const headings = (metadata.headings ?? []) as MarkdownHeading[];

  return {
    html: withHeadingAnchors(code),
    headings: headings.map(({ depth, slug, text }) => ({ depth, slug, text })),
  };
}

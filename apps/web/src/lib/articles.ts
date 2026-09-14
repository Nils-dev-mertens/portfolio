import { getArticles, type Article, type Lang } from '@portfolio/data';

/**
 * Published articles keyed by the project they belong to, so a project card can
 * link to its write-up without running a query per card. Only articles that
 * actually have text are linked — a freshly created draft has none.
 */
export function articlesByProject(lang: Lang): Map<string, Article> {
  const byProject = new Map<string, Article>();
  for (const article of getArticles({ status: 'published' }, lang)) {
    if (article.project_id && article.has_body && !byProject.has(article.project_id)) {
      byProject.set(article.project_id, article);
    }
  }
  return byProject;
}

/** Locale-aware URL for an article. */
export function articleHref(article: Pick<Article, 'slug'>, lang: Lang): string {
  return `${lang === 'en' ? '/en' : ''}/articles/${article.slug}`;
}

/**
 * Returns the first image `src` found in the markdown body (markdown `![]()` or
 * raw `<img src>`), in document order. Null when the article has no images.
 */
export function firstImageSrc(body: string): string | null {
  const hits: { url: string; index: number }[] = [];

  const md = /!\[[^\]]*\]\(\s*([^\s)]+)(?:\s+[^)]*)?\)/g;
  let m: RegExpExecArray | null;
  while ((m = md.exec(body)) !== null) {
    hits.push({ url: m[1], index: m.index });
  }

  const html = /<img[^>]+src=["']([^"']+)["']/gi;
  while ((m = html.exec(body)) !== null) {
    hits.push({ url: m[1], index: m.index });
  }

  if (hits.length === 0) return null;
  hits.sort((a, b) => a.index - b.index);
  return hits[0].url;
}

/** Absolute URL for the article's Open Graph image, or null for the fallback. */
export function articleOgImage(article: Pick<Article, 'body'>, site: URL): string | null {
  const raw = firstImageSrc(article.body);
  if (!raw) return null;
  // Already absolute (external CDN etc.) — keep as is.
  if (/^https?:\/\//i.test(raw)) return raw;
  try {
    return new URL(raw, site).href;
  } catch {
    return null;
  }
}

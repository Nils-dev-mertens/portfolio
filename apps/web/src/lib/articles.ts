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

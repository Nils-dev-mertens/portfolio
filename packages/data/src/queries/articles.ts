import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '../db';
import { articles, ARTICLE_STATUSES, ArticleStatus } from '../db/schema';
import { type Lang, pick } from '../i18n';

export type { ArticleStatus } from '../db/schema';
export { ARTICLE_STATUSES } from '../db/schema';

type ArticleRow = typeof articles.$inferSelect;

/** An article plus `has_body`, which the dashboard uses to label its editor. */
export type Article = ArticleRow & { has_body: boolean };

/**
 * Localizes the text columns from their `_en` companions and derives
 * `has_body`. The Dutch column is only ever empty for a draft, so an article
 * that has text in one language always renders in both.
 */
function shape(row: ArticleRow, lang: Lang): Article {
  const localized: ArticleRow =
    lang === 'nl'
      ? row
      : {
          ...row,
          title: pick(row, 'title', lang) as string,
          summary: pick(row, 'summary', lang) as string,
          body: pick(row, 'body', lang) as string,
        };

  return { ...localized, has_body: row.body.trim().length > 0 };
}

/**
 * Turns a title into a URL-safe slug. Accented characters are folded to their
 * ASCII base so Dutch titles ("Waarom ik Docker gebruik") stay readable in a URL.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/**
 * Returns `base` with a numeric suffix if another article already claims it, so
 * two articles called "Deploy notes" become `deploy-notes` and `deploy-notes-2`.
 * Pass `ignoreId` when updating an article so it does not collide with itself.
 */
export function uniqueSlug(base: string, ignoreId?: string): string {
  const taken = new Set(
    getDb()
      .select({ id: articles.id, slug: articles.slug })
      .from(articles)
      .all()
      .filter((row) => row.id !== ignoreId)
      .map((row) => row.slug),
  );

  const root = base || 'article';
  let candidate = root;
  let suffix = 2;
  while (taken.has(candidate)) candidate = `${root}-${suffix++}`;
  return candidate;
}

export function getArticles(
  opts: { project_id?: string; status?: ArticleStatus; limit?: number } = {},
  lang: Lang = 'nl',
): Article[] {
  const db = getDb();

  const conditions = [
    opts.project_id !== undefined ? eq(articles.project_id, opts.project_id) : undefined,
    opts.status !== undefined ? eq(articles.status, opts.status) : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const rows = db
    .select()
    .from(articles)
    .$dynamic()
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    // Newest first. Drafts have no published_at, and SQLite sorts NULL last on
    // DESC, so unfinished pieces never outrank the published ones.
    .orderBy(desc(articles.published_at), desc(articles.created_at))
    .limit(opts.limit ?? -1)
    .all();

  return rows.map((row) => shape(row, lang));
}

export function getArticleBySlug(slug: string, lang: Lang = 'nl'): Article | undefined {
  const row = getDb().select().from(articles).where(eq(articles.slug, slug)).get();
  return row ? shape(row, lang) : undefined;
}

export function getArticleById(id: string, lang: Lang = 'nl'): Article | undefined {
  const row = getDb().select().from(articles).where(eq(articles.id, id)).get();
  return row ? shape(row, lang) : undefined;
}

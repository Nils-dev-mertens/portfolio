import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const PROJECT_CATEGORIES = ['website', 'cli', 'api', 'library', 'tool', 'other'] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const ARTICLE_STATUSES = ['draft', 'published'] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  title_en: text('title_en').notNull().default(''),
  description: text('description').notNull(),
  description_en: text('description_en').notNull().default(''),
  category: text('category').$type<ProjectCategory>().notNull().default('other'),
  tags: text('tags').notNull().default('[]'),
  url: text('url'),
  repo_url: text('repo_url'),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

/**
 * Articles are the long-form counterpart of a project: an explainer, a
 * post-mortem or an opinion piece.
 *
 * Like every other piece of content on the site, an article is a row — title,
 * summary and the markdown body, each with its `_en` companion column that the
 * DeepL job fills. Pages read them with the same query helpers as projects and
 * render on the server, so the article list and article pages are plain
 * server-rendered pages.
 */
export const articles = sqliteTable('articles', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  title_en: text('title_en').notNull().default(''),
  summary: text('summary').notNull().default(''),
  summary_en: text('summary_en').notNull().default(''),
  /** Markdown. Rendered by `renderMarkdown` from this package. */
  body: text('body').notNull().default(''),
  body_en: text('body_en').notNull().default(''),
  project_id: text('project_id'),
  status: text('status').$type<ArticleStatus>().notNull().default('draft'),
  published_at: text('published_at'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at'),
});

/**
 * Images embedded in an article body. They are stored in the database rather
 * than on disk so that uploading one works on a running site: files on disk
 * would only appear after a rebuild, which is exactly what putting the bodies
 * in the database was meant to avoid. The API serves them from
 * `/api/articles/images/:id` with immutable caching.
 */
export const article_images = sqliteTable('article_images', {
  id: text('id').primaryKey(),
  article_id: text('article_id').notNull(),
  filename: text('filename').notNull(),
  mime: text('mime').notNull(),
  byte_size: integer('byte_size').notNull(),
  data: blob('data', { mode: 'buffer' }).notNull(),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const github_activity = sqliteTable('github_activity', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  repo: text('repo').notNull(),
  message: text('message'),
  occurred_at: text('occurred_at').notNull(),
});

export const github_contributions = sqliteTable('github_contributions', {
  date: text('date').primaryKey(),
  count: integer('count').notNull().default(0),
});

export const work_experience = sqliteTable('work_experience', {
  id: text('id').primaryKey(),
  company: text('company').notNull(),
  role: text('role').notNull(),
  role_en: text('role_en').notNull().default(''),
  description: text('description'),
  description_en: text('description_en'),
  start_date: text('start_date').notNull(),
  end_date: text('end_date'),
  current: integer('current', { mode: 'boolean' }).notNull().default(false),
  tags: text('tags').notNull().default('[]'),
});

export const education = sqliteTable('education', {
  id: text('id').primaryKey(),
  institution: text('institution').notNull(),
  program: text('program').notNull(),
  program_en: text('program_en').notNull().default(''),
  description: text('description'),
  description_en: text('description_en'),
  start_date: text('start_date').notNull(),
  end_date: text('end_date'),
});

export const skill_categories = sqliteTable('skill_categories', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  label_en: text('label_en').notNull().default(''),
  sort_order: integer('sort_order').notNull().default(0),
});

export const skills = sqliteTable('skills', {
  id: text('id').primaryKey(),
  category_id: text('category_id').notNull(),
  name: text('name').notNull(),
  sort_order: integer('sort_order').notNull().default(0),
});

export const about = sqliteTable('about', {
  id: text('id').primaryKey(),
  location: text('location').notNull(),
  email: text('email').notNull(),
  github_url: text('github_url').notNull(),
  status_label: text('status_label').notNull(),
  status_label_en: text('status_label_en').notNull().default(''),
  status_active: integer('status_active', { mode: 'boolean' }).notNull().default(true),
  tagline: text('tagline').notNull(),
  tagline_en: text('tagline_en').notNull().default(''),
  quote: text('quote').notNull(),
  quote_en: text('quote_en').notNull().default(''),
  quote_sub: text('quote_sub').notNull(),
  quote_sub_en: text('quote_sub_en').notNull().default(''),
  bio_landing: text('bio_landing').notNull().default('[]'),
  bio_landing_en: text('bio_landing_en').notNull().default('[]'),
  bio_about: text('bio_about').notNull().default('[]'),
  bio_about_en: text('bio_about_en').notNull().default('[]'),
});

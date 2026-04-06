import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  tags: text('tags').notNull().default('[]'),
  url: text('url'),
  repo_url: text('repo_url'),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const github_activity = sqliteTable('github_activity', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  repo: text('repo').notNull(),
  message: text('message'),
  occurred_at: text('occurred_at').notNull(),
});

export const blog_posts = sqliteTable('blog_posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt'),
  content: text('content'),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  published_at: text('published_at'),
});

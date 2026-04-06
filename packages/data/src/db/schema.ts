import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const PROJECT_CATEGORIES = ['website', 'cli', 'api', 'library', 'tool', 'other'] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').$type<ProjectCategory>().notNull().default('other'),
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

export const work_experience = sqliteTable('work_experience', {
  id: text('id').primaryKey(),
  company: text('company').notNull(),
  role: text('role').notNull(),
  description: text('description'),
  start_date: text('start_date').notNull(),
  end_date: text('end_date'),
  current: integer('current', { mode: 'boolean' }).notNull().default(false),
  tags: text('tags').notNull().default('[]'),
});

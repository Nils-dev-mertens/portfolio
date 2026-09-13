import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const PROJECT_CATEGORIES = ['website', 'cli', 'api', 'library', 'tool', 'other'] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

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

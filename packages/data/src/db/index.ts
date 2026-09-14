import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

const DB_PATH = process.env.DB_PATH ?? 'portfolio.db';

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;
  const sqlite = new Database(DB_PATH, { create: true });
  sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, title_en TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL, description_en TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'other',
      tags TEXT NOT NULL DEFAULT '[]', url TEXT, repo_url TEXT,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL, title_en TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '', summary_en TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '', body_en TEXT NOT NULL DEFAULT '',
      project_id TEXT,
      status TEXT NOT NULL DEFAULT 'draft', published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS article_images (
      id TEXT PRIMARY KEY, article_id TEXT NOT NULL,
      filename TEXT NOT NULL, mime TEXT NOT NULL, byte_size INTEGER NOT NULL,
      data BLOB NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS article_images_article_id ON article_images (article_id);
    CREATE TABLE IF NOT EXISTS github_activity (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, repo TEXT NOT NULL,
      message TEXT, occurred_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS github_contributions (
      date TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS work_experience (
      id TEXT PRIMARY KEY, company TEXT NOT NULL, role TEXT NOT NULL, role_en TEXT NOT NULL DEFAULT '',
      description TEXT, description_en TEXT,
      start_date TEXT NOT NULL, end_date TEXT,
      current INTEGER NOT NULL DEFAULT 0,
      tags TEXT NOT NULL DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS education (
      id TEXT PRIMARY KEY, institution TEXT NOT NULL, program TEXT NOT NULL, program_en TEXT NOT NULL DEFAULT '',
      description TEXT, description_en TEXT,
      start_date TEXT NOT NULL, end_date TEXT
    );
    CREATE TABLE IF NOT EXISTS skill_categories (
      id TEXT PRIMARY KEY, label TEXT NOT NULL, label_en TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY, category_id TEXT NOT NULL, name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS about (
      id TEXT PRIMARY KEY, location TEXT NOT NULL, email TEXT NOT NULL,
      github_url TEXT NOT NULL, status_label TEXT NOT NULL, status_label_en TEXT NOT NULL DEFAULT '',
      status_active INTEGER NOT NULL DEFAULT 1,
      tagline TEXT NOT NULL, tagline_en TEXT NOT NULL DEFAULT '',
      quote TEXT NOT NULL, quote_en TEXT NOT NULL DEFAULT '',
      quote_sub TEXT NOT NULL, quote_sub_en TEXT NOT NULL DEFAULT '',
      bio_landing TEXT NOT NULL DEFAULT '[]',
      bio_landing_en TEXT NOT NULL DEFAULT '[]',
      bio_about TEXT NOT NULL DEFAULT '[]',
      bio_about_en TEXT NOT NULL DEFAULT '[]'
    );
  `);

  // Add translation columns for already-created databases (idempotent).
  const addColumn = (table: string, column: string, definition: string) => {
    const cols = sqlite.query(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === column)) {
      sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  };
  addColumn('projects', 'title_en', "TEXT NOT NULL DEFAULT ''");
  addColumn('projects', 'description_en', "TEXT NOT NULL DEFAULT ''");
  addColumn('articles', 'title_en', "TEXT NOT NULL DEFAULT ''");
  addColumn('articles', 'summary_en', "TEXT NOT NULL DEFAULT ''");
  addColumn('articles', 'body', "TEXT NOT NULL DEFAULT ''");
  addColumn('articles', 'body_en', "TEXT NOT NULL DEFAULT ''");
  addColumn('work_experience', 'role_en', "TEXT NOT NULL DEFAULT ''");
  addColumn('work_experience', 'description_en', 'TEXT');
  addColumn('education', 'program_en', "TEXT NOT NULL DEFAULT ''");
  addColumn('education', 'description_en', 'TEXT');
  addColumn('about', 'status_label_en', "TEXT NOT NULL DEFAULT ''");
  addColumn('about', 'tagline_en', "TEXT NOT NULL DEFAULT ''");
  addColumn('about', 'quote_en', "TEXT NOT NULL DEFAULT ''");
  addColumn('about', 'quote_sub_en', "TEXT NOT NULL DEFAULT ''");
  addColumn('about', 'bio_landing_en', "TEXT NOT NULL DEFAULT '[]'");
  addColumn('about', 'bio_about_en', "TEXT NOT NULL DEFAULT '[]'");

  _db = drizzle(sqlite, { schema });
  return _db;
}

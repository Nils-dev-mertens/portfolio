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
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]', url TEXT, repo_url TEXT,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS github_activity (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, repo TEXT NOT NULL,
      message TEXT, occurred_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY, title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE, excerpt TEXT, content TEXT,
      published INTEGER NOT NULL DEFAULT 0, published_at TEXT
    );
  `);
  _db = drizzle(sqlite, { schema });
  return _db;
}

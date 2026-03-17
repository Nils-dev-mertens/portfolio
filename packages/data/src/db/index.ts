import { Database } from 'bun:sqlite';
import { CREATE_PROJECTS, CREATE_GITHUB_ACTIVITY, CREATE_BLOG_POSTS } from './schema';

const DB_PATH = process.env.DB_PATH ?? 'portfolio.db';

let db: Database | null = null;

export function getDb(): Database {
  if (db) return db;

  db = new Database(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(CREATE_PROJECTS);
  db.exec(CREATE_GITHUB_ACTIVITY);
  db.exec(CREATE_BLOG_POSTS);

  return db;
}

export const CREATE_PROJECTS = `
  CREATE TABLE IF NOT EXISTS projects (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    tags        TEXT NOT NULL DEFAULT '[]',
    url         TEXT,
    repo_url    TEXT,
    featured    INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

export const CREATE_GITHUB_ACTIVITY = `
  CREATE TABLE IF NOT EXISTS github_activity (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL,
    repo        TEXT NOT NULL,
    message     TEXT,
    occurred_at TEXT NOT NULL
  )
`;

export const CREATE_BLOG_POSTS = `
  CREATE TABLE IF NOT EXISTS blog_posts (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    excerpt     TEXT,
    content     TEXT,
    published   INTEGER NOT NULL DEFAULT 0,
    published_at TEXT
  )
`;

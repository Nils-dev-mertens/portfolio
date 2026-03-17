import { getDb } from '../db';

export interface GithubActivity {
  id: string;
  type: string;
  repo: string;
  message: string | null;
  occurred_at: string;
}

export function getGithubActivity(limit = 10): GithubActivity[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM github_activity ORDER BY occurred_at DESC LIMIT ?')
    .all(limit) as GithubActivity[];
}

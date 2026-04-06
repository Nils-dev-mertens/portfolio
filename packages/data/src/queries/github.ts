import { desc } from 'drizzle-orm';
import { getDb } from '../db';
import { github_activity } from '../db/schema';

export type GithubActivity = typeof github_activity.$inferSelect;

export function getGithubActivity(limit = 10): GithubActivity[] {
  const db = getDb();
  return db
    .select()
    .from(github_activity)
    .orderBy(desc(github_activity.occurred_at))
    .limit(limit)
    .all();
}

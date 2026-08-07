import { desc, asc, like } from 'drizzle-orm';
import { getDb } from '../db';
import { github_activity, github_contributions } from '../db/schema';

export type GithubActivity = typeof github_activity.$inferSelect;
export type GithubContribution = typeof github_contributions.$inferSelect;

export function getGithubActivity(limit = 10): GithubActivity[] {
  const db = getDb();
  return db
    .select()
    .from(github_activity)
    .orderBy(desc(github_activity.occurred_at))
    .limit(limit)
    .all();
}

export function getGithubContributions(year?: number): GithubContribution[] {
  const db = getDb();
  return db
    .select()
    .from(github_contributions)
    .where(year !== undefined ? like(github_contributions.date, `${year}-%`) : undefined)
    .orderBy(asc(github_contributions.date))
    .all();
}

import { eq, desc } from 'drizzle-orm';
import { getDb } from '../db';
import { projects } from '../db/schema';

export type Project = Omit<typeof projects.$inferSelect, 'tags'> & { tags: string[] };

export function getProjects(opts: { featured?: boolean; limit?: number } = {}): Project[] {
  const db = getDb();

  const rows = db
    .select()
    .from(projects)
    .$dynamic()
    .where(opts.featured !== undefined ? eq(projects.featured, opts.featured) : undefined)
    .orderBy(desc(projects.created_at))
    .limit(opts.limit ?? -1)
    .all();

  return rows.map((row) => ({ ...row, tags: JSON.parse(row.tags) as string[] }));
}

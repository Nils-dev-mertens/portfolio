import { eq, desc, and } from 'drizzle-orm';
import { getDb } from '../db';
import { projects, ProjectCategory } from '../db/schema';

export type { ProjectCategory } from '../db/schema';
export { PROJECT_CATEGORIES } from '../db/schema';
export type Project = Omit<typeof projects.$inferSelect, 'tags'> & { tags: string[] };

export function getProjects(opts: { featured?: boolean; category?: ProjectCategory; limit?: number } = {}): Project[] {
  const db = getDb();

  const conditions = [
    opts.featured !== undefined ? eq(projects.featured, opts.featured) : undefined,
    opts.category !== undefined ? eq(projects.category, opts.category) : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const rows = db
    .select()
    .from(projects)
    .$dynamic()
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(projects.created_at))
    .limit(opts.limit ?? -1)
    .all();

  return rows.map((row) => ({ ...row, tags: JSON.parse(row.tags) as string[] }));
}

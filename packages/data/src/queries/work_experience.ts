import { desc } from 'drizzle-orm';
import { getDb } from '../db';
import { work_experience } from '../db/schema';

export type WorkExperience = Omit<typeof work_experience.$inferSelect, 'tags'> & { tags: string[] };

export function getWorkExperience(): WorkExperience[] {
  const db = getDb();

  const rows = db
    .select()
    .from(work_experience)
    .orderBy(desc(work_experience.start_date))
    .all();

  return rows.map((row) => ({ ...row, tags: JSON.parse(row.tags) as string[] }));
}

import { desc } from 'drizzle-orm';
import { getDb } from '../db';
import { work_experience } from '../db/schema';
import { type Lang, pick } from '../i18n';

export type WorkExperience = Omit<typeof work_experience.$inferSelect, 'tags'> & { tags: string[] };

export function getWorkExperience(lang: Lang = 'nl'): WorkExperience[] {
  const db = getDb();

  const rows = db
    .select()
    .from(work_experience)
    .orderBy(desc(work_experience.start_date))
    .all();

  return rows.map((row) => {
    const job: WorkExperience = { ...row, tags: JSON.parse(row.tags) as string[] };
    if (lang === 'nl') return job;
    return {
      ...job,
      role: pick(row, 'role', lang) as string,
      description: pick(row, 'description', lang) as string | null,
    };
  });
}

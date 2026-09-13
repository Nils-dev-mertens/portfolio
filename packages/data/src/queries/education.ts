import { desc } from 'drizzle-orm';
import { getDb } from '../db';
import { education } from '../db/schema';
import { type Lang, pick } from '../i18n';

export type Education = typeof education.$inferSelect;

export function getEducation(lang: Lang = 'nl'): Education[] {
  const db = getDb();
  const rows = db.select().from(education).orderBy(desc(education.start_date)).all();
  if (lang === 'nl') return rows;
  return rows.map((row) => ({
    ...row,
    program: pick(row, 'program', lang) as string,
    description: pick(row, 'description', lang) as string | null,
  }));
}

import { desc } from 'drizzle-orm';
import { getDb } from '../db';
import { education } from '../db/schema';

export type Education = typeof education.$inferSelect;

export function getEducation(): Education[] {
  const db = getDb();
  return db.select().from(education).orderBy(desc(education.start_date)).all();
}

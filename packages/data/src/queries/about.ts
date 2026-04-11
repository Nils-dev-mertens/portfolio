import { getDb } from '../db';
import { about } from '../db/schema';

export type About = Omit<typeof about.$inferSelect, 'bio_landing' | 'bio_about'> & {
  bio_landing: string[];
  bio_about: string[];
};

export function getAbout(): About | undefined {
  const db = getDb();
  const row = db.select().from(about).limit(1).all()[0];
  if (!row) return undefined;
  return {
    ...row,
    bio_landing: JSON.parse(row.bio_landing) as string[],
    bio_about: JSON.parse(row.bio_about) as string[],
  };
}

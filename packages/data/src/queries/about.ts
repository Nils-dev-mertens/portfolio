import { getDb } from '../db';
import { about } from '../db/schema';
import { type Lang, pick } from '../i18n';

export type About = Omit<typeof about.$inferSelect, 'bio_landing' | 'bio_about'> & {
  bio_landing: string[];
  bio_about: string[];
};

export function getAbout(lang: Lang = 'nl'): About | undefined {
  const db = getDb();
  const row = db.select().from(about).limit(1).all()[0];
  if (!row) return undefined;

  const base: About = {
    ...row,
    bio_landing: JSON.parse(row.bio_landing) as string[],
    bio_about: JSON.parse(row.bio_about) as string[],
  };

  if (lang === 'nl') return base;

  const bio_landing_en = row.bio_landing_en ? (JSON.parse(row.bio_landing_en) as string[]) : [];
  const bio_about_en = row.bio_about_en ? (JSON.parse(row.bio_about_en) as string[]) : [];

  return {
    ...base,
    tagline: pick(row, 'tagline', lang) as string,
    quote: pick(row, 'quote', lang) as string,
    quote_sub: pick(row, 'quote_sub', lang) as string,
    status_label: pick(row, 'status_label', lang) as string,
    bio_landing: bio_landing_en.length ? bio_landing_en : base.bio_landing,
    bio_about: bio_about_en.length ? bio_about_en : base.bio_about,
  };
}

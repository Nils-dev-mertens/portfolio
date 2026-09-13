import { asc } from 'drizzle-orm';
import { getDb } from '../db';
import { skill_categories, skills } from '../db/schema';
import { pick, type Lang } from '../i18n';

export type SkillItem = {
  id: string;
  name: string;
  sort_order: number;
};

export type SkillCategory = {
  id: string;
  /** Localized label — falls back to the Dutch label when `label_en` is empty. */
  label: string;
  label_en: string;
  sort_order: number;
  skills: SkillItem[];
};

/**
 * Returns every skill category with its skills, ordered by `sort_order`.
 * Used by the site (localized) and the dashboard (which edits both labels).
 */
export function getSkillCategories(lang: Lang = 'nl'): SkillCategory[] {
  const db = getDb();

  const categories = db
    .select()
    .from(skill_categories)
    .orderBy(asc(skill_categories.sort_order), asc(skill_categories.label))
    .all();

  if (categories.length === 0) return [];

  const items = db
    .select()
    .from(skills)
    .orderBy(asc(skills.sort_order), asc(skills.name))
    .all();

  return categories.map((category) => ({
    id: category.id,
    label: pick(category, 'label', lang) as string,
    label_en: category.label_en,
    sort_order: category.sort_order,
    skills: items
      .filter((item) => item.category_id === category.id)
      .map((item) => ({ id: item.id, name: item.name, sort_order: item.sort_order })),
  }));
}

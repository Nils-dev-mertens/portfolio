import { Hono } from 'hono';
import { eq, max } from 'drizzle-orm';
import { getDb, skill_categories, skills, getSkillCategories } from '@portfolio/data';

const router = new Hono();

/** All categories including their skills — both labels, so the dashboard can edit them. */
router.get('/', (c) => c.json(getSkillCategories()));

// ── Categories ────────────────────────────────────────────────────────────────

router.post('/categories', async (c) => {
  const body = await c.req.json<{
    id?: string;
    label: string;
    label_en?: string;
    sort_order?: number;
  }>();

  if (!body.label?.trim()) return c.json({ error: 'label is required' }, 400);

  const db = getDb();
  const id = body.id?.trim() || crypto.randomUUID();

  if (db.select().from(skill_categories).where(eq(skill_categories.id, id)).get()) {
    return c.json({ error: 'A category with this id already exists' }, 409);
  }

  const highest = db
    .select({ value: max(skill_categories.sort_order) })
    .from(skill_categories)
    .get()?.value;

  db.insert(skill_categories)
    .values({
      id,
      label: body.label.trim(),
      label_en: body.label_en?.trim() ?? '',
      sort_order: body.sort_order ?? (highest ?? -1) + 1,
    })
    .run();

  return c.json(getSkillCategories(), 201);
});

router.put('/categories/:id', async (c) => {
  const db = getDb();
  const id = c.req.param('id');
  if (!db.select().from(skill_categories).where(eq(skill_categories.id, id)).get()) {
    return c.json({ error: 'Not found' }, 404);
  }

  const body = await c.req.json<Partial<{
    label: string;
    label_en: string;
    sort_order: number;
  }>>();

  db.update(skill_categories)
    .set({
      ...(body.label !== undefined && { label: body.label }),
      ...(body.label_en !== undefined && { label_en: body.label_en }),
      ...(body.sort_order !== undefined && { sort_order: body.sort_order }),
    })
    .where(eq(skill_categories.id, id))
    .run();

  return c.json(getSkillCategories());
});

router.delete('/categories/:id', (c) => {
  const db = getDb();
  const id = c.req.param('id');
  if (!db.select().from(skill_categories).where(eq(skill_categories.id, id)).get()) {
    return c.json({ error: 'Not found' }, 404);
  }

  // Skills belong to the category, so they go with it.
  db.delete(skills).where(eq(skills.category_id, id)).run();
  db.delete(skill_categories).where(eq(skill_categories.id, id)).run();

  return c.json(getSkillCategories());
});

// ── Skill items ───────────────────────────────────────────────────────────────

router.post('/items', async (c) => {
  const body = await c.req.json<{ category_id: string; name: string; sort_order?: number }>();

  if (!body.category_id || !body.name?.trim()) {
    return c.json({ error: 'category_id and name are required' }, 400);
  }

  const db = getDb();
  if (!db.select().from(skill_categories).where(eq(skill_categories.id, body.category_id)).get()) {
    return c.json({ error: 'Unknown category' }, 400);
  }

  const highest = db
    .select({ value: max(skills.sort_order) })
    .from(skills)
    .where(eq(skills.category_id, body.category_id))
    .get()?.value;

  db.insert(skills)
    .values({
      id: crypto.randomUUID(),
      category_id: body.category_id,
      name: body.name.trim(),
      sort_order: body.sort_order ?? (highest ?? -1) + 1,
    })
    .run();

  return c.json(getSkillCategories(), 201);
});

router.put('/items/:id', async (c) => {
  const db = getDb();
  const id = c.req.param('id');
  if (!db.select().from(skills).where(eq(skills.id, id)).get()) {
    return c.json({ error: 'Not found' }, 404);
  }

  const body = await c.req.json<Partial<{ name: string; sort_order: number; category_id: string }>>();

  db.update(skills)
    .set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.sort_order !== undefined && { sort_order: body.sort_order }),
      ...(body.category_id !== undefined && { category_id: body.category_id }),
    })
    .where(eq(skills.id, id))
    .run();

  return c.json(getSkillCategories());
});

router.delete('/items/:id', (c) => {
  const db = getDb();
  const id = c.req.param('id');
  if (!db.select().from(skills).where(eq(skills.id, id)).get()) {
    return c.json({ error: 'Not found' }, 404);
  }

  db.delete(skills).where(eq(skills.id, id)).run();
  return c.json(getSkillCategories());
});

export { router as skillsRouter };

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { getDb, projects, PROJECT_CATEGORIES, getProjects } from '@portfolio/data';

const router = new Hono();

router.get('/', (c) => {
  const featured = c.req.query('featured');
  const category = c.req.query('category') as (typeof PROJECT_CATEGORIES)[number] | undefined;
  const limit = c.req.query('limit');

  const data = getProjects({
    featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
    category: category && PROJECT_CATEGORIES.includes(category) ? category : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  return c.json(data);
});

router.get('/:id', (c) => {
  const data = getProjects();
  const project = data.find((p) => p.id === c.req.param('id'));
  if (!project) return c.json({ error: 'Not found' }, 404);
  return c.json(project);
});

router.post('/', async (c) => {
  const body = await c.req.json<{
    title: string;
    description: string;
    category?: string;
    tags?: string[];
    url?: string;
    repo_url?: string;
    featured?: boolean;
  }>();

  const db = getDb();
  const id = crypto.randomUUID();
  db.insert(projects)
    .values({
      id,
      title: body.title,
      description: body.description,
      category: (body.category as (typeof PROJECT_CATEGORIES)[number]) ?? 'other',
      tags: JSON.stringify(body.tags ?? []),
      url: body.url,
      repo_url: body.repo_url,
      featured: body.featured ?? false,
    })
    .run();

  const created = db.select().from(projects).where(eq(projects.id, id)).get()!;
  return c.json({ ...created, tags: JSON.parse(created.tags) as string[] }, 201);
});

router.put('/:id', async (c) => {
  const db = getDb();
  const id = c.req.param('id');
  const existing = db.select().from(projects).where(eq(projects.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json<Partial<{
    title: string;
    description: string;
    category: string;
    tags: string[];
    url: string;
    repo_url: string;
    featured: boolean;
  }>>();

  db.update(projects)
    .set({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.category !== undefined && { category: body.category as (typeof PROJECT_CATEGORIES)[number] }),
      ...(body.tags !== undefined && { tags: JSON.stringify(body.tags) }),
      ...(body.url !== undefined && { url: body.url }),
      ...(body.repo_url !== undefined && { repo_url: body.repo_url }),
      ...(body.featured !== undefined && { featured: body.featured }),
    })
    .where(eq(projects.id, id))
    .run();

  const updated = db.select().from(projects).where(eq(projects.id, id)).get()!;
  return c.json({ ...updated, tags: JSON.parse(updated.tags) as string[] });
});

router.delete('/:id', (c) => {
  const db = getDb();
  const id = c.req.param('id');
  const existing = db.select().from(projects).where(eq(projects.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  db.delete(projects).where(eq(projects.id, id)).run();
  return c.json({ success: true });
});

export { router as projectsRouter };

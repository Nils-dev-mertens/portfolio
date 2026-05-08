import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { getDb, work_experience, getWorkExperience } from '@portfolio/data';

const router = new Hono();

router.get('/', (c) => {
  return c.json(getWorkExperience());
});

router.get('/:id', (c) => {
  const all = getWorkExperience();
  const item = all.find((w) => w.id === c.req.param('id'));
  if (!item) return c.json({ error: 'Not found' }, 404);
  return c.json(item);
});

router.post('/', async (c) => {
  const body = await c.req.json<{
    company: string;
    role: string;
    description?: string;
    start_date: string;
    end_date?: string;
    current?: boolean;
    tags?: string[];
  }>();

  const db = getDb();
  const id = crypto.randomUUID();
  db.insert(work_experience)
    .values({
      id,
      company: body.company,
      role: body.role,
      description: body.description,
      start_date: body.start_date,
      end_date: body.end_date,
      current: body.current ?? false,
      tags: JSON.stringify(body.tags ?? []),
    })
    .run();

  return c.json(getWorkExperience().find((w) => w.id === id)!, 201);
});

router.put('/:id', async (c) => {
  const db = getDb();
  const id = c.req.param('id');
  const existing = db.select().from(work_experience).where(eq(work_experience.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json<Partial<{
    company: string;
    role: string;
    description: string;
    start_date: string;
    end_date: string;
    current: boolean;
    tags: string[];
  }>>();

  db.update(work_experience)
    .set({
      ...(body.company !== undefined && { company: body.company }),
      ...(body.role !== undefined && { role: body.role }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.start_date !== undefined && { start_date: body.start_date }),
      ...(body.end_date !== undefined && { end_date: body.end_date }),
      ...(body.current !== undefined && { current: body.current }),
      ...(body.tags !== undefined && { tags: JSON.stringify(body.tags) }),
    })
    .where(eq(work_experience.id, id))
    .run();

  return c.json(getWorkExperience().find((w) => w.id === id)!);
});

router.delete('/:id', (c) => {
  const db = getDb();
  const id = c.req.param('id');
  const existing = db.select().from(work_experience).where(eq(work_experience.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  db.delete(work_experience).where(eq(work_experience.id, id)).run();
  return c.json({ success: true });
});

export { router as workRouter };

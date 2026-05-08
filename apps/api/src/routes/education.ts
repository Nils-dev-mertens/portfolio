import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { getDb, education, getEducation } from '@portfolio/data';

const router = new Hono();

router.get('/', (c) => {
  return c.json(getEducation());
});

router.get('/:id', (c) => {
  const all = getEducation();
  const item = all.find((e) => e.id === c.req.param('id'));
  if (!item) return c.json({ error: 'Not found' }, 404);
  return c.json(item);
});

router.post('/', async (c) => {
  const body = await c.req.json<{
    institution: string;
    program: string;
    description?: string;
    start_date: string;
    end_date?: string;
  }>();

  const db = getDb();
  const id = crypto.randomUUID();
  db.insert(education)
    .values({
      id,
      institution: body.institution,
      program: body.program,
      description: body.description,
      start_date: body.start_date,
      end_date: body.end_date,
    })
    .run();

  const created = db.select().from(education).where(eq(education.id, id)).get()!;
  return c.json(created, 201);
});

router.put('/:id', async (c) => {
  const db = getDb();
  const id = c.req.param('id');
  const existing = db.select().from(education).where(eq(education.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json<Partial<{
    institution: string;
    program: string;
    description: string;
    start_date: string;
    end_date: string;
  }>>();

  db.update(education)
    .set({
      ...(body.institution !== undefined && { institution: body.institution }),
      ...(body.program !== undefined && { program: body.program }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.start_date !== undefined && { start_date: body.start_date }),
      ...(body.end_date !== undefined && { end_date: body.end_date }),
    })
    .where(eq(education.id, id))
    .run();

  const updated = db.select().from(education).where(eq(education.id, id)).get()!;
  return c.json(updated);
});

router.delete('/:id', (c) => {
  const db = getDb();
  const id = c.req.param('id');
  const existing = db.select().from(education).where(eq(education.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  db.delete(education).where(eq(education.id, id)).run();
  return c.json({ success: true });
});

export { router as educationRouter };

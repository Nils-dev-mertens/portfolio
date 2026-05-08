import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { getDb, github_activity, getGithubActivity } from '@portfolio/data';

const router = new Hono();

router.get('/', (c) => {
  const limit = c.req.query('limit');
  return c.json(getGithubActivity(limit ? parseInt(limit) : undefined));
});

router.post('/', async (c) => {
  const body = await c.req.json<{
    type: string;
    repo: string;
    message?: string;
    occurred_at: string;
  }>();

  const db = getDb();
  const id = crypto.randomUUID();
  db.insert(github_activity)
    .values({
      id,
      type: body.type,
      repo: body.repo,
      message: body.message,
      occurred_at: body.occurred_at,
    })
    .run();

  const created = db.select().from(github_activity).where(eq(github_activity.id, id)).get()!;
  return c.json(created, 201);
});

router.delete('/:id', (c) => {
  const db = getDb();
  const id = c.req.param('id');
  const existing = db.select().from(github_activity).where(eq(github_activity.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  db.delete(github_activity).where(eq(github_activity.id, id)).run();
  return c.json({ success: true });
});

export { router as githubRouter };

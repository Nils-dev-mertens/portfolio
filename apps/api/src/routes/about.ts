import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { getDb, about, getAbout } from '@portfolio/data';

const router = new Hono();

router.get('/', (c) => {
  const data = getAbout();
  if (!data) return c.json({ error: 'Not found' }, 404);
  return c.json(data);
});

router.put('/:id', async (c) => {
  const db = getDb();
  const id = c.req.param('id');
  const existing = db.select().from(about).where(eq(about.id, id)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json<Partial<{
    location: string;
    email: string;
    github_url: string;
    status_label: string;
    status_active: boolean;
    tagline: string;
    quote: string;
    quote_sub: string;
    bio_landing: string[];
    bio_about: string[];
  }>>();

  db.update(about)
    .set({
      ...(body.location !== undefined && { location: body.location }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.github_url !== undefined && { github_url: body.github_url }),
      ...(body.status_label !== undefined && { status_label: body.status_label }),
      ...(body.status_active !== undefined && { status_active: body.status_active }),
      ...(body.tagline !== undefined && { tagline: body.tagline }),
      ...(body.quote !== undefined && { quote: body.quote }),
      ...(body.quote_sub !== undefined && { quote_sub: body.quote_sub }),
      ...(body.bio_landing !== undefined && { bio_landing: JSON.stringify(body.bio_landing) }),
      ...(body.bio_about !== undefined && { bio_about: JSON.stringify(body.bio_about) }),
    })
    .where(eq(about.id, id))
    .run();

  return c.json(getAbout()!);
});

export { router as aboutRouter };

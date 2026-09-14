import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import {
  getDb,
  articles,
  article_images,
  projects,
  ARTICLE_STATUSES,
  getArticles,
  getArticleById,
  renderMarkdown,
  slugify,
  uniqueSlug,
  type ArticleStatus,
} from '@portfolio/data';

const router = new Hono();

type ArticleInput = Partial<{
  title: string;
  summary: string;
  slug: string;
  project_id: string | null;
  status: ArticleStatus;
}>;

/** The two body columns, addressed by language in the editor. */
const BODY_COLUMN = { nl: 'body', en: 'body_en' } as const;
type BodyLang = keyof typeof BODY_COLUMN;

/**
 * Images go straight into the database, so an upload shows up on a running site
 * without a rebuild. SVG is deliberately not accepted: it can carry script, and
 * these are served inline from our own origin.
 */
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const imageUrl = (id: string) => `/api/articles/images/${id}`;

function isStatus(value: unknown): value is ArticleStatus {
  return ARTICLE_STATUSES.includes(value as ArticleStatus);
}

function isBodyLang(value: unknown): value is BodyLang {
  return value === 'nl' || value === 'en';
}

/** `?lang=` — defaults to Dutch, rejects anything else so a typo is not silent. */
function requestedLang(value: string | undefined): BodyLang | null {
  if (value === undefined || value === '') return 'nl';
  return isBodyLang(value) ? value : null;
}

/**
 * The raw row, used where the exact column matters: the body endpoints have to
 * read and write one language without the Dutch fallback the shaped article
 * applies.
 */
function findRaw(id: string) {
  return getDb().select().from(articles).where(eq(articles.id, id)).get();
}

router.get('/', (c) => {
  const projectId = c.req.query('project_id');
  const status = c.req.query('status');
  const limit = c.req.query('limit');

  const data = getArticles({
    project_id: projectId || undefined,
    status: isStatus(status) ? status : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  return c.json(data);
});

/**
 * Renders markdown with the same pipeline the article pages use, so the editor
 * preview and the published page cannot drift apart.
 */
router.post('/preview', async (c) => {
  const { body } = await c.req.json<{ body?: string }>();
  if (typeof body !== 'string') return c.json({ error: 'A body is required' }, 400);

  const { html, headings } = await renderMarkdown(body);
  return c.json({ html, headings });
});

/**
 * The body of one language, as stored. No fallback to the other language here:
 * the editor has to show the column it is about to overwrite.
 */
router.get('/:id/body', (c) => {
  const article = findRaw(c.req.param('id'));
  if (!article) return c.json({ error: 'Not found' }, 404);

  const lang = requestedLang(c.req.query('lang'));
  if (!lang) return c.json({ error: 'Unknown language' }, 400);

  return c.json({ lang, body: article[BODY_COLUMN[lang]] });
});

router.put('/:id/body', async (c) => {
  const article = findRaw(c.req.param('id'));
  if (!article) return c.json({ error: 'Not found' }, 404);

  const lang = requestedLang(c.req.query('lang'));
  if (!lang) return c.json({ error: 'Unknown language' }, 400);

  const { body } = await c.req.json<{ body?: string }>();
  if (typeof body !== 'string') return c.json({ error: 'A body is required' }, 400);

  const db = getDb();
  db.update(articles)
    .set({ [BODY_COLUMN[lang]]: body, updated_at: new Date().toISOString() })
    .where(eq(articles.id, article.id))
    .run();

  return c.json({ lang, body, bytes: Buffer.byteLength(body, 'utf8') });
});

/**
 * Upload one image for an article. Returns the URL to paste into the body, so
 * the editor can insert markdown itself.
 */
router.post('/:id/images', async (c) => {
  const article = findRaw(c.req.param('id'));
  if (!article) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.parseBody();
  const file = body['file'];
  if (!(file instanceof File)) return c.json({ error: 'A file is required' }, 400);
  if (!IMAGE_TYPES.includes(file.type)) {
    return c.json(
      { error: `Unsupported image type: ${file.type || 'unknown'}. Use PNG, JPEG, WebP, GIF or AVIF.` },
      400,
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return c.json({ error: 'Image is larger than 5 MB' }, 400);
  }

  const id = crypto.randomUUID();
  const filename = file.name || 'image';

  getDb()
    .insert(article_images)
    .values({
      id,
      article_id: article.id,
      filename,
      mime: file.type,
      byte_size: bytes.byteLength,
      data: bytes,
    })
    .run();

  return c.json(
    { id, url: imageUrl(id), filename, mime: file.type, byte_size: bytes.byteLength },
    201,
  );
});

/** Public: the URL above is what article bodies reference. */
router.get('/images/:id', (c) => {
  const image = getDb()
    .select()
    .from(article_images)
    .where(eq(article_images.id, c.req.param('id')))
    .get();
  if (!image) return c.json({ error: 'Not found' }, 404);

  return c.body(Uint8Array.from(image.data), 200, {
    'Content-Type': image.mime,
    'Content-Length': String(image.byte_size),
    // An image id never changes content, so it can be cached forever.
    'Cache-Control': 'public, max-age=31536000, immutable',
  });
});

router.delete('/images/:id', (c) => {
  const db = getDb();
  const id = c.req.param('id');
  if (!db.select().from(article_images).where(eq(article_images.id, id)).get()) {
    return c.json({ error: 'Not found' }, 404);
  }

  db.delete(article_images).where(eq(article_images.id, id)).run();
  return c.json({ success: true });
});

router.get('/:id', (c) => {
  const article = getArticleById(c.req.param('id'));
  if (!article) return c.json({ error: 'Not found' }, 404);
  return c.json(article);
});

router.post('/', async (c) => {
  const body = await c.req.json<ArticleInput>();

  const title = body.title?.trim();
  if (!title) return c.json({ error: 'A title is required' }, 400);

  const db = getDb();
  const projectId = body.project_id?.trim() || null;
  if (projectId && !db.select().from(projects).where(eq(projects.id, projectId)).get()) {
    return c.json({ error: 'Unknown project' }, 400);
  }

  const id = crypto.randomUUID();
  const status = isStatus(body.status) ? body.status : 'draft';
  const now = new Date().toISOString();

  db.insert(articles)
    .values({
      id,
      slug: uniqueSlug(slugify(body.slug?.trim() || title)),
      title,
      summary: body.summary?.trim() ?? '',
      project_id: projectId,
      status,
      published_at: status === 'published' ? now : null,
      created_at: now,
      updated_at: now,
    })
    .run();

  return c.json(getArticleById(id)!, 201);
});

router.put('/:id', async (c) => {
  const db = getDb();
  const id = c.req.param('id');
  const existing = findRaw(id);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json<ArticleInput>();

  if (body.title !== undefined && !body.title.trim()) {
    return c.json({ error: 'A title is required' }, 400);
  }

  if (body.project_id) {
    const projectId = body.project_id.trim();
    if (!db.select().from(projects).where(eq(projects.id, projectId)).get()) {
      return c.json({ error: 'Unknown project' }, 400);
    }
  }

  const status = isStatus(body.status) ? body.status : existing.status;

  db.update(articles)
    .set({
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.summary !== undefined && { summary: body.summary.trim() }),
      // The slug is only rewritten when it is sent explicitly, so published
      // URLs survive a title edit.
      ...(body.slug !== undefined && { slug: uniqueSlug(slugify(body.slug), id) }),
      ...(body.project_id !== undefined && { project_id: body.project_id?.trim() || null }),
      status,
      // Stamped the first time an article goes live; re-publishing keeps the
      // original date instead of bumping it.
      ...(status === 'published' && !existing.published_at && {
        published_at: new Date().toISOString(),
      }),
      updated_at: new Date().toISOString(),
    })
    .where(eq(articles.id, id))
    .run();

  return c.json(getArticleById(id)!);
});

router.delete('/:id', (c) => {
  const db = getDb();
  const id = c.req.param('id');
  if (!findRaw(id)) return c.json({ error: 'Not found' }, 404);

  // Images belong to the article, so they go with it.
  db.delete(article_images).where(eq(article_images.article_id, id)).run();
  db.delete(articles).where(eq(articles.id, id)).run();
  return c.json({ success: true });
});

export { router as articlesRouter };

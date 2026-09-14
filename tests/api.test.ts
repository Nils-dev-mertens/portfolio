import { describe, expect, test, beforeAll } from 'bun:test';
import { seed } from '../packages/data/index.ts';
import { createApp } from '../apps/api/src/app';

const app = createApp();

async function login(password: string): Promise<Response> {
  return app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
}

beforeAll(() => {
  seed();
});

describe('health', () => {
  test('GET /health returns ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe('auth', () => {
  test('login with wrong password returns 401', async () => {
    const res = await login('wrong-password');
    expect(res.status).toBe(401);
  });

  test('login with correct password returns a token', async () => {
    const res = await login('test-password-123');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string };
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(20);
  });

  test('mutations without a token are rejected with 401', async () => {
    const res = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'x', description: 'y' }),
    });
    expect(res.status).toBe(401);
  });
});

describe('projects', () => {
  test('GET /api/projects returns the seeded projects', async () => {
    const res = await app.request('/api/projects');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string }[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(5);
  });

  test('GET /api/projects?featured=true filters', async () => {
    const res = await app.request('/api/projects?featured=true');
    const body = (await res.json()) as { featured: boolean }[];
    expect(body.length).toBe(3);
    expect(body.every((p) => p.featured)).toBe(true);
  });

  test('GET /api/projects/:id returns a single project', async () => {
    const res = await app.request('/api/projects/portfolio-site');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; tags: string[] };
    expect(body.id).toBe('portfolio-site');
    expect(Array.isArray(body.tags)).toBe(true);
  });

  test('GET /api/projects/:id for an unknown id returns 404', async () => {
    const res = await app.request('/api/projects/nope');
    expect(res.status).toBe(404);
  });

  test('full CRUD flow with a valid token', async () => {
    const loginRes = await login('test-password-123');
    const { token } = (await loginRes.json()) as { token: string };
    const auth = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // create
    const createRes = await app.request('/api/projects', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        title: 'Test Project',
        description: 'Created by a test',
        category: 'cli',
        tags: ['bun', 'test'],
        featured: true,
      }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { id: string; tags: string[] };
    expect(created.tags).toEqual(['bun', 'test']);

    // read back
    const getRes = await app.request(`/api/projects/${created.id}`);
    expect(getRes.status).toBe(200);

    // update
    const putRes = await app.request(`/api/projects/${created.id}`, {
      method: 'PUT',
      headers: auth,
      body: JSON.stringify({ title: 'Renamed' }),
    });
    expect(putRes.status).toBe(200);
    const updated = (await putRes.json()) as { title: string };
    expect(updated.title).toBe('Renamed');

    // delete
    const delRes = await app.request(`/api/projects/${created.id}`, { method: 'DELETE', headers: auth });
    expect(delRes.status).toBe(200);
    expect((await delRes.json()) as { success: boolean }).toEqual({ success: true });

    // gone
    const afterRes = await app.request(`/api/projects/${created.id}`);
    expect(afterRes.status).toBe(404);
  });
});

describe('articles', () => {
  async function authHeaders() {
    const res = await login('test-password-123');
    const { token } = (await res.json()) as { token: string };
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }

  test('GET /api/articles returns the seeded articles', async () => {
    const res = await app.request('/api/articles');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { slug: string; status: string }[];
    expect(body.length).toBe(3);
    expect(body[0].slug).toBe('playwright-page-object');
  });

  test('filters by status and project, and ignores an unknown status', async () => {
    const published = (await (await app.request('/api/articles?status=published')).json()) as {
      status: string;
    }[];
    expect(published.length).toBe(2);
    expect(published.every((a) => a.status === 'published')).toBe(true);

    const forProject = (await (
      await app.request('/api/articles?project_id=playwright-test-suite')
    ).json()) as { slug: string }[];
    expect(forProject.map((a) => a.slug)).toEqual(['playwright-page-object']);

    const bogus = (await (await app.request('/api/articles?status=nope')).json()) as unknown[];
    expect(bogus.length).toBe(3);
  });

  test('GET /api/articles/:id returns a single article and 404s on unknown ids', async () => {
    const list = (await (await app.request('/api/articles')).json()) as { id: string }[];
    const res = await app.request(`/api/articles/${list[0].id}`);
    expect(res.status).toBe(200);

    const missing = await app.request('/api/articles/does-not-exist');
    expect(missing.status).toBe(404);
  });

  test('only the metadata is writable, and it needs a token', async () => {
    const anonymous = await app.request('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Anoniem' }),
    });
    expect(anonymous.status).toBe(401);

    const headers = await authHeaders();
    const noTitle = await app.request('/api/articles', {
      method: 'POST',
      headers,
      body: JSON.stringify({ summary: 'Zonder titel' }),
    });
    expect(noTitle.status).toBe(400);

    const unknownProject = await app.request('/api/articles', {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Zwevend', project_id: 'nope' }),
    });
    expect(unknownProject.status).toBe(400);
  });

  test('full CRUD flow with a valid token', async () => {
    const headers = await authHeaders();

    const createRes = await app.request('/api/articles', {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Test Artikel', summary: 'Een test', status: 'draft' }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as {
      id: string;
      slug: string;
      status: string;
      published_at: string | null;
    };
    expect(created.slug).toBe('test-artikel');
    expect(created.status).toBe('draft');
    expect(created.published_at).toBeNull();

    // Publishing stamps the date; the slug stays put because it is only
    // rewritten when it is sent explicitly.
    const putRes = await app.request(`/api/articles/${created.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ title: 'Hertitel', status: 'published' }),
    });
    expect(putRes.status).toBe(200);
    const updated = (await putRes.json()) as {
      title: string;
      slug: string;
      status: string;
      published_at: string | null;
    };
    expect(updated.title).toBe('Hertitel');
    expect(updated.slug).toBe('test-artikel');
    expect(updated.status).toBe('published');
    expect(updated.published_at).not.toBeNull();

    const delRes = await app.request(`/api/articles/${created.id}`, { method: 'DELETE', headers });
    expect(delRes.status).toBe(200);
    expect((await delRes.json()) as { success: boolean }).toEqual({ success: true });

    const afterRes = await app.request(`/api/articles/${created.id}`);
    expect(afterRes.status).toBe(404);
  });

  test('two articles with the same title get distinct slugs', async () => {
    const headers = await authHeaders();
    const create = (title: string) =>
      app.request('/api/articles', { method: 'POST', headers, body: JSON.stringify({ title }) });

    const first = (await (await create('Dubbel')).json()) as { id: string; slug: string };
    const second = (await (await create('Dubbel')).json()) as { id: string; slug: string };
    expect(first.slug).toBe('dubbel');
    expect(second.slug).toBe('dubbel-2');

    for (const article of [first, second]) {
      await app.request(`/api/articles/${article.id}`, { method: 'DELETE', headers });
    }
  });
});

describe('article bodies', () => {
  async function authHeaders() {
    const res = await login('test-password-123');
    const { token } = (await res.json()) as { token: string };
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }

  function preview(body: string, headers: Record<string, string>) {
    return app.request('/api/articles/preview', {
      method: 'POST',
      headers,
      body: JSON.stringify({ body }),
    });
  }

  test('the list reports which articles have text and which are still empty', async () => {
    const list = (await (await app.request('/api/articles')).json()) as {
      slug: string;
      has_body: boolean;
      body: string;
    }[];

    const written = list.filter((article) => article.has_body).map((a) => a.slug);
    expect(written.sort()).toEqual(['docker-home-server-pipeline', 'playwright-page-object']);
    expect(list.find((a) => a.slug === 'astro-server-islands')!.has_body).toBe(false);
    expect(list.find((a) => a.slug === 'astro-server-islands')!.body).toBe('');
  });

  test('previewing needs a token and renders markdown like the site does', async () => {
    const anonymous = await preview('## Hoi', { 'Content-Type': 'application/json' });
    expect(anonymous.status).toBe(401);

    const headers = await authHeaders();
    const res = await preview('## Hoi\n\nMet `code` en **vet**.', headers);
    expect(res.status).toBe(200);
    const { html, headings } = (await res.json()) as {
      html: string;
      headings: { depth: number; slug: string; text: string }[];
    };
    expect(html).toContain('<h2 id="hoi">');
    expect(html).toContain('Hoi</h2>');
    expect(html).toContain('<code>code</code>');
    expect(html).toContain('<strong>vet</strong>');
    // The editor needs these to build the same index the article page shows.
    expect(headings).toEqual([{ depth: 2, slug: 'hoi', text: 'Hoi' }]);
  });

  test('images in a body render as images', async () => {
    const headers = await authHeaders();
    const res = await preview('![De pipeline](/api/articles/images/abc)', headers);
    const { html } = (await res.json()) as { html: string };
    expect(html).toContain('src="/api/articles/images/abc"');
    expect(html).toContain('alt="De pipeline"');
  });

  test('a body round-trips through the article and marks it as written', async () => {
    const headers = await authHeaders();
    const created = (await (
      await app.request('/api/articles', {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: 'Body Test' }),
      })
    ).json()) as { id: string; has_body: boolean };
    expect(created.has_body).toBe(false);

    const empty = (await (
      await app.request(`/api/articles/${created.id}/body`)
    ).json()) as { lang: string; body: string };
    expect(empty.lang).toBe('nl');
    expect(empty.body).toBe('');

    const saved = await app.request(`/api/articles/${created.id}/body`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ body: '## Eerste versie\n\nTekst.' }),
    });
    expect(saved.status).toBe(200);

    const read = (await (
      await app.request(`/api/articles/${created.id}/body`)
    ).json()) as { body: string };
    expect(read.body).toContain('Eerste versie');

    const detail = (await (
      await app.request(`/api/articles/${created.id}`)
    ).json()) as { has_body: boolean; body: string };
    expect(detail.has_body).toBe(true);
    expect(detail.body).toContain('Eerste versie');

    // Dutch and English are separate columns: editing one leaves the other alone,
    // and the English reader falls back to the Dutch text until it is filled in.
    const english = await app.request(`/api/articles/${created.id}/body?lang=en`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ body: '## First version' }),
    });
    expect(english.status).toBe(200);
    expect(((await english.json()) as { body: string }).body).toBe('## First version');

    const nlStillThere = (await (
      await app.request(`/api/articles/${created.id}/body`)
    ).json()) as { body: string };
    expect(nlStillThere.body).toContain('Eerste versie');

    await app.request(`/api/articles/${created.id}`, { method: 'DELETE', headers });
  });

  test('body endpoints reject unknown ids and unknown languages', async () => {
    const headers = await authHeaders();

    expect((await app.request('/api/articles/nope/body')).status).toBe(404);
    expect(
      (
        await app.request('/api/articles/nope/body', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ body: 'x' }),
        })
      ).status,
    ).toBe(404);

    const list = (await (await app.request('/api/articles')).json()) as { id: string }[];
    const badLang = await app.request(`/api/articles/${list[0].id}/body?lang=de`);
    expect(badLang.status).toBe(400);

    const missingBody = await app.request(`/api/articles/${list[0].id}/body`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({}),
    });
    expect(missingBody.status).toBe(400);
  });

  test('changing the slug keeps the text attached', async () => {
    const headers = await authHeaders();
    const created = (await (
      await app.request('/api/articles', {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: 'Verplaats Mij' }),
      })
    ).json()) as { id: string; slug: string };
    expect(created.slug).toBe('verplaats-mij');

    await app.request(`/api/articles/${created.id}/body`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ body: '## Blijft bestaan' }),
    });

    const renamed = await app.request(`/api/articles/${created.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ slug: 'nieuwe-slug' }),
    });
    expect(renamed.status).toBe(200);
    const after = (await renamed.json()) as { slug: string; body: string; has_body: boolean };
    expect(after.slug).toBe('nieuwe-slug');
    expect(after.body).toContain('Blijft bestaan');
    expect(after.has_body).toBe(true);

    await app.request(`/api/articles/${created.id}`, { method: 'DELETE', headers });
  });
});

describe('article images', () => {
  // A real 1x1 PNG — the API checks the declared type, and serving it back has
  // to produce the same bytes.
  const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
    'base64',
  );

  async function authHeaders() {
    const res = await login('test-password-123');
    const { token } = (await res.json()) as { token: string };
    return { Authorization: `Bearer ${token}` };
  }

  async function createArticle(headers: Record<string, string>) {
    const res = await app.request('/api/articles', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Met Plaatjes' }),
    });
    return (await res.json()) as { id: string; slug: string };
  }

  function upload(id: string, bytes: Uint8Array, name: string, type: string, headers: Record<string, string>) {
    const form = new FormData();
    form.append('file', new File([bytes], name, { type }));
    return app.request(`/api/articles/${id}/images`, { method: 'POST', headers, body: form });
  }

  test('an image uploads, is served back, and goes with the article', async () => {
    const headers = await authHeaders();
    const article = await createArticle(headers);

    const uploaded = await upload(article.id, PNG, 'pipeline.png', 'image/png', headers);
    expect(uploaded.status).toBe(201);
    const image = (await uploaded.json()) as { id: string; url: string; byte_size: number };
    expect(image.url).toBe(`/api/articles/images/${image.id}`);
    expect(image.byte_size).toBe(PNG.byteLength);

    // Served publicly, cacheable, with the stored type
    const served = await app.request(image.url);
    expect(served.status).toBe(200);
    expect(served.headers.get('content-type')).toBe('image/png');
    expect(served.headers.get('cache-control')).toContain('immutable');
    expect(Buffer.from(await served.arrayBuffer()).equals(PNG)).toBe(true);

    // Deleting the article takes its images with it
    await app.request(`/api/articles/${article.id}`, { method: 'DELETE', headers });
    expect((await app.request(image.url)).status).toBe(404);
  });

  test('uploads need a token and an accepted image type', async () => {
    const headers = await authHeaders();
    const article = await createArticle(headers);

    const anonymous = await upload(article.id, PNG, 'x.png', 'image/png', {});
    expect(anonymous.status).toBe(401);

    const notAnImage = await upload(
      article.id,
      Buffer.from('nope'),
      'notes.txt',
      'text/plain',
      headers,
    );
    expect(notAnImage.status).toBe(400);
    expect(((await notAnImage.json()) as { error: string }).error).toContain('Unsupported image type');

    // SVG can carry script, so it is refused even though browsers render it.
    const svg = await upload(
      article.id,
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      'x.svg',
      'image/svg+xml',
      headers,
    );
    expect(svg.status).toBe(400);

    const tooBig = await upload(
      article.id,
      new Uint8Array(5 * 1024 * 1024 + 1),
      'big.png',
      'image/png',
      headers,
    );
    expect(tooBig.status).toBe(400);
    expect(((await tooBig.json()) as { error: string }).error).toContain('5 MB');

    await app.request(`/api/articles/${article.id}`, { method: 'DELETE', headers });
  });

  test('uploads and deletes reject unknown ids', async () => {
    const headers = await authHeaders();

    expect((await upload('nope', PNG, 'x.png', 'image/png', headers)).status).toBe(404);
    expect((await app.request('/api/articles/images/nope')).status).toBe(404);
    expect(
      (await app.request('/api/articles/images/nope', { method: 'DELETE', headers })).status,
    ).toBe(404);
  });
});

describe('skills', () => {
  async function authHeaders() {
    const res = await login('test-password-123');
    const { token } = (await res.json()) as { token: string };
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }

  test('GET /api/skills returns the seeded categories with their skills', async () => {
    const res = await app.request('/api/skills');
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      id: string;
      label: string;
      label_en: string;
      skills: { id: string; name: string }[];
    }[];
    expect(body.length).toBe(6);
    expect(body[0].id).toBe('languages');
    expect(body[5].id).toBe('tooling');
    expect(body[0].label).toBe('Talen');
    expect(body[0].label_en).toBe('Languages');
    expect(body[0].skills.map((s) => s.name)).toContain('TypeScript');
  });

  test('mutations without a token are rejected with 401', async () => {
    const res = await app.request('/api/skills/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'Nope' }),
    });
    expect(res.status).toBe(401);
  });

  test('a category requires a label', async () => {
    const headers = await authHeaders();
    const res = await app.request('/api/skills/categories', {
      method: 'POST',
      headers,
      body: JSON.stringify({ label: '   ' }),
    });
    expect(res.status).toBe(400);
  });

  test('full CRUD flow for a category and its skills', async () => {
    const headers = await authHeaders();
    type List = {
      id: string;
      label: string;
      label_en: string;
      sort_order: number;
      skills: { id: string; name: string }[];
    }[];

    // create a category — it is appended after the seeded ones
    const createRes = await app.request('/api/skills/categories', {
      method: 'POST',
      headers,
      body: JSON.stringify({ label: 'Testcategorie', label_en: 'Test category' }),
    });
    expect(createRes.status).toBe(201);
    let list = (await createRes.json()) as List;
    const category = list.find((c) => c.label === 'Testcategorie')!;
    expect(category).toBeDefined();
    expect(category.skills).toEqual([]);
    expect(category.sort_order).toBe(6);

    // add a skill to it
    const itemRes = await app.request('/api/skills/items', {
      method: 'POST',
      headers,
      body: JSON.stringify({ category_id: category.id, name: 'Vitest' }),
    });
    expect(itemRes.status).toBe(201);
    list = (await itemRes.json()) as List;
    const withSkill = list.find((c) => c.id === category.id)!;
    expect(withSkill.skills.map((s) => s.name)).toEqual(['Vitest']);

    // rename the skill, then the category
    const itemPut = await app.request(`/api/skills/items/${withSkill.skills[0].id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: 'Vitest 2' }),
    });
    expect(itemPut.status).toBe(200);
    list = (await itemPut.json()) as List;
    expect(list.find((c) => c.id === category.id)!.skills.map((s) => s.name)).toEqual(['Vitest 2']);

    const catPut = await app.request(`/api/skills/categories/${category.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ label_en: 'Renamed', sort_order: 1 }),
    });
    expect(catPut.status).toBe(200);
    list = (await catPut.json()) as List;
    expect(list.find((c) => c.id === category.id)!.label_en).toBe('Renamed');
    expect(list[0].id).toBe('languages');

    // deleting the category takes its skills with it
    const delRes = await app.request(`/api/skills/categories/${category.id}`, {
      method: 'DELETE',
      headers,
    });
    expect(delRes.status).toBe(200);
    list = (await delRes.json()) as List;
    expect(list.find((c) => c.id === category.id)).toBeUndefined();
    expect(list.reduce((sum, c) => sum + c.skills.length, 0)).toBe(34);
  });

  test('unknown ids return 404', async () => {
    const headers = await authHeaders();
    const cat = await app.request('/api/skills/categories/nope', {
      method: 'DELETE',
      headers,
    });
    expect(cat.status).toBe(404);

    const item = await app.request('/api/skills/items', {
      method: 'POST',
      headers,
      body: JSON.stringify({ category_id: 'nope', name: 'X' }),
    });
    expect(item.status).toBe(400);
  });
});

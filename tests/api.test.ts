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

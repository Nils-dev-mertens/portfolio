import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';

export const requireAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.warn('[auth] 401 — missing or malformed Authorization header');
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const secret = process.env.AUTH_SECRET;
  if (!secret) return c.json({ error: 'Auth not configured' }, 500);

  try {
    await verify(token, secret, 'HS256');
  } catch (err) {
    console.warn('[auth] 401 — token verification failed:', (err as Error).message);
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  return next();
});

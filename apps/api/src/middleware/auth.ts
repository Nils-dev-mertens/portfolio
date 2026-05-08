import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';

export const requireAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const secret = process.env.AUTH_SECRET;
  if (!secret) return c.json({ error: 'Auth not configured' }, 500);

  try {
    await verify(token, secret);
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  return next();
});

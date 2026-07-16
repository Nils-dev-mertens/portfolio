import { Hono } from 'hono';
import { sign } from 'hono/jwt';

const router = new Hono();

let _hash: string | null = null;
async function getPasswordHash(): Promise<string> {
  if (!_hash) {
    const pw = process.env.AUTH_PASSWORD;
    if (!pw) throw new Error('AUTH_PASSWORD is not set');
    _hash = await Bun.password.hash(pw);
  }
  return _hash;
}

getPasswordHash().catch((err) => console.error('[auth] startup hash failed:', err.message));

router.post('/login', async (c) => {
  const { password } = await c.req.json<{ password: string }>();

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error('[auth] AUTH_SECRET is not set');
    return c.json({ error: 'Auth not configured — AUTH_SECRET missing' }, 500);
  }

  let hash: string;
  try {
    hash = await getPasswordHash();
  } catch (err) {
    console.error('[auth] getPasswordHash failed:', err);
    return c.json({ error: 'Auth not configured — AUTH_PASSWORD missing' }, 500);
  }

  const valid = await Bun.password.verify(password, hash);
  if (!valid) return c.json({ error: 'Invalid password' }, 401);

  const token = await sign(
    { sub: 'admin', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
    secret,
    'HS256'
  );

  return c.json({ token });
});

export { router as authRouter };

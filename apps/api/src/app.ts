import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { projectsRouter } from './routes/projects';
import { aboutRouter } from './routes/about';
import { workRouter } from './routes/work';
import { educationRouter } from './routes/education';
import { githubRouter } from './routes/github';
import { authRouter } from './routes/auth';
import { requireAuth } from './middleware/auth';

/** Composes the Hono app. Side-effect free, so it can be used in tests. */
export function createApp() {
  const app = new Hono();

  // Skip request logging during tests to keep output readable.
  if (process.env.NODE_ENV !== 'test') {
    app.use(logger());
  }
  app.use(
    cors({
      origin: [
        'http://localhost:5173',
        'http://localhost:4321',
        process.env.DASHBOARD_URL ?? '',
        process.env.WEB_URL ?? '',
      ].filter(Boolean),
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.get('/health', (c) => c.json({ ok: true }));

  app.route('/api/auth', authRouter);

  // Only mutations require a JWT — GETs are public.
  // app.use (not app.on) ensures this runs before route handlers regardless of path specificity.
  app.use('/api/*', async (c, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) return next();
    if (c.req.path.startsWith('/api/auth/')) return next();
    return requireAuth(c, next);
  });

  app.route('/api/projects', projectsRouter);
  app.route('/api/about', aboutRouter);
  app.route('/api/work', workRouter);
  app.route('/api/education', educationRouter);
  app.route('/api/github', githubRouter);

  return app;
}

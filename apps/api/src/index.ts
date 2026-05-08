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

const app = new Hono();

app.use(logger());
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

// GET routes are public; mutations require a valid JWT
app.use('/api/*', async (c, next) => {
  if (c.req.method === 'GET' || c.req.method === 'OPTIONS') return next();
  return requireAuth(c, next);
});

app.route('/api/projects', projectsRouter);
app.route('/api/about', aboutRouter);
app.route('/api/work', workRouter);
app.route('/api/education', educationRouter);
app.route('/api/github', githubRouter);

const port = parseInt(process.env.PORT ?? '3001');
console.log(`API running on http://localhost:${port}`);
console.log(`[env] DB_PATH=${process.env.DB_PATH ?? '(unset, using portfolio.db)'}`);
console.log(`[env] AUTH_SECRET=${process.env.AUTH_SECRET ? 'set' : 'MISSING'}`);
console.log(`[env] AUTH_PASSWORD=${process.env.AUTH_PASSWORD ? 'set' : 'MISSING'}`);

export default { port, fetch: app.fetch };

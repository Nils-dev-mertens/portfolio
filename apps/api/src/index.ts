import { getDb, projects, seed, startScheduler } from "@portfolio/data";
import { createApp } from './app';

// Initialize database on startup (wrapped in IIFE to handle async)
(async () => {
  const db = getDb();
  try {
    const count = db.select().from(projects).all().length;
    if (count === 0) {
      seed();
    }
  } catch (e: any) {
    if (e.message?.includes('no such table') || e.message?.includes('unable to open database')) {
      console.log('🆕 Creating new database...');

      seed();
    } else {
      console.error('❌ DB error:', e);
    }
  }
})();

// Start background jobs (GitHub contributions sync, CMS sync, ...) — runs hourly.
startScheduler();

const app = createApp();

const port = parseInt(process.env.PORT ?? '3001');
console.log(`API running on http://localhost:${port}`);
console.log(`[env] DB_PATH=${process.env.DB_PATH ?? '(unset, using portfolio.db)'}`);
console.log(`[env] AUTH_SECRET=${process.env.AUTH_SECRET ? 'set' : 'MISSING'}`);
console.log(`[env] AUTH_PASSWORD=${process.env.AUTH_PASSWORD ? 'set' : 'MISSING'}`);

export default { port, fetch: app.fetch };

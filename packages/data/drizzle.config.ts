import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: { url: process.env.DB_PATH ?? '../../apps/web/portfolio.db' },
} satisfies Config;

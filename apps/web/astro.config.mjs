import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import { startScheduler } from '@portfolio/data';

// Boot background scheduler once at server start
startScheduler();

export default defineConfig({
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  vite: {
    ssr: {
      external: ['bun:sqlite'],
    },
  },
});

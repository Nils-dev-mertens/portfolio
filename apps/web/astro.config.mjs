import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      // Article images are served by the API at `/api/...`, which nginx maps to
      // the api service in production. The dev server needs the same mapping,
      // otherwise they would 404 on localhost:4321.
      proxy: {
        '/api': {
          target: process.env.API_URL ?? 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  },
  i18n: {
    defaultLocale: 'nl',
    locales: ['nl', 'en'],
    prefixDefaultLocale: false,
    routing: {
      redirectToDefaultLocale: false,
    },
  },
});

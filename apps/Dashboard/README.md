# Portfolio Dashboard

Admin dashboard for the portfolio site: React + TypeScript + Vite + shadcn/ui,
served under `/dashboard/`.

## Local development

Start the API and the dashboard together from the repository root:

```bash
bun run dev
```

The dashboard calls the API on its own origin (`/api/...`), which nginx proxies to
the api service in production. During development there is no nginx, so the Vite
dev server proxies those requests to `http://localhost:3001` instead. Point it
elsewhere with `API_URL` in `apps/Dashboard/.env`:

```bash
API_URL=http://localhost:4000
```

Sign in with the `AUTH_PASSWORD` from `apps/api/.env`.

## Writing an article

`/articles` manages everything: title, summary, project link, draft or published,
and the text itself. **Write body** opens a markdown editor with a live preview
rendered by the API with the same pipeline the article pages use, so the preview
cannot drift from what visitors get.

The body is stored with the article, in a `body` column with a `body_en`
companion — the same shape as every other piece of content on the site. Article
pages render on the server from that row, so saving publishes immediately, and
you can keep editing it straight from the dashboard.

English bodies are generated from the Dutch one automatically when a DeepL key is
configured (`body_en` is only filled while it is empty, so your own edits always
win), or by hand in the editor:

```bash
DEEPL_API_KEY=xxx bun packages/data/src/jobs/translate.ts
```

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `src/components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button"
```

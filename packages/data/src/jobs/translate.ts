/**
 * Generates the English content from the Dutch source using DeepL. Intended to
 * run after `db:seed` (or on demand). It ONLY fills what is currently missing,
 * so any manual English edits are preserved.
 *
 * Two things get translated:
 *   1. the `_en` columns (about, projects, articles, work_experience, education)
 *   2. article bodies — `articles.body` into `articles.body_en`, line by line so
 *      fenced code, imports and JSX-style blocks survive untouched
 *
 * Because bodies are rows rather than files, the scheduler keeps them in sync
 * on its own; the generated translation is still a starting point for review
 * rather than a replacement for one, and editing `body_en` in the dashboard
 * stops it from being regenerated.
 *
 * Requires DEEPL_API_KEY in the environment. Uses the free API by default.
 *
 *   DEEPL_API_KEY=xxx bun src/jobs/translate.ts
 */
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { about, articles, projects, work_experience, education } from '../db/schema';

interface Entry {
  table: 'about' | 'projects' | 'articles' | 'work_experience' | 'education';
  id: string;
  column: string; // base column, e.g. "title" -> "title_en"
  text: string;
  index?: number; // for array columns (bio_landing / bio_about)
}

const API_URL = process.env.DEEPL_API_URL ?? 'https://api-free.deepl.com/v2/translate';
const TARGET_LANG = process.env.DEEPL_TARGET_LANG ?? 'EN-US';

function collectEntries(): Entry[] {
  const db = getDb();
  const entries: Entry[] = [];

  // about (single row)
  const a = db.select().from(about).limit(1).all()[0];
  if (a) {
    for (const col of ['tagline', 'quote', 'quote_sub', 'status_label'] as const) {
      const text = a[col];
      if (text) entries.push({ table: 'about', id: a.id, column: col, text });
    }
    for (const col of ['bio_landing', 'bio_about'] as const) {
      const arr = JSON.parse(a[col] || '[]') as string[];
      arr.forEach((text, index) => {
        if (text) entries.push({ table: 'about', id: a.id, column: col, text, index });
      });
    }
  }

  // projects
  for (const p of db.select().from(projects).all()) {
    if (p.title) entries.push({ table: 'projects', id: p.id, column: 'title', text: p.title });
    if (p.description)
      entries.push({ table: 'projects', id: p.id, column: 'description', text: p.description });
  }

  // articles (metadata only — the body is handled by translateArticleBodies)
  for (const a of db.select().from(articles).all()) {
    if (a.title) entries.push({ table: 'articles', id: a.id, column: 'title', text: a.title });
    if (a.summary)
      entries.push({ table: 'articles', id: a.id, column: 'summary', text: a.summary });
  }

  // work_experience
  for (const w of db.select().from(work_experience).all()) {
    if (w.role) entries.push({ table: 'work_experience', id: w.id, column: 'role', text: w.role });
    if (w.description)
      entries.push({
        table: 'work_experience',
        id: w.id,
        column: 'description',
        text: w.description,
      });
  }

  // education
  for (const e of db.select().from(education).all()) {
    if (e.program)
      entries.push({ table: 'education', id: e.id, column: 'program', text: e.program });
    if (e.description)
      entries.push({ table: 'education', id: e.id, column: 'description', text: e.description });
  }

  return entries;
}

async function translate(texts: string[], apiKey: string): Promise<string[]> {
  if (texts.length === 0) return [];

  const body = new URLSearchParams();
  body.set('target_lang', TARGET_LANG);
  for (const t of texts) body.append('text', t);

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`DeepL request failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as { translations: { text: string }[] };
  return json.translations.map((tr) => tr.text);
}

function findRow(table: Entry['table'], id: string) {
  const db = getDb();
  switch (table) {
    case 'about':
      return db.select().from(about).limit(1).all()[0];
    case 'projects':
      return db.select().from(projects).where(eq(projects.id, id)).all()[0];
    case 'articles':
      return db.select().from(articles).where(eq(articles.id, id)).all()[0];
    case 'work_experience':
      return db.select().from(work_experience).where(eq(work_experience.id, id)).all()[0];
    case 'education':
      return db.select().from(education).where(eq(education.id, id)).all()[0];
  }
}

/**
 * Pulls inline code, link targets, URLs and inline JSX out of a line so DeepL
 * sees plain prose, and puts them back afterwards. Placeholders survive DeepL
 * intact in practice; when they do not, the generated file is still only a
 * starting point and the author is expected to read it.
 */
function protect(line: string): { text: string; store: string[] } {
  const store: string[] = [];
  const keep = (value: string) => {
    store.push(value);
    return `[[${store.length - 1}]]`;
  };

  const text = line
    .replace(/`[^`]*`/g, keep) // inline code
    .replace(/\]\(([^)]*)\)/g, (_match, url: string) => `](${keep(url)})`)
    .replace(/<[^>]+>/g, keep) // inline JSX / HTML
    .replace(/https?:\/\/\S+/g, keep); // bare URLs

  return { text, store };
}

function restore(text: string, store: string[]): string {
  return text.replace(/\[\[(\d+)\]\]/g, (match, index: string) => store[Number(index)] ?? match);
}

/**
 * Translates a markdown/MDX body while leaving the document structure alone:
 * fenced code blocks, imports and block-level JSX/expressions are copied over
 * unchanged, everything else is sent through DeepL line by line.
 */
async function translateMarkdown(body: string, apiKey: string): Promise<string> {
  const lines = body.split(/\r?\n/);
  const pending: { index: number; text: string; store: string[] }[] = [];

  let inFence = false;
  for (const [index, line] of lines.entries()) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !line.trim()) continue;
    if (/^\s*(import|export)\s/.test(line)) continue;
    if (/^\s*[<{]/.test(line)) continue; // block-level JSX or MDX expression

    const { text, store } = protect(line);
    pending.push({ index, text, store });
  }

  if (pending.length === 0) return body;

  const translated = await translate(
    pending.map((entry) => entry.text),
    apiKey,
  );

  for (const [i, entry] of pending.entries()) {
    lines[entry.index] = restore(translated[i] ?? entry.text, entry.store);
  }

  return lines.join('\n');
}

/**
 * Fills `body_en` for every article that has a Dutch body and no English one.
 * An existing `body_en` is never overwritten, matching the rule used for the
 * other `_en` columns — so a hand-written or edited translation always wins.
 */
export async function translateArticleBodies(apiKey: string): Promise<number> {
  const db = getDb();
  const pending = db
    .select()
    .from(articles)
    .all()
    .filter((article) => article.body.trim() !== '' && article.body_en.trim() === '');

  if (pending.length === 0) return 0;

  for (const article of pending) {
    const bodyEn = await translateMarkdown(article.body, apiKey);
    db.update(articles).set({ body_en: bodyEn }).where(eq(articles.id, article.id)).run();
    console.log(`[translate] body_en ← ${article.slug}`);
  }

  return pending.length;
}

export async function runTranslate() {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    console.log('[translate] DEEPL_API_KEY not set — skipping English generation.');
    return;
  }

  // Bodies first: they are the long-running part, and they must not be skipped
  // when every other `_en` column is already filled (that path returns early).
  const bodies = await translateArticleBodies(apiKey);
  if (bodies > 0) console.log(`[translate] Translated ${bodies} article body/bodies.`);

  const entries = collectEntries();
  if (entries.length === 0) {
    console.log('[translate] No Dutch source content found to translate.');
    return;
  }

  // skip entries whose _en column is already filled
  const db = getDb();
  const isEmpty = (v: unknown) => v === null || v === undefined || v === '' || v === '[]';
  const pending: Entry[] = [];
  for (const e of entries) {
    const row = findRow(e.table, e.id);
    if (!row) continue;
    const existing = (row as Record<string, unknown>)[`${e.column}_en`];
    if (isEmpty(existing)) pending.push(e);
  }

  if (pending.length === 0) {
    console.log('[translate] All `_en` columns already populated — nothing to do.');
    return;
  }

  const uniqueTexts = Array.from(new Set(pending.map((e) => e.text)));
  console.log(`[translate] Translating ${pending.length} field(s) (${uniqueTexts.length} unique)…`);

  const translated = await translate(uniqueTexts, apiKey);
  const map = new Map(uniqueTexts.map((t, i) => [t, translated[i]]));

  // group by (table, id) and apply
  const byRow = new Map<string, Entry[]>();
  for (const e of pending) {
    const key = `${e.table}:${e.id}`;
    if (!byRow.has(key)) byRow.set(key, []);
    byRow.get(key)!.push(e);
  }

  for (const [key, rows] of byRow) {
    const [table, id] = key.split(':');
    const set: Record<string, unknown> = {};

    // arrays need reconstruction from indexed entries
    const arrayCols = new Set(rows.filter((r) => r.index !== undefined).map((r) => r.column));
    for (const col of arrayCols) {
      const parts = rows
        .filter((r) => r.column === col)
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
        .map((r) => map.get(r.text) ?? '');
      set[`${col}_en`] = JSON.stringify(parts);
    }
    for (const r of rows) {
      if (r.index !== undefined) continue;
      set[`${r.column}_en`] = map.get(r.text) ?? '';
    }

    if (table === 'about') db.update(about).set(set).where(eq(about.id, id)).run();
    else if (table === 'projects') db.update(projects).set(set).where(eq(projects.id, id)).run();
    else if (table === 'articles') db.update(articles).set(set).where(eq(articles.id, id)).run();
    else if (table === 'work_experience')
      db.update(work_experience).set(set).where(eq(work_experience.id, id)).run();
    else db.update(education).set(set).where(eq(education.id, id)).run();
  }

  console.log(`[translate] Done — populated ${pending.length} English field(s).`);
}

if (import.meta.main) {
  runTranslate().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

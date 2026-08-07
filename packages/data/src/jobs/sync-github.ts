import { max, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { github_contributions, about } from '../db/schema';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

const CONTRIBUTIONS_QUERY = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

interface ContributionDay {
  date: string;
  contributionCount: number;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function toDateString(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateString(d);
}

function getUsername(): string {
  const fromEnv = process.env.GITHUB_USERNAME?.trim();
  if (fromEnv) return fromEnv;

  // Fall back to the username embedded in the `about` table's github_url.
  try {
    const row = getDb().select().from(about).limit(1).all()[0];
    const match = row?.github_url?.match(/github\.com\/([^/]+)/);
    if (match) return match[1];
  } catch {
    // DB may not exist yet on first boot — fall through to default.
  }

  return 'Nils-Dev-Mertens';
}

/**
 * Fetches GitHub contribution days via GraphQL and upserts them into
 * `github_contributions`.
 *
 * - Empty table  → backfills the entire current year (Jan 1 → today).
 * - Non-empty    → incrementally fetches from the last recorded date → today.
 */
export async function syncGithub(): Promise<void> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    console.log('[scheduler] syncGithub — GITHUB_TOKEN not set, skipping');
    return;
  }

  const db = getDb();
  const today = toDateString(new Date());

  const lastRow = db
    .select({ last: max(github_contributions.date) })
    .from(github_contributions)
    .get();
  const lastDate = lastRow?.last ?? null;

  const from = lastDate ? addDays(lastDate, 1) : `${today.slice(0, 4)}-01-01`;

  if (from > today) {
    console.log(`[scheduler] syncGithub — already up to date (last: ${lastDate})`);
    return;
  }

  const username = getUsername();
  // GitHub's DateTime! scalar requires full ISO 8601 timestamps, not bare dates.
  const body = {
    query: CONTRIBUTIONS_QUERY,
    variables: {
      login: username,
      from: `${from}T00:00:00Z`,
      to: `${today}T23:59:59Z`, // end-of-day so today is included
    },
  };

  console.log(`[scheduler] syncGithub — fetching ${from} → ${today} for ${username}`);

  let days: ContributionDay[];
  try {
    const res = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'portfolio-cronjob',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(`[scheduler] syncGithub — HTTP ${res.status}: ${await res.text()}`);
      return;
    }

    const json = (await res.json()) as {
      data?: {
        user?: {
          contributionsCollection?: {
            contributionCalendar?: {
              weeks?: { contributionDays?: ContributionDay[] }[];
            };
          };
        };
      };
      errors?: { message: string }[];
    };

    if (json.errors?.length) {
      console.error(`[scheduler] syncGithub — GraphQL errors: ${json.errors.map((e) => e.message).join('; ')}`);
      return;
    }

    days =
      json.data?.user?.contributionsCollection?.contributionCalendar?.weeks
        ?.flatMap((w) => w.contributionDays ?? []) ?? [];
  } catch (e) {
    console.error('[scheduler] syncGithub — request failed:', e);
    return;
  }

  // GitHub buckets days into Sunday-aligned weeks, which can include days just
  // outside the requested range — drop those so they never pollute other years.
  days = days.filter((d) => d.date >= from && d.date <= today);

  if (days.length === 0) {
    console.log('[scheduler] syncGithub — no contribution days returned');
    return;
  }

  db.insert(github_contributions)
    .values(days.map((d) => ({ date: d.date, count: d.contributionCount })))
    .onConflictDoUpdate({
      target: github_contributions.date,
      set: { count: sql`excluded.count` },
    })
    .run();

  const total = days.reduce((sum, d) => sum + d.contributionCount, 0);
  console.log(`[scheduler] syncGithub — upserted ${days.length} days (${total} contributions)`);
}

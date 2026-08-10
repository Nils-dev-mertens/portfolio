import { like, max, sql } from 'drizzle-orm';
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

// GitHub caps a single query's range at ~1 year, so we fetch year by year.
const YEARS_QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionYears
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

/** Runs a GraphQL query against the GitHub API and returns its `data` payload. */
async function graphql<T>(
  token: string,
  query: string,
  variables: Record<string, string>
): Promise<T> {
  const res = await fetch(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'portfolio-cronjob',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(`GraphQL errors: ${json.errors.map((e) => e.message).join('; ')}`);
  }

  return json.data as T;
}

/** Fetches every contribution day in [from, to] and upserts it into the DB. */
async function fetchRangeAndUpsert(
  token: string,
  username: string,
  from: string,
  to: string
): Promise<number> {
  // GitHub's DateTime! scalar requires full ISO 8601 timestamps, not bare dates.
  const data = await graphql<{
    user?: {
      contributionsCollection?: {
        contributionCalendar?: { weeks?: { contributionDays?: ContributionDay[] }[] };
      };
    };
  }>(token, CONTRIBUTIONS_QUERY, {
    login: username,
    from: `${from}T00:00:00Z`,
    to: `${to}T23:59:59Z`, // end-of-day so `to` is included
  });

  let days =
    data.user?.contributionsCollection?.contributionCalendar?.weeks?.flatMap(
      (w) => w.contributionDays ?? []
    ) ?? [];

  // GitHub buckets days into Sunday-aligned weeks, which can include days just
  // outside the requested range — drop those so they never pollute other years.
  days = days.filter((d) => d.date >= from && d.date <= to);

  if (days.length === 0) return 0;

  const db = getDb();
  db.insert(github_contributions)
    .values(days.map((d) => ({ date: d.date, count: d.contributionCount })))
    .onConflictDoUpdate({
      target: github_contributions.date,
      set: { count: sql`excluded.count` },
    })
    .run();

  return days.reduce((sum, d) => sum + d.contributionCount, 0);
}

/**
 * Keeps `github_contributions` in sync with GitHub.
 *
 * - Table empty (or missing years) → backfills **all** contribution years
 *   reported by GitHub (each year fetched in its own query, since GitHub caps
 *   a single range at ~1 year).
 * - Otherwise → incrementally fetches from the last recorded date → today.
 */
export async function syncGithub(): Promise<void> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    console.log('[scheduler] syncGithub — GITHUB_TOKEN not set, skipping');
    return;
  }

  const db = getDb();
  const today = toDateString(new Date());
  const currentYear = Number(today.slice(0, 4));

  const username = getUsername();

  // Discover every year the user has contributed (e.g. [2019, 2020, ..., 2026]).
  let years: number[];
  try {
    const data = await graphql<{ user?: { contributionsCollection?: { contributionYears?: number[] } } }>(
      token,
      YEARS_QUERY,
      { login: username }
    );
    years = data.user?.contributionsCollection?.contributionYears ?? [];
  } catch (e) {
    console.error('[scheduler] syncGithub — could not fetch contribution years:', e);
    return;
  }

  // Never fetch future years.
  years = years.filter((y) => y <= currentYear).sort((a, b) => a - b);

  if (years.length === 0) {
    console.log('[scheduler] syncGithub — no contribution years returned');
    return;
  }

  // For every contribution year, fill whatever is missing:
  // - year absent from the DB         → fetch from Jan 1 of that year
  // - year partially present          → fetch from the last recorded date in it
  // - year fully recorded (past years)→ skip
  // - current year                    → always re-fetch today so today's count
  //                                     stays fresh even after its first insert
  // This backfills the full history on first run AND keeps running hourly.
  for (const y of years) {
    const to = y === currentYear ? today : `${y}-12-31`;

    const lastInYear = db
      .select({ last: max(github_contributions.date) })
      .from(github_contributions)
      .where(like(github_contributions.date, `${y}-%`))
      .get();

    // Always fetch the current year's today (refreshes the hourly count);
    // for past years, only fetch what's missing.
    let from = lastInYear?.last ? addDays(lastInYear.last, 1) : `${y}-01-01`;
    if (from > to) {
      if (y !== currentYear) continue; // past year is already complete
      from = to; // current year: re-fetch today to keep it fresh
    }

    try {
      const total = await fetchRangeAndUpsert(token, username, from, to);
      console.log(`[scheduler] syncGithub — ${y}: fetched ${from} → ${to} (${total} contributions)`);
    } catch (e) {
      console.error(`[scheduler] syncGithub — fetch ${y} failed:`, e);
    }
  }
}

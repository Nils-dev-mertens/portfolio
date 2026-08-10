import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { getDb, github_contributions } from '../packages/data/index.ts';
import { syncGithub } from '../packages/data/src/jobs/sync-github';

const originalFetch = globalThis.fetch;

// Test files share one process (and thus one in-memory DB), so always start
// from a clean table regardless of what other suites inserted.
beforeEach(() => {
  getDb().delete(github_contributions).run();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.GITHUB_TOKEN = '';
  process.env.GITHUB_USERNAME = '';
  getDb().delete(github_contributions).run();
});

function dayFrom(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Replaces globalThis.fetch with a fake GitHub GraphQL client.
 * - YEARS_QUERY → returns the provided contribution years.
 * - CONTRIBUTIONS_QUERY → returns one contribution day every 7 days inside
 *   the requested [from, to] range.
 */
function mockGithub(years: number[]) {
  const calls: { query: string; variables: Record<string, string> }[] = [];
  globalThis.fetch = mock(async (url: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as {
      query: string;
      variables: Record<string, string>;
    };
    calls.push(body);

    if (body.query.includes('contributionYears')) {
      return new Response(
        JSON.stringify({
          data: { user: { contributionsCollection: { contributionYears: years } } },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // contributions query
    const from = dayFrom(body.variables.from);
    const to = dayFrom(body.variables.to);
    const start = new Date(`${from}T00:00:00Z`);
    const end = new Date(`${to}T00:00:00Z`);
    const days: { date: string; contributionCount: number }[] = [];
    for (let d = start; d <= end; d.setUTCDate(d.getUTCDate() + 7)) {
      days.push({
        date: dayFrom(d.toISOString()),
        contributionCount: Math.floor((d.getUTCDate() % 5) + 1),
      });
    }

    return new Response(
      JSON.stringify({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                weeks: [{ contributionDays: days }],
              },
            },
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }) as unknown as typeof fetch;
  return calls;
}

describe('syncGithub', () => {
  test('returns early without making requests when GITHUB_TOKEN is missing', async () => {
    const calls = mockGithub([2025]);
    await syncGithub();

    expect(calls.length).toBe(0);
    expect(getDb().select().from(github_contributions).all().length).toBe(0);
  });

  test('backfills every reported contribution year', async () => {
    process.env.GITHUB_TOKEN = 'test-token';
    process.env.GITHUB_USERNAME = 'test-user';
    const calls = mockGithub([2024, 2025]);

    await syncGithub();

    const rows = getDb().select().from(github_contributions).all();
    // each year contributes ~52 weekly days (2024 + 2025)
    expect(rows.length).toBeGreaterThan(50);
    expect(new Set(rows.map((r) => r.date.slice(0, 4)))).toEqual(new Set(['2024', '2025']));
    expect(calls.some((c) => c.query.includes('contributionYears'))).toBe(true);
  });

  test('is idempotent — a second run upserts without duplicating rows', async () => {
    process.env.GITHUB_TOKEN = 'test-token';
    process.env.GITHUB_USERNAME = 'test-user';
    mockGithub([2025]);

    await syncGithub();
    const first = getDb().select().from(github_contributions).all().length;

    await syncGithub();
    const second = getDb().select().from(github_contributions).all().length;

    expect(second).toBe(first);
  });
});

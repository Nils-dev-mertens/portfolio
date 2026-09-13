import { describe, expect, test, beforeAll } from 'bun:test';
import {
  seed,
  getDb,
  getProjects,
  getAbout,
  getWorkExperience,
  getEducation,
  getSkillCategories,
  getGithubContributions,
  getGithubActivity,
  github_activity,
  github_contributions,
} from '../packages/data/index.ts';

beforeAll(() => {
  seed();

  const db = getDb();
  db.insert(github_contributions)
    .values([
      { date: '2025-01-10', count: 3 },
      { date: '2025-02-11', count: 0 },
      { date: '2026-01-01', count: 5 },
    ])
    .run();
  db.insert(github_activity)
    .values([
      { id: 'a1', type: 'PushEvent', repo: 'foo/bar', message: 'fix', occurred_at: '2026-01-03T10:00:00Z' },
      { id: 'a2', type: 'PullRequestEvent', repo: 'foo/baz', message: null, occurred_at: '2026-01-02T10:00:00Z' },
      { id: 'a3', type: 'PushEvent', repo: 'foo/qux', message: 'wip', occurred_at: '2026-01-01T10:00:00Z' },
    ])
    .run();
});

describe('getProjects', () => {
  test('returns all projects with parsed tags, newest first', () => {
    const rows = getProjects();
    expect(rows.length).toBe(5);
    expect(rows[0].id).toBe('portfolio-site');
    expect(rows[0].tags).toEqual(['Astro', 'SQLite', 'Bun', 'TypeScript', 'Docker', 'Drizzle']);
  });

  test('filters by featured', () => {
    const featured = getProjects({ featured: true });
    expect(featured.length).toBe(3);
    expect(featured.every((p) => p.featured)).toBe(true);
  });

  test('filters by category', () => {
    const tools = getProjects({ category: 'tool' });
    expect(tools.length).toBe(2);
    expect(tools.every((p) => p.category === 'tool')).toBe(true);
  });

  test('respects limit', () => {
    expect(getProjects({ limit: 2 }).length).toBe(2);
  });
});

describe('getAbout', () => {
  test('returns the about row with parsed bio arrays', () => {
    const about = getAbout();
    expect(about).toBeDefined();
    expect(about!.email).toBe('nilsdevmertens@gmail.com');
    expect(about!.bio_about.length).toBeGreaterThan(0);
    expect(about!.bio_landing.length).toBeGreaterThan(0);
  });
});

describe('getWorkExperience', () => {
  test('returns entries with parsed tags, newest start_date first', () => {
    const rows = getWorkExperience();
    expect(rows.length).toBe(3);
    expect(rows[0].company).toBe('ZORGI');
    expect(rows[0].tags).toEqual(['Playwright', 'Test Automation', 'CI/CD']);
  });
});

describe('getEducation', () => {
  test('returns entries sorted by start_date desc', () => {
    const rows = getEducation();
    expect(rows.length).toBe(2);
    expect(rows[0].institution).toBe('AP Hogeschool — Antwerpen');
  });
});

describe('getGithubContributions', () => {
  test('returns all rows when no year is given', () => {
    expect(getGithubContributions().length).toBe(3);
  });

  test('filters by year', () => {
    const rows = getGithubContributions(2025);
    expect(rows.length).toBe(2);
    expect(rows.every((r) => r.date.startsWith('2025-'))).toBe(true);
  });
});

describe('getGithubActivity', () => {
  test('returns rows newest first and honors the limit', () => {
    const rows = getGithubActivity(2);
    expect(rows.length).toBe(2);
    expect(rows[0].id).toBe('a1');
    expect(rows[1].id).toBe('a2');
  });
});

describe('getSkillCategories', () => {
  test('returns the seeded categories in order, with their skills', () => {
    const rows = getSkillCategories();
    expect(rows.map((c) => c.id)).toEqual([
      'languages',
      'frontend',
      'backend',
      'devops',
      'test',
      'tooling',
    ]);
    expect(rows[0].skills.map((s) => s.name)).toContain('TypeScript');
    expect(rows[3].skills.length).toBe(8);
  });

  test('localizes the label from the _en companion column', () => {
    expect(getSkillCategories('nl')[0].label).toBe('Talen');
    expect(getSkillCategories('en')[0].label).toBe('Languages');
  });
});

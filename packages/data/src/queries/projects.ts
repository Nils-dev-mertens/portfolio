import { getDb } from '../db';

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  url: string | null;
  repo_url: string | null;
  featured: boolean;
  created_at: string;
}

interface ProjectRow {
  id: string;
  title: string;
  description: string;
  tags: string;
  url: string | null;
  repo_url: string | null;
  featured: number;
  created_at: string;
}

export function getProjects(opts: { featured?: boolean; limit?: number } = {}): Project[] {
  const db = getDb();

  let sql = 'SELECT * FROM projects';
  const params: (string | number)[] = [];

  if (opts.featured !== undefined) {
    sql += ' WHERE featured = ?';
    params.push(opts.featured ? 1 : 0);
  }

  sql += ' ORDER BY created_at DESC';

  if (opts.limit !== undefined) {
    sql += ' LIMIT ?';
    params.push(opts.limit);
  }

  const rows = db.query<ProjectRow, (string | number)[]>(sql).all(...params);

  return rows.map((row) => ({
    ...row,
    tags: JSON.parse(row.tags) as string[],
    featured: row.featured === 1,
  }));
}

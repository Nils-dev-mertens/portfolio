import { getDb } from '../db';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  published: boolean;
  published_at: string | null;
}

export function getBlogPosts(): BlogPost[] {
  const db = getDb();
  const rows = db
    .query<Omit<BlogPost, 'published'> & { published: number }, []>(
      'SELECT * FROM blog_posts WHERE published = 1 ORDER BY published_at DESC'
    )
    .all();

  return rows.map((row) => ({ ...row, published: row.published === 1 }));
}

import { eq, desc } from 'drizzle-orm';
import { getDb } from '../db';
import { blog_posts } from '../db/schema';

export type BlogPost = typeof blog_posts.$inferSelect;

export function getBlogPosts(): BlogPost[] {
  const db = getDb();
  return db
    .select()
    .from(blog_posts)
    .where(eq(blog_posts.published, true))
    .orderBy(desc(blog_posts.published_at))
    .all();
}

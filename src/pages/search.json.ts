import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', (e: CollectionEntry<'blog'>) => !e.data.draft);

  const index = posts.map((post: CollectionEntry<'blog'>) => ({
    title: post.data.title,
    excerpt: post.data.excerpt ?? '',
    tags: post.data.tags,
    url: `/blog/${post.id}/`,
    date: post.data.date.toISOString(),
  }));

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};

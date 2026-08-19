import rss from '@astrojs/rss';
import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIContext } from 'astro';
import { summarize } from '../lib/summarize';

/**
 * Static feed at /rss.xml. Drafts are excluded, matching `/search.json` and the
 * blog listing — the draft flag is the single switch that hides a post
 * everywhere.
 */
export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', (e: CollectionEntry<'blog'>) => !e.data.draft)).sort(
    (a: CollectionEntry<'blog'>, b: CollectionEntry<'blog'>) =>
      b.data.date.getTime() - a.data.date.getTime()
  );

  return rss({
    title: 'Nathan Dodson',
    description: 'IT Director · Platform Engineer · MBA',
    // Set from `site` in astro.config.mjs.
    site: context.site!,
    items: posts.map((post: CollectionEntry<'blog'>) => ({
      title: post.data.title,
      pubDate: post.data.date,
      // Same fallback the post page uses for its meta description (SEO-1).
      description: post.data.excerpt || summarize(post.body ?? ''),
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: '<language>en-us</language>',
  });
}

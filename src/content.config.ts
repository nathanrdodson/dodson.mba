import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string().optional(),
    featureImage: z.string().optional(),
    featureImageAlt: z.string().default(''),
    featureImageCaption: z.string().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const photos = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/photos' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    featureImage: z.string(),
    featureImageAlt: z.string().default(''),
    order: z.number().default(0),
    images: z.array(z.string()).default([]),
  }),
});

const about = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/about' }),
  schema: z.object({}),
});

export const collections = { blog, photos, about };

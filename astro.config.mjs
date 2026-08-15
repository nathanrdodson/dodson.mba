import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeFigures from './src/lib/rehype-figures.mjs';

export default defineConfig({
  site: 'https://dodson.mba',
  output: 'static',
  integrations: [
    mdx(),
    sitemap({
      // `/design` renders the style guide and ships `noindex`; listing it here
      // would contradict that. `/404` is not a real destination.
      filter: (page) => !['/design/', '/404/'].includes(new URL(page).pathname),
    }),
  ],
  markdown: {
    // Ghost-era posts put captions on the same line as their image; this splits them
    // into figure/figcaption so they can be styled apart from body copy.
    rehypePlugins: [rehypeFigures],
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          silenceDeprecations: ['import', 'global-builtin'],
        },
      },
    },
  },
  build: {
    assets: '_assets',
  },
});

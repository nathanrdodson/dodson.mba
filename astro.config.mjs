import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import rehypeFigures from './src/lib/rehype-figures.mjs';

export default defineConfig({
  site: 'https://dodson.mba',
  output: 'static',
  integrations: [mdx()],
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

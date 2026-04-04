import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://dodson.mba',
  output: 'static',
  integrations: [mdx()],
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

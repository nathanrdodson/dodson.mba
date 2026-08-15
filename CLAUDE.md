# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Node 22.12+ is required and is not the machine default** — `nvm use 22` before anything, or `astro` aborts with a version error.

```sh
nvm use 22
npm ci                 # install
npm run dev            # dev server at localhost:4321
npm run build          # build to ./dist/
npm run preview        # serve the built ./dist/
npm run lint:md        # markdownlint over src/content/**/*.md
npm run lint:md:fix    # autofix structural rules only
```

There is no test suite and no JS/TS/SCSS linter. `npm run build` is the real correctness gate — Zod schema violations in content frontmatter fail the build. Verifying a change means building and inspecting `dist/`.

## Architecture

Static Astro site, `output: 'static'`, no server runtime. Content is Markdown on disk; there is no CMS or database.

### Content collections

Three collections are declared in `src/content.config.ts` (`blog`, `photos`, `about`), all using the `glob` loader over `src/content/*`. The Zod schemas there are the source of truth for frontmatter — the build fails on violation. Keep the schemas tight: fields that no page reads have been deliberately removed, so don't add speculative ones.

### Image references live in two different shapes

This is the repo's main footgun. A `/images/...` path can be referenced either as a frontmatter field (`featureImage`) **or** as an entry in the `images:` array of a `src/content/photos/*.md` album. A previous cleanup scanned only `featureImage` and deleted 16 photos that were live on the site.

Before deleting any image, match against every path in the content tree, not just frontmatter:

```sh
grep -rhoE '/images/[a-zA-Z0-9_./-]+' src/content/ | sort -u > /tmp/refs.txt
find public/images -type f | sed 's|^public||' | sort -u > /tmp/present.txt
comm -13 /tmp/refs.txt /tmp/present.txt   # unreferenced — safe to consider
comm -23 /tmp/refs.txt /tmp/present.txt   # referenced but missing — must be empty
```

`public/images/logo.png`, `profile.webp`, and `default-avatar-square-small.jpg` are referenced from components rather than content, so they will always show as "unreferenced" by that grep. They are in use.

GitHub Pages rejects deploy artifacts over 1GB; `public/images/` is ~176MB and is the only directory with unbounded growth.

### View transitions constrain all client script

`BaseLayout.astro` mounts `<ClientRouter />`, so navigation does not reload the document. **Every client script must initialize on `astro:page-load`, never `DOMContentLoaded` or `window load`** — those fire once and the code silently dies on every subsequent navigation. All of `src/scripts/*.ts` already follows this; match it.

Only `app.ts` and `header-search.ts` are imported globally (from `BaseLayout.astro`). Page-specific scripts are imported by their own page.

### Styles

SCSS in `src/styles/`, entry `app.scss`, which uses an **explicit `@import` list — glob imports were deliberately removed**. A new partial is invisible until added there.

Class prefixes are meaningful: `c-` component, `m-` module, `l-` layout, `js-` behavior hook with no styling. Don't style a `js-` class or add behavior to a `c-`/`m-`/`l-` class.

### Build-time helpers (`src/lib/`)

- `rehype-figures.mjs` — wired into `astro.config.mjs` as a rehype plugin. Ghost-era posts put captions on the same line as the image, producing `<p><img>Caption</p>`; this promotes them to `<figure>/<figcaption>` so every post is fixed at render time without editing prose.
- `card-art.ts` + `seed.ts` — deterministic generative contour art for posts with no `featureImage`. Seeded by a stable string hash, so a given post always renders the same composition across rebuilds. Changing the hash reshuffles every card.
- `reading-time.ts` — read-time estimate from raw markdown body.

### Search

`src/pages/search.json.ts` emits a static `/search.json` at build time (drafts excluded); `src/scripts/header-search.ts` fetches it and queries client-side with Fuse.js. Adding a searchable field means changing both the endpoint and the Fuse `keys` in `src/scripts/search-index.ts`.

### `/design` is a production page

`src/pages/design.astro` renders live design tokens and every shared component against real collection content, at <https://dodson.mba/design/>. It is unlinked from the nav but publicly reachable and **is not a scratch page**. When changing a design token, adding a component, or altering component markup, update `/design` in the same commit.

### Icons

Iconoir, loaded as a CDN stylesheet in `BaseLayout.astro` pinned to `@main` (a moving upstream target). Used as `<i class="iconoir-name">`. Verify a class actually exists in the set before using it — an invalid name fails silently as a blank glyph.

## Content conventions

Tags: trip/series tag first in title case (`"Tunisia 2023"`), then lowercase topic tags (`travel`, `photography`, `hiking`, `national parks`, `wildlife`, `conservation`, `essays`). Don't invent a new topic tag when an existing one fits.

`excerpt` feeds the meta description and the search index only — **not** listing cards, which derive previews from the post body.

The markdownlint config intentionally disables every rule that would rewrite prose (`MD013`, `MD036`, `MD026`, `MD001`, `MD041`, `MD033`). These are personal essays: fix structure, never edit the author's wording. Do not run `lint:md:fix` expecting it to be safe on headings phrased in the author's voice.

## Deployment

Push to `main` → `.github/workflows/deploy.yml` builds on Node 22 and deploys to GitHub Pages. Custom domain via `public/CNAME`. CI builds from a clean checkout, so gitignored local files (`.DS_Store`, `dist/`) never reach production.

## Known gaps

- `src/pages/experience.astro` links `/files/resume.pdf` for download. That file has never existed in the repo and 404s in production — supplying it requires the actual PDF.
- Career/experience content is hardcoded in `src/pages/experience.astro`, not a data file or collection.

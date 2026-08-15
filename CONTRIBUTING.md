# Contributing

How to make changes to dodson.mba. This is a personal site, so "contributing" mostly means the author (or an AI agent working on their behalf) making a change safely and shipping it.

Agent-specific guidance lives in [CLAUDE.md](CLAUDE.md) — read that too if you are an LLM working in this repo.

Known problems and planned improvements are tracked in [ISSUES.md](ISSUES.md). Check it before starting work, and add an entry for anything you find but don't fix.

---

## Setup

**Node 22.12+ is required, and it is probably not your shell default.** The build aborts on older versions with a hard error.

```sh
nvm use 22        # required first, every session
npm ci            # clean install from package-lock.json
npm run dev       # http://localhost:4321
```

Use `npm ci`, not `npm install`, unless you are deliberately changing a dependency — `ci` respects the lockfile exactly, which is what CI does.

---

## Commands

| Command               | Action                                     |
| :-------------------- | :----------------------------------------- |
| `npm run dev`         | Dev server with HMR at `localhost:4321`    |
| `npm run build`       | Production build to `./dist/`              |
| `npm run preview`     | Serve the built `./dist/` locally          |
| `npm run lint:md`     | Lint content Markdown                      |
| `npm run lint:md:fix` | Autofix structural Markdown rules only     |

There is no test suite. **`npm run build` is the correctness gate** — content frontmatter is validated against Zod schemas at build time, so a bad date or a missing required field fails the build rather than shipping broken.

---

## Making changes

### Add a blog post

1. Create `src/content/blog/my-post-slug.md`. The filename becomes the URL: `/blog/my-post-slug/`.
2. Add frontmatter (schema in `src/content.config.ts`):

   ```yaml
   ---
   title: "Post Title"
   date: 2026-08-15
   excerpt: "One line — used for meta description and search, not the listing card."
   featureImage: "/images/blog/2026/08/photo.jpg"
   featureImageAlt: "Describe the image"
   tags: ["Trip Name 2026", "travel", "photography"]
   ---
   ```

3. Put images in `public/images/blog/<year>/<month>/` and reference them as `/images/blog/...` (no `public/` prefix).
4. Omit `featureImage` and the post gets deterministic generative contour art on its card instead — this is intentional, not a fallback to fix.
5. `draft: true` hides a post from listings, search, and the feed.

**Tags:** trip/series tag first in title case (`"Tunisia 2023"`), then lowercase topic tags from the existing vocabulary: `travel`, `photography`, `hiking`, `national parks`, `wildlife`, `conservation`, `essays`. Reuse an existing topic tag rather than coining a synonym.

### Add a photo album

1. Create `src/content/photos/album-slug.md`:

   ```yaml
   ---
   title: "Album Name"
   date: 2026-08-15
   featureImage: /images/blog/2026/08/cover.jpg
   featureImageAlt: "Album cover description"
   order: 6
   images:
     - /images/blog/2026/08/photo-01.jpg
     - /images/blog/2026/08/photo-02.jpg
   ---
   ```

2. The `images:` array is what populates the album page — `featureImage` is only the cover on the gallery index.
3. `order` controls position on `/photos`.

### Change styles

- SCSS lives in `src/styles/`. New partials must be added to the explicit `@import` list in `src/styles/app.scss` — **glob imports were deliberately removed**, so a new file is inert until imported.
- Class prefixes carry meaning: `c-` component, `m-` module, `l-` layout, `js-` behavior hook. `js-` classes are never styled; styled classes never get JS behavior attached.
- Theme tokens are in `src/styles/common/_themes.scss` and `_variables.scss`. Both light and dark must be checked — past commits fixed contrast bugs that only appeared in one theme.

### Change client-side behavior

Scripts are in `src/scripts/`, written in TypeScript.

**Initialize on `astro:page-load`, never `DOMContentLoaded` or `window.load`.** The site uses Astro's `<ClientRouter />`, so navigation swaps the DOM without a document reload; one-shot listeners fire on first paint and then silently stop working on every later navigation.

```ts
document.addEventListener('astro:page-load', () => {
  // setup here
});
```

`app.ts` and `header-search.ts` are loaded globally from `BaseLayout.astro`; everything else is imported by the page that needs it.

### Update the design system page

`/design` (`src/pages/design.astro`) is a **live production page** at <https://dodson.mba/design/>. It is unlinked from the nav but publicly reachable, and it renders real tokens and components against real content.

When you change a design token, add a component, or alter component markup, **update `/design` in the same commit** so it keeps matching what the site actually looks like.

---

## Images

Blog and album images go in `public/images/blog/<year>/<month>/`. Reference them as `/images/...`, never `public/images/...`.

### Before deleting any image

Image paths appear in **two** shapes: the `featureImage` frontmatter field, and the `images:` array in `src/content/photos/*.md`. A previous cleanup pass scanned only `featureImage` and deleted 16 photos that were live on the site.

Always check against the whole content tree:

```sh
grep -rhoE '/images/[a-zA-Z0-9_./-]+' src/content/ | sort -u > /tmp/refs.txt
find public/images -type f | sed 's|^public||' | sort -u > /tmp/present.txt

comm -13 /tmp/refs.txt /tmp/present.txt   # present but unreferenced
comm -23 /tmp/refs.txt /tmp/present.txt   # referenced but missing — must be empty
```

`logo.png`, `profile.webp`, and `default-avatar-square-small.jpg` are referenced from components, not content, so they always appear "unreferenced" above. They are in use — do not delete them.

**Size ceiling:** GitHub Pages rejects deploy artifacts over 1GB. `public/images/` is ~176MB today and is the only directory that grows without bound. A large photo import is the most likely way to break the deploy.

---

## Before you commit

```sh
nvm use 22
npm run build     # must succeed — this is the real gate
npm run lint:md   # content markdown
```

Then verify nothing is dangling:

```sh
# every referenced image exists (must print nothing)
grep -rhoE '/images/[a-zA-Z0-9_./-]+' src/content/ | sort -u \
  | comm -23 - <(find public/images -type f | sed 's|^public||' | sort -u)

# every internal link resolves in the build (must print nothing but known gaps)
grep -rhoE 'href="/[^"#?]*"' dist/ | sed -E 's/href="(.*)"/\1/' | sort -u \
  | while read -r h; do [ -e "dist${h}" ] || [ -e "dist${h}/index.html" ] || echo "BROKEN: $h"; done
```

If you touched styles or components, load the site in both light and dark mode, and check `/design`.

---

## Commits and branches

- Branch from `main` as `feat/short-description` (matching existing history: `feat/site-redesign`, `feat/blog-toc-sidebar`).
- Commit subjects are **imperative, sentence case, no Conventional Commits prefixes** — matching history like `Add scroll-spy TOC sidebar to blog posts`, `Remove unreferenced blog images from Ghost migration`. Not `feat:` / `fix:`.
- Explain *why* in the body when the change isn't self-evident, especially for content deletions.
- AI-assisted commits carry a trailer, e.g.:

  ```text
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  ```

- Reference an [ISSUES.md](ISSUES.md) ID when a commit closes one (`Fixes SEO-1`), and move the entry to the Resolved table in the same commit.
- Open a PR into `main`. Merging to `main` deploys immediately — there is no staging environment.

---

## Deployment

`.github/workflows/deploy.yml` runs on every push to `main` (and via manual `workflow_dispatch`): checkout → Node 22 → `npm ci` → `npm run build` → upload `./dist` → deploy to GitHub Pages.

The custom domain lives in `public/CNAME`. CI builds from a clean checkout, so gitignored local files (`.DS_Store`, `dist/`) never reach production — but it also means **anything not committed will not deploy**, including images you only have locally.

---

## Editing prose

The posts are personal essays. `.markdownlint-cli2.jsonc` deliberately disables every rule that would rewrite prose — line length, heading style, emphasis-as-heading, ellipses in headings.

Fix structure; do not edit the author's wording. `npm run lint:md:fix` is not automatically safe on headings written in the author's voice — review its diff before accepting it.

# Issues and improvements

Running backlog of known problems and planned improvements for dodson.mba. This is the single source of truth for "what's wrong / what's next" — architecture and conventions live in [CLAUDE.md](CLAUDE.md), workflow in [CONTRIBUTING.md](CONTRIBUTING.md).

## Maintaining this file

- **Log it here when you find it.** Anything you notice but don't fix in the same change gets an entry, so it isn't rediscovered from scratch later.
- **IDs are stable and never reused.** New entries take the next number in their prefix. Reference them in commits and PRs (`Fixes PERF-2`).
- **Record the evidence, not just the claim.** Measured numbers and the command that produced them are the expensive part — keep them so the next person doesn't re-derive them.
- **When you fix something, move the entry to [Resolved](#resolved)** with the date and commit. Don't delete it; the history is why a decision looks the way it does.
- Priorities: **P1** user-visible breakage or major regression risk · **P2** meaningful quality/performance/SEO gain · **P3** hygiene and polish.

Measurements below were taken 2026-08-15 against the production build.

---

## Open

### P1

#### `CONTENT-1` — `/files/resume.pdf` 404s in production

The Experience page has a "Download resume" button pointing at a file that has never existed in git history. It is the only broken internal link in the entire build.

- **Where:** [src/pages/experience.astro](src/pages/experience.astro) — `<a href="/files/resume.pdf" download>`
- **Verify:** `curl -sI https://dodson.mba/files/resume.pdf` → 404
- **Fix:** add the real PDF at `public/files/resume.pdf`, or remove the button. Needs the actual document — cannot be resolved in code alone.

---

### P2

#### `PERF-1` — Images bypass Astro's image pipeline entirely

All 440 images live in `public/`, so `astro:assets` never processes them. They ship as original-resolution JPEGs with no modern formats and no responsive variants; a phone downloads the same 2000px file as a desktop.

- **Measured:** 435 JPEG/JPG, 4 PNG, 1 WebP. ~176MB total. Typical 2000×1333 at ~400KB, largest 1.5MB.
- **Per-page payload:** `/photos/tunisia` **31.7MB** (60 images) · `/photos/charleston-sc` 17.7MB (41) · `/photos/new-mexico` 13.4MB (31) · `/photos/seeds-colorado` 11.2MB (30)
- **Mitigation already in place:** `loading="lazy"` on 59/61 gallery images.
- **Fix:** move images to `src/assets/` and use `<Image>`/`<Picture>` for automatic AVIF/WebP + `srcset`. Large migration — every content path changes, and the `images:` arrays in `src/content/photos/*.md` must move to `image()` schema refs. Do it on its own branch.
- **Also fixes:** `CI-4` (artifact size).

#### `PERF-2` — No `width`/`height` on any image → layout shift

Zero `width=` or `height=` attributes sitewide, so every image reflows the page as it loads.

- **Measured:** 0 of 61 `<img>` on `/photos/tunisia` carry dimensions.
- **Fix:** cheapest Core Web Vitals win available, and **does not require `PERF-1`** — dimensions can be emitted from the source files at build time while images stay in `public/`.

#### `PERF-3` — Two render-blocking third-party stylesheets

`BaseLayout.astro` loads Google Fonts and Iconoir from jsDelivr in `<head>`. Both block first paint on a third-party connection.

- **Where:** [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro)
- **Detail:** Google Fonts has `preconnect`; **jsDelivr does not**. Iconoir is pinned to `@main`, a moving upstream target — the icon set can change without a commit here.
- **Fix:** self-host fonts via Fontsource and subset Iconoir to the ~10 icons actually used. Removes both third-party round trips and the `@main` risk together.

#### `A11Y-1` — Album photos cannot have alt text at all

The `photos` schema types `images` as `z.array(z.string())`, so there is nowhere to put alt text for the ~180 album photos. They all render `alt=""`.

- **Measured:** 183 empty `alt=""` across the built site.
- **Where:** [src/content.config.ts](src/content.config.ts)
- **Fix:** widen the schema to accept `string | { src: string; alt: string }` and keep plain strings working, then backfill alt text per album.

---

### P3

#### `SEO-3` — `og:image` serves the full-resolution original

Social cards point at the untouched 2000px source (up to 1.5MB). Scrapers want roughly 1200×630.

- **Fix:** generate a dedicated OG derivative. Naturally falls out of `PERF-1`.

#### `SEO-4` — No structured data

No JSON-LD anywhere. `BlogPosting` on posts and `Person` on the home page are the useful ones.

#### `A11Y-3` — Two components drop the alt text the schema already carries

`featureImageAlt` is authored per post but two components discard it, so images that carry meaning render with no accessible name.

- **Where:** [src/components/FeaturedSlider.astro](src/components/FeaturedSlider.astro) paints the feature image as a CSS `background-image` on a `<div>`, which has nowhere to put alt text. [src/components/PostList.astro](src/components/PostList.astro) renders `<img alt="">` literally, ignoring the field.
- **Context:** every other component (`ArticleCard`, `Hero`, `PhotoGallery`) does this correctly with `<img alt={featureImageAlt}>` — these two are the outliers, not the convention.
- **Fix:** decide per component whether the image is decorative (leave `alt=""`, and drop the unused field) or meaningful (switch the slider to a real `<img>`, and pass the field through in `PostList`). The slider change touches `m-featured-article__picture-bg` styling, so it is not a one-liner.
- Distinct from `A11Y-1`, which is about album photos having no schema field at all.

#### `CI-3` — No dependency automation, with advisories open

No dependabot or renovate config. `npm audit` currently reports 9 high-severity advisories (astro, esbuild, js-yaml, nanoid, devalue, immutable).

- **Note:** `npm audit fix` resolves them but bumps Astro, so it belongs in its own change with a full build verification.

#### `CI-4` — ~176MB artifact uploaded on every deploy

Upload and deploy dominate the ~50s workflow runtime. Resolved as a side effect of `PERF-1`.

#### `DX-2` — No formatter or linter outside Markdown

No prettier, eslint, stylelint, or `.editorconfig`. Markdown is the only linted format in a repo that is mostly Astro, TypeScript, and SCSS.

#### `CONTENT-3` — 10 pairs of byte-identical duplicate images

~5MB wasted. Each pair is the same photo referenced under two names, e.g. `DSC_0611.jpg` / `DSC_0611-1.jpg`, and `_DSC0008.jpg` present in both `2023/04/` and `2023/05/`.

- **Verify:** `find public/images -type f -exec md5 -q {} \; | sort | uniq -d`
- **Note:** both copies are referenced from content, so deduping means editing content references. Low value; bundle it into `PERF-1` rather than doing it alone.

#### `DX-3` — Swiper CSS loads on all 39 pages

4KB of slider CSS ships to pages with no slider (`/experience`, `/404`). The JS is correctly scoped and does not load.

---

## Resolved

| ID | Issue | Resolved | Commit |
| :--- | :--- | :--- | :--- |
| `SEO-1` | 27 of 29 posts shared one meta description; posts without `excerpt` now derive one from the body via `src/lib/summarize.ts` | 2026-08-15 | _pending_ |
| `SEO-2` | No sitemap, robots.txt, or RSS; added `@astrojs/sitemap` (excluding the `noindex` `/design`), `public/robots.txt`, and `/rss.xml` | 2026-08-15 | _pending_ |
| `CI-1` | No PR validation; added `.github/workflows/ci.yml` running check + lint + build on every PR into `main` | 2026-08-15 | _pending_ |
| `CI-2` | Nothing enforced type-checking; added `@astrojs/check` + `typescript` and `npm run check`, which found and fixed 2 real errors (`fuse.js` v7 namespace types, untyped `headroom.js`) | 2026-08-15 | _pending_ |
| `A11Y-2` | No skip-to-content link; added `.c-skip-link` and `id="main-content"` on all 8 page `<main>` landmarks | 2026-08-15 | _pending_ |
| `DX-1` | No `.nvmrc`; added one pinning Node 22, and both workflows now read the version from it | 2026-08-15 | _pending_ |
| `CONTENT-2` | 9 markdownlint findings blocking the new `CI-1` gate. `MD003`/`MD024`/`MD028` disabled with rationale, matching the existing precedent that rules which would rewrite prose are switched off; only `MD059` was fixed in prose (`[here]` → `[about LEED certification]`), being a real quality issue rather than a style preference | 2026-08-15 | _pending_ |
| `CONTENT-0` | 16 gallery photos 404ing in production after a cleanup pass scanned only `featureImage` and missed the `images:` arrays | 2026-08-15 | `e5bb55c` |
| `CONTENT-4` | Broken in-page anchor `#map` in the Tunisia post; heading id is `mapbox` | 2026-08-15 | `9db6657` |
| `DX-4` | Orphaned files (`logo.png` root duplicate, `no-image.png`, one-off `fix-content.mjs`, conflicting `.claude/launch.json`) and dead `updated` / `postType` schema fields | 2026-08-15 | `6a2530d` |
| `DX-5` | `markdownlint-cli2` configured but not installed or scripted; only reachable via `npx --yes` | 2026-08-15 | `bf7f197` |
| `DOC-1` | README documented non-existent `public/fonts/` and `public/grain.svg`, described `excerpt` wrongly, omitted the `images:` array, and gave un-runnable Ghost migration steps | 2026-08-15 | `c92ade4` |
| `DX-6` | `.claude/settings.json` carried hardcoded Windows paths and one-off command permissions from a prior machine | 2026-08-15 | `9efbc21` |

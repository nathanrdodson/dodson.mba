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

#### `SEO-1` — 27 of 29 posts share an identical meta description

Only 2 posts set `excerpt`, so the rest fall back to the site tagline. This propagates to `og:description` and `twitter:description`, making every shared post link look identical.

- **Measured:** 27 posts emit `"IT Director · Platform Engineer · MBA"`.
- **Verify:** `grep -h -oE '<meta name="description" content="[^"]*"' dist/blog/*/index.html | sort | uniq -c`
- **Fix:** in `BaseLayout.astro`, fall back to the first ~155 characters of the post body rather than the site default. Small change, disproportionate SEO payoff.

#### `SEO-2` — No sitemap, robots.txt, or RSS feed

None of `sitemap.xml`, `robots.txt`, `rss.xml` exist in the build. A photo/travel blog with no feed is the notable omission.

- **Fix:** add `@astrojs/sitemap` and `@astrojs/rss`; commit a `public/robots.txt` pointing at the sitemap.

#### `CI-1` — No PR validation; a broken build is discovered in production

`deploy.yml` triggers only on `push` to `main` and `workflow_dispatch`. Merging to `main` deploys immediately, so nothing verifies a change before it is live.

- **Where:** [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- **Fix:** add a `pull_request` trigger running `npm run build` and `npm run lint:md`. Highest-value CI change; blocks the class of failure the rest of this list keeps producing.

#### `CI-2` — Nothing enforces linting or type-checking

`tsconfig.json` extends `astro/tsconfigs/strict`, but no type check has ever run — `@astrojs/check` and `typescript` are not installed. `lint:md` exists but no workflow calls it.

- **Fix:** install `@astrojs/check` + `typescript`, add `npm run check`, and run it alongside the build in `CI-1`.

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

#### `CI-3` — No dependency automation, with advisories open

No dependabot or renovate config. `npm audit` currently reports 9 high-severity advisories (astro, esbuild, js-yaml, nanoid, devalue, immutable).

- **Note:** `npm audit fix` resolves them but bumps Astro, so it belongs in its own change with a full build verification.

#### `CI-4` — ~176MB artifact uploaded on every deploy

Upload and deploy dominate the ~50s workflow runtime. Resolved as a side effect of `PERF-1`.

#### `DX-1` — No `.nvmrc`

Node 22.12+ is a hard requirement documented as a trap in three places, but nothing pins it — `nvm use` alone picks the machine default (currently Node 18, which hard-aborts the build).

- **Fix:** one-line `.nvmrc` containing `22`. Best effort-to-value ratio in this file.

#### `DX-2` — No formatter or linter outside Markdown

No prettier, eslint, stylelint, or `.editorconfig`. Markdown is the only linted format in a repo that is mostly Astro, TypeScript, and SCSS.

#### `A11Y-2` — No skip-to-content link

No skip link on any page, so keyboard users traverse the full header and nav on every navigation.

#### `CONTENT-2` — 9 markdownlint findings in post prose

`npm run lint:md` reports 9 issues across 4 posts: setext headings in `charleston-sc.md`, a duplicate heading in `its-been-a-while-airport.md`, non-descriptive `[here]` link text and 5 blockquote-spacing warnings in `seeds-leadership-2022.md`.

- **Deliberately unfixed.** These are personal essays and the lint config exists for structural hygiene, not prose editing. Fix only with the author's sign-off — `lint:md:fix` is not automatically safe here.

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
| `CONTENT-0` | 16 gallery photos 404ing in production after a cleanup pass scanned only `featureImage` and missed the `images:` arrays | 2026-08-15 | `e5bb55c` |
| `CONTENT-4` | Broken in-page anchor `#map` in the Tunisia post; heading id is `mapbox` | 2026-08-15 | `9db6657` |
| `DX-4` | Orphaned files (`logo.png` root duplicate, `no-image.png`, one-off `fix-content.mjs`, conflicting `.claude/launch.json`) and dead `updated` / `postType` schema fields | 2026-08-15 | `6a2530d` |
| `DX-5` | `markdownlint-cli2` configured but not installed or scripted; only reachable via `npx --yes` | 2026-08-15 | `bf7f197` |
| `DOC-1` | README documented non-existent `public/fonts/` and `public/grain.svg`, described `excerpt` wrongly, omitted the `images:` array, and gave un-runnable Ghost migration steps | 2026-08-15 | `c92ade4` |
| `DX-6` | `.claude/settings.json` carried hardcoded Windows paths and one-off command permissions from a prior machine | 2026-08-15 | `9efbc21` |

# dodson.mba

Personal site for Nathan Dodson. Built with [Astro](https://astro.build) and SCSS, derived from the Ghost theme [nrdliebling](https://github.com/nathanrdodson/nrdliebling). Content lives in Markdown — no CMS, no database.

**Requires Node >=22.12.** Use `nvm use 22` before running any commands.

- [CONTRIBUTING.md](CONTRIBUTING.md) — setup, how to add posts and albums, conventions, pre-commit checks
- [CLAUDE.md](CLAUDE.md) — architecture notes and guardrails for AI agents working in this repo
- [ISSUES.md](ISSUES.md) — known problems and planned improvements, with a resolved log

---

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via `.github/workflows/deploy.yml`. The workflow:

1. Installs Node 22 and runs `npm ci`
2. Builds the site to `./dist/`
3. Uploads the artifact and deploys via the GitHub Pages environment

The custom domain `dodson.mba` is configured in `public/CNAME`. To enable GitHub Pages for the first time, go to **Settings → Pages** in the repository and set the source to **GitHub Actions**.

> **Artifact size.** GitHub Pages rejects artifacts over 1GB. `public/images/` is ~176MB today, but it is the only part of the repo with room to grow unbounded — adding a large batch of photos is the thing most likely to break the deploy.

---

## Commands

| Command               | Action                                     |
| :-------------------- | :----------------------------------------- |
| `npm run dev`         | Start dev server at `localhost:4321`       |
| `npm run build`       | Build to `./dist/`                         |
| `npm run preview`     | Preview production build locally           |
| `npm run lint:md`     | Lint content Markdown                      |
| `npm run lint:md:fix` | Autofix the structural Markdown lint rules |

Markdown lint config is in `.markdownlint-cli2.jsonc`, scoped to `src/content/**/*.md`. Rules that would rewrite prose (line length, heading style in the author's voice) are deliberately off — the goal is structural hygiene, not editing the writing.

---

## Pages

| Route            | Source                           | Notes                                            |
| :--------------- | :------------------------------- | :----------------------------------------------- |
| `/`              | `src/pages/index.astro`          | Home — bio hero, featured slider, recent posts   |
| `/blog`          | `src/pages/blog/index.astro`     | Post listing                                     |
| `/blog/[slug]`   | `src/pages/blog/[...slug].astro` | Post detail with TOC + reading progress          |
| `/photos`        | `src/pages/photos/index.astro`   | Gallery index                                    |
| `/photos/[slug]` | `src/pages/photos/[slug].astro`  | Individual album                                 |
| `/experience`    | `src/pages/experience.astro`     | Career timeline                                  |
| `/design`        | `src/pages/design.astro`         | Design system reference — **live in production** |
| `/404`           | `src/pages/404.astro`            |                                                  |
| `/search.json`   | `src/pages/search.json.ts`       | Fuse.js index consumed by header search          |

### The `/design` page

`/design` is a real, publicly reachable page at <https://dodson.mba/design/>. It renders the live color tokens, type scale, and every shared component against real content pulled from the collections, with a stable `SECTION-NN` reference code on each swatch.

It is not linked from the site nav, but it is **not** a scratch page — treat it as production. When you change a design token, add a component, or alter component markup, update `/design` in the same commit so it keeps reflecting what the site actually looks like.

---

## Content

### Blog posts — `src/content/blog/`

Each post is a `.md` file. Frontmatter schema (defined in `src/content.config.ts`):

```yaml
---
title: "Post Title"
date: 2024-06-15          # YYYY-MM-DD
excerpt: "One-line summary."  # optional — meta description + search index
featureImage: "/images/blog/2024/06/my-photo.jpg"  # optional
featureImageAlt: "Alt text"                          # optional
featureImageCaption: "Caption shown below hero"      # optional
tags: ["travel", "New Mexico 2021"]                  # optional
featured: true            # optional — pins to featured slider
draft: true               # optional — hides from listings
---

Post content here.
```

`excerpt` is used for the page's `<meta name="description">` and the search index — **not** for listing cards, which derive their preview from the post body.

Tag convention: the trip/series tag first (`"Tunisia 2023"`, `"New Mexico 2021"` — title case), then lowercase topic tags (`travel`, `photography`, `hiking`, `national parks`, `wildlife`, `conservation`, `essays`).

### Photo gallery — `src/content/photos/`

Each album is a `.md` file:

```yaml
---
title: "New Mexico"
date: 2021-05-15
featureImage: /images/blog/2021/12/newmexico2021-2-01.jpg  # album cover
featureImageAlt: "New Mexico 2021"
order: 4                  # controls sort order in the gallery index
images:                   # every photo in the album, in display order
  - /images/blog/2021/12/newmexico2021-1-02.jpg
  - /images/blog/2021/12/newmexico2021-1-11.jpg
---

Optional caption or blurb.
```

The `images:` array is what actually populates the album page. It is easy to miss when auditing which files are in use — see [Images](#images) below.

### About bio — `src/content/about/index.md`

Rendered into the home page hero. Plain Markdown, no frontmatter needed.

---

## Images

| Location                                        | Purpose                                                           |
| :---------------------------------------------- | :---------------------------------------------------------------- |
| `public/images/blog/`                           | Blog and gallery images (year/month subdirs, migrated from Ghost) |
| `public/images/photos/`                         | Photo gallery images                                              |
| `public/images/logo.png`                        | Site logo (header)                                                |
| `public/images/profile.webp`                    | Profile / Open Graph image                                        |
| `public/images/default-avatar-square-small.jpg` | Featured slider fallback avatar                                   |

> **Before deleting "unused" images, check the `images:` arrays in `src/content/photos/`.** A prior cleanup pass scanned only `featureImage` fields and deleted 16 gallery photos that were live on the site. To find genuinely unreferenced files, match against every `/images/...` path in `src/content/`, not just frontmatter cover images:
>
> ```sh
> grep -rhoE '/images/[a-zA-Z0-9_./-]+' src/content/ | sort -u > /tmp/refs.txt
> find public/images -type f | sed 's|^public||' | sort -u > /tmp/present.txt
> comm -13 /tmp/refs.txt /tmp/present.txt   # present but never referenced
> comm -23 /tmp/refs.txt /tmp/present.txt   # referenced but missing — should be empty
> ```

---

## Icons

Icons are [Iconoir](https://iconoir.com), loaded as a stylesheet from jsDelivr in `src/layouts/BaseLayout.astro` and used as `<i class="iconoir-github">`. The URL is pinned to the `@main` branch, so the icon set can change upstream without a commit here.

---

## Ghost migration (historical)

29 posts and 2,934 images were imported from a Ghost CMS export by `scripts/migrate-ghost.py`. **This has already been run and cannot be re-run** — it reads a `ghost-to-md-output/` export directory that is not part of this repository. The script is kept as a record of how the content was transformed:

- Converts Ghost frontmatter to the Astro schema
- Cleans tags (strips `#` prefixes, drops internal Ghost tags)
- Replaces `__GHOST_URL__/content/images/` paths with `/images/blog/`
- Extracts the first image in each post as `featureImage`
- Copies all images to `public/images/blog/`
- Skips stub, hidden, and junk posts

---

## Structure

```text
.github/
└── workflows/
    └── deploy.yml   GitHub Pages deployment (triggers on push to main)
src/
├── components/      Astro components
├── content/
│   ├── blog/        Blog posts (.md)
│   ├── photos/      Photo gallery albums (.md)
│   └── about/       Bio shown on home page
├── content.config.ts  Collection schemas
├── layouts/
│   └── BaseLayout.astro
├── lib/             Build-time helpers (reading time, card art, rehype plugins)
├── pages/           Routes
├── scripts/         Client-side TypeScript
└── styles/          SCSS (BEM, theme variables)
public/
├── images/          All images
├── CNAME            Custom domain (dodson.mba)
├── favicon.ico
└── favicon.svg
scripts/
└── migrate-ghost.py  Ghost CMS → Astro migration (historical, not re-runnable)
.markdownlint-cli2.jsonc  Content Markdown lint config
```

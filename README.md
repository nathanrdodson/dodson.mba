# dodson.mba

Personal site for Nathan Dodson. Built with [Astro](https://astro.build) and SCSS, derived from the Ghost theme [nrdliebling](https://github.com/nathanrdodson/nrdliebling). Content lives in Markdown — no CMS, no database.

**Requires Node >=22.** Use `nvm use 22` before running any commands.

---

## Commands

| Command         | Action                                  |
| :-------------- | :-------------------------------------- |
| `npm run dev`   | Start dev server at `localhost:4321`    |
| `npm run build` | Build to `./dist/`                      |
| `npm run preview` | Preview production build locally      |

---

## Content

### Blog posts — `src/content/blog/`

Each post is a `.md` file. Frontmatter schema:

```yaml
---
title: "Post Title"
date: 2024-06-15          # YYYY-MM-DD
excerpt: "One-line summary shown in listings."
featureImage: "/images/blog/2024/06/my-photo.jpg"  # optional
featureImageAlt: "Alt text"                          # optional
featureImageCaption: "Caption shown below hero"      # optional
tags: ["travel", "New Mexico 2021"]                  # optional
featured: true            # optional — pins to featured slider
draft: true               # optional — hides from listings
---

Post content here.
```

### Photo gallery — `src/content/photos/`

Each entry is a `.md` file:

```yaml
---
title: "Flint Hills"
date: 2024-06-15
featureImage: /images/photos/flint-hills.jpg
featureImageAlt: "Rolling tallgrass prairie at golden hour"
order: 1                  # controls sort order in gallery
---

Optional caption or blurb.
```

Photo images go in `public/images/photos/`.

### About bio — `src/content/about/index.md`

Rendered into the home page hero. Plain Markdown, no frontmatter needed.

---

## Images

| Location | Purpose |
| :--- | :--- |
| `public/images/blog/` | Blog post images (year/month subdirs, migrated from Ghost) |
| `public/images/photos/` | Photo gallery images |
| `public/images/` | Site assets (logo, avatar, fallbacks) |

---

## Ghost migration

29 posts and 2,934 images were imported from the Ghost CMS export in `ghost-to-md-output/`. To re-run:

```sh
python3 scripts/migrate-ghost.py
```

The script:
- Converts Ghost frontmatter to Astro schema
- Cleans tags (strips `#` prefixes, drops internal Ghost tags)
- Replaces `__GHOST_URL__/content/images/` paths with `/images/blog/`
- Extracts the first image in each post as `featureImage`
- Copies all images to `public/images/blog/`
- Skips stub, hidden, and junk posts

---

## Structure

```
src/
├── components/      Astro components
├── content/
│   ├── blog/        Blog posts (.md)
│   ├── photos/      Photo gallery entries (.md)
│   └── about/       Bio shown on home page
├── layouts/
│   └── BaseLayout.astro
├── pages/           Routes
├── scripts/         Client-side TypeScript
└── styles/          SCSS (BEM, theme variables)
public/
├── fonts/           icomoon icon font
├── images/          All images
└── grain.svg
scripts/
└── migrate-ghost.py Ghost CMS → Astro migration
```

#!/usr/bin/env python3
"""
Migrate Ghost CMS markdown exports to Astro content format.

- Cleans frontmatter (date_published → date, removes slug/date_updated)
- Normalises tags (strips Ghost # prefixes, drops internal tags)
- Replaces __GHOST_URL__/content/images/ → /images/blog/
- Extracts first image as featureImage
- Skips junk/hidden/stub posts
- Copies images to public/images/blog/
"""

import os
import re
import shutil
import sys
from pathlib import Path
from datetime import datetime, timezone

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
SRC  = ROOT / "ghost-to-md-output"
IMG_SRC  = SRC / "images"
IMG_DEST = ROOT / "public" / "images" / "blog"
POST_DEST = ROOT / "src" / "content" / "blog"

# ── Posts to skip entirely ─────────────────────────────────────────────────────
SKIP_SLUGS = {
    "insert-title-here",   # test post
    "this-is-my-post",     # test post ("I masdasda")
    "nathan",              # hidden about/start page
    "i-am-nathan-d",       # stub "Welcome!" tech page
    "resume",              # just a horizontal rule
    "photography",         # hidden blurb page
    "the-danger-of-banned-books",  # draft with content "null"
}

# ── Tag normalisation ──────────────────────────────────────────────────────────
DROP_TAGS = {"#site", "#hidden", "#photo-blurb"}

TAG_MAP = {
    "#travel blog": "travel",
    "#photo-gallery": "photography",
    "#blog": "blog",
    # keep series tags as-is after stripping #
}

def clean_tags(raw: str) -> list[str]:
    if not raw:
        return []
    parts = [t.strip() for t in raw.split(",") if t.strip()]
    result = []
    for tag in parts:
        if tag in DROP_TAGS:
            continue
        if tag in TAG_MAP:
            result.append(TAG_MAP[tag])
        elif tag.startswith("#"):
            result.append(tag[1:])  # strip leading #
        else:
            result.append(tag)
    # dedupe preserving order
    seen = set()
    out = []
    for t in result:
        if t not in seen:
            seen.add(t)
            out.append(t)
    return out

# ── Image path replacement ─────────────────────────────────────────────────────
GHOST_IMG_RE = re.compile(r'__GHOST_URL__/content/images/')

def fix_image_paths(content: str) -> str:
    return GHOST_IMG_RE.sub('/images/blog/', content)

# ── Extract first image URL from body ─────────────────────────────────────────
IMG_MD_RE = re.compile(r'!\[.*?\]\((/images/blog/[^\)]+)\)')

def extract_feature_image(body: str) -> str | None:
    m = IMG_MD_RE.search(body)
    return m.group(1) if m else None

# ── Parse Ghost frontmatter ────────────────────────────────────────────────────
FM_RE = re.compile(r'^---\n(.*?)\n---\n?(.*)', re.DOTALL)

def parse_fm(text: str) -> tuple[dict, str]:
    m = FM_RE.match(text)
    if not m:
        return {}, text
    fm_raw, body = m.group(1), m.group(2)
    fm: dict = {}
    # simple key: value parser (handles multi-word values, no nested yaml needed)
    for line in fm_raw.splitlines():
        if ": " in line:
            k, v = line.split(": ", 1)
            fm[k.strip()] = v.strip()
        elif line.endswith(":"):
            fm[line[:-1].strip()] = ""
    return fm, body.lstrip("\n")

# ── Build Astro frontmatter string ─────────────────────────────────────────────
def fmt_tags(tags: list[str]) -> str:
    if not tags:
        return "[]"
    escaped = [f'"{t}"' for t in tags]
    return "[" + ", ".join(escaped) + "]"

def build_fm(fields: dict) -> str:
    lines = ["---"]
    for k, v in fields.items():
        if v is None:
            continue
        lines.append(f"{k}: {v}")
    lines.append("---")
    return "\n".join(lines)

# ── Process a single file ──────────────────────────────────────────────────────
def process(src_path: Path) -> str | None:
    text = src_path.read_text(encoding="utf-8")
    fm, body = parse_fm(text)

    slug = fm.get("slug", "")
    if slug in SKIP_SLUGS:
        return f"  SKIP  {src_path.name} (slug in skip list)"

    # Skip null/empty body stubs
    if body.strip() in ("", "null", "---"):
        return f"  SKIP  {src_path.name} (empty body)"

    # Parse date
    raw_date = fm.get("date_published", "")
    try:
        dt = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
        # skip epoch-0 drafts that were never published (treat as draft)
        is_epoch = dt.year < 2000
    except Exception:
        dt = None
        is_epoch = False

    if is_epoch and fm.get("draft", "").lower() != "true":
        # mark as draft if date is clearly placeholder
        fm["draft"] = "true"

    if dt and not is_epoch:
        date_str = dt.strftime("%Y-%m-%d")
    elif is_epoch:
        date_str = "2000-01-01"
    else:
        date_str = "2000-01-01"

    # Tags
    tags = clean_tags(fm.get("tags", ""))

    # Fix image paths in body
    body = fix_image_paths(body)

    # Feature image — first image in body
    feature_image = extract_feature_image(body)

    # Build Astro frontmatter
    astro_fm: dict = {}
    raw_title = fm.get("title", "Untitled").replace('"', "'")
    astro_fm["title"] = f'"{raw_title}"'
    astro_fm["date"] = date_str
    if feature_image:
        astro_fm["featureImage"] = f'"{feature_image}"'
    if fm.get("excerpt"):
        astro_fm["excerpt"] = f'"{fm["excerpt"].replace(chr(34), chr(39))}"'
    if tags:
        astro_fm["tags"] = fmt_tags(tags)
    if fm.get("draft", "").lower() == "true":
        astro_fm["draft"] = "true"

    # Determine output filename — use slug from frontmatter for clean URLs
    out_name = slug if slug else src_path.stem
    # strip any date prefix if slug is clean
    out_path = POST_DEST / f"{out_name}.md"

    out_text = build_fm(astro_fm) + "\n\n" + body

    out_path.write_text(out_text, encoding="utf-8")
    return f"  OK    {out_path.name}"

# ── Copy images ────────────────────────────────────────────────────────────────
def copy_images():
    copied = 0
    skipped = 0
    for src_file in IMG_SRC.rglob("*"):
        if not src_file.is_file():
            continue
        if src_file.name.startswith("."):
            continue
        rel = src_file.relative_to(IMG_SRC)
        dest = IMG_DEST / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists():
            shutil.copy2(src_file, dest)
            copied += 1
        else:
            skipped += 1
    return copied, skipped

# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    POST_DEST.mkdir(parents=True, exist_ok=True)
    IMG_DEST.mkdir(parents=True, exist_ok=True)

    print("── Copying images ────────────────────────────────────────")
    copied, skipped = copy_images()
    print(f"  Copied {copied} images, skipped {skipped} already-existing")

    print("\n── Migrating posts ───────────────────────────────────────")
    md_files = sorted(SRC.glob("*.md"))
    for f in md_files:
        result = process(f)
        if result:
            print(result)

    print("\nDone.")

if __name__ == "__main__":
    main()

/**
 * Derives a plain-text summary from a Markdown body, for use as a meta
 * description when a post sets no explicit `excerpt`.
 *
 * Only 2 of 29 posts set `excerpt`, so without this every other post inherited
 * the site tagline and all 27 shared one meta/og/twitter description — every
 * shared link looked identical. See `SEO-1` in ISSUES.md.
 *
 * This is intentionally a regex strip rather than a real Markdown parse: the
 * output is a ~155-character description, never rendered as markup, so the cost
 * of a full AST pass at build time buys nothing.
 */

/** Google truncates around 155–160 characters; stay just under. */
const DEFAULT_MAX_LENGTH = 155;

const ELLIPSIS = '…';

function stripMarkdown(markdown: string): string {
  return (
    markdown
      // Fenced code and inline code carry no descriptive value.
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/~~~[\s\S]*?~~~/g, ' ')
      .replace(/`[^`\n]*`/g, ' ')
      // Images before links — the `![alt](src)` form would otherwise leave a
      // stray `!` behind once the link rule ran.
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Raw HTML, including the <figure>/<figcaption> the Ghost-era posts carry.
      .replace(/<[^>]+>/g, ' ')
      // Block-level markers, line-anchored so mid-sentence hyphens survive.
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/^\s{0,3}>\s?/gm, '')
      .replace(/^\s{0,3}(?:[-*_]\s*){3,}$/gm, ' ')
      .replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, '')
      // Emphasis and strikethrough markers.
      .replace(/(\*\*|__|~~)/g, '')
      .replace(/(?<![\w*_])[*_](?=\S)/g, '')
      .replace(/(?<=\S)[*_](?![\w*_])/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Truncates at a word boundary so the description never ends mid-word.
 * Falls back to a hard cut for text with no spaces in range.
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Reserve one character for the ellipsis.
  const clipped = text.slice(0, maxLength - 1);
  const lastSpace = clipped.lastIndexOf(' ');
  const stem = lastSpace > maxLength * 0.5 ? clipped.slice(0, lastSpace) : clipped;

  return `${stem.replace(/[,;:.!?—–-]+$/, '')}${ELLIPSIS}`;
}

export function summarize(markdown: string, maxLength: number = DEFAULT_MAX_LENGTH): string {
  return truncate(stripMarkdown(markdown), maxLength);
}

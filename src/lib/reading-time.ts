/**
 * Estimated read time in whole minutes, derived from raw markdown body text.
 * 200 wpm is the usual prose reading rate; floor of 1 so nothing reads "0 min".
 */
export function readingMinutes(body: string | undefined): number {
  if (!body) return 1;

  const words = body
    // Drop frontmatter-ish leftovers, code fences, and image/link syntax so the
    // count reflects prose rather than markup.
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`~-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.round(words / 200));
}

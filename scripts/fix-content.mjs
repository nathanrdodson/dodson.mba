/**
 * One-off content pass over src/content/blog:
 *   1. Fills empty image alt text (MD045) using the post's own title as context.
 *   2. Normalises the tag vocabulary across every post.
 *
 * Body prose is never touched — only the alt slot inside `![]( )` and the `tags:`
 * frontmatter line.
 *
 * Run: node scripts/fix-content.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'src/content/blog';

// Normalised taxonomy: trip/series tag first, then topics.
const TAGS = {
  'always-take-the-high-road': ['New Mexico 2021', 'travel', 'photography'],
  'atalaya-upper-mountain-trail': ['New Mexico 2021', 'travel', 'hiking', 'photography'],
  atx: ['Texas 2022', 'travel', 'photography'],
  'bandelier-national-monument': ['New Mexico 2021', 'travel', 'national parks', 'photography'],
  'beni-kedeche-and-ksar': ['Tunisia 2023', 'travel', 'photography'],
  'charleston-sc': ['Charleston 2022', 'travel', 'photography'],
  'day-1-in-granada-espana': ['Europe 2019', 'travel', 'photography'],
  'ethical-considerations-in-haiku': ['essays'],
  'eureka-springs-arkansas': ['Arkansas 2022', 'travel', 'photography'],
  'first-few-days-in-the-uk': ['Europe 2019', 'travel', 'photography'],
  'georgia-okeefes-ghost-ranch': ['New Mexico 2021', 'travel', 'photography'],
  'gightis-ruins-and-red-skies': ['Tunisia 2023', 'travel', 'photography'],
  'grand-canyon-national-park': ['Southwest 2018', 'travel', 'national parks', 'photography'],
  'in-colorado-with-seeds': ['SEEDS 2022', 'conservation', 'travel', 'photography'],
  'in-the-air': ['Europe 2019', 'travel', 'photography'],
  'introducing-uromastix': ['Tunisia 2023', 'wildlife', 'photography'],
  'its-been-a-while-airport': ['New Mexico 2021', 'travel', 'photography'],
  'juneau-and-tracy-arm': ['Alaska 2018', 'travel', 'photography'],
  'ketchikan-alaska': ['Alaska 2018', 'travel', 'photography'],
  'landed-in-spain': ['Europe 2019', 'travel', 'photography'],
  'mci-to-mdw': ['Charleston 2022', 'travel', 'photography'],
  'meeting-anwer': ['Tunisia 2023', 'travel', 'photography'],
  more: ['Tunisia 2023', 'wildlife', 'photography'],
  'normal-people': ['essays'],
  'seeds-leadership-2022': ['SEEDS 2022', 'conservation', 'photography'],
  'the-university-of-gabes': ['Tunisia 2023', 'travel', 'photography'],
  'tune-up-cafe': ['New Mexico 2021', 'travel', 'photography'],
  'tunisias-arid-ecosystems': ['Tunisia 2023', 'wildlife', 'travel', 'photography'],
  'zion-national-park': ['Southwest 2018', 'travel', 'national parks', 'hiking', 'photography'],
};

let altFilled = 0;
let tagsSet = 0;

for (const file of readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
  const slug = file.replace(/\.md$/, '');
  const path = join(DIR, file);
  let src = readFileSync(path, 'utf8');

  const fmEnd = src.indexOf('\n---', 4);
  let front = src.slice(0, fmEnd + 4);
  let body = src.slice(fmEnd + 4);

  // ── Alt text ───────────────────────────────────────────────────────────────
  // Derived from the post title. Deliberately contextual rather than descriptive:
  // inventing specifics for photos we cannot inspect would put inaccurate
  // descriptions in front of screen-reader users, which is worse than none.
  const titleMatch = front.match(/^title:\s*(.+)$/m);
  const title = (titleMatch?.[1] ?? slug)
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/[[\]]/g, '')
    .trim();

  body = body.replace(/!\[\]\(/g, () => {
    altFilled++;
    return `![${title}](`;
  });

  // ── Tags ───────────────────────────────────────────────────────────────────
  const tags = TAGS[slug];
  if (tags) {
    const line = `tags: [${tags.map((t) => `"${t}"`).join(', ')}]`;
    front = /^tags:.*$/m.test(front)
      ? front.replace(/^tags:.*$/m, line)
      : front.replace(/^(date:.*)$/m, `$1\n${line}`);
    tagsSet++;
  }

  writeFileSync(path, front + body);
}

console.log(`alt text filled: ${altFilled}`);
console.log(`posts tagged:    ${tagsSet}`);

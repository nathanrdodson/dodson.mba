import { hashString } from './seed';

/**
 * Deterministic generative artwork for posts with no feature image.
 *
 * Drawn as loose contour lines — a hand-struck, topographic feel that reuses the
 * line motif running through the rest of the site, rather than the geometric circles
 * this used to produce. The same post always resolves to the same composition, so
 * the art is stable across builds and no two posts look alike.
 *
 * Variation comes from line count, drift and tone; the palette holds to the single
 * ink accent so these never become the loudest thing on the page.
 */

// Neutral hue anchors — sand, bone, olive, sage, eucalyptus, slate, blue-grey,
// lavender-grey, clay and rose-grey. Held at very low saturation and high lightness so
// each reads as a tinted paper stock rather than as a second accent colour.
const NEUTRAL_HUES = [12, 30, 48, 82, 120, 168, 200, 224, 258, 340];

export interface CardArt {
  angle: number;
  from: string;
  to: string;
  paths: string[];
}

// Small deterministic PRNG (Lehmer). Seeded per post so the drawing is reproducible.
function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export function cardArt(id: string): CardArt {
  const seed = hashString(id);
  const rand = seededRandom(seed);

  const angle = 20 + (seed % 8) * 20;

  // Pick a neutral anchor, then let the second stop drift a little off it so the wash
  // is a soft two-tone rather than a flat fill.
  const hueA = NEUTRAL_HUES[seed % NEUTRAL_HUES.length];
  const hueB = (hueA + 12 + ((seed >> 6) % 30)) % 360;

  const from = `hsl(${hueA} ${9 + (seed % 8)}% ${86 + (seed % 5)}%)`;
  const to = `hsl(${hueB} ${6 + ((seed >> 2) % 7)}% ${93 + ((seed >> 5) % 4)}%)`;

  // Contour lines drawn well past the edges so they read as a slice of a larger
  // field rather than as strokes floating inside a box.
  const count = 5 + Math.floor(rand() * 4);
  const spacing = 100 / (count + 1);
  const paths: string[] = [];

  for (let i = 0; i < count; i++) {
    const baseY = spacing * (i + 1) + (rand() - 0.5) * 6;
    const amp = 5 + rand() * 12;
    let d = `M -10 ${(baseY + (rand() - 0.5) * amp).toFixed(1)}`;

    for (let x = 8; x <= 110; x += 17) {
      const cx = (x - 8).toFixed(1);
      const cy = (baseY + (rand() - 0.5) * amp * 2).toFixed(1);
      const y = (baseY + (rand() - 0.5) * amp).toFixed(1);
      d += ` Q ${cx} ${cy}, ${x} ${y}`;
    }

    paths.push(d);
  }

  return { angle, from, to, paths };
}

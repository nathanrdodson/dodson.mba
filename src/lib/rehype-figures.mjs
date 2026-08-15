/**
 * Rehype plugin: promote inline images to <figure>, and same-line trailing text to
 * <figcaption>.
 *
 * The Ghost export left captions on the same line as their image, so markdown emits
 * `<p><img>Caption text</p>` — the caption is a bare text node inside the image's
 * paragraph, visually identical to body copy and impossible to target with CSS.
 * Rewriting at render time fixes every post at once without editing any prose.
 *
 * The distinction that matters: markdown folds consecutive lines into one paragraph,
 * so an image is in the same <p> as the prose that follows it on the *next* line.
 * Only text on the *same* line is a caption, and that text is the part before the
 * first newline. Everything after it is body copy and goes back into a paragraph.
 *
 *   ![](a.jpg)A caption          -> <figure><img><figcaption>A caption</figcaption>
 *   ![](a.jpg)\nBody prose       -> <figure><img></figure><p>Body prose</p>
 */

const isImg = (n) => n.type === 'element' && n.tagName === 'img';
const isBlank = (n) => n.type === 'text' && !n.value.trim();
const hasContent = (nodes) => nodes.some((n) => !isBlank(n));

// A handful of posts run full paragraphs onto the image's line, which the source
// gives no way to distinguish from a caption. Anything past this length is treated
// as body copy — real captions in this content are all well under it.
const MAX_CAPTION_LENGTH = 180;

const textLength = (nodes) =>
  nodes.reduce(
    (n, node) =>
      n + (node.type === 'text' ? node.value.length : (node.children?.length ?? 0) * 8),
    0,
  );

/**
 * Split the nodes trailing an image into caption (same line) and body (after the
 * first newline).
 */
function splitCaption(following) {
  const caption = [];
  const rest = [];
  let inRest = false;

  for (const node of following) {
    if (inRest) {
      rest.push(node);
      continue;
    }

    if (node.type !== 'text') {
      // Inline markup (<em>, <a>…) on the same line still belongs to the caption.
      caption.push(node);
      continue;
    }

    const nl = node.value.indexOf('\n');
    if (nl === -1) {
      caption.push(node);
      continue;
    }

    const before = node.value.slice(0, nl);
    const after = node.value.slice(nl).replace(/^\n+/, '');
    if (before.trim()) caption.push({ type: 'text', value: before });
    if (after) rest.push({ type: 'text', value: after });
    inRest = true;
  }

  return { caption, rest };
}

function transformParagraph(node) {
  if (node.tagName !== 'p' || !node.children?.some(isImg)) return null;

  // Split the paragraph's children into segments, each starting at an image.
  const segments = [];
  let current = { img: null, following: [] };

  for (const child of node.children) {
    if (isImg(child)) {
      segments.push(current);
      current = { img: child, following: [] };
    } else {
      current.following.push(child);
    }
  }
  segments.push(current);

  const asParagraph = (children) => ({ ...node, children });
  const out = [];

  for (const seg of segments) {
    if (!seg.img) {
      // Text preceding the first image stays a paragraph.
      if (hasContent(seg.following)) out.push(asParagraph(seg.following));
      continue;
    }

    let { caption, rest } = splitCaption(seg.following);

    // Too long to be a caption — hand it back to the body.
    if (textLength(caption) > MAX_CAPTION_LENGTH) {
      rest = [...caption, ...rest];
      caption = [];
    }

    out.push({
      type: 'element',
      tagName: 'figure',
      properties: { className: ['m-figure'] },
      children: hasContent(caption)
        ? [
            seg.img,
            {
              type: 'element',
              tagName: 'figcaption',
              properties: { className: ['m-figure__caption'] },
              children: caption,
            },
          ]
        : [seg.img],
    });

    if (hasContent(rest)) out.push(asParagraph(rest));
  }

  return out;
}

function walk(node) {
  if (!Array.isArray(node.children)) return;

  const next = [];
  for (const child of node.children) {
    if (child.type === 'element') {
      const replaced = transformParagraph(child);
      if (replaced) {
        next.push(...replaced);
        continue;
      }
      walk(child);
    }
    next.push(child);
  }
  node.children = next;
}

export default function rehypeFigures() {
  return (tree) => walk(tree);
}

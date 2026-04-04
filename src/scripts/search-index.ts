import Fuse from 'fuse.js/min-basic';

interface SearchItem {
  title: string;
  excerpt: string;
  tags: string[];
  url: string;
  date: string;
}

const fuseOptions: Fuse.IFuseOptions<SearchItem> = {
  shouldSort: true,
  ignoreLocation: true,
  findAllMatches: true,
  includeScore: true,
  minMatchCharLength: 2,
  keys: ['title', 'excerpt', 'tags'],
};

let fuse: Fuse<SearchItem> | null = null;

export async function initSearch(): Promise<void> {
  if (fuse) return;
  try {
    const res = await fetch('/search.json');
    const posts: SearchItem[] = await res.json();
    fuse = new Fuse(posts, fuseOptions);
  } catch (err) {
    console.error('Search index failed to load:', err);
  }
}

export function searchPosts(query: string): SearchItem[] {
  if (!fuse) return [];
  return fuse
    .search(query)
    .filter((r) => (r.score ?? 1) <= 0.5)
    .map((r) => r.item);
}

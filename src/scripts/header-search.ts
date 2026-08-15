// Inline header search: the icon expands a field in place, results drop below it.
// Replaces the old full-screen modal.

import { initSearch, searchPosts } from './search-index';

const MIN_QUERY = 2;
const MAX_RESULTS = 8;

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(document.documentElement.lang || 'en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Result titles come from post frontmatter and go in via innerHTML, so escape them
// rather than trusting the content pipeline to stay free of angle brackets.
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

document.addEventListener('astro:page-load', () => {
  const roots = document.querySelectorAll<HTMLElement>('.js-hs');
  if (roots.length === 0) return;

  // The index is shared, so only fetch it once no matter which instance opens first.
  let indexRequested = false;

  roots.forEach((root) => {
    const toggle = root.querySelector<HTMLButtonElement>('.js-hs-toggle');
    const input = root.querySelector<HTMLInputElement>('.js-hs-input');
    const closeBtn = root.querySelector<HTMLButtonElement>('.js-hs-close');
    const results = root.querySelector<HTMLElement>('.js-hs-results');
    if (!toggle || !input || !results) return;

    // Drop the visible class first so the panel can fade out, and only empty the
    // markup once that transition has finished — clearing immediately would make it
    // vanish mid-animation.
    const clearResults = () => {
      results.classList.remove('is-visible');
      window.setTimeout(() => {
        if (!results.classList.contains('is-visible')) results.innerHTML = '';
      }, 220);
    };

    // Expansion itself is pure CSS (:hover / :focus-within). All this does is warm
    // the index so results are ready by the time anything is typed.
    const warmIndex = () => {
      if (indexRequested) return;
      indexRequested = true;
      void initSearch();
    };

    root.addEventListener('mouseenter', warmIndex);
    root.addEventListener('focusin', warmIndex);

    const reset = () => {
      root.classList.remove('is-active');
      input.value = '';
      clearResults();
    };

    // Clicking the glyph puts the cursor in the field — also the tap path on touch,
    // where focus is what opens it.
    toggle.addEventListener('click', () => {
      warmIndex();
      input.focus();
    });

    closeBtn?.addEventListener('click', () => {
      reset();
      input.blur();
    });

    input.addEventListener('input', () => {
      const query = input.value.trim();
      root.classList.toggle('is-active', query.length > 0);

      if (query.length < MIN_QUERY) {
        clearResults();
        return;
      }

      const found = searchPosts(query).slice(0, MAX_RESULTS);

      results.innerHTML =
        found.length > 0
          ? found
              .map(
                (r) => `
        <a class="hs__result" href="${r.url}">
          <span class="hs__result-title">${escapeHtml(r.title)}</span>
          <span class="hs__result-date">${formatDate(r.date)}</span>
        </a>`,
              )
              .join('')
          : '<p class="hs__empty">No matches</p>';

      results.classList.add('is-visible');
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        reset();
        input.blur();
      }
    });

    // Outside-click closing is handled once at module scope — see below. Binding it
    // here would add a fresh document listener on every view transition.
    root.addEventListener('hs:reset', reset);
  });

  // The mobile top bar has no room to expand inline, so its button opens the menu
  // (handled in app.ts) and then focuses the search that lives inside it — focus is
  // what expands the field on touch, where there is no hover.
  document.querySelectorAll<HTMLElement>('.js-open-search-in-menu').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.querySelector<HTMLInputElement>('.js-hs-input');
      if (target) {
        window.setTimeout(() => target.focus(), 60);
      }
    });
  });
});

// Registered once. The module is evaluated a single time even across view
// transitions, so this can't stack — and it resolves the current search instances at
// click time rather than closing over stale ones.
document.addEventListener('click', (e) => {
  document.querySelectorAll<HTMLElement>('.js-hs.is-active').forEach((root) => {
    if (!root.contains(e.target as Node)) {
      root.dispatchEvent(new CustomEvent('hs:reset'));
    }
  });
});

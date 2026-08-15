// Writing-list keyboard navigation: j / k step, Enter opens, Esc clears.
//
// This drives real DOM focus rather than a parallel "selected" state, so Tab and
// screen readers travel the same path and Enter needs no handler at all — a focused
// <a href> activates natively.

const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.js-wl-link'));
if (links.length > 0) {
  let index = -1;

  // Keep our position in sync when focus arrives some other way (Tab, click).
  links.forEach((link, i) => {
    link.addEventListener('focus', () => {
      index = i;
    });
  });

  const isTyping = (el: Element | null): boolean =>
    el instanceof HTMLElement &&
    (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

  const searchIsOpen = (): boolean => !!document.querySelector('.js-hs.is-active');

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (isTyping(document.activeElement)) return;
    if (searchIsOpen()) return;

    if (e.key === 'j' || e.key === 'k') {
      e.preventDefault();
      index =
        e.key === 'j'
          ? Math.min(index + 1, links.length - 1)
          : Math.max(index - 1, 0);
      links[index]?.focus();
    } else if (e.key === 'Escape') {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      index = -1;
    }
  });
}

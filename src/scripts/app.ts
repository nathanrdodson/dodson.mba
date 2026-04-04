import Headroom from 'headroom.js';
import Swiper from 'swiper';
import { FreeMode, A11y } from 'swiper/modules';
import 'swiper/css';
import { initSearch, searchPosts } from './search-index';

export const isMobile = (width = '768px'): boolean =>
  window.matchMedia(`(max-width: ${width})`).matches;

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(document.documentElement.lang || 'en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const header = document.querySelector<HTMLElement>('.js-header');
  const openMenuBtns = document.querySelectorAll<HTMLElement>('.js-open-menu');
  const closeMenuBtn = document.querySelector<HTMLElement>('.js-close-menu');
  const menu = document.querySelector<HTMLElement>('.js-menu');
  const toggleSubmenuBtn = document.querySelector<HTMLElement>('.js-toggle-submenu');
  const submenuOption = document.querySelector<HTMLElement>('.js-submenu-option');
  const submenu = document.querySelector<HTMLElement>('.js-submenu');
  const openSearchBtns = document.querySelectorAll<HTMLElement>('.js-open-search');
  const closeSearchBtn = document.querySelector<HTMLElement>('.js-close-search');
  const searchModal = document.querySelector<HTMLElement>('.js-search');
  const searchInput = document.querySelector<HTMLInputElement>('.js-input-search');
  const searchResults = document.querySelector<HTMLElement>('.js-search-results');
  const searchNoResults = document.querySelector<HTMLElement>('.js-no-results');
  const darkmodeToggleWrap = document.querySelector<HTMLElement>('.js-toggle-darkmode');
  const darkmodeInput = document.querySelector<HTMLInputElement>('.js-darkmode-input');
  const mainNav = document.querySelector<HTMLElement>('.js-main-nav');
  const mainNavLeft = document.querySelector<HTMLElement>('.js-main-nav-left');
  const recentSlider = document.querySelector<HTMLElement>('.js-recent-slider');

  let submenuIsOpen = false;
  let searchInitialized = false;

  // ─── Dark mode ──────────────────────────────────────────────────────────────

  const currentTheme = localStorage.getItem('theme') ?? 'dark';
  if (darkmodeInput) {
    darkmodeInput.checked = currentTheme === 'dark';
  }

  darkmodeInput?.addEventListener('change', () => {
    const isDark = darkmodeInput.checked;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  // ─── Toggle desktop nav overflow on darkmode hover ──────────────────────────

  const toggleDesktopOverflow = (enable: boolean) => {
    if (!isMobile()) {
      mainNav?.classList.toggle('toggle-overflow', enable);
      mainNavLeft?.classList.toggle('toggle-overflow', enable);
    }
  };

  darkmodeToggleWrap?.addEventListener('mouseenter', () => toggleDesktopOverflow(true));
  darkmodeToggleWrap?.addEventListener('mouseleave', () => toggleDesktopOverflow(false));

  // ─── Mobile menu ────────────────────────────────────────────────────────────

  const toggleScroll = () => body.classList.toggle('no-scroll-y');

  openMenuBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      header?.classList.add('mobile-menu-opened');
      menu?.classList.add('opened');
      toggleScroll();
    });
  });

  closeMenuBtn?.addEventListener('click', () => {
    header?.classList.remove('mobile-menu-opened');
    menu?.classList.remove('opened');
    toggleScroll();
  });

  // ─── Submenu ────────────────────────────────────────────────────────────────

  const showSubmenu = () => {
    header?.classList.add('submenu-is-active');
    toggleSubmenuBtn?.classList.add('active');
    submenu?.classList.remove('closed');
    submenu?.classList.add('opened');
  };

  const hideSubmenu = () => {
    header?.classList.remove('submenu-is-active');
    toggleSubmenuBtn?.classList.remove('active');
    submenu?.classList.remove('opened');
    submenu?.classList.add('closed');
  };

  toggleSubmenuBtn?.addEventListener('click', () => {
    submenuIsOpen = !submenuIsOpen;
    submenuIsOpen ? showSubmenu() : hideSubmenu();
  });

  window.addEventListener('click', (e) => {
    if (submenuIsOpen && submenuOption && !submenuOption.contains(e.target as Node)) {
      submenuIsOpen = false;
      hideSubmenu();
    }
  });

  // ─── Search ─────────────────────────────────────────────────────────────────

  const openSearch = async () => {
    searchModal?.classList.add('opened');
    toggleScroll();
    // Lazy-init search index on first open
    if (!searchInitialized) {
      searchInitialized = true;
      await initSearch();
    }
    setTimeout(() => searchInput?.focus(), 400);
  };

  const closeSearch = () => {
    searchInput?.blur();
    searchModal?.classList.remove('opened');
    searchResults!.innerHTML = '';
    searchResults?.classList.add('hide');
    searchNoResults?.classList.add('hide');
    toggleScroll();
  };

  openSearchBtns.forEach((btn) => btn.addEventListener('click', openSearch));
  closeSearchBtn?.addEventListener('click', closeSearch);

  document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape' && searchModal?.classList.contains('opened')) {
      closeSearch();
    }
  });

  searchInput?.addEventListener('keyup', () => {
    const query = searchInput.value.trim();
    if (query.length < 2) {
      searchResults!.innerHTML = '';
      searchResults?.classList.add('hide');
      searchNoResults?.classList.add('hide');
      return;
    }

    const results = searchPosts(query);

    if (results.length > 0) {
      const html = results
        .map(
          (r) => `
        <article class="m-result">
          <a href="${r.url}" class="m-result__link">
            <h3 class="m-result__title">${r.title}</h3>
            <span class="m-result__date">${formatDate(r.date)}</span>
          </a>
        </article>`,
        )
        .join('');
      searchNoResults?.classList.add('hide');
      searchResults!.innerHTML = html;
      searchResults?.classList.remove('hide');
    } else {
      searchResults!.innerHTML = '';
      searchResults?.classList.add('hide');
      searchNoResults?.classList.remove('hide');
    }
  });

  // ─── Headroom ───────────────────────────────────────────────────────────────

  if (header) {
    const headroom = new Headroom(header, {
      tolerance: { down: 10, up: 20 },
      offset: 15,
    });
    headroom.init();
  }

  // ─── Recent articles Swiper ─────────────────────────────────────────────────

  if (recentSlider) {
    new Swiper('.js-recent-slider', {
      modules: [FreeMode, A11y],
      freeMode: true,
      slidesPerView: 'auto',
      a11y: { enabled: true },
    });
  }

  // ─── Remove header animation after a moment ──────────────────────────────────

  setTimeout(() => {
    header?.removeAttribute('data-animate');
  }, 600);
});

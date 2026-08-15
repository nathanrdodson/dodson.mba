import Headroom from 'headroom.js';
import Swiper from 'swiper';
import { FreeMode, A11y } from 'swiper/modules';
import 'swiper/css';

// Runs on first load and again after every view transition. Only element-level
// listeners are attached here — those die with the DOM they're bound to, so they
// can't accumulate. Anything bound to document/window must live at module scope.
document.addEventListener('astro:page-load', () => {
  const body = document.body;
  const header = document.querySelector<HTMLElement>('.js-header');
  const openMenuBtns = document.querySelectorAll<HTMLElement>('.js-open-menu');
  const closeMenuBtn = document.querySelector<HTMLElement>('.js-close-menu');
  const menu = document.querySelector<HTMLElement>('.js-menu');
  const recentSlider = document.querySelector<HTMLElement>('.js-recent-slider');

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
});

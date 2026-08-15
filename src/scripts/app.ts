import Headroom from 'headroom.js';
import Swiper from 'swiper';
import { FreeMode, A11y } from 'swiper/modules';
import 'swiper/css';

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const header = document.querySelector<HTMLElement>('.js-header');
  const openMenuBtns = document.querySelectorAll<HTMLElement>('.js-open-menu');
  const closeMenuBtn = document.querySelector<HTMLElement>('.js-close-menu');
  const menu = document.querySelector<HTMLElement>('.js-menu');
  const toggleSubmenuBtn = document.querySelector<HTMLElement>('.js-toggle-submenu');
  const submenuOption = document.querySelector<HTMLElement>('.js-submenu-option');
  const submenu = document.querySelector<HTMLElement>('.js-submenu');
  const recentSlider = document.querySelector<HTMLElement>('.js-recent-slider');

  let submenuIsOpen = false;

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

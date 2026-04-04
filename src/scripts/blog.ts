import Swiper from 'swiper';
import { Navigation, A11y } from 'swiper/modules';
import 'swiper/css';

document.addEventListener('DOMContentLoaded', () => {
  const featuredSlider = document.querySelector<HTMLElement>('.js-featured-slider');
  if (!featuredSlider) return;

  const numSlides = featuredSlider.querySelectorAll('.swiper-slide').length;

  new Swiper('.js-featured-slider', {
    modules: [Navigation, A11y],
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    a11y: { enabled: true },
  });

  // Hide nav buttons if only one slide
  if (numSlides <= 1) {
    featuredSlider.querySelectorAll<HTMLElement>('.js-featured-slider-button').forEach((btn) => {
      btn.remove();
    });
  }
});

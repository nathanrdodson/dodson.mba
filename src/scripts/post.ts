import mediumZoom from 'medium-zoom';
import Swiper from 'swiper';
import { Navigation, A11y } from 'swiper/modules';
import 'swiper/css';

// ─── Responsive video embeds (replace fitvids) ───────────────────────────────

function fitVids() {
  const iframes = document.querySelectorAll<HTMLIFrameElement>(
    '.js-post-content iframe[src*="youtube"], .js-post-content iframe[src*="vimeo"]'
  );
  iframes.forEach((iframe) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;padding-bottom:56.25%;height:0;overflow:hidden;';
    iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
    iframe.parentNode!.insertBefore(wrapper, iframe);
    wrapper.appendChild(iframe);
  });
}

// ─── Mark zoomable images ─────────────────────────────────────────────────────

function markZoomableImages() {
  const postContent = document.querySelector('.js-post-content');
  if (!postContent) return;

  postContent.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    const figure = img.closest('figure');
    const isBookmark = figure?.classList.contains('kg-bookmark-card');
    const isNft = figure?.classList.contains('kg-nft-card');
    const isLinked = img.parentElement?.tagName === 'A';
    const isProductImage = img.classList.contains('kg-product-card-image');
    const isAudioThumb = img.classList.contains('kg-audio-thumbnail');

    if (!isBookmark && !isNft && !isLinked && !isProductImage && !isAudioThumb) {
      img.classList.add('js-zoomable');
    }
  });
}

// ─── Gallery image aspect ratios ─────────────────────────────────────────────

function adjustGalleryImages() {
  document.querySelectorAll<HTMLImageElement>('.kg-gallery-image img').forEach((img) => {
    const container = img.closest<HTMLElement>('.kg-gallery-image');
    if (!container) return;
    const w = img.getAttribute('width');
    const h = img.getAttribute('height');
    if (w && h) container.style.flex = `${Number(w) / Number(h)} 1 0%`;
  });
}

// ─── Reading progress rail ────────────────────────────────────────────────────

function initReadingProgress() {
  const fill = document.querySelector<HTMLElement>('.js-progress-fill');
  const pct = document.querySelector<HTMLElement>('.js-progress-pct');
  const article = document.querySelector<HTMLElement>('.js-progress-content');
  if (!fill || !article) return;

  let ticking = false;

  const update = () => {
    const rect = article.getBoundingClientRect();
    const top = rect.top + window.scrollY;

    // Measure against the article itself, not the document — the footer and the
    // recommended-posts strip below it shouldn't count as unread content.
    // Progress starts as the article's top reaches the viewport top and completes as
    // its bottom clears the bottom.
    const span = Math.max(1, rect.height - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, (window.scrollY - top) / span));

    fill.style.transform = `scaleY(${ratio})`;
    if (pct) pct.textContent = `${Math.round(ratio * 100)}%`;
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  update();
  // Replaces any handler left from a previous page — window survives view
  // transitions, so re-adding without removing would stack one per navigation.
  window.removeEventListener('scroll', activeScrollHandler);
  window.removeEventListener('resize', activeScrollHandler);
  activeScrollHandler = onScroll;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}

let activeScrollHandler: EventListener = () => {};

// ─── Recommended posts slider ─────────────────────────────────────────────────

function initRecommendedSlider() {
  if (!document.querySelector('.js-recommended-slider')) return;

  new Swiper('.js-recommended-slider', {
    modules: [Navigation, A11y],
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    slidesPerView: 1,
    allowTouchMove: true,
    loop: true,
    a11y: { enabled: true },
    breakpoints: {
      720: { slidesPerView: 2, allowTouchMove: true, loop: true },
      1024: { slidesPerView: 3, allowTouchMove: false, loop: false },
    },
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('astro:page-load', () => {
  fitVids();
  adjustGalleryImages();
  markZoomableImages();

  mediumZoom('.js-zoomable');
  initRecommendedSlider();
  initReadingProgress();
});

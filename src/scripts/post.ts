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

// ─── Scroll progress circle ───────────────────────────────────────────────────

function initProgressCircle() {
  const progressCircle = document.querySelector<SVGCircleElement>('.js-progress');
  if (!progressCircle) return;

  const svg = progressCircle.parentElement as SVGSVGElement | null;
  if (!svg) return;

  let circumference = 0;
  let isTicking = false;

  const setCircleStyles = () => {
    const svgWidth = svg.clientWidth;
    const radius = svgWidth / 2;
    const borderWidth = window.innerWidth < 768 ? 2 : 3;

    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgWidth}`);
    progressCircle.setAttribute('stroke-width', String(borderWidth));
    progressCircle.setAttribute('r', String(radius - (borderWidth - 1)));
    progressCircle.setAttribute('cx', String(radius));
    progressCircle.setAttribute('cy', String(radius));

    circumference = radius * 2 * Math.PI;
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = String(circumference);
  };

  const updateProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const progressMax = docHeight - winHeight;
    const percent = Math.min(100, Math.ceil((scrollTop / progressMax) * 100));
    const offset = circumference - (percent / 100) * circumference;
    progressCircle.style.strokeDashoffset = String(offset);
    isTicking = false;
  };

  setCircleStyles();
  setTimeout(() => {
    svg.style.opacity = '1';
  }, 300);

  window.addEventListener(
    'scroll',
    () => {
      if (!isTicking) {
        requestAnimationFrame(updateProgress);
        isTicking = true;
      }
    },
    { passive: true }
  );

  window.addEventListener('resize', () => {
    setTimeout(() => {
      setCircleStyles();
      updateProgress();
    }, 200);
  });
}

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

document.addEventListener('DOMContentLoaded', () => {
  fitVids();
  adjustGalleryImages();
  markZoomableImages();

  mediumZoom('.js-zoomable');
  initRecommendedSlider();
  initProgressCircle();
});

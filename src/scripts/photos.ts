import mediumZoom from 'medium-zoom';

document.addEventListener('astro:page-load', () => {
  mediumZoom('.js-zoomable');
});

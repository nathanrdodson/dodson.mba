import mediumZoom from 'medium-zoom';

// ─── Column rebalancing ───────────────────────────────────────────────────────
// Split gallery items into two columns balanced by total image height.

function balanceColumns() {
  const photoList = document.getElementById('photo-list');
  if (!photoList) return;

  const items = Array.from(photoList.querySelectorAll<HTMLElement>('.gallery-item'));
  if (items.length === 0) return;

  // Remove existing column wrappers if re-running
  const existingCols = photoList.querySelectorAll('.gallery-col');
  existingCols.forEach((col) => {
    const children = Array.from(col.children);
    children.forEach((child) => photoList.appendChild(child));
    col.remove();
  });

  const col1 = document.createElement('div');
  const col2 = document.createElement('div');
  col1.className = 'gallery-col';
  col2.className = 'gallery-col';

  let height1 = 0;
  let height2 = 0;

  items.forEach((item) => {
    if (height1 <= height2) {
      col1.appendChild(item);
      height1 += item.offsetHeight;
    } else {
      col2.appendChild(item);
      height2 += item.offsetHeight;
    }
  });

  photoList.appendChild(col1);
  photoList.appendChild(col2);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

window.addEventListener('load', () => {
  balanceColumns();
  mediumZoom('.js-zoomable');

  const photoList = document.getElementById('photo-list');
  if (photoList) {
    const resizeObserver = new ResizeObserver(() => {
      balanceColumns();
    });
    resizeObserver.observe(photoList);
  }
});

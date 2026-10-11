/* -----------------------------------------------------------------------------
   fallingShapes.js - Scroll-driven decorative falling shapes behind the poster
   ----------------------------------------------------------------------------- */

const SHAPE_TYPES = ['leaf', 'peach', 'peach-half', 'blossom'];

const COLORS = {
  leaf: 'var(--color-accent-leaf)',
  peach: 'var(--color-melon-400)',
  peachHalf1: 'var(--color-melon-200)',
  peachPit: 'var(--color-dark)',
  blossom: 'var(--color-rose-200)',
};

function createSvg(width, height) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.width = width + 'px';
  svg.style.height = height + 'px';
  svg.style.pointerEvents = 'none';
  svg.style.userSelect = 'none';
  svg.style.display = 'block';
  return svg;
}

function makeShape(id) {
  const type = SHAPE_TYPES[id % SHAPE_TYPES.length];
  const size = 28 + (id * 11) % 63;
  const opacity = 0.18 + (id * 7) % 23 * 0.01; // 0.18-0.4
  const depth = 0.2 + (id * 13) % 80 * 0.01; // 0.2-1.0
  const svg = createSvg(size, size);
  svg.classList.add('falling-shape');
  svg.dataset.depth = String(depth);
  svg.dataset.type = type;
  svg.dataset.size = String(size);

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('opacity', String(Math.min(0.4, Math.max(0.18, opacity))));
  svg.appendChild(g);

  if (type === 'leaf') {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M14 4 C26 4, 26 20, 14 28 C2 20, 2 4, 14 4 Z');
    path.setAttribute('fill', COLORS.leaf);
    g.appendChild(path);
  } else if (type === 'peach') {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(size / 2));
    circle.setAttribute('cy', String(size / 2 + 2));
    circle.setAttribute('r', String(size / 2 - 4));
    circle.setAttribute('fill', COLORS.peach);
    g.appendChild(circle);
    const stem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    stem.setAttribute('d', `M${size / 2} 6 L${size / 2 - 2} 2 L${size / 2 + 2} 4 Z`);
    stem.setAttribute('fill', COLORS.leaf);
    g.appendChild(stem);
  } else if (type === 'peach-half') {
    const half = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    half.setAttribute('d', `M${size / 2} 4 A${size / 2 - 3} ${size / 2 - 3} 0 1 1 ${size / 2} ${size - 4} Z`);
    half.setAttribute('fill', COLORS.peachHalf1);
    g.appendChild(half);
    const pit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pit.setAttribute('cx', String(size / 2 + 2));
    pit.setAttribute('cy', String(size / 2 + 4));
    pit.setAttribute('r', String(Math.max(3, size / 6)));
    pit.setAttribute('fill', COLORS.peachPit);
    g.appendChild(pit);
  } else if (type === 'blossom') {
    const petal = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    petal.setAttribute('d', `M${size / 2} 4 Q${size - 2} ${size / 2}, ${size / 2} ${size - 4} Q2 ${size / 2}, ${size / 2} 4 Z`);
    petal.setAttribute('fill', COLORS.blossom);
    g.appendChild(petal);
    const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    center.setAttribute('cx', String(size / 2));
    center.setAttribute('cy', String(size / 2));
    center.setAttribute('r', String(Math.max(2, size / 8)));
    center.setAttribute('fill', 'var(--color-rose-700)');
    g.appendChild(center);
  }

  return svg;
}

export function initFallingShapes() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const layer = document.createElement('div');
  layer.className = 'falling-shapes-layer';
  layer.setAttribute('aria-hidden', 'true');

  const shapes = [];
  for (let i = 0; i < 14; i++) {
    const s = makeShape(i);
    layer.appendChild(s);
    shapes.push(s);
  }

  document.body.appendChild(layer);

  if (prefersReduced) return { layer, shapes };

  const vw = () => window.innerWidth || document.documentElement.clientWidth;
  const vh = () => window.innerHeight || document.documentElement.clientHeight;
  let lastScroll = window.scrollY || document.documentElement.scrollTop || 0;
  let lastTime = performance.now();
  let ticking = false;
  let visible = true;

  shapes.forEach((s, i) => {
    const size = parseFloat(s.dataset.size || '40');
    s.style.position = 'absolute';
    s.style.left = Math.max(4, (i * 73) % (vw() - size)) + 'px';
    s.style.top = Math.max(-size, ((i * 97) % (vh() * 2)) - size) + 'px';
    s.style.willChange = 'transform';
    s.style.opacity = '0.55';
  });

  function update(now) {
    if (!visible) {
      ticking = false;
      return;
    }
    const scroll = window.scrollY || document.documentElement.scrollTop || 0;
    const scrolled = scroll - lastScroll;
    const dt = now - lastTime;
    const sway = now * 0.00012;

    const w = vw();
    const h = vh();
    shapes.forEach((s) => {
      const depth = Math.max(0.2, Math.min(1.0, parseFloat(s.dataset.depth || '0.5')));
      const size = parseFloat(s.dataset.size || '40');
      const currentY = parseFloat(s._y || parseFloat(s.style.top) || 0);
      let newY = currentY + scrolled * depth + dt * 0.02 * depth;
      if (newY > h + size) newY = -size * (0.6 + (size % 5) * 0.05);
      const x = parseFloat(s._x || parseFloat(s.style.left) || 0);
      const newX = x + Math.sin((sway + depth * 100)) * 0.5;
      s._y = newY;
      s._x = newX;
      s.style.transform = `translate3d(${newX}px, ${newY}px, 0) rotate(${scroll * depth * 0.01}deg)`;
    });

    lastScroll = scroll;
    lastTime = now;
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  function onVisibility() {
    visible = document.visibilityState === 'visible';
    if (visible && !ticking) {
      lastTime = performance.now();
      lastScroll = window.scrollY || document.documentElement.scrollTop || 0;
      onScroll();
    }
  }

  shapes.forEach((s) => {
    s._x = parseFloat(s.style.left);
    s._y = parseFloat(s.style.top);
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  return { layer, shapes };
}

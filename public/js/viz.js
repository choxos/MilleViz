// Shared plotting helpers. Every figure on the site is an inline <svg> or a
// <canvas> drawn by the page's own script; this file holds only the pieces
// more than one page needs.

export const SVG_NS = 'http://www.w3.org/2000/svg';

/** Round to one decimal. Path data does not need more, and it halves the DOM text. */
export const r1 = (n) => Math.round(n * 10) / 10;

/** Points array to an SVG path. Pass close:true for a filled shape. */
export function path(points, close = false) {
  if (!points.length) return '';
  return 'M' + points.map((p) => r1(p[0]) + ',' + r1(p[1])).join(' ') + (close ? 'Z' : '');
}

/** Linear scale from a data range to a pixel range. */
export function scale(d0, d1, p0, p1) {
  const m = (p1 - p0) / (d1 - d0);
  return (v) => p0 + (v - d0) * m;
}

/** Create an SVG element with attributes, optionally appending it. */
export function svg(tag, attrs = {}, parent = null) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  if (parent) parent.appendChild(node);
  return node;
}

/** Horizontal gridlines plus their left-hand tick labels. */
export function hGrid(parent, values, x0, x1, y, fmt = String) {
  for (const v of values) {
    const py = y(v);
    svg('path', { d: `M${x0},${r1(py)} H${x1}`, class: 'grid-line' }, parent);
    svg('text', { x: x0 - 16, y: r1(py) + 4, 'text-anchor': 'end', class: 'tick' }, parent)
      .textContent = fmt(v);
  }
}

/** Bottom-axis tick labels. The first sits flush left, the last flush right. */
export function xTicks(parent, values, x, yPos, fmt = String) {
  values.forEach((v, i) => {
    const anchor = i === 0 ? 'start' : i === values.length - 1 ? 'end' : 'middle';
    svg('text', { x: r1(x(v)), y: yPos, 'text-anchor': anchor, class: 'tick' }, parent)
      .textContent = fmt(v);
  });
}

/** Primes up to n, by sieve. */
export function sieve(n) {
  const composite = new Uint8Array(n + 1);
  const primes = [];
  for (let i = 2; i <= n; i++) {
    if (!composite[i]) {
      primes.push(i);
      for (let j = i * i; j <= n; j += i) composite[j] = 1;
    }
  }
  return primes;
}

export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * requestAnimationFrame loop that pauses when the figure scrolls out of view,
 * and never starts at all when the visitor asked for reduced motion. step gets
 * seconds elapsed since the loop started.
 */
export function animate(element, step) {
  if (reducedMotion()) { step(0); return () => {}; }
  let raf = 0, t0 = 0, running = false;
  const frame = (now) => {
    if (!running) return;
    if (!t0) t0 = now;
    step((now - t0) / 1000);
    raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  const io = new IntersectionObserver(
    ([entry]) => (entry.isIntersecting ? start() : stop()),
    { rootMargin: '120px' },
  );
  io.observe(element);
  return () => { stop(); io.disconnect(); };
}

/**
 * Size a canvas to its CSS box at the device pixel ratio and return a context
 * already scaled to CSS pixels. Call again on resize.
 */
export function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: rect.width, h: rect.height };
}

/** Re-run fn on resize, coalesced to one call per frame. */
export function onResize(fn) {
  let pending = false;
  const handler = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; fn(); });
  };
  window.addEventListener('resize', handler);
  return handler;
}

/** Wire a range input to a callback, firing once immediately. */
export function slider(id, onChange) {
  const input = document.getElementById(id);
  const run = () => onChange(Number(input.value), input);
  input.addEventListener('input', run);
  run();
  return input;
}

/** Wire a group of aria-pressed buttons as a single-choice toggle. */
export function toggle(containerId, onChange) {
  const box = document.getElementById(containerId);
  const buttons = [...box.querySelectorAll('button')];
  const pick = (value) => {
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.value === value));
    onChange(value);
  };
  for (const b of buttons) b.addEventListener('click', () => pick(b.dataset.value));
  pick(buttons.find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset.value
    ?? buttons[0].dataset.value);
  return pick;
}

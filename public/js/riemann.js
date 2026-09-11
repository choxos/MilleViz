// Figures for the Riemann Hypothesis page. Every curve here is computed from
// the definitions: primes by sieve, Li(x) by numeric integration, and the
// explicit formula evaluated over the published zeta zeros.

import { path, scale, svg, hGrid, xTicks, sieve, slider, r1 } from './viz.js';

const ACCENT = '#b14e49';
const INK = '#241e1a';
const MUTED = '#79736f';
const FAINT = '#a7a4a0';
const STAIR = '#b8b2ab';

/** Imaginary parts of the first fifty nontrivial zeros. */
const GAMMA = [
  14.134725, 21.022040, 25.010858, 30.424876, 32.935062, 37.586178, 40.918719,
  43.327073, 48.005151, 49.773832, 52.970321, 56.446248, 59.347044, 60.831779,
  65.112544, 67.079811, 69.546402, 72.067158, 75.704691, 77.144840, 79.337375,
  82.910381, 84.735493, 87.425275, 88.809111, 92.491899, 94.651344, 95.870634,
  98.831194, 101.317851, 103.725538, 105.446623, 107.168611, 111.029536,
  111.874659, 114.320221, 116.226680, 118.790783, 121.370125, 122.946829,
  124.256819, 127.516684, 129.578704, 131.087689, 133.497737, 134.756510,
  138.116042, 139.736209, 141.123707, 143.111846,
];

/**
 * Li(x) = the integral of 1/ln t from 2 to x, by trapezoid rule, evaluated
 * once at every sample point in a single sweep so the cost stays linear.
 */
function liTable(xs) {
  const step = 0.25;
  const out = new Map();
  let acc = 0, t = 2, prev = 1 / Math.log(2), i = 0;
  const sorted = [...xs].sort((a, b) => a - b);
  for (const target of sorted) {
    while (t < target) {
      const next = Math.min(t + step, target);
      const cur = 1 / Math.log(next);
      acc += 0.5 * (prev + cur) * (next - t);
      prev = cur; t = next;
    }
    out.set(target, acc);
    i++;
  }
  return out;
}

/** Fig 01: the counting staircase against its two estimates. */
function figCount() {
  const node = document.getElementById('fig-count');
  const x = scale(0, 100, 56, 1020);
  const y = scale(0, 32, 290, 26);

  hGrid(node, [0, 8, 16, 24], 56, 1020, y);
  xTicks(node, [0, 25, 50, 75, 100], x, 318);

  const samples = [];
  for (let v = 2; v <= 100; v += 1) samples.push(v);
  const li = liTable(samples);

  svg('path', {
    d: path(samples.map((v) => [x(v), y(v / Math.log(v))])),
    stroke: FAINT, 'stroke-width': 1.2, 'stroke-dasharray': '4 4', fill: 'none',
  }, node);
  svg('path', {
    d: path(samples.map((v) => [x(v), y(li.get(v))])),
    stroke: MUTED, 'stroke-width': 1.4, fill: 'none',
  }, node);

  const stair = [[x(0), y(0)]];
  let count = 0;
  for (const p of sieve(100)) {
    stair.push([x(p), y(count)]);
    count += 1;
    stair.push([x(p), y(count)]);
  }
  stair.push([x(100), y(count)]);
  svg('path', {
    d: path(stair), stroke: ACCENT, 'stroke-width': 2,
    'stroke-linejoin': 'round', fill: 'none',
  }, node);

  const label = (text, at, dy, fill) => {
    const t = svg('text', {
      x: 1012, y: r1(y(at) + dy), 'text-anchor': 'end', class: 'serieslabel', fill,
    }, node);
    t.textContent = text;
  };
  label('Li(x) ≈ 29.1', 29.08, -11, MUTED);
  label('π(x) = 25', 25, -11, ACCENT);
  label('x / ln x ≈ 21.7', 21.71, 20, FAINT);
}

/** Fig 02: the error, inside an envelope that opens as the square root. */
function figError() {
  const node = document.getElementById('fig-error');
  const x = scale(0, 10000, 56, 1020);
  const y = scale(-110, 110, 224, 56);

  const samples = [];
  for (let v = 10; v <= 10000; v += 25) samples.push(v);
  const li = liTable(samples);
  const primes = sieve(10000);

  const upper = samples.map((v) => [x(v), y(Math.sqrt(v))]);
  const lower = samples.map((v) => [x(v), y(-Math.sqrt(v))]);
  svg('path', {
    d: path(upper.concat([...lower].reverse()), true),
    fill: ACCENT, 'fill-opacity': 0.07, stroke: 'none',
  }, node);
  for (const edge of [upper, lower]) {
    svg('path', {
      d: path(edge), stroke: ACCENT, 'stroke-width': 1,
      'stroke-dasharray': '4 4', opacity: 0.5, fill: 'none',
    }, node);
  }
  svg('path', { d: `M56,${r1(y(0))} H1020`, class: 'axis-line' }, node);

  let seen = 0, i = 0;
  const err = samples.map((v) => {
    while (i < primes.length && primes[i] <= v) { i += 1; seen += 1; }
    return [x(v), y(li.get(v) - seen)];
  });
  svg('path', {
    d: path(err), stroke: INK, 'stroke-width': 1.6,
    'stroke-linejoin': 'round', fill: 'none',
  }, node);

  hGrid(node, [], 56, 1020, y);
  for (const [v, text] of [[100, '+100'], [0, '0'], [-100, '−100']]) {
    svg('text', { x: 40, y: r1(y(v)) + 4, 'text-anchor': 'end', class: 'tick' }, node)
      .textContent = text;
  }
  xTicks(node, [0, 10000], x, 262, (v) => v.toLocaleString('en-US'));
  svg('text', { x: 1012, y: 52, 'text-anchor': 'end', class: 'serieslabel', fill: ACCENT }, node)
    .textContent = '± √x';
}

/** Fig 03: fifty zeros, all of them on the critical line. */
function figZeros() {
  const node = document.getElementById('fig-zeros');
  const x = scale(0, 146, 56, 1020);

  svg('rect', { x: 56, y: 34, width: 964, height: 120, fill: ACCENT, 'fill-opacity': 0.055 }, node);
  svg('path', { d: 'M56,34 H1020 M56,154 H1020', class: 'axis-line', fill: 'none' }, node);
  svg('path', { d: 'M56,94 H1020', stroke: ACCENT, 'stroke-width': 1.2, fill: 'none' }, node);

  GAMMA.forEach((g, i) => {
    const cx = r1(x(g));
    const dot = svg('circle', { cx, cy: 94, r: 3.6, fill: ACCENT }, node);
    svg('title', {}, dot).textContent = `Zero ${i + 1}: s = 1/2 + ${g.toFixed(6)}i`;
    svg('path', { d: `M${cx},154 V162`, stroke: FAINT, 'stroke-width': 1 }, node);
  });

  for (const [y, text] of [[38, 'Re = 1'], [98, 'Re = ½'], [158, 'Re = 0']]) {
    svg('text', {
      x: 44, y, 'text-anchor': 'end', class: 'tick',
      fill: text.includes('½') ? ACCENT : FAINT,
    }, node).textContent = text;
  }
  xTicks(node, [0, 146], x, 196, (v) => `t = ${v}`);
}

/** Fig 04: the staircase rebuilt, one zero at a time. */
function figMusic() {
  const node = document.getElementById('fig-music');
  const out = document.getElementById('zeros-out');
  const x = scale(2, 30, 56, 1020);
  const y = scale(0, 32, 280, 16);

  hGrid(node, [0, 8, 16, 24], 56, 1020, y);
  xTicks(node, [2, 30], x, 308, (v) => `x = ${v}`);

  // The true staircase: a jump of ln p at every prime power up to 30.
  const jumps = [];
  for (const p of sieve(30)) {
    for (let q = p; q <= 30; q *= p) jumps.push([q, Math.log(p)]);
  }
  jumps.sort((a, b) => a[0] - b[0]);
  const stair = [[x(2), y(0)]];
  let height = 0;
  for (const [at, rise] of jumps) {
    stair.push([x(at), y(height)]);
    height += rise;
    stair.push([x(at), y(height)]);
  }
  stair.push([x(30), y(height)]);
  svg('path', {
    d: path(stair), stroke: STAIR, 'stroke-width': 2,
    'stroke-linejoin': 'round', fill: 'none',
  }, node);

  const curve = svg('path', {
    stroke: ACCENT, 'stroke-width': 1.7, 'stroke-linejoin': 'round', fill: 'none',
  }, node);

  // psi(x) = x - sum over zeros - ln 2pi - half ln(1 - x^-2). Each zero is
  // paired with its conjugate, which is what turns the pair into one real wave.
  const draw = (n) => {
    const points = [];
    for (let v = 2; v <= 30; v += 0.06) {
      let psi = v - Math.log(2 * Math.PI) - 0.5 * Math.log(1 - 1 / (v * v));
      const lx = Math.log(v), root = Math.sqrt(v);
      for (let i = 0; i < n; i++) {
        const g = GAMMA[i], theta = g * lx;
        psi -= 2 * root * (0.5 * Math.cos(theta) + g * Math.sin(theta)) / (0.25 + g * g);
      }
      points.push([x(v), y(Math.max(-2, Math.min(33, psi)))]);
    }
    curve.setAttribute('d', path(points));
    out.textContent = String(n);
  };

  slider('zeros', draw);
}

figCount();
figError();
figZeros();
figMusic();

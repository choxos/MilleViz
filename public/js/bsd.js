// Figures for the Birch and Swinnerton-Dyer page.
//
// Figure 01 does the chord and tangent group law in exact rational arithmetic
// over big integers. Figure 02 repeats the 1960s counting experiment.

import { path, scale, svg, hGrid, xTicks, sieve, slider, r1 } from './viz.js';

const ACCENT = '#a45e00';
const INK = '#241e1a';
const MUTED = '#79736f';
const FAINT = '#a7a4a0';

/* ---------- exact rationals ---------- */

const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };
const rat = (n, d = 1n) => { if (d < 0n) { n = -n; d = -d; } const k = gcd(n, d) || 1n; return [n / k, d / k]; };
const rAdd = (x, y) => rat(x[0] * y[1] + y[0] * x[1], x[1] * y[1]);
const rSub = (x, y) => rat(x[0] * y[1] - y[0] * x[1], x[1] * y[1]);
const rMul = (x, y) => rat(x[0] * y[0], x[1] * y[1]);
const rDiv = (x, y) => rat(x[0] * y[1], x[1] * y[0]);
const rEq = (x, y) => x[0] * y[1] === y[0] * x[1];
const toFloat = (x) => Number(x[0]) / Number(x[1]);
const digits = (x) => String(x < 0n ? -x : x).length;
/** Long integers shown head and tail, so the growth is visible without the wall of digits. */
const shorten = (n, keep = 16) => {
  const s = String(n);
  const sign = s.startsWith('-') ? '-' : '';
  const body = sign ? s.slice(1) : s;
  if (body.length <= keep * 2) return s;
  return `${sign}${body.slice(0, keep)}…${body.slice(-6)}`;
};

/** Fig 01: multiples of (3, 5) on y^2 = x^3 - 2. */
function figCurve() {
  const node = document.getElementById('fig-curve');
  const multOut = document.getElementById('mult-out');
  const digitsOut = document.getElementById('digits-out');
  const coords = document.getElementById('coords');

  const A = rat(0n), B = rat(-2n);
  const double = (P) => {
    const l = rDiv(rAdd(rMul(rat(3n), rMul(P[0], P[0])), A), rMul(rat(2n), P[1]));
    const x = rSub(rSub(rMul(l, l), P[0]), P[0]);
    return [x, rSub(rMul(l, rSub(P[0], x)), P[1])];
  };
  const addPoints = (P, Q) => {
    if (rEq(P[0], Q[0])) return double(P);
    const l = rDiv(rSub(Q[1], P[1]), rSub(Q[0], P[0]));
    const x = rSub(rSub(rMul(l, l), P[0]), Q[0]);
    return [x, rSub(rMul(l, rSub(P[0], x)), P[1])];
  };

  const P = [rat(3n), rat(5n)];
  const points = [P];
  for (let i = 1; i < 9; i++) points.push(addPoints(points[i - 1], P));

  const X0 = 1.1, X1 = 16, Y0 = -62, Y1 = 62;
  const x = scale(X0, X1, 56, 1020);
  const y = scale(Y0, Y1, 380, 30);

  hGrid(node, [-50, -25, 0, 25, 50], 56, 1020, y);
  xTicks(node, [2, 6, 10, 14], x, 408, (v) => `x = ${v}`);

  // The real points of the curve, both halves of the branch.
  const upper = [], lower = [];
  const start = Math.cbrt(2);
  for (let v = start; v <= X1; v += 0.01) {
    const t = Math.sqrt(Math.max(0, v * v * v - 2));
    upper.push([x(v), y(t)]);
    lower.push([x(v), y(-t)]);
  }
  svg('path', { d: path(upper), stroke: INK, 'stroke-width': 1.5, fill: 'none' }, node);
  svg('path', { d: path(lower), stroke: INK, 'stroke-width': 1.5, fill: 'none' }, node);

  const chord = svg('path', { stroke: ACCENT, 'stroke-width': 1, 'stroke-dasharray': '4 4', opacity: 0.75, fill: 'none' }, node);
  const drop = svg('path', { stroke: ACCENT, 'stroke-width': 1, 'stroke-dasharray': '2 3', opacity: 0.75, fill: 'none' }, node);
  const marks = svg('g', {}, node);

  const inView = (px, py) => px >= X0 && px <= X1 && py >= Y0 && py <= Y1;

  slider('multiple', (n) => {
    marks.textContent = '';
    let offscreen = 0;

    for (let i = 0; i < n; i++) {
      const px = toFloat(points[i][0]), py = toFloat(points[i][1]);
      if (!inView(px, py)) { offscreen += 1; continue; }
      const cx = r1(x(px)), cy = r1(y(py));
      const last = i === n - 1;
      svg('circle', { cx, cy, r: last ? 5.5 : 4, fill: last ? ACCENT : 'none', stroke: ACCENT, 'stroke-width': 1.6 }, marks);
      svg('text', {
        x: cx + 10, y: cy - 8, class: 'serieslabel', fill: last ? ACCENT : MUTED,
      }, marks).textContent = `${i + 1}P`;
    }

    // The construction of the newest point: chord through (n-1)P and P, then
    // the reflection of where it meets the curve.
    chord.setAttribute('d', '');
    drop.setAttribute('d', '');
    if (n >= 2) {
      const a = points[n - 2], b = points[0], c = points[n - 1];
      const ax = toFloat(a[0]), ay = toFloat(a[1]);
      const bx = toFloat(b[0]), by = toFloat(b[1]);
      const cx = toFloat(c[0]), cy = toFloat(c[1]);
      if (inView(ax, ay) && inView(bx, by) && inView(cx, -cy) && inView(cx, cy)) {
        chord.setAttribute('d', path([[x(ax), y(ay)], [x(bx), y(by)], [x(cx), y(-cy)]]));
        svg('circle', { cx: r1(x(cx)), cy: r1(y(-cy)), r: 3.4, fill: 'none', stroke: ACCENT, 'stroke-width': 1.2, opacity: 0.7 }, marks);
        drop.setAttribute('d', `M${r1(x(cx))},${r1(y(-cy))} V${r1(y(cy))}`);
      }
    }

    if (offscreen) {
      svg('text', { x: 1012, y: 404, 'text-anchor': 'end', class: 'tick', fill: FAINT }, marks)
        .textContent = `${offscreen} ${offscreen === 1 ? 'point lies' : 'points lie'} outside this window`;
    }

    const point = points[n - 1];
    multOut.textContent = `${n}P`;
    digitsOut.textContent = String(digits(point[0][0]));
    coords.innerHTML =
      `<b>${n}P</b> &nbsp; x = ${shorten(point[0][0])} / ${shorten(point[0][1])}` +
      `<br><b>&nbsp;</b> &nbsp; y = ${shorten(point[1][0])} / ${shorten(point[1][1])}`;
  });
}

/** Fig 02: the running product of solution counts, over two curves. */
function figProduct() {
  const node = document.getElementById('fig-product');
  const out0 = document.getElementById('prod0');
  const out1 = document.getElementById('prod1');
  const BOUND = 20000;

  /** #E(F_p), by marking the quadratic residues once and reading off the count. */
  const countPoints = (a, b, p) => {
    const residue = new Uint8Array(p);
    for (let i = 0; i <= (p >> 1); i++) residue[(i * i) % p] = 1;
    let total = 1; // the point at infinity
    for (let v = 0; v < p; v++) {
      const cube = (((v * v) % p) * v) % p;
      const t = (((cube + a * v + b) % p) + p) % p;
      total += t === 0 ? 1 : (residue[t] ? 2 : 0);
    }
    return total;
  };

  const CURVES = [
    { a: -1, b: 0, disc: 64, rank: 0, label: 'y² = x³ − x   rank 0', color: MUTED },
    { a: 0, b: -2, disc: -1728, rank: 1, label: 'y² = x³ − 2   rank 1', color: ACCENT },
  ];

  const primes = sieve(BOUND);
  for (const curve of CURVES) {
    let product = 1;
    curve.series = [];
    for (const p of primes) {
      if (p === 2 || curve.disc % p === 0) continue;
      product *= countPoints(curve.a, curve.b, p) / p;
      curve.series.push([p, product]);
    }
  }

  const x = scale(Math.log(10), Math.log(BOUND), 56, 1020);
  const y = scale(0, 10, 300, 30);
  hGrid(node, [0, 2, 4, 6, 8, 10], 56, 1020, y);
  for (const v of [10, 100, 1000, 10000]) {
    svg('text', { x: r1(x(Math.log(v))), y: 328, 'text-anchor': 'middle', class: 'tick' }, node)
      .textContent = v.toLocaleString('en-US');
  }
  svg('text', { x: 1020, y: 328, 'text-anchor': 'end', class: 'tick' }, node).textContent = 'primes up to';

  const paths = CURVES.map((curve) =>
    svg('path', { stroke: curve.color, 'stroke-width': curve.rank ? 2 : 1.5, fill: 'none' }, node));
  const labels = CURVES.map((curve) =>
    svg('text', { class: 'serieslabel', fill: curve.color, 'text-anchor': 'end', x: 1012 }, node));
  const cursor = svg('path', { stroke: FAINT, 'stroke-width': 1, 'stroke-dasharray': '3 3', fill: 'none' }, node);

  slider('bound', (limit) => {
    cursor.setAttribute('d', `M${r1(x(Math.log(Math.max(10, limit))))},30 V300`);
    CURVES.forEach((curve, i) => {
      const shown = curve.series.filter(([p]) => p <= limit && p >= 10);
      paths[i].setAttribute('d', path(shown.map(([p, v]) => [x(Math.log(p)), y(v)])));
      const last = shown.length ? shown[shown.length - 1][1] : 1;
      labels[i].setAttribute('y', r1(y(last)) + (curve.rank ? -12 : 18));
      labels[i].textContent = curve.label;
      (i === 0 ? out0 : out1).textContent = last.toFixed(2);
    });
  });
}

figCurve();
figProduct();

// Figures for the Navier-Stokes page.
//
// Figure 01 advects tracers through the exact Taylor-Green solution
//   u =  sin x cos y e^(-2vt)
//   v = -cos x sin y e^(-2vt)
// on a periodic domain. Figure 02 is a schematic of vortex stretching whose
// numbers follow the exact scaling for a tube of conserved circulation.

import { path, scale, svg, slider, animate, fitCanvas, onResize, r1 } from './viz.js';

const ACCENT = '#007bb2';
const FAINT = '#a7a4a0';
const RULE = '#e2dfdb';
const PAPER = '#fbfaf7';

/** Fig 01: tracer particles in the Taylor-Green vortex. */
function figFlow() {
  const canvas = document.getElementById('fig-flow');
  const peakOut = document.getElementById('peak');
  const TAU = Math.PI * 2;
  const TRAIL = 14;

  let ctx, w, h, unit, cols, particles = [];
  let viscosity = 0.035;
  let clock = 0, last = 0;

  const seed = () => {
    const count = Math.round(Math.min(1400, Math.max(420, w * 1.15)));
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({ x: Math.random() * cols, y: Math.random() * TAU, trail: [] });
    }
    clock = 0;
    last = 0;
  };

  const layout = () => {
    ({ ctx, w, h } = fitCanvas(canvas));
    unit = h / TAU;          // pixels per radian, so one cell is 2pi across
    cols = w / unit;         // how many radians of x fit on the canvas
    if (!particles.length) seed();
  };

  // Velocity of the exact solution at (x, y), already scaled by the decay.
  const velocity = (x, y, decay) => [
    Math.sin(x) * Math.cos(y) * decay,
    -Math.cos(x) * Math.sin(y) * decay,
  ];

  const draw = (elapsed) => {
    const dt = Math.min(elapsed - last, 0.05);
    last = elapsed;
    clock += dt;
    const decay = Math.exp(-2 * viscosity * clock);
    peakOut.textContent = `${Math.round(decay * 100)}%`;

    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, w, h);

    // The cell boundaries, where the flow is momentarily still.
    ctx.strokeStyle = RULE;
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= cols + 1; gx += Math.PI) {
      ctx.beginPath();
      ctx.moveTo(gx * unit, 0); ctx.lineTo(gx * unit, h); ctx.stroke();
    }
    for (let gy = 0; gy <= TAU; gy += Math.PI) {
      ctx.beginPath();
      ctx.moveTo(0, gy * unit); ctx.lineTo(w, gy * unit); ctx.stroke();
    }

    for (const p of particles) {
      // Midpoint step. dt is scaled up so the motion reads at this size.
      const step = dt * 1.6;
      const [u1, v1] = velocity(p.x, p.y, decay);
      const [u2, v2] = velocity(p.x + u1 * step * 0.5, p.y + v1 * step * 0.5, decay);
      p.x += u2 * step;
      p.y += v2 * step;
      if (p.x < 0) p.x += cols; else if (p.x > cols) p.x -= cols;
      if (p.y < 0) p.y += TAU; else if (p.y > TAU) p.y -= TAU;

      const speed = Math.hypot(u2, v2);
      p.trail.push([p.x * unit, p.y * unit]);
      if (p.trail.length > TRAIL) p.trail.shift();

      // A trail that wrapped the domain would draw a line across the canvas.
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < p.trail.length; i++) {
        const [ax, ay] = p.trail[i - 1], [bx, by] = p.trail[i];
        if (Math.abs(bx - ax) > w / 2 || Math.abs(by - ay) > h / 2) continue;
        ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
      }
      ctx.globalAlpha = 0.1 + 0.35 * Math.min(1, speed * 1.6);
      ctx.stroke();

      ctx.globalAlpha = 0.25 + 0.75 * Math.min(1, speed * 1.8);
      ctx.fillStyle = speed > 0.12 ? ACCENT : FAINT;
      ctx.beginPath();
      ctx.arc(p.x * unit, p.y * unit, 1.7, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  layout();
  onResize(() => { layout(); });
  slider('visc', (v) => { viscosity = v / 1000; });
  document.getElementById('restir').addEventListener('click', seed);
  animate(canvas, draw);
}

/** Fig 02: a vortex tube stretched along its axis. */
function figStretch() {
  const node = document.getElementById('fig-stretch');
  const spinOut = document.getElementById('spin');
  const radiusOut = document.getElementById('radius');

  const cx = 520, cy = 160;
  const baseHalfLength = 90, baseRadius = 64;

  svg('path', { d: `M120,${cy} H920`, stroke: FAINT, 'stroke-width': 1, 'stroke-dasharray': '4 4', opacity: 0.7 }, node);
  // The outline the tube started at, kept for comparison.
  svg('rect', {
    x: cx - baseHalfLength, y: cy - baseRadius, width: baseHalfLength * 2, height: baseRadius * 2,
    fill: 'none', stroke: RULE, 'stroke-width': 1, 'stroke-dasharray': '3 4',
  }, node);
  svg('text', { x: cx - baseHalfLength, y: cy - baseRadius - 12, class: 'tick' }, node)
    .textContent = 'where it started';

  const body = svg('path', { fill: ACCENT, 'fill-opacity': 0.1, stroke: ACCENT, 'stroke-width': 1.4 }, node);
  const capL = svg('ellipse', { fill: 'none', stroke: ACCENT, 'stroke-width': 1.4 }, node);
  const capR = svg('ellipse', { fill: PAPER, stroke: ACCENT, 'stroke-width': 1.4 }, node);
  const bands = [0, 1, 2, 3, 4].map(() => svg('path', { fill: 'none', stroke: ACCENT, 'stroke-width': 1, opacity: 0.4 }, node));
  const arrowL = svg('path', { stroke: FAINT, 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round' }, node);
  const arrowR = svg('path', { stroke: FAINT, 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round' }, node);

  slider('stretch', (raw) => {
    const L = raw / 10;                    // stretch factor, 1 to 12
    const half = Math.min(baseHalfLength * L, 380);
    const radius = baseRadius / Math.sqrt(L);
    const capWidth = Math.max(7, radius * 0.34);

    body.setAttribute('d',
      `M${r1(cx - half)},${r1(cy - radius)} H${r1(cx + half)} ` +
      `A${r1(capWidth)},${r1(radius)} 0 0 1 ${r1(cx + half)},${r1(cy + radius)} ` +
      `H${r1(cx - half)} A${r1(capWidth)},${r1(radius)} 0 0 1 ${r1(cx - half)},${r1(cy - radius)} Z`);
    for (const [cap, x] of [[capL, cx - half], [capR, cx + half]]) {
      cap.setAttribute('cx', r1(x));
      cap.setAttribute('cy', cy);
      cap.setAttribute('rx', r1(capWidth));
      cap.setAttribute('ry', r1(radius));
    }
    bands.forEach((band, i) => {
      const x = cx - half + ((i + 1) / 6) * half * 2;
      band.setAttribute('d',
        `M${r1(x)},${r1(cy - radius)} A${r1(capWidth)},${r1(radius)} 0 0 0 ${r1(x)},${r1(cy + radius)}`);
    });

    // Circulation arrows on the near face, drawn once; the readout carries the rate.
    const sweep = (x, dir) => `M${r1(x)},${r1(cy - radius * 0.62)} ` +
      `A${r1(capWidth * 0.62)},${r1(radius * 0.62)} 0 0 ${dir} ${r1(x)},${r1(cy + radius * 0.62)}`;
    arrowL.setAttribute('d', sweep(cx - half, 1));
    arrowR.setAttribute('d', sweep(cx + half, 0));

    spinOut.textContent = `${L.toFixed(1)}×`;
    radiusOut.textContent = `${Math.round(100 / Math.sqrt(L))}%`;
  });
}

figFlow();
figStretch();

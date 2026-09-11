// Figures for the Navier-Stokes page.
//
// Figure 01 advects tracers through the exact Taylor-Green solution
//   u =  sin x cos y e^(-2vt)
//   v = -cos x sin y e^(-2vt)
// on a periodic domain. Figure 02 is a schematic of vortex stretching whose
// numbers follow the exact scaling for a tube of conserved circulation.

import { path, scale, svg, slider, animate, fitCanvas, onResize, r1 } from './viz.js';

const ACCENT = '#007bb2';
const INK = '#241e1a';
const MUTED = '#79736f';
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

/**
 * Fig 02: the collapsing core of the 2026 construction.
 *
 * Writing tau for the time left before the singular moment, the paper's core
 * has radial scale tau^(1/2) and axial scale tau^(1/2 - h), speeds of order
 * tau^(-1/2 - h) and core kinetic energy of order tau^(1/2 - 3h), for a fixed
 * h below 1/100. The readouts and the plotted curves use those exponents with
 * h = 0.005. The drawn proportions are exaggerated, as the paper's own
 * schematic is, because the true radius-to-height ratio is tau^h and barely
 * moves across the range a picture can hold.
 */
function figCollapse() {
  const node = document.getElementById('fig-collapse');
  const speedOut = document.getElementById('speed-out');
  const energyOut = document.getElementById('energy-out');

  const sup = (n) => String(n).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);

  const H = 0.005;
  const SPEED_EXP = -(0.5 + H);   // tau^(-1/2 - h)
  const ENERGY_EXP = 0.5 - 3 * H; // tau^(1/2 - 3h)
  const H_DRAWN = 0.06;           // the exaggerated aspect exponent, disclosed on the page
  const DECADES = 6;

  // Left panel: the core itself.
  const coreX = 250, coreY = 186;
  const R0 = 78, HALF0 = 132;

  svg('text', { x: 56, y: 32, class: 'serieslabel', fill: MUTED }, node)
    .textContent = 'the core, proportions exaggerated';
  svg('path', { d: `M${coreX},34 V338`, stroke: FAINT, 'stroke-width': 1, 'stroke-dasharray': '4 4', opacity: 0.6 }, node);
  svg('rect', {
    x: coreX - R0, y: coreY - HALF0, width: R0 * 2, height: HALF0 * 2,
    fill: 'none', stroke: RULE, 'stroke-width': 1, 'stroke-dasharray': '3 4',
  }, node);
  svg('text', { x: coreX - R0, y: coreY - HALF0 - 10, class: 'tick' }, node)
    .textContent = 'where it started';

  const body = svg('path', { fill: ACCENT, 'fill-opacity': 0.12, stroke: ACCENT, 'stroke-width': 1.5 }, node);
  const bands = [0, 1, 2].map(() => svg('ellipse', { fill: 'none', stroke: ACCENT, 'stroke-width': 1, opacity: 0.45 }, node));

  // Right panel: speed and energy against the time remaining.
  const x = scale(0, -DECADES, 600, 1000);
  const y = scale(-3.2, 3.2, 330, 44);

  for (const e of [-3, -2, -1, 0, 1, 2, 3]) {
    const py = r1(y(e));
    svg('path', { d: `M600,${py} H1000`, class: 'grid-line' }, node);
    svg('text', { x: 590, y: py + 4, 'text-anchor': 'end', class: 'tick' }, node)
      .textContent = e === 0 ? '1' : `10${e < 0 ? '⁻' : ''}${sup(Math.abs(e))}`;
  }
  for (const d of [0, 2, 4, 6]) {
    svg('text', { x: r1(x(-d)), y: 352, 'text-anchor': 'middle', class: 'tick' }, node)
      .textContent = d === 0 ? 'τ = 1' : `10⁻${sup(d)}`;
  }
  svg('text', { x: 600, y: 32, class: 'serieslabel', fill: MUTED }, node)
    .textContent = 'time remaining before the singular moment';

  const line = (exp, color, width) => {
    const pts = [];
    for (let d = 0; d <= DECADES; d += 0.05) pts.push([x(-d), y(-d * exp)]);
    return svg('path', { d: path(pts), stroke: color, 'stroke-width': width, fill: 'none' }, node);
  };
  line(SPEED_EXP, ACCENT, 2);
  line(ENERGY_EXP, INK, 1.5);
  svg('text', { x: 1000, y: r1(y(DECADES * -SPEED_EXP)) - 12, 'text-anchor': 'end', class: 'serieslabel', fill: ACCENT }, node)
    .textContent = 'speed';
  svg('text', { x: 1000, y: r1(y(DECADES * -ENERGY_EXP)) + 20, 'text-anchor': 'end', class: 'serieslabel', fill: INK }, node)
    .textContent = 'core energy';

  const cursor = svg('path', { stroke: FAINT, 'stroke-width': 1, 'stroke-dasharray': '3 3', fill: 'none' }, node);
  const dotSpeed = svg('circle', { r: 4.5, fill: ACCENT }, node);
  const dotEnergy = svg('circle', { r: 4.5, fill: INK }, node);

  slider('tau', (raw) => {
    const decades = raw / 100;            // 0 to 6
    const tau = Math.pow(10, -decades);

    // Exact rates, for the readouts.
    const speed = Math.pow(tau, SPEED_EXP);
    const energy = Math.pow(tau, ENERGY_EXP);
    speedOut.textContent = speed < 10 ? `${speed.toFixed(1)}×` : `${Math.round(speed).toLocaleString('en-US')}×`;
    energyOut.textContent = energy >= 0.01
      ? `${(energy * 100).toFixed(energy > 0.1 ? 0 : 1)}%`
      : `${(energy * 100).toPrecision(2)}%`;

    // Drawn shape: an overall contraction, with the radius pulled in faster.
    const shrink = 1 - 0.76 * (decades / DECADES);
    const aspect = Math.pow(tau, H_DRAWN);
    const radius = Math.max(2.5, R0 * shrink * aspect);
    const half = Math.max(8, HALF0 * shrink);
    const cap = Math.max(2, radius * 0.32);

    body.setAttribute('d',
      `M${r1(coreX - radius)},${r1(coreY - half)} H${r1(coreX + radius)} ` +
      `A${r1(cap)},${r1(half)} 0 0 1 ${r1(coreX + radius)},${r1(coreY + half)} ` +
      `H${r1(coreX - radius)} A${r1(cap)},${r1(half)} 0 0 1 ${r1(coreX - radius)},${r1(coreY - half)} Z`);
    bands.forEach((band, i) => {
      band.setAttribute('cx', coreX);
      band.setAttribute('cy', r1(coreY - half + ((i + 1) / 4) * half * 2));
      band.setAttribute('rx', r1(radius));
      band.setAttribute('ry', r1(Math.max(1.5, radius * 0.3)));
    });

    const px = r1(x(-decades));
    cursor.setAttribute('d', `M${px},44 V330`);
    dotSpeed.setAttribute('cx', px);
    dotSpeed.setAttribute('cy', r1(y(-decades * SPEED_EXP)));
    dotEnergy.setAttribute('cx', px);
    dotEnergy.setAttribute('cy', r1(y(-decades * ENERGY_EXP)));
  });
}

figFlow();
figCollapse();

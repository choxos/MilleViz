// Figures for the Poincare Conjecture page.
//
// Figure 01 draws a sphere and a torus parametrically under a fixed tilt and
// tightens a loop on each. Figure 02 runs a genuine curve shortening flow.

import { svg, slider, toggle, animate, fitCanvas, onResize } from './viz.js';

const ACCENT = '#008889';
const FAINT = '#a7a4a0';
const RULE = '#e2dfdb';
const PAPER = '#fbfaf7';
const TAU = Math.PI * 2;

const TILT = 1.02; // radians; how far the surfaces are tipped toward the viewer

/** Orthographic projection after tipping about the x axis. */
function project(x, y, z) {
  const cos = Math.cos(TILT), sin = Math.sin(TILT);
  return [x, y * cos - z * sin, y * sin + z * cos]; // third value is depth
}

/** Fig 01: tighten a loop on a sphere, then try it on a doughnut. */
function figLoop() {
  const canvas = document.getElementById('fig-loop');
  const sizeOut = document.getElementById('loop-size');
  const note = document.getElementById('loop-note');

  const NOTES = {
    sphere: 'On the sphere the loop slides toward the pole and vanishes. Nothing is in its way.',
    torus: 'On the doughnut the loop slides to the innermost ring and stops. The hole is in the way, and no amount of tightening moves it. That single difference is what Poincar&eacute; was asking about.',
  };

  let ctx, w, h, scale, cx, cy;
  let surface = 'sphere';
  let t = 0; // 0 is the starting loop, 1 is as tight as it will go

  const layout = () => {
    ({ ctx, w, h } = fitCanvas(canvas));
    scale = Math.min(w / 3.1, h / 2.3);
    cx = w / 2;
    cy = h / 2;
  };

  const put = (x, y, z) => {
    const [px, py] = project(x, y, z);
    return [cx + px * scale, cy - py * scale];
  };

  const strokeLoop = (points, color, width) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.stroke();
  };

  const drawSphere = () => {
    const R = 0.92;
    ctx.strokeStyle = RULE;
    ctx.lineWidth = 1;
    for (let k = 1; k < 8; k++) {                       // lines of latitude
      const v = (k / 8) * Math.PI;
      const ring = [];
      for (let i = 0; i <= 60; i++) {
        const u = (i / 60) * TAU;
        ring.push(put(R * Math.sin(v) * Math.cos(u), R * Math.sin(v) * Math.sin(u), R * Math.cos(v)));
      }
      strokeLoop(ring, RULE, 1);
    }
    ctx.strokeStyle = FAINT;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, R * scale, 0, TAU);
    ctx.stroke();

    // The loop: a circle of latitude sliding to the pole.
    const v = (1 - t) * (Math.PI / 2) + t * 0.001;
    const ring = [];
    for (let i = 0; i <= 90; i++) {
      const u = (i / 90) * TAU;
      ring.push(put(R * Math.sin(v) * Math.cos(u), R * Math.sin(v) * Math.sin(u), R * Math.cos(v)));
    }
    strokeLoop(ring, ACCENT, 2.4);
    return Math.sin(v); // radius, as a fraction of the starting radius
  };

  const drawTorus = () => {
    const R = 0.74, r = 0.3;
    const point = (u, v) => put(
      (R + r * Math.cos(v)) * Math.cos(u),
      (R + r * Math.cos(v)) * Math.sin(u),
      r * Math.sin(v),
    );
    ctx.strokeStyle = RULE;
    ctx.lineWidth = 1;
    for (let k = 0; k < 28; k++) {                      // tube cross sections
      const u = (k / 28) * TAU;
      const ring = [];
      for (let i = 0; i <= 26; i++) ring.push(point(u, (i / 26) * TAU));
      strokeLoop(ring, RULE, 1);
    }
    for (const v of [0, Math.PI]) {                     // outer and inner equators
      const ring = [];
      for (let i = 0; i <= 90; i++) ring.push(point((i / 90) * TAU, v));
      strokeLoop(ring, FAINT, 1.2);
    }

    // The loop runs the long way around the hole. Tightening slides it from
    // the outer equator to the inner one, where it can go no further.
    const v = t * Math.PI;
    const ring = [];
    for (let i = 0; i <= 120; i++) ring.push(point((i / 120) * TAU, v));
    strokeLoop(ring, ACCENT, 2.4);

    if (t > 0.985) {
      ctx.fillStyle = ACCENT;
      ctx.font = '500 13px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('STUCK', cx, cy + (R + r + 0.22) * scale * Math.sin(TILT) + 8);
    }
    return (R + r * Math.cos(v)) / (R + r);
  };

  const draw = () => {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, w, h);
    const fraction = surface === 'sphere' ? drawSphere() : drawTorus();
    sizeOut.textContent = `${Math.round(fraction * 100)}%`;
  };

  layout();
  onResize(() => { layout(); draw(); });
  toggle('surface', (value) => {
    surface = value;
    note.innerHTML = NOTES[value];
    draw();
  });
  slider('tighten', (v) => { t = v / 100; draw(); });
}

/**
 * Fig 02: curve shortening flow. Each point moves toward the average of its
 * neighbors, which is the discrete curvature vector, and the curve is rescaled
 * each step to hold its area so it stays on screen.
 */
function figCurveFlow() {
  const canvas = document.getElementById('fig-flow2');
  const roundOut = document.getElementById('roundness');
  const playBtn = document.getElementById('play');
  const N = 240;

  let ctx, w, h, points = [], running = true, targetArea = 0;

  const blob = () => {
    const lobes = 3 + Math.floor(Math.random() * 4);
    const phase = Math.random() * TAU;
    const wobble = 0.3 + Math.random() * 0.3;
    const lobes2 = 5 + Math.floor(Math.random() * 6);
    points = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * TAU;
      const radius = 1
        + wobble * Math.sin(lobes * a + phase)
        + 0.16 * Math.sin(lobes2 * a + phase * 2);
      points.push([Math.cos(a) * radius, Math.sin(a) * radius]);
    }
    targetArea = Math.abs(area());
  };

  const area = () => {
    let sum = 0;
    for (let i = 0; i < N; i++) {
      const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % N];
      sum += x1 * y2 - x2 * y1;
    }
    return sum / 2;
  };

  const perimeter = () => {
    let sum = 0;
    for (let i = 0; i < N; i++) {
      const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % N];
      sum += Math.hypot(x2 - x1, y2 - y1);
    }
    return sum;
  };

  const step = () => {
    const next = new Array(N);
    for (let i = 0; i < N; i++) {
      const a = points[(i - 1 + N) % N], b = points[i], c = points[(i + 1) % N];
      next[i] = [b[0] + 0.18 * (a[0] + c[0] - 2 * b[0]), b[1] + 0.18 * (a[1] + c[1] - 2 * b[1])];
    }
    points = next;
    const now = Math.abs(area());
    if (now > 1e-9) {
      const k = Math.sqrt(targetArea / now);
      points = points.map(([x, y]) => [x * k, y * k]);
    }
  };

  const layout = () => { ({ ctx, w, h } = fitCanvas(canvas)); };

  const draw = () => {
    const scale = Math.min(w, h) * 0.36;
    const cx = w / 2, cy = h / 2;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = RULE;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, Math.sqrt(targetArea / Math.PI) * scale, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach(([x, y], i) => {
      const px = cx + x * scale, py = cy - y * scale;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();

    const p = perimeter();
    const ratio = p > 0 ? (4 * Math.PI * Math.abs(area())) / (p * p) : 0;
    roundOut.textContent = `${Math.round(Math.min(1, ratio) * 100)}%`;
  };

  blob();
  layout();
  onResize(() => { layout(); draw(); });
  playBtn.addEventListener('click', () => {
    running = !running;
    playBtn.textContent = running ? 'Pause' : 'Play';
  });
  document.getElementById('newblob').addEventListener('click', () => {
    blob();
    if (!running) draw();
  });

  draw(); // so the readout is filled before the loop starts, or if it never does
  animate(canvas, () => {
    if (running) for (let i = 0; i < 2; i++) step();
    draw();
  });
}

figLoop();
figCurveFlow();

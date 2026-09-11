// Figures for the Yang-Mills page.

import { path, scale, svg, xTicks, slider, toggle, r1 } from './viz.js';

const ACCENT = '#38853e';
const INK = '#241e1a';
const MUTED = '#79736f';
const FAINT = '#a7a4a0';
const RULE_2 = '#efece9';

/** Glueball masses in GeV, from lattice computations. */
const GLUEBALLS = [
  { m: 1.73, label: '0⁺⁺  lightest glueball' },
  { m: 2.40, label: '2⁺⁺' },
  { m: 2.59, label: '0⁻⁺' },
  { m: 2.94, label: '1⁺⁻' },
  { m: 3.10, label: '2⁻⁺' },
  { m: 3.37, label: '3⁺⁺' },
];

/** Fig 01: a spectrum with a floor, against one without. */
function figSpectrum() {
  const node = document.getElementById('fig-spectrum');
  const gapOut = document.getElementById('gap-out');
  const note = document.getElementById('spectrum-note');
  const y = scale(0, 3.8, 330, 40);

  const NOTES = {
    qcd: 'The levels drawn are glueball masses computed on a lattice, in giga electron volts. They are numerical results from simulations, not theorems, which is exactly the situation the prize is meant to fix.',
    em: 'With a massless carrier there is no lowest excitation. Whatever energy you name, the theory contains a state below it, so the spectrum runs continuously all the way down to the vacuum. No gap, and a force that reaches across the universe.',
  };

  // Axis.
  svg('path', { d: 'M150,40 V330', class: 'axis-line' }, node);
  for (let e = 0; e <= 3.5; e += 0.5) {
    const py = r1(y(e));
    svg('path', { d: `M144,${py} H150`, class: 'axis-line' }, node);
    svg('text', { x: 136, y: py + 4, 'text-anchor': 'end', class: 'tick' }, node)
      .textContent = e.toFixed(1);
  }
  svg('text', { x: 136, y: 24, 'text-anchor': 'end', class: 'tick', fill: MUTED }, node)
    .textContent = 'GeV';

  // The vacuum, which both theories share.
  svg('path', { d: `M150,${r1(y(0))} H960`, stroke: INK, 'stroke-width': 2 }, node);
  svg('text', { x: 970, y: r1(y(0)) + 4, class: 'serieslabel', fill: INK }, node)
    .textContent = 'vacuum';

  const continuum = svg('g', {}, node);
  svg('rect', {
    x: 150, y: 40, width: 620, height: r1(y(0) - 40),
    fill: ACCENT, 'fill-opacity': 0.14,
  }, continuum);
  for (let e = 0.08; e < 3.8; e += 0.16) {
    svg('path', { d: `M150,${r1(y(e))} H770`, stroke: ACCENT, 'stroke-width': 1, opacity: 0.28 }, continuum);
  }
  svg('text', { x: 782, y: r1(y(1.8)), class: 'serieslabel', fill: ACCENT }, continuum)
    .textContent = 'states all the way down';

  const gapped = svg('g', {}, node);
  svg('rect', {
    x: 150, y: r1(y(1.73)), width: 620, height: r1(y(0) - y(1.73)),
    fill: RULE_2,
  }, gapped);
  svg('text', { x: 460, y: r1(y(0.85)), 'text-anchor': 'middle', class: 'serieslabel', fill: MUTED }, gapped)
    .textContent = 'nothing here';
  // The gap bracket.
  svg('path', {
    d: `M810,${r1(y(0))} V${r1(y(1.73))} M804,${r1(y(0))} H816 M804,${r1(y(1.73))} H816`,
    stroke: ACCENT, 'stroke-width': 1.2, fill: 'none',
  }, gapped);
  svg('text', { x: 824, y: r1(y(0.86)) + 4, class: 'serieslabel', fill: ACCENT }, gapped)
    .textContent = 'the mass gap';
  for (const state of GLUEBALLS) {
    const py = r1(y(state.m));
    svg('path', { d: `M150,${py} H770`, stroke: ACCENT, 'stroke-width': 1.8 }, gapped);
    svg('text', { x: 782, y: py + 4, class: 'serieslabel', fill: state.m === 1.73 ? ACCENT : MUTED }, gapped)
      .textContent = state.label;
  }

  toggle('theory', (value) => {
    const isGapped = value === 'qcd';
    gapped.setAttribute('display', isGapped ? 'inline' : 'none');
    continuum.setAttribute('display', isGapped ? 'none' : 'inline');
    gapOut.textContent = isGapped ? '1.73' : '0';
    note.textContent = NOTES[value];
  });
}

/** Fig 02: how far a force reaches, as a function of its carrier's mass. */
function figReach() {
  const node = document.getElementById('fig-reach');
  const massOut = document.getElementById('mass-out');
  const reachOut = document.getElementById('reach-out');

  const HBARC = 0.1973;      // GeV femtometer
  const R0 = 0.1, R1 = 3.0;  // femtometers
  const x = scale(R0, R1, 56, 1020);
  const y = scale(-6, 1.2, 286, 30); // log10 of the correlation

  for (let e = 1; e >= -6; e -= 1) {
    const py = r1(y(e));
    svg('path', { d: `M56,${py} H1020`, class: 'grid-line' }, node);
    svg('text', { x: 40, y: py + 4, 'text-anchor': 'end', class: 'tick' }, node)
      .textContent = e === 0 ? '1' : `10${e < 0 ? '⁻' : ''}${String(Math.abs(e)).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`;
  }
  xTicks(node, [0.1, 1, 2, 3], x, 314, (v) => `${v} fm`);

  const sample = [];
  for (let r = R0; r <= R1 + 1e-9; r += 0.01) sample.push(r);

  // Massless reference: the Coulomb form, normalised to 1 at r = R0.
  svg('path', {
    d: path(sample.map((r) => [x(r), y(Math.log10(R0 / r))])),
    stroke: FAINT, 'stroke-width': 1.4, fill: 'none',
  }, node);
  svg('text', { x: 1012, y: r1(y(Math.log10(R0 / R1))) - 12, 'text-anchor': 'end', class: 'serieslabel', fill: FAINT }, node)
    .textContent = 'massless: 1 / r';

  const curve = svg('path', { stroke: ACCENT, 'stroke-width': 2, fill: 'none' }, node);
  const marker = svg('path', { stroke: ACCENT, 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.6, fill: 'none' }, node);
  const label = svg('text', { class: 'serieslabel', fill: ACCENT }, node);

  slider('mass', (raw) => {
    const m = raw / 100;                 // GeV
    const mu = m / HBARC;                // inverse femtometers
    massOut.textContent = m.toFixed(2);

    const points = sample.map((r) => {
      const value = Math.exp(-mu * (r - R0)) * (R0 / r);
      return [x(r), y(Math.max(-6.4, Math.log10(value)))];
    });
    curve.setAttribute('d', path(points));

    // Where the correlation has fallen to one percent of its value at R0.
    let reach = null;
    for (const r of sample) {
      if (Math.exp(-mu * (r - R0)) * (R0 / r) < 0.01) { reach = r; break; }
    }
    if (reach === null) {
      reachOut.textContent = 'past 3';
      marker.setAttribute('d', '');
      label.textContent = '';
    } else {
      reachOut.textContent = reach.toFixed(2);
      marker.setAttribute('d', `M${r1(x(reach))},30 V286`);
      label.setAttribute('x', r1(x(reach)) + 8);
      label.setAttribute('y', 44);
      label.textContent = `1% at ${reach.toFixed(2)} fm`;
    }
  });
}

figSpectrum();
figReach();

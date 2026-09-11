// Figures for the Hodge Conjecture page.
//
// Figure 01 draws published Hodge diamonds. Figure 02 is an honest schematic:
// a fixed lattice of rational classes and a subspace that turns with the
// complex structure, catching a different set of them as it goes.

import { svg, slider, toggle, r1 } from './viz.js';

const ACCENT = '#9256a0';
const INK = '#241e1a';
const MUTED = '#79736f';
const FAINT = '#a7a4a0';
const RULE = '#e2dfdb';

/** Hodge numbers h^{p,q}, as rows of the diamond from k = 0 upward. */
const VARIETIES = {
  p2: {
    name: 'the projective plane',
    rows: [[1], [0, 0], [0, 1, 0], [0, 0], [1]],
    note: 'The simplest interesting case. Every hole sits on the p = q column already, and each one is accounted for by an obvious subvariety: a line, and the plane itself.',
  },
  k3: {
    name: 'a K3 surface',
    rows: [[1], [0, 0], [1, 20, 1], [0, 0], [1]],
    note: 'Twenty independent classes in the middle, and the (2, 0) and (0, 2) entries on either side of them are what makes the sorting move when you deform the surface. How many of the twenty count as Hodge classes depends on which K3 surface you picked: for most of them it is one, and for special ones it is as many as twenty.',
  },
  ab: {
    name: 'an abelian surface',
    rows: [[1], [2, 2], [1, 4, 1], [2, 2], [1]],
    note: 'A four-dimensional torus with a complex structure. Its Hodge numbers are binomial coefficients, and the number of its middle classes that are algebraic jumps from one to four as the complex structure hits special values. This is the smallest place the phenomenon in figure 02 actually happens.',
  },
  quintic: {
    name: 'the quintic threefold',
    rows: [[1], [0, 0], [0, 1, 0], [1, 101, 101, 1], [0, 1, 0], [0, 0], [1]],
    note: 'A three-dimensional variety, so the diamond has a genuinely interesting middle row. The 101 is famous: matching it against the 1 on the mirror side is where mirror symmetry started. The conjecture here concerns the (2, 2) classes, which is exactly the first case nobody can settle.',
  },
};

/** Fig 01: the diamond. */
function figDiamond() {
  const node = document.getElementById('fig-diamond');
  const out = document.getElementById('pp-out');
  const note = document.getElementById('diamond-note');
  const layer = svg('g', {}, node);

  const draw = (key) => {
    layer.textContent = '';
    const { rows, note: text } = VARIETIES[key];
    const n = rows.length - 1;               // 2 * complex dimension
    const stepX = Math.min(300, 1120 / n);
    const stepY = Math.min(95, 352 / n);
    const originX = 520;
    const originY = 46;

    let diagonal = 0;
    rows.forEach((row, k) => {
      const cy = originY + k * stepY;
      row.forEach((value, i) => {
        // Within row k the entries are h^{p,q} with p from max(0,k-dim) upward.
        const dim = n / 2;
        const p = Math.max(0, k - dim) + i;
        const q = k - p;
        const cx = originX + (p - q) * (stepX / 2);
        const isDiagonal = p === q;
        if (isDiagonal) diagonal += value;

        if (isDiagonal && value) {
          svg('circle', { cx: r1(cx), cy: r1(cy), r: 21, fill: ACCENT, 'fill-opacity': 0.13 }, layer);
        }
        const cell = value
          ? svg('text', {
              x: r1(cx), y: r1(cy) + 6, 'text-anchor': 'middle', class: 'serieslabel',
              fill: isDiagonal ? ACCENT : INK, 'font-size': 17,
            }, layer)
          : svg('circle', { cx: r1(cx), cy: r1(cy), r: 2.5, fill: 'none', stroke: RULE, 'stroke-width': 1 }, layer);
        if (value) cell.textContent = String(value);
        svg('title', {}, cell).textContent = `h^{${p},${q}} = ${value}`;
      });
    });

    // The p = q column, marked.
    svg('path', {
      d: `M${originX},${originY - 32} V${r1(originY + n * stepY + 30)}`,
      stroke: ACCENT, 'stroke-width': 1, 'stroke-dasharray': '4 4', opacity: 0.45,
    }, layer);
    svg('text', {
      x: originX, y: r1(originY + n * stepY + 50), 'text-anchor': 'middle',
      class: 'serieslabel', fill: ACCENT,
    }, layer).textContent = 'p = q';

    out.textContent = String(diagonal);
    note.textContent = text;
  };

  toggle('variety', draw);
}

/**
 * Fig 02: a fixed lattice of rational classes, and a subspace that turns as the
 * complex structure deforms. A lattice point is caught when it lies within a
 * small tolerance of the subspace, so a rational direction catches a whole
 * family at once and everything else catches only the origin.
 */
function figLattice() {
  const node = document.getElementById('fig-lattice');
  const out = document.getElementById('hodge-count');

  const RANGE = 7;             // lattice runs from -RANGE to RANGE in both axes
  const cx = 600, cy = 210;
  const unit = 26;
  const TOL = 0.02;            // how close to the line counts as on it

  const dots = [];
  for (let i = -RANGE; i <= RANGE; i++) {
    for (let j = -RANGE; j <= RANGE; j++) {
      const px = cx + i * unit, py = cy - j * unit;
      if (py < 26 || py > 394) continue;
      const dot = svg('circle', { cx: px, cy: py, r: 3, fill: FAINT, 'fill-opacity': 0.4 }, node);
      dots.push({ i, j, dot });
    }
  }

  const line = svg('path', { stroke: ACCENT, 'stroke-width': 1.6, fill: 'none' }, node);
  const band = svg('path', { fill: ACCENT, 'fill-opacity': 0.08, stroke: 'none' }, node);

  // Legend, in the space the lattice cannot use.
  const legend = [
    ['dot', FAINT, 'a rational class'],
    ['dot-on', ACCENT, 'a Hodge class: it sits in the (p, p) part'],
    ['line', ACCENT, 'the (p, p) part, which turns as the shape deforms'],
  ];
  legend.forEach(([kind, color, text], i) => {
    const ly = 150 + i * 34;
    if (kind === 'line') {
      svg('path', { d: `M62,${ly} H86`, stroke: color, 'stroke-width': 1.6 }, node);
    } else {
      svg('circle', {
        cx: 74, cy: ly, r: kind === 'dot-on' ? 5 : 3,
        fill: color, 'fill-opacity': kind === 'dot-on' ? 1 : 0.4,
      }, node);
    }
    svg('text', { x: 98, y: ly + 4, class: 'tick', fill: MUTED }, node).textContent = text;
  });
  const caught = svg('text', { x: 62, y: 276, class: 'serieslabel', fill: ACCENT }, node);

  slider('deform', (raw) => {
    const angle = (raw / 200) * Math.PI;          // the direction of the subspace
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const nx = -dy, ny = dx;                      // its normal

    const reach = 212;
    line.setAttribute('d', `M${r1(cx - dx * reach)},${r1(cy + dy * reach)} L${r1(cx + dx * reach)},${r1(cy - dy * reach)}`);
    const ox = nx * TOL * unit, oy = -ny * TOL * unit;
    band.setAttribute('d',
      `M${r1(cx - dx * reach + ox)},${r1(cy + dy * reach + oy)} ` +
      `L${r1(cx + dx * reach + ox)},${r1(cy - dy * reach + oy)} ` +
      `L${r1(cx + dx * reach - ox)},${r1(cy - dy * reach - oy)} ` +
      `L${r1(cx - dx * reach - ox)},${r1(cy + dy * reach - oy)} Z`);

    let count = 0;
    for (const { i, j, dot } of dots) {
      const distance = Math.abs(i * nx + j * ny);
      const on = distance < TOL;
      if (on) count += 1;
      dot.setAttribute('r', on ? 5 : 3);
      dot.setAttribute('fill', on ? ACCENT : FAINT);
      dot.setAttribute('fill-opacity', on ? 1 : 0.4);
    }
    out.textContent = String(count);
    caught.textContent = count > 1
      ? 'lined up: a whole family qualifies'
      : 'only the origin qualifies';
  });
}

figDiamond();
figLattice();

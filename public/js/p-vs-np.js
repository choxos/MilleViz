// Figures for the P versus NP page.

import { path, scale, svg, hGrid, xTicks, slider, r1 } from './viz.js';

const ACCENT = '#4c6ebd';
const INK = '#241e1a';
// (muted tone is set in CSS for this page)
const FAINT = '#a7a4a0';
const RULE = '#e2dfdb';

/** Exact below 2^53, a decimal exponent above it. */
function bigCount(exponent) {
  if (exponent < 53) return Math.pow(2, exponent).toLocaleString('en-US');
  const log10 = exponent * Math.LOG10E * Math.LN2;
  const power = Math.floor(log10);
  const mantissa = Math.pow(10, log10 - power).toFixed(1);
  return `${mantissa} × 10^${power}`;
}

/** Seconds as something a person can picture. */
function humanTime(seconds) {
  const units = [
    [1, 'second'], [60, 'minute'], [3600, 'hour'], [86400, 'day'],
    [31557600, 'year'], [31557600e3, 'thousand years'], [31557600e6, 'million years'],
    [31557600e9, 'billion years'],
  ];
  if (seconds < 1) return 'under a second';
  if (seconds > 31557600e9 * 100) return 'longer than the universe has existed, many times over';
  let best = units[0];
  for (const u of units) if (seconds >= u[0]) best = u;
  const n = seconds / best[0];
  const shown = n >= 100 ? Math.round(n).toLocaleString('en-US') : n.toFixed(1);
  const name = best[1].includes(' ') ? best[1] : best[1] + (n >= 2 ? 's' : '');
  return `${shown} ${name}`;
}

/** Fig 01: n squared against 2 to the n, on a log axis. */
function figGrowth() {
  const node = document.getElementById('fig-growth');
  const out = document.getElementById('size-out');
  const statCheck = document.getElementById('stat-check');
  const statSearch = document.getElementById('stat-search');
  const statTime = document.getElementById('stat-time');

  const MAX_N = 60;
  const x = scale(0, MAX_N, 56, 1020);
  const y = scale(0, 18, 296, 30); // decimal exponent

  const decades = [0, 3, 6, 9, 12, 15, 18];
  const names = { 0: '1', 3: 'thousand', 6: 'million', 9: 'billion', 12: 'trillion', 15: 'quadrillion', 18: 'quintillion' };
  hGrid(node, decades, 56, 1020, y, (v) => names[v]);
  xTicks(node, [0, 15, 30, 45, 60], x, 324, (v) => `n = ${v}`);

  const search = [], check = [];
  for (let n = 1; n <= MAX_N; n += 0.5) {
    search.push([x(n), y(n * Math.LOG10E * Math.LN2)]);
    check.push([x(n), y(Math.max(0, 2 * Math.log10(n)))]);
  }
  svg('path', { d: path(search), stroke: ACCENT, 'stroke-width': 2, fill: 'none' }, node);
  svg('path', { d: path(check), stroke: INK, 'stroke-width': 1.6, fill: 'none' }, node);

  svg('text', { x: 1012, y: 48, 'text-anchor': 'end', class: 'serieslabel', fill: ACCENT }, node)
    .textContent = 'searching: 2ⁿ';
  svg('text', { x: 1012, y: r1(y(2 * Math.log10(MAX_N))) - 12, 'text-anchor': 'end', class: 'serieslabel', fill: INK }, node)
    .textContent = 'checking: n²';

  const rule = svg('path', { stroke: ACCENT, 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.55 }, node);
  const dotSearch = svg('circle', { r: 4.5, fill: ACCENT }, node);
  const dotCheck = svg('circle', { r: 4.5, fill: INK }, node);

  slider('size', (n) => {
    const px = r1(x(n));
    rule.setAttribute('d', `M${px},30 V296`);
    dotSearch.setAttribute('cx', px);
    dotSearch.setAttribute('cy', r1(y(n * Math.LOG10E * Math.LN2)));
    dotCheck.setAttribute('cx', px);
    dotCheck.setAttribute('cy', r1(y(Math.max(0, 2 * Math.log10(n)))));

    out.textContent = String(n);
    statCheck.textContent = `${(n * n).toLocaleString('en-US')} steps`;
    statSearch.textContent = `${bigCount(n)} combinations`;
    const seconds = Math.pow(2, n) / 1e9;
    statTime.textContent = humanTime(seconds);
    statTime.classList.toggle('hot', seconds > 31557600);
  });
}

/**
 * Fig 02: subset sum. Fourteen fixed numbers; the target is the sum of a real
 * subset, so a solution is guaranteed to exist.
 */
function figSubsetSum() {
  const NUMBERS = [267, 493, 682, 869, 961, 1153, 1246, 1400, 1598, 1775, 1942, 2136, 2411, 2688];
  const SOLUTION = [1, 4, 6, 9, 12]; // indices whose sum is the target
  const TARGET = SOLUTION.reduce((a, i) => a + NUMBERS[i], 0);

  const chips = document.getElementById('chips');
  const sumOut = document.getElementById('sum');
  const triedOut = document.getElementById('tried');
  const verdict = document.getElementById('verdict');
  const searchBtn = document.getElementById('search');
  const resetBtn = document.getElementById('reset');
  document.getElementById('target').textContent = TARGET.toLocaleString('en-US');

  let picked = new Set();
  let running = false;

  const buttons = NUMBERS.map((value, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = value.toLocaleString('en-US');
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      if (running) return;
      if (picked.has(i)) picked.delete(i); else picked.add(i);
      render();
    });
    chips.appendChild(b);
    return b;
  });

  function render(message) {
    let sum = 0;
    for (const i of picked) sum += NUMBERS[i];
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(picked.has(i)));
    }
    sumOut.textContent = sum.toLocaleString('en-US');
    const hit = sum === TARGET && picked.size > 0;
    sumOut.classList.toggle('hit', hit);
    verdict.classList.toggle('hit', hit);
    if (message) verdict.textContent = message;
    else if (hit) verdict.textContent = 'That is the target. Thirteen additions confirmed it, and it took you however long it took you. That gap is the whole problem.';
    else if (picked.size === 0) verdict.textContent = 'Click numbers to add them up.';
    else verdict.textContent = `${sum > TARGET ? 'Over' : 'Under'} by ${Math.abs(TARGET - sum).toLocaleString('en-US')}.`;
  }

  /** Walk every selection in counting order, a slice per frame so the page stays live. */
  function runSearch() {
    if (running) return;
    running = true;
    searchBtn.disabled = true;
    const total = 1 << NUMBERS.length;
    let mask = 1;

    const stepBatch = () => {
      const deadline = performance.now() + 12;
      while (mask < total) {
        let sum = 0;
        for (let i = 0; i < NUMBERS.length; i++) if (mask & (1 << i)) sum += NUMBERS[i];
        if (sum === TARGET) {
          picked = new Set([...NUMBERS.keys()].filter((i) => mask & (1 << i)));
          triedOut.textContent = mask.toLocaleString('en-US');
          render(`Found after ${mask.toLocaleString('en-US')} of ${total.toLocaleString('en-US')} combinations. Checking this one answer took thirteen additions.`);
          running = false;
          searchBtn.disabled = false;
          return;
        }
        mask += 1;
        if (performance.now() > deadline) break;
      }
      triedOut.textContent = mask.toLocaleString('en-US');
      picked = new Set([...NUMBERS.keys()].filter((i) => mask & (1 << i)));
      render('Searching.');
      if (mask < total) requestAnimationFrame(stepBatch);
      else { running = false; searchBtn.disabled = false; }
    };
    requestAnimationFrame(stepBatch);
  }

  searchBtn.addEventListener('click', runSearch);
  resetBtn.addEventListener('click', () => {
    if (running) return;
    picked = new Set();
    triedOut.textContent = '0';
    render();
  });
  render();
}

/** Fig 03: the reduction web, drawn. */
function figReduce() {
  const node = document.getElementById('fig-reduce');
  const boxes = [
    { id: 'sat', label: 'Satisfiability', sub: 'Cook, 1971', x: 30, y: 138 },
    { id: '3sat', label: '3-SAT', sub: 'Karp, 1972', x: 380, y: 138 },
    { id: 'clique', label: 'Clique', sub: '', x: 740, y: 24 },
    { id: 'vc', label: 'Vertex cover', sub: '', x: 740, y: 102 },
    { id: 'sum', label: 'Subset sum', sub: 'figure 02', x: 740, y: 180 },
    { id: 'ham', label: 'Hamiltonian cycle', sub: '', x: 740, y: 258 },
  ];
  const W = 250, H = 58;

  for (const b of boxes) {
    svg('rect', {
      x: b.x, y: b.y, width: W, height: H, rx: 2,
      fill: b.id === 'sat' ? '#e5efff' : 'none', stroke: b.id === 'sat' ? ACCENT : RULE,
      'stroke-width': 1,
    }, node);
    svg('text', {
      x: b.x + 18, y: b.y + (b.sub ? 26 : 34), class: 'serieslabel',
      fill: b.id === 'sat' ? ACCENT : INK, 'font-size': 13,
    }, node).textContent = b.label;
    if (b.sub) {
      svg('text', { x: b.x + 18, y: b.y + 44, class: 'tick' }, node).textContent = b.sub;
    }
  }

  const arrow = (from, to) => {
    const a = boxes.find((b) => b.id === from), z = boxes.find((b) => b.id === to);
    const x0 = a.x + W + 6, y0 = a.y + H / 2;
    const x1 = z.x - 12, y1 = z.y + H / 2;
    const mid = x0 + (x1 - x0) * 0.55;
    svg('path', {
      d: `M${x0},${y0} C${mid},${y0} ${mid},${y1} ${x1},${y1}`,
      stroke: FAINT, 'stroke-width': 1.1, fill: 'none',
    }, node);
    svg('path', {
      d: `M${x1 - 5},${y1 - 4} L${x1 + 1},${y1} L${x1 - 5},${y1 + 4}`,
      stroke: FAINT, 'stroke-width': 1.1, fill: 'none', 'stroke-linejoin': 'round',
    }, node);
  };
  arrow('sat', '3sat');
  for (const t of ['clique', 'vc', 'sum', 'ham']) arrow('3sat', t);

}

figGrowth();
figSubsetSum();
figReduce();

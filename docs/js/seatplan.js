/* CTAdmin – seat plan: layout model, presets, seat ordering, rendering

   Layout = { name, label, startRoll, count, rows, cols, walkways, skipAlternate, blocked, podium }
     rows × cols   physical seat grid (cols = seat positions per bench row, including skipped ones)
     walkways      aisle after seat position n (1-based), e.g. [6]
     skipAlternate leave every other seat position empty (exam spacing)
     blocked       unusable seats as "row-col" (0-based, from top-left)
     podium        'top' | 'bottom' | 'none'
   Fill options (side, start row, pattern, random seed) are plan-wide and live in prefs.plan. */

const BUILTIN = {};
[['A', 1], ['B', 66], ['C', 131]].forEach(([s, st]) => {
  const base = { rows: 6, cols: 12, walkways: [6], blocked: [], podium: 'top' };
  BUILTIN[s]       = { ...base, name: `${s} (${st}–${st + 64})`, label: `Section ${s}`, startRoll: st, count: 65, skipAlternate: false };
  BUILTIN[s + '1'] = { ...base, name: `${s}1 (${st}–${st + 32})`, label: `Section ${s}1`, startRoll: st, count: 33, skipAlternate: true };
  BUILTIN[s + '2'] = { ...base, name: `${s}2 (${st + 33}–${st + 64})`, label: `Section ${s}2`, startRoll: st + 33, count: 32, skipAlternate: true };
});

const LIMITS = { rows: [1, 40], cols: [1, 40], count: [1, 1600], startRoll: [0, 999999999] };
const toInt = (v, [lo, hi], d) => { const n = Math.round(Number(v)); return v !== '' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
const parseWalkways = v => (Array.isArray(v) ? v : String(v ?? '').split(/[\s,;]+/)).map(Number).filter(Number.isInteger);

function normalizeLayout(src = {}) {
  const rows = toInt(src.rows, LIMITS.rows, 6), cols = toInt(src.cols, LIMITS.cols, 12);
  return {
    name:  String(src.name || src.label || 'My layout').trim().slice(0, 60),
    label: String(src.label ?? '').trim().slice(0, 60),
    startRoll: toInt(src.startRoll, LIMITS.startRoll, 1),
    count: toInt(src.count, LIMITS.count, 1),
    rows, cols,
    walkways: [...new Set(parseWalkways(src.walkways).filter(n => n > 0 && n < cols))].sort((a, b) => a - b),
    skipAlternate: !!src.skipAlternate,
    blocked: [...new Set((Array.isArray(src.blocked) ? src.blocked : []).filter(k => {
      const m = /^(\d+)-(\d+)$/.exec(k); return m && +m[1] < rows && +m[2] < cols;
    }))],
    podium: ['top', 'bottom', 'none'].includes(src.podium) ? src.podium : 'top',
  };
}

const isSkipped = (L, c) => L.skipAlternate && c % 2 === 1;
const isUsable  = (L, r, c) => !isSkipped(L, c) && !L.blocked.includes(`${r}-${c}`);
function capacity(L) {
  let n = 0;
  for (let r = 0; r < L.rows; r++) for (let c = 0; c < L.cols; c++) if (isUsable(L, r, c)) n++;
  return n;
}
/* fewest rows that seat everyone with the current columns / spacing (blocked seats beyond the new rows are ignored) */
function rowsNeeded(L) {
  const perRow = [...Array(L.cols).keys()].filter(c => !isSkipped(L, c)).length || 1;
  let rows = Math.ceil(L.count / perRow);
  while (rows < LIMITS.rows[1] && capacity({ ...L, rows }) < L.count) rows++;
  return Math.min(rows, LIMITS.rows[1]);
}

/* Usable seats as [r, c] in numbering order. Serpentine alternates over lines that contain seats. */
function orderSeats(L, { side = 'left', start = 'top', pattern = 'raster' } = {}) {
  const rowIdx = [...Array(L.rows).keys()], colIdx = [...Array(L.cols).keys()];
  if (start === 'bottom') rowIdx.reverse();
  if (side === 'right') colIdx.reverse();
  const byCol = pattern.endsWith('-col'), serp = pattern.startsWith('serpentine');
  const outer = byCol ? colIdx : rowIdx, inner = byCol ? rowIdx : colIdx;
  const out = [];
  let line = 0;
  for (const a of outer) {
    const seats = inner.map(b => (byCol ? [b, a] : [a, b])).filter(([r, c]) => isUsable(L, r, c));
    if (!seats.length) continue;
    if (serp && line % 2) seats.reverse();
    out.push(...seats); line++;
  }
  return out;
}

function seededShuffle(arr, seed) {
  let s = seed >>> 0;
  const rnd = () => {                                  // mulberry32
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

const pad = n => (n < 10 ? '0' + n : String(n));
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

/* ---------- presets & selection ---------- */
prefs.plan    = prefs.plan || {};
prefs.layouts = prefs.layouts || {};
if (!prefs.layoutId && prefs.plan.sectionSelect) prefs.layoutId = prefs.plan.sectionSelect;   // Phase 2 → 3
delete prefs.plan.sectionSelect;
if (!BUILTIN[prefs.layoutId] && !prefs.layouts[prefs.layoutId]) prefs.layoutId = 'A';
if (!Number.isFinite(prefs.plan.seed)) prefs.plan.seed = (Math.random() * 2 ** 32) >>> 0;

const isBuiltin = id => Object.prototype.hasOwnProperty.call(BUILTIN, id);
const currentLayout = () => normalizeLayout(BUILTIN[prefs.layoutId] || prefs.layouts[prefs.layoutId]);
const newLayoutId = () => 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const layoutSelect = $id('layoutSelect');
function fillLayoutSelect() {
  const opt = (id, L) => `<option value="${esc(id)}">${esc(L.name)}</option>`;
  const mine = Object.entries(prefs.layouts).sort((a, b) => a[1].name.localeCompare(b[1].name));
  layoutSelect.innerHTML =
    `<optgroup label="Built-in">${Object.entries(BUILTIN).map(([id, L]) => opt(id, L)).join('')}</optgroup>` +
    (mine.length ? `<optgroup label="My layouts">${mine.map(([id, L]) => opt(id, L)).join('')}</optgroup>` : '');
  layoutSelect.value = prefs.layoutId;
}
function selectLayout(id) {
  prefs.layoutId = id; savePrefs();
  layoutSelect.value = id;
  setSeatEdit(false);
  renderPlan();
  document.dispatchEvent(new Event('layoutchange'));
}
/* store a custom layout (normalised) and redraw */
function saveLayout(id, L) {
  prefs.layouts[id] = normalizeLayout(L); savePrefs();
  const o = [...layoutSelect.options].find(o => o.value === id);
  if (o) o.textContent = prefs.layouts[id].name; else fillLayoutSelect();
  renderPlan();
}
layoutSelect.addEventListener('change', () => selectLayout(layoutSelect.value));

/* ---------- fill options ---------- */
const FILL_FIELDS = { startSide: 'side', startRow: 'start', pattern: 'pattern' };
Object.entries(FILL_FIELDS).forEach(([id, key]) => {
  const el = $id(id);
  const saved = prefs.plan[id] ?? prefs.plan[key];
  if (saved && [...el.options].some(o => o.value === saved)) el.value = saved;
  el.addEventListener('change', () => { prefs.plan[id] = el.value; savePrefs(); renderPlan(); });
});
const currentFill = () => ({ side: $id('startSide').value, start: $id('startRow').value, pattern: $id('pattern').value });

$id('generateBtn').addEventListener('click', () => { prefs.plan.seed = (Math.random() * 2 ** 32) >>> 0; savePrefs(); renderPlan(); });

/* ---------- plan model (shared by screen render and PNG export) ---------- */
function planModel() {
  const L = currentLayout(), fill = currentFill();
  const order = orderSeats(L, fill);
  const rolls = Array.from({ length: L.count }, (_, i) => L.startRoll + i);
  if (fill.pattern === 'random') seededShuffle(rolls, prefs.plan.seed);
  const at = new Map();
  order.forEach(([r, c], i) => { if (i < rolls.length) at.set(`${r}-${c}`, rolls[i]); });
  const aisles = new Set(L.walkways);
  const rows = [];
  for (let r = 0; r < L.rows; r++) {
    const row = [];
    for (let c = 0; c < L.cols; c++) {
      if (aisles.has(c)) row.push({ aisle: true });
      const key = `${r}-${c}`;
      row.push({ key, r, c, roll: at.get(key), blocked: L.blocked.includes(key), skipped: isSkipped(L, c) });
    }
    rows.push(row);
  }
  const last = L.startRoll + L.count - 1;
  const digits = Math.max(2, String(last).length);
  return {
    L, fill, rows, aisleCount: aisles.size,
    title: L.label ? `Seat Plan for ${L.label}` : 'Seat Plan',
    sub: `Rolls ${pad(L.startRoll)}–${pad(last)} · ${L.count} students`,
    unseated: Math.max(0, L.count - order.length),
    fs: Math.min(0.4, 1.25 / digits),
  };
}
const unseatedText = n => `⚠ ${n} student${n > 1 ? 's have' : ' has'} no seat. Add rows or seats per row.`;

/* ---------- render ---------- */
function renderPlan() {
  const M = planModel(), L = M.L;
  const editing = body.classList.contains('edit-seats');
  const tag = editing ? 'button' : 'div';
  const tracks = M.rows[0].map(cell => (cell.aisle ? 'var(--aisle)' : 'var(--seat)')).join(' ');
  let cells = '';
  for (const row of M.rows) for (const s of row) {
    if (s.aisle) { cells += '<div class="aisle"></div>'; continue; }
    const cls = s.blocked ? 'seat blocked' : s.skipped ? 'seat skipped' : s.roll === undefined ? 'seat empty' : 'seat';
    const attrs = editing && !s.skipped
      ? ` type="button" data-rc="${s.key}" aria-pressed="${s.blocked}" aria-label="Row ${s.r + 1}, seat ${s.c + 1}${s.blocked ? ', blocked' : ''}"`
      : (editing ? ' type="button" disabled' : '');
    cells += `<${tag} class="${cls}"${attrs}>` +
      (s.roll !== undefined ? `<span class="seat-num">${pad(s.roll)}</span><span class="chair"></span>` : s.blocked ? '<span class="x" aria-hidden="true">✕</span>' : '') +
      `</${tag}>`;
  }
  $id('planHolder').innerHTML =
    `<div class="plan-container podium-${L.podium}${M.unseated ? ' has-warn' : ''}" style="--units:${L.cols + 0.6 * M.aisleCount};--rows:${L.rows};--fs:${M.fs.toFixed(3)}">
       <h1>${esc(M.title)}</h1>
       <p class="plan-sub">${esc(M.sub)}</p>
       ${M.unseated ? `<p class="plan-warn" role="alert">${esc(unseatedText(M.unseated))}</p>` : ''}
       <div class="podium" aria-hidden="true"></div>
       <div class="plan-grid" style="grid-template-columns:${tracks}">${cells}</div>
     </div>`;
  $id('generateBtn').hidden = M.fill.pattern !== 'random';
}

/* ---------- PNG export (drawn on a canvas; always light colours) ---------- */
function exportPlanPNG() {
  const M = planModel(), L = M.L;
  const S = 72, seatH = S * 0.98, gap = S * 0.12, aisleW = S * 0.6, margin = 48, scale = 2;
  const FONT = '"Segoe UI", system-ui, Roboto, Helvetica, Arial, sans-serif';
  const C = { bg: '#ffffff', txt: '#111111', muted: '#555555', line: '#8c8c8c', chair: '#8c8c8c', pri: '#AC1F24', warn: '#b3261e' };
  const gridW = L.cols * S + M.aisleCount * aisleW;
  const gridH = L.rows * seatH + (L.rows - 1) * gap;
  const titlePx = 34, subPx = 19, warnPx = 18, podH = 14, podGap = 14;

  const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  ctx.font = `700 ${titlePx}px ${FONT}`;
  const titleW = ctx.measureText(M.title).width;
  const W = Math.ceil(Math.max(gridW, titleW, 420) + 2 * margin);
  const headH = titlePx * 1.3 + subPx * 1.6 + (M.unseated ? warnPx * 1.8 : 0);
  const podBlock = L.podium === 'none' ? 0 : podH + podGap;
  const H = Math.ceil(margin + headH + podBlock + gridH + margin);
  cv.width = W * scale; cv.height = H * scale;
  ctx.scale(scale, scale);
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';

  const rrect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };

  let y = margin;
  ctx.fillStyle = C.txt; ctx.font = `700 ${titlePx}px ${FONT}`; ctx.fillText(M.title, W / 2, y); y += titlePx * 1.3;
  ctx.fillStyle = C.muted; ctx.font = `400 ${subPx}px ${FONT}`; ctx.fillText(M.sub, W / 2, y); y += subPx * 1.6;
  if (M.unseated) { ctx.fillStyle = C.warn; ctx.font = `700 ${warnPx}px ${FONT}`; ctx.fillText(unseatedText(M.unseated), W / 2, y); y += warnPx * 1.8; }
  const drawPodium = py => {
    const pw = Math.min(gridW * 0.6, 420);
    ctx.globalAlpha = 0.85; ctx.fillStyle = C.pri; rrect((W - pw) / 2, py, pw, podH, podH / 2); ctx.fill(); ctx.globalAlpha = 1;
  };
  if (L.podium === 'top') { drawPodium(y); y += podBlock; }

  const x0 = (W - gridW) / 2;
  M.rows.forEach((row, ri) => {
    let x = x0;
    const top = y + ri * (seatH + gap);
    for (const s of row) {
      if (s.aisle) { x += aisleW; continue; }
      rrect(x + 0.5, top + 0.5, S - 1, seatH - 1, S * 0.09);
      ctx.fillStyle = C.bg; ctx.fill();
      if (s.blocked) {
        ctx.save(); ctx.clip();
        ctx.strokeStyle = '#d6d6d6'; ctx.lineWidth = 2;
        for (let d = -seatH; d < S; d += 7) { ctx.beginPath(); ctx.moveTo(x + d, top + seatH); ctx.lineTo(x + d + seatH, top); ctx.stroke(); }
        ctx.restore();
        rrect(x + 0.5, top + 0.5, S - 1, seatH - 1, S * 0.09);
      }
      ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke();
      if (s.roll !== undefined) {
        const fpx = S * M.fs;
        ctx.fillStyle = C.txt; ctx.font = `700 ${fpx}px ${FONT}`;
        ctx.fillText(pad(s.roll), x + S / 2, top + S * 0.07, S * 0.92);
        const cw = S * 0.58, ch = seatH * 0.26, cx = x + (S - cw) / 2, cy = top + S * 0.05 + fpx + S * 0.08;
        ctx.fillStyle = C.chair;
        rrect(cx, cy, cw, ch, 3); ctx.fill();
        ctx.fillRect(cx + cw * 0.08, cy + ch, cw * 0.14, ch * 0.18);
        ctx.fillRect(cx + cw * 0.78, cy + ch, cw * 0.14, ch * 0.18);
      } else if (s.blocked) {
        ctx.fillStyle = C.muted; ctx.font = `400 ${S * 0.35}px ${FONT}`;
        ctx.textBaseline = 'middle'; ctx.fillText('✕', x + S / 2, top + seatH / 2); ctx.textBaseline = 'top';
      }
      x += S;
    }
  });
  y += gridH;
  if (L.podium === 'bottom') drawPodium(y + podGap);

  const fname = 'seat-plan-' + ((L.label || L.name).replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'layout') + '.png';
  cv.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: fname }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
  return { width: cv.width, height: cv.height, fname, canvas: cv };
}

/* ---------- blocked-seat editing (custom layouts only) ---------- */
function setSeatEdit(on) {
  on = !!on && !isBuiltin(prefs.layoutId);
  if (on === body.classList.contains('edit-seats')) return;
  body.classList.toggle('edit-seats', on);
  $id('seatEditBar').hidden = !on;
  $id('editSeatsBtn').setAttribute('aria-pressed', String(on));
  renderPlan();
}
$id('planHolder').addEventListener('click', e => {
  const seat = e.target.closest('[data-rc]');
  if (!seat || !body.classList.contains('edit-seats')) return;
  const L = currentLayout(), key = seat.dataset.rc;
  L.blocked = L.blocked.includes(key) ? L.blocked.filter(k => k !== key) : [...L.blocked, key];
  saveLayout(prefs.layoutId, L);
  document.dispatchEvent(new Event('layoutchange'));
  $id('planHolder').querySelector(`[data-rc="${key}"]`)?.focus();
});
$id('seatEditDone').addEventListener('click', () => setSeatEdit(false));
$id('printBtn').addEventListener('click', () => { setSeatEdit(false); window.print(); });
$id('pngBtn').addEventListener('click', () => { setSeatEdit(false); exportPlanPNG(); });

fillLayoutSelect();
savePrefs();

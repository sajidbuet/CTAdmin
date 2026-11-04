/* CTAdmin – seat plan generation & rendering */
const SECTION_CFG = {
  A:{start:1,seats:65,dense:true},B:{start:66,seats:65,dense:true},C:{start:131,seats:65,dense:true},
  A1:{start:1,seats:33,dense:false},A2:{start:34,seats:32,dense:false},
  B1:{start:66,seats:33,dense:false},B2:{start:99,seats:32,dense:false},
  C1:{start:131,seats:33,dense:false},C2:{start:164,seats:32,dense:false},
};
const pad = n => (n < 10 ? '0' + n : String(n));

/* Returns rows[][] of roll numbers (null = empty seat). */
function buildSeatRows(start, total, perRow, opts = {}) {
  const { horizStart = 'left', vertStart = 'top', mode = 'row',
          serpentine = false, random = false } = opts;
  const nums = Array.from({ length: total }, (_, i) => start + i);
  if (random) nums.sort(() => Math.random() - .5);
  const rows = Array.from({ length: Math.ceil(total / perRow) }, () => Array(perRow).fill(null));
  const rowOrder = vertStart === 'top' ? [...rows.keys()] : [...rows.keys()].reverse();
  const colOrder = horizStart === 'left' ? [...Array(perRow).keys()] : [...Array(perRow).keys()].reverse();
  let n = 0;
  if (mode === 'row') {
    rowOrder.forEach((r, i) => {
      const cols = serpentine && i % 2 ? [...colOrder].reverse() : colOrder;
      cols.forEach(c => { if (n < nums.length) rows[r][c] = nums[n++]; });
    });
  } else {
    colOrder.forEach((c, i) => {
      const rs = serpentine && i % 2 ? [...rowOrder].reverse() : rowOrder;
      rs.forEach(r => { if (n < nums.length) rows[r][c] = nums[n++]; });
    });
  }
  return rows;
}

function buildTable(rows, dense) {
  const seat = v => `<td class="seat">${v ? `<span class="seat-num">${pad(v)}</span><span class="chair"></span>` : ''}</td>`;
  let html = '<table>';
  rows.forEach(r => {
    html += '<tr>';
    if (dense) {
      r.forEach((v, i) => { if (i === 6) html += '<td class="walkway"></td>'; html += seat(v); });
    } else {
      for (let i = 0; i < 3; i++) html += seat(r[i]) + '<td class="seat"></td>';
      html += '<td class="walkway"></td>';
      for (let i = 3; i < 6; i++) html += seat(r[i]) + '<td class="seat"></td>';
    }
    html += '</tr>';
  });
  return html + '</table>';
}

function renderPlan() {
  const section = document.getElementById('sectionSelect').value;
  const cfg = SECTION_CFG[section];
  const pattern = document.getElementById('pattern').value;
  const rows = buildSeatRows(cfg.start, cfg.seats, cfg.dense ? 12 : 6, {
    horizStart: document.getElementById('startSide').value,
    vertStart:  document.getElementById('startRow').value,
    mode:       pattern.includes('-col') ? 'col' : 'row',
    serpentine: pattern.startsWith('serpentine'),
    random:     pattern === 'random',
  });
  const cols = 12;   /* dense = 12 seats; sparse = 6 seats + 6 blanks */
  document.getElementById('planHolder').innerHTML =
    `<div class="plan-container" style="--cols:${cols};--rows:${rows.length}"><h1>Seat Plan for Section ${section}</h1>
     <div class="podium"></div>${buildTable(rows, cfg.dense)}</div>`;
}

/* plan options: restored from prefs, re-render on any change */
const PLAN_FIELDS = ['sectionSelect', 'startSide', 'startRow', 'pattern'];
prefs.plan = prefs.plan || {};
PLAN_FIELDS.forEach(id => {
  const el = document.getElementById(id);
  if (prefs.plan[id] && [...el.options].some(o => o.value === prefs.plan[id])) el.value = prefs.plan[id];
  el.addEventListener('change', () => { prefs.plan[id] = el.value; savePrefs(); renderPlan(); });
});
document.getElementById('generateBtn').onclick = renderPlan;

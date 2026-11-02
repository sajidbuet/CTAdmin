/* CTAdmin – timer dial sizing */
const pie = document.getElementById('pie'), fill = document.getElementById('pieFill'),
      timeLabel_text = document.getElementById('timeLabel'),
      precount_text = document.getElementById('precount');
const dialSizes = {
  small: { w:215, r:94, stroke:21, font:64, dash:592, labelY:123, btnText:'Larger Timer' },
  large: {},
};
let scaleFactor = 1.0, currentSize = 'large', FULL_LEN = 1690;
const scaleControl = document.getElementById('scaleControl');
const scaleSlider  = document.getElementById('scaleSlider');
const scaleValue   = document.getElementById('scaleValue');
const sizeBtn      = document.getElementById('toggleSizeBtn');
const timerBox     = document.getElementById('timerBox');

function recomputeLarge() {
  const s = dialSizes.small, k = key => Math.round(s[key] * scaleFactor);
  dialSizes.large = { w:k('w'), r:k('r'), stroke:k('stroke'), font:k('font'),
                      dash:k('dash'), labelY:k('labelY'), btnText:'Smaller Timer' };
  scaleValue.textContent = scaleFactor.toFixed(1) + '×';
}

function applyDialSize(sizeKey) {
  const s = dialSizes[sizeKey];
  currentSize = sizeKey;
  const bg = pie.querySelector('circle');
  pie.setAttribute('width', s.w);
  pie.setAttribute('height', s.w);
  pie.setAttribute('viewBox', `0 0 ${s.w} ${s.w}`);
  [bg, fill].forEach(c => {
    c.setAttribute('cx', s.w / 2); c.setAttribute('cy', s.w / 2);
    c.setAttribute('r', s.r);      c.setAttribute('stroke-width', s.stroke);
  });
  const len = fill.getTotalLength();
  fill.setAttribute('stroke-dasharray', len);
  fill.setAttribute('stroke-dashoffset', len);
  FULL_LEN = len;
  fill.setAttribute('transform', `rotate(-90 ${s.w / 2} ${s.w / 2})`);
  [timeLabel_text, precount_text].forEach(t => {
    t.setAttribute('x', s.w / 2); t.setAttribute('y', s.labelY);
    t.setAttribute('font-size', s.font);
  });
  timeLabel_text.setAttribute('text-anchor', 'middle');
  timeLabel_text.setAttribute('dominant-baseline', 'middle');

  timerBox.style.position = 'fixed';
  timerBox.style.transformOrigin = 'center center';
  if (sizeKey === 'large') {
    timerBox.style.top = '47%'; timerBox.style.left = '50%';
    timerBox.style.transform = `translate(-50%, -30%) scale(${scaleFactor})`;
  } else {
    timerBox.style.top = '1rem'; timerBox.style.left = '50%';
    timerBox.style.transform = 'translateX(-50%) scale(1)';
  }
  drawPie();
  sizeBtn.textContent = s.btnText;
}

scaleSlider.addEventListener('input', e => {
  scaleFactor = parseFloat(e.target.value);
  recomputeLarge();
  applyDialSize('large');
});
sizeBtn.onclick = () => {
  scaleControl.style.display = currentSize === 'large' ? 'none' : 'block';
  applyDialSize(currentSize === 'large' ? 'small' : 'large');
};
scaleControl.style.display = 'block';
recomputeLarge();

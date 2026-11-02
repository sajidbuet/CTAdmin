/* CTAdmin – timer dial (fixed viewBox; size comes from CSS) */
const pie = document.getElementById('pie'), fill = document.getElementById('pieFill'),
      timeLabel_text = document.getElementById('timeLabel'),
      precount_text = document.getElementById('precount');
const FULL_LEN = 2 * Math.PI * parseFloat(fill.getAttribute('r'));
fill.setAttribute('stroke-dasharray', FULL_LEN);
fill.setAttribute('stroke-dashoffset', FULL_LEN);

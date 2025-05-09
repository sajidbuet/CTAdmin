/* ───────── Seat‑Plan (আগে যেমন) ───────── */

const gong = document.getElementById('gongStart');
const endBell = document.getElementById('endBell');
const fiveMinBell = document.getElementById('fiveMinBell'); //fiveMinBell  lastFive
const lastFive    = document.getElementById('lastFive');
const pleaseStop = document.getElementById('pleaseStop');
//const muteBtn   = document.getElementById('muteBtn');
const precountToggle   = document.getElementById('precountToggle');
const precountOverlay  = document.getElementById('precountOverlay');

let isMuted = false;
let fiveMinFired = false;
// মিউট বাটন ক্লিক হ্যান্ডলার
/*muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;                        // ফ্ল্যাগ টগল
  endBell.muted = pleaseStop.muted = isMuted;// HTML5 muted প্রপার্টি সেট :contentReference[oaicite:4]{index=4}
  muteBtn.textContent = isMuted              // বাটন লেবেল আপডেট
    ? '🔇 Unmute' 
    : '🔊 Mute';
  muteBtn.classList.toggle('muted', isMuted);
}); */

// Grab elements
const volumeIcon   = document.getElementById('volumeIcon');
const volumeSlider = document.getElementById('volumeSlider');
const audios       = [gong, endBell, fiveMinBell, lastFive, pleaseStop];

// Track last non-zero volume so we can restore after unmute
let lastVolume = parseFloat(volumeSlider.value);

// Initialize volumes
audios.forEach(a => a.volume = lastVolume);
updateIconState();

// 1) Slider input adjusts volume (& updates icon state)
volumeSlider.addEventListener('input', e => {
  const v = parseFloat(e.target.value);
  audios.forEach(a => a.volume = v);
  if (v > 0) lastVolume = v;
  updateIconState();
});

// 2) Icon click toggles mute/unmute
volumeIcon.addEventListener('click', () => {
  if (volumeSlider.value > 0) {
    // mute
    volumeSlider.value = 0;
  } else {
    // unmute (restore lastVolume)
    volumeSlider.value = lastVolume;
  }
  // trigger the input handler
  volumeSlider.dispatchEvent(new Event('input'));
});

// Helper to update the icon’s appearance
function updateIconState() {
  if (parseFloat(volumeSlider.value) === 0) {
    volumeIcon.classList.add('muted');
    volumeIcon.textContent = '🔇';
  } else {
    volumeIcon.classList.remove('muted');
    volumeIcon.textContent = '🔉';
  }
}

// Also apply gain scaling to beep()
function beep(duration = 150) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.frequency.value = 1000;
    const gain = ctx.createGain();
    // baseGain × current slider volume
    gain.gain.value = 0.2 * parseFloat(volumeSlider.value);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    setTimeout(()=>{ osc.stop(); ctx.close(); }, duration);
  } catch (e) {
    console.warn('Beep failed:', e);
  }
}


gong.load(); // নেটওয়ার্ক থেকে অবিলম্বে ফেচ করায়
endBell.load();
pleaseStop.load();
lastFive.load();
fiveMinBell.load();
const SECTION_CFG = {
  A:{start:1,seats:65,dense:true},B:{start:66,seats:65,dense:true},C:{start:131,seats:65,dense:true},
  A1:{start:1,seats:33,dense:false},A2:{start:34,seats:32,dense:false},
  B1:{start:66,seats:33,dense:false},B2:{start:99,seats:32,dense:false},
  C1:{start:131,seats:33,dense:false},C2:{start:164,seats:32,dense:false},
};
const pad=n=>(n<10?"0"+n:n.toString());

/* ---------- Build seat rows  (row / column • raster / serpentine / random) ----------
   ‑ keep the original signature; optional 4th arg is a small opts object.
   ‑ if opts is omitted it behaves like the old simple raster‑row scan.       */
   function buildSeatRows(start, total, perRow, opts = {}) {
    const {
      horizStart = "left",         // "left" | "right"
      vertStart  = "top",          // "top"  | "bottom"
      mode       = "row",          // "row"  | "col"
      serpentine = false,
      random     = false
    } = opts;
  
    /* --- make the number list --- */
    const nums = Array.from({length: total}, (_, i) => start + i);
    if (random) nums.sort(() => Math.random() - .5);   // shuffle if needed
  
    /* --- prepare blank grid --- */
    const rows = Array.from(
          { length: Math.ceil(total / perRow) },
          () => Array(perRow).fill(null));
  
    /* index helpers */
    const rowOrder = vertStart === "top"
          ? [...rows.keys()] : [...rows.keys()].reverse();
    const colOrder = horizStart === "left"
          ? [...Array(perRow).keys()] : [...Array(perRow).keys()].reverse();
  
    let n = 0;
  
    if (mode === "row") {                  /* -------- ROW scan -------- */
      rowOrder.forEach((r, rLogical) => {
        const cols = serpentine && rLogical % 2 ? [...colOrder].reverse() : colOrder;
        cols.forEach(c => { if (n < nums.length) rows[r][c] = nums[n++]; });
      });
  
    } else {                               /* -------- COLUMN scan -------- */
      colOrder.forEach((c, cLogical) => {
        const rowsNow = serpentine && cLogical % 2 ? [...rowOrder].reverse() : rowOrder;
        rowsNow.forEach(r => { if (n < nums.length) rows[r][c] = nums[n++]; });
      });
    }
    return rows;
  }
  
function buildTable(rows,dense){
  const seatCell=v=>`<td class="seat">${v?`<span class="seat-num">${pad(v)}</span><span class="chair"></span>`:""}</td>`;
  let html="<table>";
  rows.forEach(r=>{
    html+="<tr>";
    if(dense){r.forEach((v,i)=>{if(i===6)html+='<td class="walkway"></td>';html+=seatCell(v);});}
    else{
      for(let i=0;i<3;i++) html+=seatCell(r[i])+'<td class="seat"></td>'; //blankcol
      html+='<td class="walkway"></td>';
      for(let i=3;i<6;i++) html+=seatCell(r[i])+'<td class="seat"></td>'; //blankcol
    }
    html+="</tr>";
  });
  return html+"</table>";
}
function renderPlan() {
  const section = document.getElementById("sectionSelect").value;
  const cfg     = SECTION_CFG[section];
  const perRow  = cfg.dense ? 12 : 6;

  /* read user choices */
  const pattern = document.getElementById("pattern").value;    // e.g. "serpentine-col"
  const horiz   = document.getElementById("startSide").value;  // "left" | "right"
  const vert    = document.getElementById("startRow").value;   // "top"  | "bottom"

  const opts = {
    horizStart : horiz,
    vertStart  : vert,
    mode       : pattern.includes("-col") ? "col" : "row",
    serpentine : pattern.startsWith("serpentine"),
    random     : pattern === "random"
  };

  const seatRows = buildSeatRows(cfg.start, cfg.seats, perRow, opts);

  document.getElementById("planHolder").innerHTML =
    `<div class="plan-container">
       <h1>Seat Plan for Section ${section}</h1>
       <div class="podium"></div>
       ${buildTable(seatRows, cfg.dense)}
     </div>`;
}

document.getElementById("generateBtn").onclick=renderPlan;
window.addEventListener("DOMContentLoaded",renderPlan);

/* ───────── Stopwatch & Clock (সিঙ্কড) ───────── */
let FULL_LEN = 1690;   // initial circumference for large dial

/* ---------- dial size presets ---------- */
/*
const dialSizes = {
  large : {w:614,   r:269, stroke:61,  font:184, dash:1690, labelY:352, btnText:"Smaller Timer"},
  small : {w:430, r:188, stroke:43,  font:129,  dash:1183,  labelY:246,   btnText:"Larger Timer"}
}; */

// your existing dialSizes.small definition…
const dialSizes = {
  small: {w:215, r:94, stroke:21, font:64, dash:592, labelY:123, btnText:"Larger Timer"},
  large: {} // will be computed
};

let scaleFactor = 1.0;               // initial
const scaleControl = document.getElementById('scaleControl');
const scaleSlider  = document.getElementById('scaleSlider');
const scaleValue   = document.getElementById('scaleValue');
const sizeBtn      = document.getElementById('toggleSizeBtn');

// recompute based on small × scaleFactor
function recomputeLarge() {
  const s = dialSizes.small;
  const f = scaleFactor;
  dialSizes.large = {
    w:      Math.round(s.w      * f),
    r:      Math.round(s.r      * f),
    stroke: Math.round(s.stroke * f),
    font:   Math.round(s.font   * f),
    dash:   Math.round(s.dash   * f),
    labelY: Math.round(s.labelY * f),
    btnText:"Smaller Timer"
  };
  scaleValue.textContent = f.toFixed(1) + "×";
}

// initially compute
recomputeLarge();

// always hide by default (in case CSS not loaded yet)
scaleControl.style.display = 'block';

// show/hide slider based on mode
function updateSliderVisibility(isLarge) {
  scaleControl.style.display = isLarge ? 'none' : 'block';
}

// when slider moves, update scaleFactor & large dims
scaleSlider.addEventListener('input', e => {
  scaleFactor = parseFloat(e.target.value);
  
  recomputeLarge();
  applyDialSize(currentSize === "large" ? "large" : "large");
  //label.textContent = scaleFactor;
});


//console.log(dialSizes.large);
let currentSize = "large";

function applyDialSize(sizeKey){
  const s = dialSizes[sizeKey];
  currentSize = sizeKey;
  FULL_LEN = s.dash;

  const svg   = document.getElementById("pie");
  const ring  = document.getElementById("pieFill");
  const bg    = svg.querySelector("circle");              // first circle
  const timeLabel_text  = document.getElementById("timeLabel");
  const precount_text  = document.getElementById("precount");

  svg.setAttribute("width",  s.w);
  svg.setAttribute("height", s.w);
  svg.setAttribute("viewBox", `0 0 ${s.w} ${s.w}`);

  [bg, ring].forEach(c=>{
    c.setAttribute("cx", s.w/2);
    c.setAttribute("cy", s.w/2);
    c.setAttribute("r",  s.r);
    c.setAttribute("stroke-width", s.stroke);
  });
  ring.setAttribute("stroke-dasharray", s.dash);
  //ring.setAttribute("stroke-dashoffset", s.dash);
   const realLen = ring.getTotalLength();         // measure
 ring.setAttribute("stroke-dasharray",  realLen);
 ring.setAttribute("stroke-dashoffset", realLen);
 FULL_LEN = realLen;       
  ring.setAttribute("transform", `rotate(-90 ${s.w/2} ${s.w/2})`);

  timeLabel_text.setAttribute("x", s.w/2);
  timeLabel_text.setAttribute("y", s.labelY);
  timeLabel_text.setAttribute("font-size", s.font);
  timeLabel_text.setAttribute("text-anchor", "middle");
  timeLabel_text.setAttribute("dominant-baseline", "middle");
  

  precount_text.setAttribute("x", s.w/2);
  precount_text.setAttribute("y", s.labelY);
  precount_text.setAttribute("font-size", s.font);

    // ── NEW: also scale the container ──
    const timerBox = document.getElementById('timerBox');
    timerBox.style.position = "fixed";
    timerBox.style.transformOrigin = "center center";
    if (sizeKey === 'large') {
      // center both horizontally and vertically, then scale
      timerBox.style.top       = '100%';
      timerBox.style.left      = '50%';
      timerBox.style.transform = `translate(-50%, -100%) scale(${scaleFactor})`;
    } else {
      // back to small: restore original top positioning
      timerBox.style.top       = '1rem';
      timerBox.style.left      = '50%';
      timerBox.style.transform = 'translateX(-50%) scale(1)';
    }  /* keep progress correct after resizing */
  drawPie();

  /* update button text */
  document.getElementById("toggleSizeBtn").textContent = s.btnText;
}


let duration=1200, initialDuration = 1200, remain=1200, endTime=null, running=false;


const pie=document.getElementById("pie"), fill=document.getElementById("pieFill"), timeLabel_text=document.getElementById("timeLabel"), precount_text  = document.getElementById("precount");
const dateLbl=document.getElementById("dateTime"), endLbl=document.getElementById("endTime");
const durInput=document.getElementById("durationInput");
const startBtn=document.getElementById("startBtn"), pauseBtn=document.getElementById("pauseBtn"), resetBtn=document.getElementById("resetBtn");

const fmt=t=>`${pad((t/60)|0)}:${pad(t%60)}`;
function drawPie(){
  //const ratio=remain/duration;
  const ratio = remain / initialDuration;
  fill.style.strokeDashoffset=(FULL_LEN*(1-ratio)).toFixed(1);
  timeLabel_text.textContent=fmt(remain);  //Math.floor(remain/duration*100);//
}
function updateEndLabel(){endLbl.textContent=endTime?`Ends at ${endTime.toLocaleTimeString()}`:"_";}


// Override startTimer to include precount
async function startTimer1(){
  console.log('▶️ startTimer (async) called, precount=', precountToggle.checked);
  if (running) return;
  if (precountToggle.checked) {
    // hide the normal digits while precounting
    timeLabel_text.style.visibility = 'hidden';
    await runPrecount();
    timeLabel_text.style.visibility = '';  // show again
  }
  // then call your original start logic
  _origStart();
}

// Likewise in finish():
async function finish(){
  console.log('Precount enabled?', precountToggle.checked);
  running=false; remain=0; drawPie(); updateEndLabel();
  pie.classList.add("shake"); beep();
  startBtn.disabled=false; pauseBtn.disabled=true; resetBtn.disabled=false; pauseBtn.textContent="Pause";

  if (precountToggle.checked) {
    // run final 3-2-1 out
    await runPrecount(true);
  }

  // now play your end bells
  endBell.currentTime = 0;
  if (!isMuted) {
    endBell.play().catch(console.warn);
    endBell.addEventListener('ended', () => {
      pleaseStop.currentTime = 0;
      pleaseStop.play().catch(console.warn);
    }, { once: true });
  }
  
}


/* ---------- controls ---------- */
function startTimer(){
  if(running) return;
  console.log('▶️ startTimer (original) called, precount=', precountToggle.checked);

  //duration=parseInt(durInput.value,10)*60;
  duration        = (+durInput.value || 10) * 60;
  initialDuration = duration;          // ← freeze here
  remain          = duration;

  if(!duration) return;
  if(duration === 300) fiveMinFired = true;
  else  fiveMinFired = true;
  remain=duration;
  endTime=new Date(Date.now()+remain*1000);
  running=true;
  startBtn.disabled=true; pauseBtn.disabled=false; resetBtn.disabled=false;
  pie.classList.remove("shake");
  drawPie(); updateEndLabel();
  try {
    gong.currentTime = 0;
    if (isMuted) return; 
    gong.play();          // Chrome/Edge/FF/Safari
  } catch (err) {
    console.warn('Audio autoplay blocked:', err);
  }
  lockDurationControls(true);
  updateQuickControls();
}
function pauseTimer(){
  if(!running){ // resume
    if(remain<=0)return;
    endTime=new Date(Date.now()+remain*1000);
    running=true; pauseBtn.textContent="Pause";
  }else{
    running=false; pauseBtn.textContent="Resume";
  }
  updateQuickControls();
}
function resetTimer(){
  running=false; 
  //remain=duration=parseInt(durInput.value,10)*60;
  duration        = (+durInput.value || 10) * 60;
  initialDuration = duration;          // ← and here
  remain          = duration;
  endTime=null; drawPie(); updateEndLabel();
  pie.classList.remove("shake");
  startBtn.disabled=false; pauseBtn.disabled=true; resetBtn.disabled=true; pauseBtn.textContent="Pause";
  lockDurationControls(false);
  updateQuickControls();
  
}
function adjust(sec){
  if(running){
    remain   = Math.max(0, remain + sec);     // only tweak the countdown
    endTime  = new Date(Date.now() + remain * 1000);
    if (!fiveMinFired && remainingSeconds === 300) {
      fiveMinFired = true;
      if (!isMuted) {
        //adjust here //fiveMinBell  lastFive
        lastFive.currentTime = 0;
        fiveMinBell.play().catch(err => console.warn('Autoplay blocked:', err));
        fiveMinBell.addEventListener('ended', () => {
          lastFive.currentTime = 0;
          lastFive.play().catch(err => console.warn('Autoplay blocked:', err));
        }, { once: true });
      }
      
    }
  } else {
    /* timer idle: change the preset duration */

    duration        = Math.max(0, duration + sec);
    initialDuration = duration;               // keep them in sync
    remain          = duration;
    durInput.value = Math.ceil(duration / 60);
  }
  drawPie(); updateEndLabel();
}

// Save off the old logic
const _origStart = startTimer;
const _origFinish = finish;

/* quick / adjust buttons */
document.querySelectorAll("button.quick").forEach(b=>b.onclick=()=>{
  durInput.value=b.dataset.min; 
  timeLabel_text.textContent=fmt(b.dataset.min*60);
  updateEndLabel();
  })
  ;
document.querySelectorAll("button.adj").forEach(b=>b.onclick=()=>adjust(parseInt(b.dataset.sec,10)));

startBtn.onclick=startTimer1; pauseBtn.onclick=pauseTimer; resetBtn.onclick=resetTimer;


function finish(){
  running=false; remain=0; drawPie(); updateEndLabel();
  pie.classList.add("shake"); beep();

  startBtn.disabled=false; pauseBtn.disabled=true; resetBtn.disabled=false; pauseBtn.textContent="Pause";
  endBell.currentTime = 0;
  if (isMuted) return;  
  endBell.play().catch(err => console.warn('Autoplay blocked:', err));
  endBell.addEventListener('ended', () => {
    pleaseStop.currentTime = 0;
    pleaseStop.play().catch(err => console.warn('Autoplay blocked:', err));
  }, { once: true });
  lockDurationControls(false);
  updateQuickControls();
}

/* ---------- master second‑tick ---------- */
function tick(){
  const now=new Date();

  /* clock */
  const opts={day:'2-digit',month:'long',year:'numeric'};
  dateLbl.textContent=`${now.toLocaleDateString(undefined,opts)} ${now.toLocaleTimeString()}`;

  /* timer */
  if(running){
    remain=Math.max(0, Math.ceil((endTime.getTime()-now.getTime())/1000));
    drawPie(); updateEndLabel();
    if(remain===3) {
      if (precountToggle.checked) {
        // hide the normal digits while precounting
        timeLabel_text.style.visibility = 'hidden';
        runPrecount();
        timeLabel_text.style.visibility = '';  // show again
      }
    }
    if(remain===0) finish();
  }

  /* schedule next tick aligned to real‑second boundary */
  const delay=1000-now.getMilliseconds();
  setTimeout(tick,delay);
}
drawPie(); updateEndLabel(); 
applyDialSize("large");  
tick();   // kick‑off master tick

/* ---------- toggle timer visibility ---------- */
const box=document.getElementById("timerBox"), tog=document.getElementById("toggleTimerBtn");
tog.onclick=()=>{const hide=box.style.display!=="none";box.style.display=hide?"none":"block";tog.textContent=hide?"Show Timer":"Hide Timer";}

document.getElementById("toggleSizeBtn").onclick = () => {
  updateSliderVisibility(currentSize === "large" );
  applyDialSize(currentSize === "large" ? "small" : "large");
}

/* click ✕ to hide timer */
document.getElementById('closeTimerBtn').onclick = () => {
  box.style.display = 'none';
  tog.textContent   = 'Show Timer';
};


const fsBtn = document.getElementById('fsToggle');

// cross-browser helpers
function isFullScreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

function requestFullScreen(elem) {
  if (elem.requestFullscreen)         return elem.requestFullscreen();
  if (elem.webkitRequestFullscreen)   return elem.webkitRequestFullscreen();
  if (elem.mozRequestFullScreen)      return elem.mozRequestFullScreen();
  if (elem.msRequestFullscreen)       return elem.msRequestFullscreen();
}

function exitFullScreen() {
  if (document.exitFullscreen)        return document.exitFullscreen();
  if (document.webkitExitFullscreen)  return document.webkitExitFullscreen();
  if (document.mozCancelFullScreen)   return document.mozCancelFullScreen();
  if (document.msExitFullscreen)      return document.msExitFullscreen();
}

// toggle handler
fsBtn.addEventListener('click', () => {
  if (!isFullScreen()) {
    requestFullScreen(document.documentElement);
    fsBtn.classList.add('fullscreen');
    fsBtn.textContent = '🗗 Exit Fullscreen';
  } else {
    exitFullScreen();
    fsBtn.classList.remove('fullscreen');
    fsBtn.textContent = '⛶ Fullscreen';
  }
});

// keep button state in sync if user presses Esc, etc.
['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange']
  .forEach(evt =>
    document.addEventListener(evt, () => {
      if (!isFullScreen()) {
        fsBtn.classList.remove('fullscreen');
        fsBtn.textContent = '⛶ Fullscreen';
      }
    })
  );

  const themeBtn = document.getElementById('themeToggle');
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  themeBtn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  themeBtn.classList.toggle('dark', isDark);
});

timeLabel_text.setAttribute('text-anchor', 'middle');
timeLabel_text.setAttribute('dominant-baseline', 'middle');

// 1) MIT license full text constant
const MIT_TEXT = `MIT License

Copyright (c) ${new Date().getFullYear()} Dr. Sajid Muhaimin Choudhury

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

[...rest of MIT license text, e.g. from https://opensource.org/licenses/MIT...]

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
`;

// 2) Elements
const mitLink    = document.getElementById('mitLicenseLink');
const mitModal   = document.getElementById('mitModal');
const mitClose   = document.getElementById('mitCloseBtn');
const mitTextEl  = document.getElementById('mitText');

// 3) Show modal on click
mitLink.addEventListener('click', () => {
  mitTextEl.textContent = MIT_TEXT;  // inject text
  mitModal.style.display = 'flex';
});

// 4) Close modal
mitClose.addEventListener('click', () => {
  mitModal.style.display = 'none';
});
// Also close if clicking outside the modal box
mitModal.addEventListener('click', e => {
  if (e.target === mitModal) {
    mitModal.style.display = 'none';
  }
});


async function runPrecount(reverse = false) {
  // numbers to show
  const nums = reverse ? [3,2,1] : [3,2,1];
  const ring = document.getElementById('pieFill');
  // temporarily speed up the ring
  ring.style.animation = 'fastFill 3s linear';
  timeLabel_text.setAttribute("display", "none");
  precount_text.setAttribute("display", "block");
  for (let n of nums) {
    precount_text.textContent = n;
    //precountOverlay.textContent = n;
    //precountOverlay.classList.add('show');
    // wait 1s
    beep(200); 
    await new Promise(r => setTimeout(r, 1000));
  }

  // clean up
  ring.style.animation = '';
  //precountOverlay.classList.remove('show');
  precount_text.setAttribute("display", "none");
  timeLabel_text.setAttribute("display", "block");
}


// 1) Make sure your beep() is accessible here:
function beep(duration = 150) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.frequency.value = 1000;       // 1 kHz
    const gain = ctx.createGain();
    gain.gain.value = 0.2;            // adjust volume
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, duration);
  } catch (e) {
    console.warn('Beep failed:', e);
  }
}


// 1) Grab the new buttons
const playBtn   = document.getElementById('playBtn');
const pauseBtn2 = document.getElementById('pauseBtn2');
const stopBtn   = document.getElementById('stopBtn');

// 2) Wire them to your existing functions
playBtn.addEventListener('click', startTimer);
pauseBtn2.addEventListener('click', pauseTimer);
stopBtn.addEventListener('click', resetTimer);

// 3) Centralize enable/disable logic
function updateQuickControls() {
  // play only when not running
  playBtn.disabled = running;
  // pause/resume only when running or paused
  pauseBtn2.disabled = !running && remain === initialDuration;
  // stop only when ever started
  stopBtn.disabled = (remain === initialDuration && !running);

  // update icon on pause button
  pauseBtn2.textContent = running ? '⏸︎' : '▶︎';
}

// 4) Call updateQuickControls() wherever your state changes:
//    - at end of startTimer()
//    - at end of pauseTimer()
//    - at end of resetTimer()
//    - at end of finish()
//    - and initially on load

const condenseBtn = document.getElementById('condenseBtn');

condenseBtn.addEventListener('click', () => {
  const active = document.body.classList.toggle('condensed-ui');
  condenseBtn.textContent = active
    ? '🔍 Expande'
    : '🎛 Condense';
});

// on load:
console.log('🚨 INITIAL LOAD localstorage condensed state: from THIS FUNC', localStorage.getItem('condensed') === 'true');
if (localStorage.getItem('condensed') === 'false') {
  document.body.classList.add('condensed-ui');
  condenseBtn.textContent = '🔍 Expand';
}

// on toggle:
condenseBtn.addEventListener('click', () => {
  const isNow = document.body.classList.toggle('condensed-ui');
  localStorage.setItem('condensed', isNow);
  console.log('🚨 condenseBtn element from THIS FUNC:', condenseBtn);
  console.log(`🚨 condensed-ui now ${isNow} from THIS FUNC`, document.body.classList.toString());
  console.log('🚨 localstorage condensed state: from THIS FUNC', localStorage.getItem('condensed') === 'true');
  
  condenseBtn.textContent = isNow ? '🔍 Expand' : '🎛 Condense';
});

// Wrap everything in DOMContentLoaded to ensure elements exist
document.addEventListener('DOMContentLoaded', () => {
  const condenseBtn = document.getElementById('condenseBtn');
  console.log('🚨 condenseBtn element:', condenseBtn);

  if (!condenseBtn) {
    console.error('❌ No element with id="condenseBtn" found.');
    return;
  }

  // Initial state log
  console.log('🚨 Initial body.classList:', document.body.classList.toString());

  condenseBtn.addEventListener('click', () => {
    console.log('🚨 condenseBtn clicked');
    
    // Toggle the class
    const isNow = document.body.classList.toggle('condensed-ui');
    console.log(`🚨 condensed-ui now ${isNow}`, document.body.classList.toString());

    // Update button text
    condenseBtn.textContent = isNow ? '🔍 Expand' : '🎛 Condense';
    console.log('🚨 condenseBtn.textContent set to:', condenseBtn.textContent);
  });
});


//const durInput = document.getElementById('durationInput');
const durInc   = document.getElementById('durInc');
const durDec   = document.getElementById('durDec');

// step up
durInc.addEventListener('click', () => {
  durInput.value = Math.max(1, parseInt(durInput.value, 10) + 1);
  resetTimer();            // or update any derived state
});

// step down
durDec.addEventListener('click', () => {
  durInput.value = Math.max(1, parseInt(durInput.value, 10) - 1);
  resetTimer();            // keep UI in sync
});

// If you also respond to manual typing:
durInput.addEventListener('change', () => {
  durInput.value = Math.max(1, parseInt(durInput.value, 10) || 1);
  resetTimer();
});

const quickBtns  = document.querySelectorAll("button.quick");

function lockDurationControls(lock = true) {
  durInput.disabled = lock;
  durInc.disabled   = lock;
  durDec.disabled   = lock;
  quickBtns.forEach(b => b.disabled = lock);
}



// --- Settings Modal Elements ---
const settingsGear   = document.getElementById('settingsGear');
const settingsModal  = document.getElementById('settingsModal');
const settingsClose  = document.getElementById('settingsClose');
const useCustom      = document.getElementById('useCustomSettings');
const customSection  = document.getElementById('customSettings');
const inpStart       = document.getElementById('customStartRoll');
const inpCount       = document.getElementById('customStudentCount');
const inpLabel       = document.getElementById('customSectionLabel');
const inpRows        = document.getElementById('customSeatRows');
const inpCols        = document.getElementById('customSeatCols');
const btnSave        = document.getElementById('saveSettings');
const fileLoadInput  = document.getElementById('loadSettings');
const btnLoad        = document.getElementById('loadSettingsBtn');

// LocalStorage key
const LS_KEY = 'ctadmin_customSettings';

// Open modal
settingsGear.addEventListener('click', () => {
  loadSettingsFromStorage();
  settingsModal.style.display = 'flex';
});

// Close modal
settingsClose.addEventListener('click', () => {
  settingsModal.style.display = 'none';
});

// Toggle custom inputs visibility
useCustom.addEventListener('change', () => {
  customSection.style.display = useCustom.checked ? 'block' : 'none';
  saveSettingsToStorage();
});

// On any custom input change, save immediately
[inpStart, inpCount, inpLabel, inpRows, inpCols].forEach(el => {
  el.addEventListener('input', saveSettingsToStorage);
});

// Save button → export JSON
btnSave.addEventListener('click', () => {
  const data = getSettingsObject();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'ctadmin-settings.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Load button → trigger file picker
btnLoad.addEventListener('click', () => fileLoadInput.click());

// File input change → import JSON
fileLoadInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      applySettingsObject(data);
      saveSettingsToStorage();
    } catch (err) {
      alert('Invalid settings file');
    }
  };
  reader.readAsText(file);
});

// Retrieve settings from inputs
function getSettingsObject() {
  return {
    useCustom: useCustom.checked,
    startRoll: +inpStart.value,
    studentCount: +inpCount.value,
    sectionLabel: inpLabel.value,
    seatRows: +inpRows.value,
    seatCols: +inpCols.value
  };
}

// Apply a settings object to inputs
function applySettingsObject(data) {
  useCustom.checked                  = !!data.useCustom;
  inpStart.value                     = data.startRoll   || inpStart.value;
  inpCount.value                     = data.studentCount|| inpCount.value;
  inpLabel.value                     = data.sectionLabel|| inpLabel.value;
  inpRows.value                      = data.seatRows    || inpRows.value;
  inpCols.value                      = data.seatCols    || inpCols.value;
  customSection.style.display        = useCustom.checked ? 'block' : 'none';
}

// Save current settings to localStorage
function saveSettingsToStorage() {
  localStorage.setItem(LS_KEY, JSON.stringify(getSettingsObject()));
}

// Load settings from localStorage (if any)
function loadSettingsFromStorage() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    applySettingsObject(data);
  } catch {
    console.warn('Failed to parse saved settings');
  }
}

// On app start, initialize from storage
document.addEventListener('DOMContentLoaded', loadSettingsFromStorage);


// Grab elements
// Toggle visibility of custom inputs

// Extend renderPlan() to incorporate custom settings
/*
SAJID: to add custom settings, change the buildTable function to accomodate custom row and custom columns
*/

/*const originalRenderPlan = renderPlan;
function renderPlan() {
  if (useCustom.checked) {
    // Use custom values instead of SECTION_CFG
    const start  = +inpStart.value;
    const total  = +inpCount.value;
    const rows   = +inpRows.value;
    const cols   = +inpCols.value;
    const label  = inpLabel.value || 'Custom';

    // Build with fixed rows×cols, labeling as “Section <label>”
    const seatRows = buildSeatRows(start, total, cols, {});
    document.getElementById("planHolder").innerHTML =
      `<div class="plan-container">
         <h1>Seat Plan for Section ${label}</h1>
         <div class="podium"></div>
         ${buildTable(seatRows, false)}
       </div>`;
  } else {
    // Fallback to original behavior
    originalRenderPlan();
  }
}

// Rebind the generate button
generateBtn.onclick = renderPlan;
*/
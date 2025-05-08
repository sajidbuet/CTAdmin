/* ───────── Seat‑Plan (আগে যেমন) ───────── */

const gong = document.getElementById('gongStart');
const endBell = document.getElementById('endBell');
const fiveMinBell = document.getElementById('fiveMinBell'); //fiveMinBell  lastFive
const lastFive    = document.getElementById('lastFive');
const pleaseStop = document.getElementById('pleaseStop');
const muteBtn   = document.getElementById('muteBtn');
let isMuted = false;
let fiveMinFired = false;
// মিউট বাটন ক্লিক হ্যান্ডলার
muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;                        // ফ্ল্যাগ টগল
  endBell.muted = pleaseStop.muted = isMuted;// HTML5 muted প্রপার্টি সেট :contentReference[oaicite:4]{index=4}
  muteBtn.textContent = isMuted              // বাটন লেবেল আপডেট
    ? '🔇 Unmute' 
    : '🔊 Mute';
  muteBtn.classList.toggle('muted', isMuted);
});


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
      for(let i=0;i<3;i++) html+=seatCell(r[i])+'<td class="blankcol"></td>';
      html+='<td class="walkway"></td>';
      for(let i=3;i<6;i++) html+=seatCell(r[i])+'<td class="blankcol"></td>';
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


console.log(dialSizes.large);
let currentSize = "large";

function applyDialSize(sizeKey){
  const s = dialSizes[sizeKey];
  currentSize = sizeKey;
  FULL_LEN = s.dash;

  const svg   = document.getElementById("pie");
  const ring  = document.getElementById("pieFill");
  const bg    = svg.querySelector("circle");              // first circle
  const text  = document.getElementById("timeLabel");

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

  text.setAttribute("x", s.w/2);
  text.setAttribute("y", s.labelY);
  text.setAttribute("font-size", s.font);
    // ── NEW: also scale the container ──
    const timerBox = document.getElementById('timerBox');
    if (sizeKey === 'large') {
      // center both horizontally and vertically, then scale
      timerBox.style.top       = '50%';
      timerBox.style.left      = '50%';
      timerBox.style.transform = `translate(-50%, -50%) scale(${scaleFactor})`;
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


const pie=document.getElementById("pie"), fill=document.getElementById("pieFill"), label=document.getElementById("timeLabel");
const dateLbl=document.getElementById("dateTime"), endLbl=document.getElementById("endTime");
const durInput=document.getElementById("durationInput");
const startBtn=document.getElementById("startBtn"), pauseBtn=document.getElementById("pauseBtn"), resetBtn=document.getElementById("resetBtn");

const fmt=t=>`${pad((t/60)|0)}:${pad(t%60)}`;
function drawPie(){
  //const ratio=remain/duration;
  const ratio = remain / initialDuration;
  fill.style.strokeDashoffset=(FULL_LEN*(1-ratio)).toFixed(1);
  label.textContent=fmt(remain);  //Math.floor(remain/duration*100);//
}
function updateEndLabel(){endLbl.textContent=endTime?`Ends at ${endTime.toLocaleTimeString()}`:"";}

/* ---------- controls ---------- */
function startTimer(){
  if(running) return;

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
}
function pauseTimer(){
  if(!running){ // resume
    if(remain<=0)return;
    endTime=new Date(Date.now()+remain*1000);
    running=true; pauseBtn.textContent="Pause";
  }else{
    running=false; pauseBtn.textContent="Resume";
  }
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


/* quick / adjust buttons */
document.querySelectorAll("button.quick").forEach(b=>b.onclick=()=>{durInput.value=b.dataset.min; label.textContent=fmt(b.dataset.min*60);});
document.querySelectorAll("button.adj").forEach(b=>b.onclick=()=>adjust(parseInt(b.dataset.sec,10)));

startBtn.onclick=startTimer; pauseBtn.onclick=pauseTimer; resetBtn.onclick=resetTimer;

/* ---------- beep + finish ---------- */
function beep(){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const osc=ctx.createOscillator(); osc.frequency.value=1000;
    const gain=ctx.createGain(); gain.gain.value=0.15;
    osc.connect(gain).connect(ctx.destination); osc.start();
    setTimeout(()=>{osc.stop();ctx.close();},600);
  }catch{}
}
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

label.setAttribute('text-anchor', 'middle');
label.setAttribute('dominant-baseline', 'middle');
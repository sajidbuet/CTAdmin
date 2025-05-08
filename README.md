# CTAdmin – Class Test Administration Tool

A lightweight, browser-based tool for BUET EEE instructors to:
- **Generate seat plans** for different sections & seating patterns  
- **Run synced timers** with visual pie-chart display  
- **Audio cues** at start, 5 min remaining, and end (with customizable sound files)  
- **Mute / fullscreen / light & dark mode toggle**  
- **Dynamic scale slider** to adjust timer size in “large” mode  

---

## 🚀 Features

- **Seat-plan Generator**  
  - Choose section (A, B, C, A1, …), seating pattern (row/column, serpentine, random), start side & row  
  - Auto-renders a responsive table with chairs, blank columns & walkway  

- **Stopwatch-style Timer**  
  - User-set duration (minutes), Start/Pause/Reset controls  
  - Pie-chart SVG visualization with smooth countdown  
  - **Audio cues** (pre-loaded) at:  
    1. **Start** – `gong-start.mp3`  
    2. **5 min remaining** – `5min-bell.mp3` → `last-five-minutes.mp3`  
    3. **Finish** – `end-bell.mp3` → `please-stop-writing.mp3`  
  - **Mute** toggle to silence all cues  
  - **Fullscreen** toggle for distraction-free display  
  - **Theme** switcher (light ↔ dark)  
  - **Scale slider** (1× – 2.5×) visible only in “large” timer mode  

- **Responsive & Accessible**  
  - Mobile-friendly layout  
  - Semantic HTML & keyboard-accessible controls  
  - CSS custom properties for easy theming  

---

## 📦 Installation

Simply clone this repo (or copy the `CTadmin` folder) into your web host:

```bash
git clone https://github.com/<your-org>/ctadmin.git
cd ctadmin

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


Here are some ideas for future enhancements, formatted as a Markdown TODO list:


## 🚀 Additional Feature Ideas
- [ ] **Accessibility Mode**: Provide high-contrast theme, larger controls, and ARIA labels for screen readers.
- [ ] **PDF Export**: Add a “Download Seat Plan” button to export the generated plan as a PDF.
- [ ] **Preset Templates**: Allow saving and loading of common timer durations or seat-plan configurations.
- [ ] **Volume Control**: Add a slider to adjust cue audio volume independently of system volume.
- [ ] **Live Sync**: Use WebSockets so remote proctors can see timer state & receive alerts in real time.
- [ ] **Analytics Dashboard**: Track usage metrics (e.g. durations used, sections generated) over time.
- [ ] **Localization**: Add support for multiple languages (Bangla, Arabic, etc.) via i18n files.


## 🛠️ Immediately Implementable Critical Features
- [ ] ** Pre count down **
- [ ] **Persistent Settings**  
  Store user preferences (theme, volume level, last-used duration, section choice) in `localStorage` so settings survive page reloads.

- [ ] **Auto–Save & Restore**  
  Automatically save the current timer state (running/paused, remaining time) and seat-plan configuration so accidental navigations don’t reset progress.

- [ ] **Quick-Start Presets**  
  Add buttons for common exam lengths (e.g. 10 min, 30 min, 1 hr) that instantly set the timer and start it with one click.

- [ ] **Keyboard Shortcuts**  
  Implement shortcuts for key actions (e.g. “S” to Start/Pause, “R” to Reset, “M” to Mute/Unmute, arrow keys to adjust time).

- [ ] **Live Countdown URL**  
  Generate a shareable link showing only the countdown display (full-screen mode) so proctors or students can follow the timer remotely.

- [ ] **Error-Boundary Handling**  
  Gracefully catch and report any script errors (e.g. media load failures) via an on-screen alert banner, preventing silent failures.

- [ ] **Audio Volume Slider**  
  Provide a slider to adjust cue volume directly in the UI, rather than relying solely on system settings.

- [ ] **Print-Friendly Seat Plan**  
  Add a “Print View” style that strips off controls and backgrounds, ensuring the seat-plan table prints neatly on paper.

- [ ] **Section-Specific URLs**  
  Allow bookmarking per-section seat plans via URL query parameters (e.g. `?section=A&pattern=serpentine-left`).

- [ ] **Minimal Mode Toggle**  
  Offer a condensed UI toggle that hides all non-essential controls (only timer and seat-plan remain) for distraction-free exam environments.

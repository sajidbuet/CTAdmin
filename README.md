# CTAdmin – Class Test Timer and Seat Plan
![logo](https://github.com/sajidbuet/ctadmin/blob/main/docs/favicon.png?raw=true)

A browser-based tool for BUET EEE instructors to run class tests: a large countdown timer with audio cues for the room, and seat plans for exam halls. English and Bengali (বাংলা).

**Use it online:** https://sajidlab.org/CTAdmin/ (can be installed as an app and then works without internet).

---

## Features

### Timer
- Countdown dial with the remaining time, current date and time, and the end time.
- Duration box with − / + (1 minute), preset buttons (10 / 15 / 20 by default, editable), and −1 min, +1 min, +5 min, +30 s adjustments that also work while a test is running or paused.
- One Start / Pause / Resume button. Reset needs a second press while a test is running or paused, so it can't be hit by accident.
- Optional 3‑2‑1 count with ticks at the start and at the end.
- Audio cues, each can be switched off: start gong; bell + “last five minutes” at 5:00; “last minute” at 1:00; end bell + “please stop writing” at 0:00. Cues fire even if the browser delays the timer for a moment.
- Volume slider and mute; speaker test.
- Survives a page reload: a running test keeps counting, a paused test stays paused.
- Exam-room safeguards: the screen is kept awake while a test is in progress; the remaining time shows in the browser tab; if the browser blocks sound (for example after a reload), a banner asks for one click to enable it.

### Timer presets
- The quick buttons under the duration are presets. In **Settings → Timer presets** give each one a label (e.g. “CT‑3 Sec B”), a duration, and optionally a seat-plan layout to switch to. Up to 6.

### Seat plan
- Built-in layouts for sections A, B, C and half-sections A1 … C2 (alternate seats).
- Your own layouts (**Settings → Seat plan**): title, first roll, number of students, rows, seats per row, walkways, leave every other seat empty, podium at top / bottom / hidden, “fit rows to students”, and **Block seats…** to mark broken or unusable seats by clicking them. Built-in layouts are read-only; use **Duplicate** to make an editable copy.
- Numbering: start from left or right, top or bottom; raster or serpentine, by row or by column; or random (Reshuffle makes a new random plan; the plan stays the same across reloads).
- Capacity check warns when there are more students than seats.
- **Print** (seat plan only, landscape) and **PNG** download.
- Layouts can be exported to and imported from a JSON file (old custom-settings files are also accepted).

### Views
- **Setup**: timer and seat plan side by side (stacked on narrow screens); either can be hidden.
- **Projection** (button or `P`): full screen, no page chrome, large countdown. The control bar (start/pause, reset, −1 / +1 / +5 min, mute, exit) hides itself after 3 seconds without mouse movement. Layout: auto, timer beside plan, timer above plan, timer only, or plan only (**Settings → Display**).
- **Phones**: timer and seat plan on separate tabs.
- Light / dark / follow-system theme, interface size (small to extra large).

### Bengali (বাংলা)
- Switch with the **বাংলা / English** button in the top bar, in **Settings → Display**, or with `L`.
- Numerals: match the language, always 0‑9, or always ০‑৯ (timer, roll numbers, date and time).
- Spoken cues in Bengali (“আর পাঁচ মিনিট।”, “আর এক মিনিট।”, “লেখা বন্ধ করুন।”).
- The Bengali font is included, so it looks the same on every computer.

### Keyboard shortcuts
| Key | Action |
|---|---|
| `Space` | Start / pause / resume |
| `R` | Reset (press twice while a test is running) |
| `↑` / `↓` | ±1 minute |
| `→` / `←` | ±30 seconds |
| `M` | Mute / unmute |
| `F` | Fullscreen |
| `P` | Projection mode |
| `L` | Switch language |
| `Esc` | Exit projection or seat blocking / close the settings panel |

All settings (theme, language, volume, cues, presets, layouts, numbering) are saved in the browser (`localStorage`) and restored next time.

---

## Running it yourself

No build step and no server-side code; everything is in `docs/`.

- **Just open it:** double-click `docs/index.html`. Everything works except offline install (browsers only allow that over `http(s)`).
- **Local web server** (needed to try offline/install):
  ```bash
  cd docs
  python -m http.server 8000
  # open http://localhost:8000/
  ```
- **Hosting:** serve the `docs/` folder (this repository uses GitHub Pages from `docs/`).

When you add a file the app needs offline, add it to `PRECACHE` in `docs/sw.js`. When you replace an audio, font or image file under the same name, change `VERSION` in `docs/sw.js` so installed copies fetch the new file.

### Project layout
```
docs/
  index.html, style.css
  js/          state, i18n, audio, seatplan, dial, timer, layouts, settings, presets, ui, guard (wake lock, sound banner), main
  i18n/bn.js   Bengali text, keyed by the English text
  audio/       cue sounds; audio/bn/ Bengali spoken cues
  fonts/       Noto Sans Bengali (Bengali subset) + licence
  icons/, manifest.webmanifest, sw.js   install / offline support
```

### Translating
Interface text is translated by `docs/i18n/bn.js`, which maps each English string to Bengali. Missing entries fall back to English. Another language would be a new file in the same shape plus an entry in `LANGS` in `docs/js/i18n.js`.

---

## Credits and licences

- Code: MIT License, © Dr. Sajid Muhaimin Choudhury. Written with the help of OpenAI o3 and Claude Opus.
- Font: [Noto Sans Bengali](https://github.com/notofonts/bengali) (variable, Bengali subset, via `@fontsource-variable/noto-sans-bengali` 5.3.0), SIL Open Font License 1.1 — see `docs/fonts/OFL-NotoSansBengali.txt`.
- Bengali spoken cues: generated with [edge-tts](https://github.com/rany2/edge-tts) using Microsoft's `bn-BD-PradeepNeural` voice.

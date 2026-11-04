# CTAdmin GUI redesign plan

Decisions: restyle/modernize, keep the #AC1F24 accent (assumed from "AC1f24"; confirm), incremental phases each validated by the owner, add Bengali (bundled font + Bengali TTS announcements). Classic `<script>` files (no ES modules/build) so `index.html` still opens from `file://`.

## Phase 0 – Cleanup (no visible change) — DONE (d48d853)
- Split `docs/app.js` into `docs/js/{audio,seatplan,dial,timer,settings,ui,main}.js`.
- Remove duplicated `finish()`/`beep()`/`startTimer` definitions, dead precount overlay, triple-registered condense listener.
- Fix: `condensed` localStorage check is inverted (`=== 'false'` adds the class); `var(----grey)`; truncated `::-webkit-outer-spin` rule in `style.css`; stray `</body></html>` in `index.html`.
- Delete stale root `style.css` (site is served from `docs/`).
- Single persisted `state` object (covers README "Persistent Settings").

## Phase 1 – View modes and layout engine — DONE (8d1fad1)
- Setup / Projection (chrome-free, auto-hiding controls, Esc to exit, fullscreen) / Compact (phone, bottom tab bar).
- CSS Grid + container queries + `clamp()`/`dvh`; drop `transform: scale` and fixed 614px SVG (use `viewBox`, 100% width).
- Projection presets: auto, 16:9, 4:3, 16:10, portrait. Large countdown (min ~5% viewport height), high contrast.

## Phase 2 – Streamlined controls — DONE, awaiting owner review
- Primary bar: Start/Pause toggle, Reset, duration chip (10/15/20, +1, +5, +30 s).
- One settings drawer: Display (theme, layout, scale), Sound (volume/mute, pre-count, cues), Seat plan.
- Shortcuts: Space, R, M, F, P, arrows. 44px touch targets, ARIA labels.
- As built: single Start/Pause/Resume button; Reset needs a second press within 3 s while a test is running or paused; theme and seat-plan options (except Section) moved into the drawer; "scale" = interface size (90–130 %); per-cue on/off and speaker test; volume, pre-count, cues, duration and plan options persisted in `ct_prefs`; settings and license use native `<dialog>`.

## Phase 3 – Customizable bench layout — DONE, awaiting owner review
- Layout model: rows, cols, startRoll, count, label, walkway column indexes, skipAlternate, pattern, startSide, startRow.
- Existing sections become presets; custom presets saved/loaded (JSON). Grid-based seat sizing fitted to viewport.
- Validate rows × cols ≥ count. Optional: blocked seats, podium position, print/PNG export.
- As built: Section picker became a Layout picker (built-in A…C2 plus “My layouts”); editor in Settings → Seat plan (name, title, first roll, students, rows, seats per row, walkways, alternate-seat spacing, podium top/bottom/hidden, “Fit rows to students”); built-ins are read-only, Duplicate to edit; click-to-block seats; capacity check with on-plan warning; JSON export/import (also reads the old custom-settings file); old custom settings migrated once; random plans use a saved seed so they survive reloads (Reshuffle makes a new one); CSS-grid rendering; Print (seat plan only, landscape); PNG download (canvas-drawn, 2× resolution, light colours regardless of theme). Setup mode now fits the window height (dial shrinks to the space left by the controls; seats sized by width and height) on desktop ≥900 px wide and on phones; below 480 px tall it scrolls as before. Start side / start row / pattern stay plan-wide rather than per layout, but are included in exported files.

## Phase 4 – Bengali (i18n) — DONE, awaiting owner review
- `docs/i18n/{en,bn}.json`, language toggle, persisted. Bengali numerals option for timer and roll numbers.
- Bundle a Bengali font (candidate: Noto Sans Bengali, SIL OFL — verify license on download) as local WOFF2; no CDN.
- Bengali announcement audio via TTS (candidate: `edge-tts` bn-BD voices; sends text to Microsoft's service). Texts to confirm with owner: start, 5 minutes left, 1 minute left, time up, please stop writing. Stored as `docs/audio/bn/*.mp3`, cue set chosen by language.
- As built: dictionaries are plain JS keyed by the English text (`docs/i18n/bn.js`; English needs no file) because `fetch()` of JSON fails from `file://`. `js/i18n.js` translates static HTML (text nodes, `title`, `aria-label`, `placeholder`) by matching the dictionary, and JS-generated text via `t()`; switching fires `langchange` so each module re-renders. Language: top-bar button (shows the other language), Settings → Display, or `L`. Numerals: match language / 0-9 / ০-৯, applied to the timer, pre-count, chips, roll numbers, plan header, layout status and date/time (`Intl` with `nu-beng`/`nu-latn`); typed inputs stay 0-9. Built-in layout titles become “সেকশন A”. Font: Noto Sans Bengali variable, Bengali subset only (108 KB WOFF2 from `@fontsource-variable/noto-sans-bengali@5.3.0`, OFL 1.1 verified, licence in `docs/fonts/`), `unicode-range` so Latin keeps the system font; also used by the PNG export (waits for the font). Spoken cues (`last-five-minutes`, `lastminute`, `please-stop-writing`) load from `docs/audio/bn/` in Bengali and fall back to the English files when missing. Bengali files generated with edge-tts 7, voice `bn-BD-PradeepNeural`, rate −10 %, owner-chosen short wording: “আর পাঁচ মিনিট।”, “আর এক মিনিট।”, “লেখা বন্ধ করুন।” (the start/end bells are unchanged). In Bengali the timer chips use smaller text (.85rem) so the controls keep the same rows as English and the dial keeps its size.


## Phase 5 – Verification
- Viewports: 360×800, 390×844, 768×1024, 1024×768, 1920×1080, 1280×720, 1280×800.
- Refresh while running/paused; cues at 5:00, 1:00, 0:00 and 3-2-1; Lighthouse accessibility.
- Needs Claude in Chrome tools enabled (`/chrome`) to check visually.

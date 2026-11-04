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

## Phase 3 – Customizable bench layout
- Layout model: rows, cols, startRoll, count, label, walkway column indexes, skipAlternate, pattern, startSide, startRow.
- Existing sections become presets; custom presets saved/loaded (JSON). Grid-based seat sizing fitted to viewport.
- Validate rows × cols ≥ count. Optional: blocked seats, podium position, print/PNG export.

## Phase 4 – Bengali (i18n)
- `docs/i18n/{en,bn}.json`, language toggle, persisted. Bengali numerals option for timer and roll numbers.
- Bundle a Bengali font (candidate: Noto Sans Bengali, SIL OFL — verify license on download) as local WOFF2; no CDN.
- Bengali announcement audio via TTS (candidate: `edge-tts` bn-BD voices; sends text to Microsoft's service). Texts to confirm with owner: start, 5 minutes left, 1 minute left, time up, please stop writing. Stored as `docs/audio/bn/*.mp3`, cue set chosen by language.

## Phase 5 – Verification
- Viewports: 360×800, 390×844, 768×1024, 1024×768, 1920×1080, 1280×720, 1280×800.
- Refresh while running/paused; cues at 5:00, 1:00, 0:00 and 3-2-1; Lighthouse accessibility.
- Needs Claude in Chrome tools enabled (`/chrome`) to check visually.

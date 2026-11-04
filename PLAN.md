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

## Phase 5 – Verification — DONE, awaiting owner review
- Viewports: 360×800, 390×844, 768×1024, 1024×768, 1920×1080, 1280×720, 1280×800.
- Refresh while running/paused; cues at 5:00, 1:00, 0:00 and 3-2-1; Lighthouse accessibility.
- As run (headless Chrome driven over the DevTools protocol, English and Bengali; Claude in Chrome was not needed):
  - Layout, all 7 viewports × setup / phone plan tab / projection: no horizontal scroll, no clipped or off-screen controls, no control under 44 px in setup mode. Setup fits the window except 768×1024 portrait (scrolls by design: below the 900 px desktop breakpoint). Countdown digits are 10–25 % of the viewport height (target ≥ 5 %). Bengali keeps the same rows and dial size as English.
  - Timer: pre-count + start gong; 5:00 bell → “last five minutes”; 1:00 cue; end 3-2-1 → end bell → “please stop writing”; reload while running (keeps counting) and while paused (same remaining time); reload after the end returns to idle.
  - Bug fixed: cues used `remain === 300 / 60 / 3`, so a late tick (busy or background tab) that skipped that second silently dropped the 5-minute and 1-minute announcements and the closing 3-2-1. Cues now fire when a tick crosses the mark; the closing count starts from whatever is left (e.g. 2-1).
  - Accessibility: Lighthouse was not run (installing it was blocked in this environment). Instead: Chrome's accessibility tree shows no unnamed buttons/fields/links in setup, projection, settings, light/dark and Bengali; every input/select is labelled; no duplicate ids; `lang` follows the language; zoom not blocked; all visible text ≥ 5.3:1 contrast (AA needs 4.5:1; disabled controls exempt). A real Lighthouse run is still worth doing once.
- Added on owner request: the projection bar has −1 min, +1 min, +5 min buttons (they change the running/paused countdown, or the duration when idle); on narrow screens the bar wraps to two rows.

## Phase 6 – Exam-room reliability — DONE, awaiting owner review
- Keep the screen awake while a test is starting/running/paused (Screen Wake Lock; re-acquired when the tab becomes visible again).
- Sound blocked: after a reload mid-test the browser may refuse to play cues until the page is clicked. Show a banner (“click to enable sound”) when that is likely or when a cue is refused.
- Background tab: drive the once-a-second tick from a small Worker (worker timers are not slowed like page timers in hidden tabs), falling back to page timers if a Worker can't start. Show the remaining time in the tab title while a test runs.
- As built: `js/guard.js` (wake lock + banner); `timer.js` fires a `timerstate` event on status changes and runs its beat from a Blob-URL Worker (works from `file://`). Wake lock is held while starting/running/paused and re-requested on `visibilitychange`. Banner shows when a test is restored by a reload before any click (`navigator.userActivation.hasBeenActive` false) or when a cue is refused (`NotAllowedError`); any click/key hides it. Tab title: “mm:ss – CT Admin” (⏸ when paused). Tested: worker beat, title, wake lock acquired, banner on reload, banner on a refused cue with Chrome's normal autoplay policy and gone after one click (sound then plays). Hidden-tab run (2 tabs hidden for 7 min, test ending at 7:00): Worker beat max gap 1.02 s, old page-timer beat 1.34 s; every cue on time in both. Headless Chrome did not apply its once-a-minute throttling to either tab, so the Worker's benefit against that throttling is not demonstrated by this test.
- Footer (owner request): “Made by Dr. Sajid Muhaimin Choudhury using OpenAI o3 and Claude Opus. Source code on GitHub under the MIT license.”

## Phase 7 – Offline / installable app — DONE, awaiting owner review
- `manifest.webmanifest` (name, icons 192/512, theme colour, standalone) and a service worker (`sw.js`): network-first for pages/scripts/styles so updates arrive, cache-first for audio, fonts, images. Only registered over http(s); `file://` keeps working as now.
- As built: `docs/manifest.webmanifest`, `docs/icons/icon-{192,512}.png` (from `logo.png`), `docs/sw.js` (`VERSION`, `PRECACHE` of all 31 app files incl. Bengali audio and font; 3 s network timeout before falling back to cache). Manifest link and registration are added by `main.js` only over http(s), so `file://` gets no console errors. Tested on a local server: worker activates and controls the page, 31 cached entries, Chrome reports no manifest or installability errors; with the network cut, a reload loads the full app, all English and Bengali audio, the Bengali font, and the timer runs and plays the gong. Live site (verified): https://sajidlab.org/CTAdmin/ (HTTPS, so install/offline will work there once deployed).

## Phase 8 – README — DONE, awaiting owner review
- Rewrite for the current app: modes, controls, shortcuts, layouts, Bengali, offline use, `file://` use, credits/licences (Noto Sans Bengali OFL, edge-tts voice).
- As built: README rewritten (features, shortcuts table, running locally, project layout, translating, credits). External links checked.

## Phase 9 – Timer presets — DONE, awaiting owner review
- The 10/15/20 chips become user presets (label, minutes, optional layout to switch to). Edited in Settings; saved in `ct_prefs`.
- As built: `js/presets.js`; Settings → Timer presets (label ≤ 12 chars, minutes in 0.5 steps 0.5–180, layout or “—”, delete; add up to 6; restore 10/15/20). A chip that switches layout shows 🪑 and says so in its tooltip/label. Presets pointing at a deleted layout just set the time. Tested: apply, layout switch, clean-up of bad values, max 6, disabled while running, survives reload, Bengali; all 34 viewport/language/mode layout checks still clean.

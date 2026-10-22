---
target: whole app (public/index.html)
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/mdatiqurrahman/python_codes/taal_app_up/public/index.html"
target_fingerprint: "sha256:8f3c506e1cd5da8c10994a58668d2c1cabcd7e48f9b675e3ce73634404c270c6"
target_path: /Users/mdatiqurrahman/python_codes/taal_app_up/public/index.html
timestamp: 2026-10-22T10-49-54Z
slug: public-index-html
---
Method: dual-agent (A: design review sub-agent · B: detector sub-agent). Headless Playwright; no user-visible overlay.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Beat grid + sam ring are strong; idle tuner needle sits on zero and reads as "in tune"; no aria-live on status lines |
| 2 | Match System / Real World | 3 | Hindustani terms correct; `সা (স্কেল)` calls Sa a "scale"; bols Latin while sargam is Bangla |
| 3 | User Control and Freedom | 2 | Native confirm()/prompt(); no undo on deleting lines/compositions/sequences |
| 4 | Consistency and Standards | 2 | English leaks in Bangla mode; rail "open pane" vs "instrument on" share one icon + dot |
| 5 | Error Prevention | 2 | Composer validates live; ½/×2 sit beside ±1 (mis-tap doubles laya mid-phrase); Reset all one confirm away |
| 6 | Recognition Rather Than Recall | 2 | Icon-only rail with title-only labels (none on touch); shortcuts documented only in Settings |
| 7 | Flexibility and Efficiency | 3 | Shortcuts, MIDI, presets, favourites, search across ~2,000 songs; no visible shortcut hints |
| 8 | Aesthetic and Minimalist Design | 2 | Practice line, Taal card (11 controls) and sargam form (14+) share one visual weight |
| 9 | Error Recovery | 2 | Mic failure alert tells end users to "open through ./run.sh"; raw alert(err.message) on import |
| 10 | Help and Documentation | 2 | Dense syntax hints inline; no task-level help, no link to notation docs |
| **Total** | | **23/40** | **Acceptable** |

## Design Specificity Verdict

LLM: half-authored. The beat grid (X/2/0/3, khali blue, sam outline), the rail icons (harmonium, tanpura, swarmandal, tabla), komal/tivra/saptak notation marks, laya in Barabar–Chaugun terms and the sam-pulsing play disc belong to this product. Everything around them is a generic settings kit: system font stack, iOS segmented tabs, white 14px-radius cards, label/select rows, toggles. No Bangla typeface is specified, so the primary language is the least designed thing on screen. The sargam line the student actually sings from is no louder than the form beneath it.

Deterministic scan: CLI 1 finding — `dark-glow` on `#playBtn` (style.css:208-209, accent #f59e2b shadow in dark mode). Browser: 13 findings on Player (low-contrast tabs, labels, vibhag marks 2.4:1, khali 3.7:1; beat numbers 10.88px), 14 on Composer (`#cPlay` white on #e8890c 2.6:1, `#cDelete` 4.4:1, notation pads/code chips 4.1:1), 3 on Settings, 8 in dark (glow + small text, no contrast failures). dark-glow judged a borderline false positive: an offset warm drop shadow on a glossy disc, not a halo.

## Priority Issues

1. [P1] Phone: practice surface buried, Play covers the grid, Settings tab clipped. Sargam lines start ~1,470px down; the fixed 64px `.play` covers beats 14–15; `#tabs` clips Settings to "সে". Fix: collapse Taal card on phones, pin current line + compact beat strip while playing, reserve space for Play, make tabs fit. → /impeccable adapt
2. [P1] Contrast fails on the accent's most-watched uses: white on #e8890c (primary buttons, `.cell.on`) 2.6:1; orange vibhag marks 2.4:1; khali blue 3.7–4.1:1; muted text 4.1–4.3:1. Fix: darker light-theme accent fill (~#b8650a) or dark text on orange; darker mark text; khali ~#2f6fae. → /impeccable audit, /impeccable colorize
3. [P1] Bangla-default UI leaks English and Bangla type is undesigned. "Starts on sam" (#sargamTurn, app.js:1223) has no BN entry; i18n.js:246 key typo "Steps change on son." never matches index.html:370; "Accent the sam" untranslated; "Made by" maps to ''; `সা (স্কেল)` mistranslation; no Bangla font in the stack. → /impeccable clarify, /impeccable typeset
4. [P2] Player tab has no practise/configure hierarchy. Notation strip, Taal card and 14-control sargam form share weight; help paragraph always visible. Fix: notation as hero, turn cue as banner, fold Loop/Instrument/Volume/Share/Import and Taal advanced controls behind disclosures. → /impeccable distill, /impeccable layout
5. [P2] Accessibility semantics missing: ~20 inputs without programmatic labels (`.field > label` lacks `for`), 24px close and 31×28 favourite targets, icon-only rail, no aria-live for turn/status. → /impeccable harden

## Persona Red Flags

Alex (power user): shortcuts only documented in Settings; prompt() for preset names, confirm() on every delete; no shortcut to cycle laya/mode or jump lines; no long-press on tempo stepper.
Sam (accessibility): 20 unnamed controls; 2.6:1 primary buttons; ~24px close buttons; rail state by colour + 7px dot; call-and-response turns never announced.
Casey (mobile): Settings tab off-screen; Play covers beats; lines 1.7 screens down; title-only rail hints; no wake-lock so the screen sleeps mid-avartan; alert/confirm feel non-native in the Android app.
Rupa (Bangla vocal student mid-riyaz): the turn cue she watches reads "Starts on sam" in English; bols in Latin beside Bangla swars; scrolls past the Taal card to see her line; one mis-tap on ×2 doubles laya; "স্কেল" is the Western term the principles avoid.

## Minor Observations

- Manjeera mode select truncates on desktop.
- Idle tuner shows giant orange "—" and a centred needle.
- Composer Delete enabled (red) on an empty new composition.
- Theme "◑" button gives no light/dark/auto state.
- With Taal closed, notation stays 16 small cells in a 980px card.
- Footer contact links carry equal weight on every tab.

## Questions to Consider

- If the notation line is what a student looks at for most of a riyaz, why is it the size of a dropdown? What would a full-screen "riyaz mode" look like?
- Is Bangla really the default if bols, the turn cue and the font are Latin-first?
- The app counts avartans and time and forgets them at Stop. Would remembering practice locally make students practise more?

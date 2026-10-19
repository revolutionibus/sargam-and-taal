# Taal Studio

A practice companion for Hindustani music: tabla/pakhawaj
thekas, lehra, tanpura, swarmandal and manjeera, all in sync and tuned to your Sa.

## Run

```sh
./run.sh             # serves on http://localhost:3000 and opens the browser
```

Use `run.sh` rather than opening `index.html` directly: browsers block loading the
sound files and the microphone from `file://`. Without samples the app falls back
to synthesized sounds.

The grand piano (sargam practice) uses the Salamander Grand Piano V3 by
Alexander Holm, CC-BY 3.0; `./import_piano.sh` re-downloads it into `public/sounds/`.

## Layout and hosting

Everything the site needs (`index.html`, `css/`, `js/`, `sounds/` and the saved
JSON files) is in `public/`. The project root holds only the local server, scripts
and docs, so `public/` can be deployed as-is to any static host.

Cloudflare: `wrangler.jsonc` serves `public/` as static assets, so
`npx wrangler deploy` publishes it as a Worker. For Pages, set the build output
directory to `public` (no build command), or run
`npx wrangler pages deploy public`. A static host can't write files, so there
compositions, presets and sargam lines are saved in the browser only (use
Settings → Export all to back them up).


## Features

- **Taal**: 13 taals plus a kayda; tabla or pakhawaj; start beat; dayan/bayan mix;
  tabla fine-tune; manjeera on taali/khali.
- **Tempo**: ±1/±10, ½, ×2, tap tempo, reset; laya shown.
- **Sa**: any key plus a fine tune in cents; all instruments retune together.
- **Lehra**: harmonium or santoor, synced and auto-loaded per taal.
- **Tanpura**: 10 tunings (Pa/Ma/Ni/…), 3 tones, 1–2 tanpuras, speed, string
  delays, randomized plucking.
- **Swarmandal**: strum in 14 ragas, by hand (S) or automatically on sam.
- **Sargam practice** (sidebar, `G` key): alankars in any raga, or your own line,
  in time with the taal from sam. Barabar to chaugun; play along, call & response
  (it plays a line, then you sing it back) or notes only; the current note is
  highlighted. Optional mic check marks each note in tune, low, high or missed.
- **Composer**: write bols (`DhaGe TiRaKiTa | …`), live validation and preview,
  bol keyboard, save, and export/import as JSON.
- **Sequences**: chain taals and compositions with repeats and per-step tempo.
- **Presets** and **favourites**; **tuner** (mic) that can set Sa from your voice.
- **Shareable files**: compositions, presets and sargam lines are saved to
  `compositions.json`, `presets.json` and `sargam-lines.json` in `public/`,
  so they can be committed or shared.
- **Settings**: stop immediately or on sam, fade out, accent sam.

## Notation

See [CREATING_TAALS.md](CREATING_TAALS.md) for a step-by-step guide to making
your own taal, and [SARGAM_NOTATION.md](SARGAM_NOTATION.md) for the sargam panel
and sargam notation, with examples.

Bols: beats are separated by spaces and vibhags by `|`. Bols written together
share a beat (`TiRaKiTa` = 4 strokes in one beat). `-` is a rest.

Lehra swars: `S r R g G m M P d D n N` (lowercase = komal, `M` = tivra).
`.N` = mandra, `S'` = taar, `-` = sustain.

Custom sargam lines use the same swars. Each swar is one note; the Laya setting
decides its default length (barabar = 1 beat, dugun = ½, …):

| Write | Means |
|---|---|
| `S R G M P - - -` | One note per Laya step; `-` holds the previous swar |
| `S R (GM) P (DNS')` | Notes in `( )` share one step: GM = two half-beats, DNS' = a triplet |
| `S[0.5] R G M[2]` | `[beats]` sets the length, and it carries on to the next swars until changed |
| `(SRG)[2]` | Three notes spread over 2 beats |
| `~` | A rest (`~[1]` = a one-beat rest) |

Each avartan holds one line of the exercise; a short last line is padded with
rests, and a note that runs past the end of the avartan is cut there (the editor
warns about it).

## Code

All under `public/`: `js/notation.js` parsing · `js/data.js` taals/lehras/ragas/alankars/sample map ·
`js/audio.js` engine · `js/player.js` scheduler · `js/tuner.js` pitch ·
`js/app.js` UI.

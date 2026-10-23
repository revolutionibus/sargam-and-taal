# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(Also shipped as an offline Android app by wrapping `public/` with Capacitor; the design language stays web.)

## Users

Students of Hindustani music, vocal or instrumental, practising at home (riyaz). They use Taal Studio as their accompaniment and practice guide in place of a live tabla player, harmonium or tanpura. Teachers, accompanists and other audiences are not confirmed as primary users.

## Product Purpose

A practice companion for Hindustani music: tabla/pakhawaj thekas, lehra, tanpura, swarmandal and manjeera, all in sync and tuned to the student's Sa, plus guided sargam practice. Success means a student can sit down, set their Sa and taal, and practise without another musician present.

## Positioning

Confirmed differentiators:

1. **Sargam practice.** Alankars in any raga, or notated songs, played in time with the taal from sam. Laya runs from barabar to chaugun. Modes are play-along, call and response (the app plays a line, the student sings it back) and notes-only. The current note is highlighted, and an optional mic check marks each note as in tune, low, high or missed.
2. **All-in-one sync.** Theka, lehra, tanpura, swarmandal and manjeera are locked to one tempo and one Sa, and they all retune together.
3. **Offline and own data.** No account. It works offline, both as a static site and as the Android app. Compositions, presets and sargam lines are plain JSON files the student owns, can export, and can share.

## Operating Context

- Home riyaz sessions: the student is singing or playing while the app runs, so their hands and attention are often on their instrument or voice.
- Devices: desktop browsers (keyboard shortcuts such as Space, T, G and S; MIDI input with a configurable Sa key) and Android phones and tablets.
- Vocabulary is Hindustani throughout: taal, theka, bol, vibhag, sam, taali, khali, laya, avartan, lehra, swar, komal/tivra, mandra/taar, raga, alankar, riyaz.
- Notation formats are documented in `BOL_NOTATION.md`, `SARGAM_NOTATION.md` and `CREATING_TAALS.md`.

## Capabilities and Constraints

- Tabs: Player, Composer, Sequences, Tuner and Settings, plus a Sargam practice sidebar.
- 13 taals plus a kayda; tabla or pakhawaj; harmonium or santoor lehra; tanpura with 10 tunings; swarmandal in 14 ragas; grand piano for sargam; tuner that can set Sa from the student's voice.
- Composer with live bol validation, a bol keyboard, and JSON export/import; sequences that chain taals and compositions.
- Stack: plain static HTML/CSS/JS in `public/`, with no build step and no framework. Deployed as static assets on Cloudflare and as a Capacitor Android app. Static hosts can't write files, so saves stay in browser storage there.
- Light, dark and auto themes.
- The interface is Bangla by default (`lang="bn"`), with English available. Every UI string goes through `public/js/i18n.js`, so new copy needs both languages.
- Without sound samples, the app falls back to synthesized sounds.

## Brand Commitments

- Name: **Taal Studio** (তাল স্টুডিও); Android app id `com.taalstudio.app`.
- Logo: `public/logo.svg`, a tabla pair under an arc of beats, with sam marked by the larger dot.
- Free and public: website and Play Store. No paid tier is planned.

## Evidence on Hand

- A song library of Rabindra Sangeet and other Bengali songs in sargam notation: `songs.taal.json` (52 entries) and `songs2.taal.json` (about 1,965 entries), plus the converters in `tools/`.
- Grand piano samples: Salamander Grand Piano V3 by Alexander Holm, CC-BY 3.0. Attribution must stay.
- Violin samples: University of Iowa Electronic Music Studios, Musical Instrument Samples (freely available).
- Tabla and other instrument samples in `public/sounds/`.
- None of these exist, and none may be invented: user counts, testimonials, reviews, endorsements by teachers or institutions, store ratings.

## Product Principles

1. **Practice comes first.** Nothing should interrupt a running session. The controls a student needs mid-riyaz (play/stop, tempo, Sa) stay reachable at a glance and by keyboard.
2. **One source of truth for time and pitch.** Every instrument follows the same tempo, sam and Sa. Never let a feature drift out of sync.
3. **The student owns their work.** It works offline with no account, and their data is portable JSON.
4. **Use the tradition's own terms.** Hindustani terminology and notation are used as they are, not swapped for Western equivalents.
5. **Free for every student.** No feature is held back behind payment.

## Accessibility & Inclusion

- Bilingual Bangla and English. Copy must work in both, and layouts must fit Bangla text, which runs longer and uses a different script.
- No formal accessibility standard has been chosen yet (open decision).

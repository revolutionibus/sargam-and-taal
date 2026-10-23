# Sargam practice and notation

The **Sargam** panel plays a sargam line in time with the taal, tanpura and the
other instruments, starting on sam. Open it with **Sargam ▸** on the Player tab,
or press `G`.

## Using the panel

1. **Exercise:** pick an alankar, one of your saved lines (**My lines**), or
   **New custom line…** to write your own.
2. **Raga / thaat:** the scale the alankars are built from. Custom lines ignore
   it, because you write the swars yourself.
3. **Laya:** the default length of each swar.

   | Laya | Notes per beat | One swar lasts |
   |---|---|---|
   | Barabar | 1 | 1 beat |
   | Dugun | 2 | ½ beat |
   | Tigun | 3 | ⅓ beat |
   | Chaugun | 4 | ¼ beat |

4. **Mode:**
   - **Play along:** the harmonium (or santoor) plays the line with you.
   - **Call & response:** it plays a line for one avartan, then stays silent for
     the next while you sing it back. The badge shows *Listen* or *Your turn*.
   - **Notes only:** nothing plays the line; you sing with the tabla, lehra
     and tanpura.
5. **Check my singing (mic):** each sung note is marked
   green (in tune, within 30 cents), blue (low), red (high) or grey (missed),
   with a running score. Any octave counts. Use headphones in *Play along* mode,
   or the mic will hear the harmonium.

Press **▶** (or Space). The line always starts on sam; the current note is
highlighted as it sounds.

## Saving your own lines

1. Choose **New custom line…**.
2. Type the swars, give the line a **Name**, and click **Save line**
   (or press Enter in the name box).
3. It appears under **My lines** in the exercise list.
4. To change it, pick it, edit it (you hear changes at once; it shows
   *Unsaved changes*), and click **Save line** again. **Delete** removes it.

Saved lines are written to `sargam-lines.json` in the project folder (when
the app is started with `./run.sh`), so you can commit or share that file.
Anyone who puts it in their copy of the project sees the same lines under
**My lines**; it can also be loaded with **Import…** in the Composer tab.
If the file can't be written, lines are kept in this browser only.

## Notation

### Swars

| Write | Swar |
|---|---|
| `S` | Sa |
| `r` / `R` | komal Re / shuddha Re |
| `g` / `G` | komal Ga / shuddha Ga |
| `m` / `M` | shuddha Ma / tivra Ma |
| `P` | Pa |
| `d` / `D` | komal Dha / shuddha Dha |
| `n` / `N` | komal Ni / shuddha Ni |

Lowercase is komal, uppercase is shuddha, except Ma: `m` is shuddha and `M`
is tivra.

| Write | Saptak |
|---|---|
| `.N` | Mandra (lower octave): dot **before** the swar |
| `N` | Madhya (middle) |
| `S'` | Taar (upper octave): apostrophe **after** the swar |
| `..D`, `S''` | Two octaves down / up |

In the panel, komal swars are underlined, tivra Ma has a mark above it, and
dots show mandra (below) and taar (above).

To see the swars in Bangla (সা রে গা মা পা ধা নি), choose **বাংলা** under
**Settings → Language → Sargam names**. The same marks apply. You still type
lines in the Latin letters above.

### Symbols

| Write | Means |
|---|---|
| space | Separates swars |
| `\|` | Optional visual divider; it has no effect on timing |
| `-` | Hold the previous swar for one more step |
| `~` | Rest (silence) for one step |
| `(GM)` | Brackets: the swars inside **share one step** |
| `^` | Join (legato): the next swar comes in without a new strike (`G^R`) |
| `/` | Meend: slide into the next swar (`D/S'`) |
| `<P>` | Grace swar: a quick touch before the next swar (`<P>G`) |
| `[0.5]` | Set the length in beats; it carries on to the next swars |

### How long each swar lasts

- Every swar lasts one **Laya step** (1 beat in barabar, ½ in dugun, …).
- `[beats]` after a swar sets a new length, which **carries on** until you set
  another one. `S[0.5] R G` makes all three half a beat. Use `[1]` to go back
  to full beats.
- Swars in `( )` divide one step between them: `(GM)` is two half-beats in
  barabar, `(DNS')` is a triplet. `(SRG)[2]` spreads three swars over 2 beats.
- `-` and `~` take one step each, or their share of a group: `(-G)` holds the
  previous swar for half a beat, then plays G.

### Join (`^`)

Put `^` between two swars to join them: in `G^R`, Re comes in **without a
new strike** (legato). The pitch moves straight to Re; it doesn't slide.
In Bengali swaralipi this is the dash before a swar (`সা -রা`, with `০` under
it in the lyric line): the same syllable carries on to the next swar.

- On harmonium and violin, Ga stops as Re comes in: the two crossfade, so the
  sound never breaks and Re has no attack of its own.
- On piano and santoor, every swar of a chain also rings until the chain's
  last swar ends: in `P^m^G`, Pa, Ma and Ga all stop together at the end of
  Ga. Only Pa is struck.
- `G^R`, `G^ R` and `G ^R` mean the same thing.
- `^` must have a swar on both sides. A rest or `-` after it is an error.
- In the panel, an orange bridge joins the swars.
- Pitch checking scores each swar on its own, as usual.

### Meend (`/`)

Put `/` between two swars to slide from one to the other: `D/S'` glides from
Dha up to taar Sa. In Bengali swaralipi this is the curve drawn under the
swars. The sound doesn't stop: Sa' isn't struck again, it is where the slide
lands.

- The slide takes the **last third** of the swar before `/`, so both swars
  keep their own pitch: in `D/S'` Dha holds for two thirds of the beat,
  slides, and Sa' is already on its pitch when its beat starts.
  **Meend length** in the panel changes that share (10% to the whole step).
- **Meend curve** in the panel sets how the pitch moves: *Even* (the same
  speed all the way), *Smooth* (eases out of one swar and into the next),
  *Late* (lingers on the first swar, then falls in) or *Early* (leaves at
  once and settles into the next).
- The slide's speed follows the length of that swar's last step: in `(D/S')`
  it takes a sixth of a beat, and in `D[3] /S'[1]` a whole beat. Holding with
  `-` doesn't make it longer: `D - /S'` holds Dha and slides at the end.
- Chains work: `P/m/G` glides from Pa through Ma to Ga. So do mixes with `^`:
  `D/S'^N` slides up to Sa', then moves to Ni without a new strike.
- `D/S'`, `D/ S'` and `D /S'` mean the same thing.
- `/` must have a swar on both sides. A rest or `-` after it is an error.
- In the panel, a curve below the swars shows the meend.
- Pitch checking scores the swar before `/` only up to the slide.

### Grace swars (`<>`)

Put swars in `< >` right before a swar to touch them quickly first: `<P>G`
flicks Pa, then plays Ga.

- The grace swar takes its time from the **start** of the swar it leads into,
  so the beat stays where it was: in `<P>G` Pa sounds on the beat and Ga comes
  in right after it.
- Each grace swar lasts 70 ms at any tempo, but together they take at most a
  third of the main swar.
- Several swars make a quick run: `<PM>G` touches Pa and Ma before Ga.
- Octave dots work inside: `<.N>S`.
- `<P>G`, `<P> G` and `<P M>G` are fine; spaces inside or after `< >` are
  ignored. `<P>` also works inside brackets: `(<P>GM)`.
- `< >` must be followed by a swar. A rest, `-` or the end of the line after
  it is an error.
- In the panel, the grace swars show small and raised before the swar.
- To practise without them, untick **Play grace swars (kan)** in the panel.
  The line then plays and shows as if it had no `< >`.
- Pitch checking scores only the main swar.

### Lines and avartans

The exercise is laid out **one line per avartan** of the selected taal.
Teentaal fits 16 beats per line, Jhaptaal 10, Rupak 7, Keherwa 8, Dadra 6.

- If the exercise is longer, it continues on the next avartan.
- A short last line is padded with silence until sam.
- A swar that runs past the end of an avartan is cut at sam; the editor shows a
  yellow warning when that happens.
- Mistakes (an unknown swar, a missing `)`, a bad length) show in red.

## Examples

Unless stated otherwise, these assume **Laya: Barabar** (1 swar = 1 beat).

### Basic aroha–avaroha (one Teentaal avartan, 16 beats)

Bilawal (all shuddha):

```
S R G M P D N S' | S' N D P M G R S
```

Yaman (tivra Ma, starting from mandra Ni):

```
.N R G M P D N S' | S' N D P M G R S
```

Bhairavi (komal Re, Ga, Dha, Ni):

```
S r g m P d n S' | S' n d P m g r S
```

### Paltas

Fours: four swars, then start one higher (16 beats):

```
S R G R | R G M G | G M P M | M P D P
```

Turns, in dugun: switch **Laya** to Dugun (2 swars per beat; 8 beats):

```
S G R M | R M G P | G P M D | M D P N
```

### Two or three swars in one beat

Pairs in every beat (8 beats):

```
(SR) (GM) (PD) (NS') | (S'N) (DP) (MG) (RS)
```

Triplets in every beat (8 beats):

```
(SRG) (RGM) (GMP) (MPD) | (PDN) (DNS') (S'ND) (NDP)
```

Mostly one per beat, with a pair in beat 3 and a triplet in beat 5 (8 beats):

```
S R (GM) P (DNS') N D P
```

### Long and short swars

Holding swars with `-` (8 beats):

```
S - R G - - M P
```

Lengths in beats (16 beats). S, R, G and M last 2 beats each; P, M, G and R
one each; the last S four:

```
S[2] R G M | P[1] M G R | S[4]
```

Three swars over two beats, then normal beats (5 beats):

```
(SRG)[2] M[1] P G
```

### Rests

A rest at the end of each half (8 beats):

```
S R G ~ | M P D ~
```

A two-beat rest (8 beats):

```
S R G M ~[2] P[1] S'
```

### Delayed or off-beat swars

G on the *and* of beat 3: silence first, M stays on beat 4 (4 beats):

```
S R (~G) M
```

R held into beat 3, then G on the *and*; M stays on beat 4 (4 beats):

```
S R (-G) M
```

G half a beat late, and everything after it moves later too (4½ beats). Note
the `[1]` that resets the length after the half-beat rest:

```
S R ~[0.5] G[1] M
```

The same, but R holds through the gap instead of silence (4½ beats):

```
S R[1.5] G[1] M
```

A quarter-beat grace note from mandra Ni into Sa (5 beats):

```
.N[0.25] S[0.75] R[1] G M P
```

### Join

Re and Sa sung on Ga's syllable, without new attacks (4 beats):

```
G^R - S
```

Pa for two beats joining Ma; a quick joined Ga–Re pair (4 beats):

```
P - ^m (G^R)
```

Mandra Dha, Ni and Sa in one breath (3 beats):

```
.D^.N^S
```

### Meend

Dha slides up to taar Sa, held for two beats, then Ni (4 beats):

```
D /S' - N
```

A held Dha sliding down to Pa at the end of its second beat (3 beats):

```
D - /P
```

### Grace swars

Ga touched from Pa, Re touched from Ga, then Sa (3 beats):

```
<P>G <G>R S
```

A quick run from Pa and Ma into Ga, held for two beats:

```
<PM>G - R S
```

### Lines for other taals

Rupak (7 beats, 3 + 2 + 2):

```
S R G | M P | D N
```

Jhaptaal (10 beats, 2 + 3 + 2 + 3):

```
S R | G M P | M G | R S ~
```

Keherwa (8 beats):

```
S R G M | P M G R
```

Dadra (6 beats):

```
S R G | R G S
```

### Two avartans (32 beats in Teentaal)

The second line continues on the next avartan:

```
S R G M P D N S' | S' N D P M G R S | S G R M G P M D | P N D S' S' - - ~
```

## For developers: how `^`, `/` and `<>` work

This section is for changing the code. You don't need it to write lines.

### Where each part lives

| Step | File | What it does |
|---|---|---|
| Parse | `js/notation.js`, `parseSargam` | Reads `^`: the swar before it gets `ringOn: true`, the swar after it `slur: true`. Reads `/`: the swar before it gets `glideTo` (the target swar) and `glideAt` (when its slide starts, in beats from its start), the swar after it `glideIn: true`. |
| Plan | `js/player.js`, `setSargam` | A swar that slides on plays as one sound through its meend chain: it gets `glides` (each slide's start, end and target, in beats from its start), `end` (where the chain ends) and `joinNext` (the chain's last swar has a `^`). Then each `^` chain's sounds, except the last, get `ringTo`: the chain's end, in beats. |
| Play | `js/player.js`, `scheduleSargam` | Swars with `glideIn` aren't played. Swars with `slur: true` are played legato. On instruments with `sustain: true` in `SARGAM_INSTRUMENTS` (harmonium, violin), a swar with `joinNext` stops exactly when the next starts and fades out over `SARGAM_HANDOVER` (50 ms); elsewhere it rings until `ringTo`. |
| Sound | `js/audio.js`, `playBuffer` / `rampPitch` / `synthMelodic` | A legato note starts `LEGATO_OFFSET` (0.3 s) into the sample, past its attack, and fades in over `LEGATO_FADE` (40 ms). A meend moves the sample's playback rate (or the synth's frequency) exponentially, so the pitch changes evenly. |
| Grace | `js/notation.js`, `parseSargam`; `js/player.js`, `scheduleSargam` | `<…>` gives the next swar `grace: [semi, …]`. The player plays them from the swar's beat for `SARGAM_GRACE` (70 ms) each, at most a third of the swar, and starts the swar after them. |
| Show | `js/app.js`, `renderSargam`; `css/style.css`, `.bridge`, `.sw .glide` | `drawSargamBridges` draws the `^` bridge (`.bridge`) from the end of one swar's name to the start of the next, measured after layout and redrawn when the lines rewrap; the `/` curve below is CSS. |
| Score | `js/app.js`, `sargamPitch` | Pitch checking stops at `glideAt`, so the slide isn't scored. |

### Changing how long the slide takes

In `parseSargam`, `glideAt` is the swar's length minus `meend` times its last
step; `meend` comes from the **Meend length** setting (`sargamMeend`, a third
by default). The slide always ends where the next swar's beat starts. The
**Meend curve** setting (`sargamMeendCurve`) is `engine.meendCurve`:
`rampPitch` uses an exponential ramp for *Even* and a value curve from
`MEEND_CURVES` in `js/audio.js` for the others.

### Limits

- A piano or santoor swar rings only as long as its recording: a short sample
  can fade before the chain ends. Violin samples loop, so they last.
- Samples are pitched by changing their playback speed, so a long meend chain
  can run past the end of a short recording (not the violin).
- A chain that crosses the end of an avartan is cut at sam, like any long note.

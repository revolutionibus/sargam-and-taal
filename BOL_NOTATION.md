# Bol notation

This is how bols are written in the Composer's big box. Each section has
examples showing where each stroke lands. Positions are in beats from the
start of the line.

## Beats and vibhags

Spaces separate beats and `|` separates vibhags.

```
Dha Dhin Dhin Dha | Dha Dhin Dhin Dha | Dha Tin Tin Ta | Ta Dhin Dhin Dha
```

That's Teentaal: 16 beats in 4 vibhags of 4.

Bols written together share one beat evenly:

| You write | You hear |
|---|---|
| `DhaGe` | Dha, Ge (½ beat each) |
| `TiRaKiTa` | Ti, Ra, Ki, Ta (¼ beat each) |
| `Dha-` | Dha, then nothing new for the second ½ beat |

Upper or lower case both work. A stroke always rings out naturally: `-` and
`~` never cut it short, they only leave time with no new stroke.

## Groups: `( )[n]`

`(…)[n]` fits a group into `n` beats, and its strokes share that time evenly.

| You write | You hear |
|---|---|
| `(TiReKiTe)[1]` | Ti, Re, Ki, Te (¼ beat each) |
| `(KiTe)[0.5]` | Ki, Te (¼ beat each) in half a beat |
| `(Dha Ge Na)[2]` | Dha, Ge, Na (⅔ beat each). Spaces inside brackets are ignored |

**The length carries on.** A `[n]` also works without brackets and stays in
force for the following beats until another `[n]` changes it:

```
Dha[2] Na Tin[0.5] Na
```

Dha at 0 and Na at 2 (both 2 beats long), then Tin at 4 and Na at 4.5 (half a
beat each). That's 5 beats in all.

## `-` and `~` inside a group

These two look alike but behave differently inside brackets:

- **`-` takes no time.** It only marks a stroke that rings. You can use as many
  as you like to make the line easier to read; they don't change the timing.
- **`~` is a silent stroke.** It takes its share of the group like any bol, so
  it leaves a gap. Whatever was already ringing keeps ringing through it.

| You write | You hear |
|---|---|
| `(Na---)[1]` | one Na, ringing for the whole beat |
| `(Tra#Ka---)[1]` | Tra at 0, Ka at ½ (the dashes add nothing) |
| `(DhaTraKa)[1]` | Dha at 0, Tra at ⅓, Ka at ⅔ |
| `(Dha~TraKa)[1]` | Dha at 0, gap, Tra at ½, Ka at ¾ |
| `(Dha--~Tra----Ka-------)[1]` | the same as the row above: the dashes add nothing |
| `(Dha~~Ka)[1]` | Dha at 0, two gaps, Ka at ¾ |
| `(---)[1]` or `(~)[1]` | a silent beat |

Outside brackets, `-` and `~` both take a slot: `Dha-` and `Dha~` are both Dha
followed by half a beat with no new stroke.

## Random choices: `(a|b|c)`

Inside brackets `|` means **"or"**: each time round, the app picks **one**
choice at random and plays only that. The chosen one gets the whole `[n]`. The
others don't play, so nothing gets squeezed.

```
(Dha--|Dha--Dha----|Dha2---Dha2----|Dha--~Tra----Ka-------|Dha--Ge6----|Dha2---Ge2----)[1]
```

| If it picks… | You hear in that 1 beat |
|---|---|
| `Dha--` | Dha, ringing for the whole beat |
| `Dha--Dha----` | Dha, Dha (½ beat each) |
| `Dha2---Dha2----` | Dha2, Dha2 (½ each) |
| `Dha--~Tra----Ka-------` | Dha, gap, Tra, Ka (¼ each) |
| `Dha--Ge6----` | Dha, Ge6 (½ each) |
| `Dha2---Ge2----` | Dha2, Ge2 (½ each) |

Without `|`, a group plays all of its strokes in turn. With `|`, it plays one
of the choices. Outside brackets, `|` still separates vibhags.

The grid shows the choices as `Dha/Dha2/…` in one cell. That's a list of
options, not a sequence.

## Recordings, accents and soft strokes

| You write | Meaning |
|---|---|
| `Dha2` | the 2nd recording of Dha on each hand. If a hand has fewer recordings it wraps round: Dha's bayan has 3, so `Dha5` uses its recording 2. Pakhawaj ignores the number |
| `Dha#` | louder (accent) |
| `Dhin*` | softer |
| `Dha2#` | the number and the mark combine |

## Bols you can use

```
Dha Dhin Dhi Din Di Dhe Dhum Na Ne Ta Tin Sur Tun Tu Ti Te Ra Re Tr Tra
Ge Ghe Ga Gi Gin Ke Ka Ki Kat
```

- **`Sur`** is the open right-hand ringing stroke on its own, without the
  bayan. `Dhin` is `Sur` plus a bayan Ge, and `Tin` is `Sur` with a damped
  bayan. So `(Dhin----Sur-----)[1]` is Dhin, then the same ring without the
  bass.
- Bols combine freely: `DhaGe`, `TinNa`, `KaTa`, `GaDi`, `DhaTiDhaGe`.

## A full example

A 7-beat line using everything above:

```
Tun*[1] Na--[0.5] (Tra----Ka----)[0.5]
(Dhin---|Dhin----Dhin5--------|Dhin----Sur-----)[1]
Na----[1.5] (KiTe)[0.5]
(Dha--|Dha--Dha----|Dha2---Dha2----|Dha--~Tra----Ka-------|Dha--Ge6----|Dha2---Ge2----)[1]
(Ti----Re----Ki----Te----)[1]
```

| Beat | Written | You hear |
|---|---|---|
| 1 | `Tun*[1]` | a soft Tun for 1 beat |
| 2 | `Na--[0.5]` | Na, ringing through the half beat |
|   | `(Tra----Ka----)[0.5]` | Tra, Ka (¼ beat each) |
| 3 | `(Dhin---\|…\|Dhin----Sur-----)[1]` | one of: Dhin · Dhin, Dhin5 · Dhin, Sur |
| 4–5 | `Na----[1.5]` | Na, ringing through 1½ beats |
| 5 (2nd half) | `(KiTe)[0.5]` | Ki, Te (¼ beat each) |
| 6 | `(Dha--\|…)[1]` | one of the six Dha choices above |
| 7 | `(Ti----Re----Ki----Te----)[1]` | Ti, Re, Ki, Te (¼ beat each) |

In beats 2 and 4 the dashes are outside brackets, so they're slots. But there's
nothing after Na in the same token, so `Na--[0.5]` sounds the same as
`(Na--)[0.5]`. The difference only matters when another bol follows:
`Na-Ge[1]` puts Ge at ⅔ of the beat, while `(Na-Ge)[1]` puts it at ½.

Things to check

- A vibhag must end on a whole beat. If the lengths in a vibhag add up to 3.5,
  the line under the box shows an error.
- An unknown bol is flagged with its beat number, for example
  `Unknown bol "Dhaa" in beat 3`.

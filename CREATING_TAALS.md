# Creating your own taal

Use the **Composer** tab. Anything you save there shows up as a taal everywhere
else in the app.

## Steps

1. Start the app with `./run.sh` and open the **Composer** tab.
2. Fill in the fields:
   - **Name**, for example `My Taal`.
   - **Vibhag marks**: one sign per vibhag, separated by spaces. Use `X` for sam,
     `0` for khali and numbers for taali, e.g. `X 2 0 3`.
   - **Default tempo**: the tempo it loads at.
   - **Drum**: Tabla or Pakhawaj.
3. Type the bols in the big box:
   - Separate beats with spaces and vibhags with `|`.
   - Bols written together share one beat. `TiRaKiTa` is 4 strokes in one beat;
     `DhaGe` is 2.
   - `-` is a rest. `Dha-` is Dha for half a beat, then silence.
   - You can also click the **bol keyboard** on the right. It plays the sound and
     inserts the bol at the cursor.
4. Check the line under the box. Green shows the beat and vibhag count, e.g.
   `10 beats in 4 vibhags (2+3+2+3)`. Red points to the problem, such as an
   unknown bol or a mismatch between marks and vibhags.
5. Click **Play in player** to hear it. It plays exactly what's in the editor,
   saved or not.
6. Click **Save**. It then appears in the Player's taal list under
   **My compositions**. You can star it as a favourite, use it in Sequences and
   include it in presets.

## Example

A made-up 10-beat taal:

- **Marks:** `X 2 0 3`
- **Bols:** `Dha Dhin | Dha Ge Na | Tin Na | Dha Dhin Na`

This gives four vibhags of 2+3+2+3 beats, with sam on beat 1 and khali on beat 6.

## Groups, lengths, random choices and accents

These come from the notation used by other tabla apps, so you can paste such
lines into the Composer:

```
(Dha#|Dha2#|Dha3#|Dha5#)[1] (Dhin*|Dhin2*) (Na---)[1] (Tra#Ka---)[1] (Dhin*|Dhin2*)[1] (Na---)[1]
```

- **`(…)[n]`** fits the group into `n` beats, shared evenly between its
  strokes. Inside brackets `-` takes no time (it only marks a ringing stroke):
  `(Na---)[1]` is one Na for the whole beat, and `(Tra#Ka---)[1]` is Tra and
  Ka half a beat each. `(---)[1]` is a silent beat. Outside brackets `-` still
  takes a slot, so `Dha-` is Dha for half a beat, then silence.
  `[n]` also works without brackets (`Dha[2]`), and a length **carries on** to
  the following beats until another `[n]` changes it.
- **`(a|b|c)`** plays one of the choices at random each time round. Inside
  brackets `|` means "or"; outside it still separates vibhags.
- **A number after a bol** picks that recording: `Dha2` is the second Dha
  sample on each hand. If a hand has fewer recordings it wraps round: Dha's
  bayan stroke has 3, so `Dha5` uses its recording 2. Pakhawaj has one
  recording per bol and ignores the number.
- **`#`** plays the stroke louder (accent); **`*`** plays it softer.

The grid shows the choices as `Dha#/Dha2#`, and a group longer than one beat
leaves the following cells empty. A vibhag must end on a whole beat.

## Bols you can use

```
Dha Dhin Dhi Din Di Dhe Dhum Na Ne Ta Tin Tun Tu Ti Te Ra Re Tr Tra
Ge Ghe Ga Gi Gin Ke Ka Ki Kat
```

Upper or lower case both work, and they combine freely: `DhaGe`, `TinNa`,
`KaTa`, `GaDi`, `DhaTiDhaGe`.

## Other things you can do

- **Edit a saved taal:** click it under **My compositions**, edit it and
  **Save**. **Delete** removes it.
- **Start from an existing taal:** use **Open a built-in taal as a starting
  point…** in the same panel. It makes an editable copy.
- **Back up or move your work:** **Export all…** saves your compositions,
  sequences and presets to a JSON file, and **Import…** loads them back.
- **Manjeera:** it follows your marks automatically: open strokes on taali and a
  closed stroke on khali.

## Limitations

- **Lehra:** your taal only gets a lehra if one with the same beat count exists.
  The built-in lehras cover 6, 7, 8, 10, 12, 14 and 16 beats. For other counts
  (9, 11, 15…), add a lehra to the `LEHRAS` list in `js/data.js`. For example:

  ```js
  { id: 'nine-yaman', name: 'Yaman', beats: 9,
    notes: 'G - R | G M P | M G R' },
  ```

  Lehra notation: `S r R g G m M P d D n N` (lowercase = komal, `M` = tivra),
  `.N` = mandra, `S'` = taar, `-` = sustain.
- **Storage:** saved compositions are written to `compositions.json` in the
  project folder (when the app is started with `./run.sh`), so you can commit or
  share that file. If it can't be written, they are kept in this browser only.

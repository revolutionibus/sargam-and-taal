# Taal Studio

Taal, lehra and sargam practice in the browser: taals with tabla bols, a
lehra, tanpura, sargam lines (alankars and songs) to sing along with, and
pitch checking through the microphone.

```sh
pip install taal-studio
taal-studio                    # serves on http://localhost:3000 and opens the browser
taal-studio --port 8080 --no-browser
taal-studio --data-dir ~/my-taal-library
```

Your compositions, presets and sargam lines are saved in `~/.taal-studio`
(or `--data-dir`, or `$TAAL_STUDIO_DATA`), filled from the bundled copies the
first time it runs.

## Sounds

All the instrument samples ship with the package. To use your own, put `.wav`
files with the same names in `~/.taal-studio/sounds/`: those are used before
the shipped ones.

## Credits

- Tabla, tanpura, harmonium, santoor and manjeera: recorded by the author.
- Grand piano: Salamander Grand Piano V3 by Alexander Holm, CC-BY 3.0.
- Violin: University of Iowa Musical Instrument Samples (violin, 2012).

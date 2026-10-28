// Built-in taals, lehras, ragas, tanpura patterns, and the sample map.
(function (root) {
  'use strict';

  // ── Samples ─────────────────────────────────────────────────────────────
  // All samples are recorded with Sa = C#. The dayan (right drum) Sa is C#4.
  // Melodic sample offsets are in semitones relative to that C#4.
  const SAMPLE_BASE_MIDI = 61; // C#4

  // Percussion groups: name -> number of numbered variants (0 = single file).
  const SAMPLE_GROUPS = {
    na: 4, ne: 7, sur: 5, tun: 6, ti: 3, te: 3, ra: 3, tra: 5,
    soft_din: 0, din: 0, tin: 0,
    ki: 4, thap: 3, tichki: 3, gin: 0,
    open_ge: 5, pressed_ge: 11, closed_ge: 5, ge_for_dha: 3, ge_for_dhin: 6,
    first_closed_then_open_ge: 4,
    manjeera_open: 0, manjeera_closed: 0,
    pk_dha: 0, pk_dhin: 0, pk_din: 0, pk_dhe: 0, pk_open_dhin: 0, pk_na: 0,
    pk_pressed_na: 0, pk_tin: 0, pk_tun: 0, pk_ti: 0, pk_tta: 0, pk_ra: 0,
    pk_normal_ge: 0, pk_open_ge: 0, pk_ki: 0, pk_thap: 0,
  };

  // Bayan (left drum) strokes stay at their recorded pitch, like a real bayan.
  const UNPITCHED = new Set([
    'ki', 'thap', 'tichki', 'gin', 'open_ge', 'pressed_ge', 'closed_ge',
    'ge_for_dha', 'ge_for_dhin', 'first_closed_then_open_ge',
    'manjeera_open', 'manjeera_closed',
  ]);

  // Melodic instruments: [sample, semitone offset from C#4, optional loop
  // [start, end] in seconds that a held note repeats].
  const MELODIC = {
    harmonium: [['harmonium_sa_low', -12], ['harmonium_pa_low', -5], ['harmonium_sa', 0],
                ['harmonium_pa', 7], ['harmonium_sa_high', 12]],
    santoor:   [['santoor_pa_low', -5], ['santoor_sa', 0], ['santoor_pa', 7], ['santoor_sa_high', 12]],
    swarmandal:[['sm_pa_low', -5], ['sm_sa', 0], ['sm_pa', 7], ['sm_sa_high', 12],
                ['sm_pa_high', 19], ['sm_sa_high_high', 24]],
    // Salamander Grand Piano (CC-BY 3.0), a minor third apart; see import_piano.sh.
    piano:     [['piano_fs2', -19], ['piano_a2', -16], ['piano_c3', -13], ['piano_ds3', -10],
                ['piano_fs3', -7], ['piano_a3', -4], ['piano_c4', -1], ['piano_ds4', 2],
                ['piano_fs4', 5], ['piano_a4', 8], ['piano_c5', 11], ['piano_ds5', 14],
                ['piano_fs5', 17], ['piano_a5', 20], ['piano_c6', 23], ['piano_ds6', 26]],
    // midi-js-soundfonts violins, one per semitone with crossfaded loops; see
    // tools/import_violin_soundfont.py. These carry their own vibrato.
    // violin1 is FluidR3_GM (MIT), violin2 MusyngKite (CC BY-SA 3.0).
    violin1:   [['violin1_g3', -6, [1.494649, 3.046984]], ['violin1_gs3', -5, [1.398571, 3.046757]],
                ['violin1_a3', -4, [1.318322, 3.046848]], ['violin1_as3', -3, [1.252630, 3.047732]],
                ['violin1_b3', -2, [0.946032, 3.038571]], ['violin1_c4', -1, [0.898821, 3.038277]],
                ['violin1_cs4', 0, [0.863583, 3.038254]], ['violin1_d4', 1, [0.905624, 3.041837]],
                ['violin1_ds4', 2, [0.842063, 3.041655]], ['violin1_e4', 3, [0.792358, 3.040771]],
                ['violin1_f4', 4, [1.345011, 3.042404]], ['violin1_fs4', 5, [1.262494, 3.042857]],
                ['violin1_g4', 6, [1.194263, 3.042653]], ['violin1_gs4', 7, [1.277347, 3.034354]],
                ['violin1_a4', 8, [1.209909, 3.034127]], ['violin1_as4', 9, [1.156304, 3.034603]],
                ['violin1_b4', 10, [0.967664, 3.036508]], ['violin1_c5', 11, [1.877279, 3.046780]],
                ['violin1_cs5', 12, [1.758776, 3.046667]], ['violin1_d5', 13, [1.659320, 3.047007]],
                ['violin1_ds5', 14, [1.359478, 3.041406]], ['violin1_e5', 15, [1.454127, 3.041859]],
                ['violin1_f5', 16, [1.168980, 3.042653]], ['violin1_fs5', 17, [1.279501, 3.042857]],
                ['violin1_g5', 18, [1.193946, 3.043651]], ['violin1_gs5', 19, [1.123424, 3.044014]],
                ['violin1_a5', 20, [1.638254, 3.039819]], ['violin1_as5', 21, [1.527279, 3.038776]],
                ['violin1_b5', 22, [1.433878, 3.039002]], ['violin1_c6', 23, [1.842789, 3.041655]],
                ['violin1_cs6', 24, [1.532404, 3.040658]], ['violin1_d6', 25, [1.617483, 3.040748]],
                ['violin1_ds6', 26, [1.474399, 3.046916]], ['violin1_e6', 27, [1.377279, 3.047143]]],
    violin2:   [['violin2_g3', -6, [0.947823, 3.033991]], ['violin2_gs3', -5, [1.064830, 3.033583]],
                ['violin2_a3', -4, [1.175102, 3.032993]], ['violin2_as3', -3, [1.279932, 3.034150]],
                ['violin2_b3', -2, [0.545442, 3.028571]], ['violin2_c4', -1, [0.860862, 3.026259]],
                ['violin2_cs4', 0, [0.982857, 3.026463]], ['violin2_d4', 1, [1.094694, 3.027007]],
                ['violin2_ds4', 2, [0.568027, 3.036871]], ['violin2_e4', 3, [0.707166, 3.037755]],
                ['violin2_f4', 4, [0.833447, 3.032676]], ['violin2_fs4', 5, [0.949977, 3.034127]],
                ['violin2_g4', 6, [1.071224, 3.038685]], ['violin2_gs4', 7, [0.560023, 3.035896]],
                ['violin2_a4', 8, [0.699728, 3.037234]], ['violin2_as4', 9, [0.830726, 3.036871]],
                ['violin2_b4', 10, [0.681474, 3.037483]], ['violin2_c5', 11, [0.816871, 3.040522]],
                ['violin2_cs5', 12, [0.642902, 3.040884]], ['violin2_d5', 13, [0.498367, 3.046553]],
                ['violin2_ds5', 14, [0.712132, 3.045465]], ['violin2_e5', 15, [0.841633, 3.045397]],
                ['violin2_f5', 16, [0.618934, 3.045964]], ['violin2_fs5', 17, [1.254898, 3.041905]],
                ['violin2_g5', 18, [0.513515, 3.041859]], ['violin2_gs5', 19, [0.654218, 3.041474]],
                ['violin2_a5', 20, [0.789660, 3.042381]], ['violin2_as5', 21, [0.916259, 3.042653]],
                ['violin2_b5', 22, [1.029410, 3.036145]], ['violin2_c6', 23, [0.688526, 3.039728]],
                ['violin2_cs6', 24, [0.820884, 3.040181]], ['violin2_d6', 25, [0.945193, 3.041202]],
                ['violin2_ds6', 26, [0.572948, 3.045850]], ['violin2_e6', 27, [0.597868, 3.052200]]],
  };

  // Tanpura tones (different instruments / jawari). Roles: pa, sa, sa2, sa_low.
  const TANPURA_TONES = [
    { id: 'k1', name: 'Tanpura 1 (warm)' },
    { id: 'k4', name: 'Tanpura 2 (bright)' },
    { id: 'p3', name: 'Tanpura 3 (open)' },
  ];
  const TANPURA_ROLE_SEMI = { pa: -17, sa: -12, sa2: -12, sa_low: -24 };

  // Four strings each, in semitones from tabla Sa (madhya Sa of tanpura = -12).
  const TANPURA_PATTERNS = [
    { name: 'Pa Sa Sa Sa',           strings: [-17, -12, -12, -24] },
    { name: 'Ma Sa Sa Sa',           strings: [-19, -12, -12, -24] },
    { name: 'Ma(tivra) Sa Sa Sa',    strings: [-18, -12, -12, -24] },
    { name: 'Ni Sa Sa Sa',           strings: [-13, -12, -12, -24] },
    { name: 'ni(komal) Sa Sa Sa',    strings: [-14, -12, -12, -24] },
    { name: 'Dha Sa Sa Sa',          strings: [-15, -12, -12, -24] },
    { name: 'Sa Sa Sa Sa',           strings: [-12, -12, -12, -24] },
    { name: 'Pa ni(komal) Sa Sa',    strings: [-17, -14, -12, -24] },
    { name: 'Pa Ni Sa Sa',           strings: [-17, -13, -12, -24] },
    { name: 'Ma Pa Sa Sa',           strings: [-19, -17, -12, -24] },
  ];

  // ── Taals ───────────────────────────────────────────────────────────────
  // Bols use "|" between vibhags; marks give the taali/khali sign of each vibhag.
  const TAALS = [
    { id: 'teentaal', name: 'Teentaal', tempo: 120, marks: 'X 2 0 3',
      bols: 'Dha Dhin Dhin Dha | Dha Dhin Dhin Dha | Dha Tin Tin Ta | Ta Dhin Dhin Dha' },
    { id: 'ektaal', name: 'Ektaal', tempo: 100, marks: 'X 0 2 0 3 4',
      bols: 'Dhin Dhin | DhaGe TiRaKiTa | Tu Na | Kat Ta | DhaGe TiRaKiTa | Dhin Na' },
    { id: 'jhaptaal', name: 'Jhaptaal', tempo: 120, marks: 'X 2 0 3',
      bols: 'Dhi Na | Dhi Dhi Na | Tin Na | Dhi Dhi Na' },
    { id: 'rupak', name: 'Rupak', tempo: 110, marks: '0 1 2',
      bols: 'Tin Tin Na | Dhi Na | Dhi Na' },
    { id: 'dadra', name: 'Dadra', tempo: 150, marks: 'X 0',
      bols: 'Dha Dhin Na | Dha Tin Na' },
    { id: 'keherwa', name: 'Keherwa', tempo: 130, marks: 'X 0',
      bols: 'Dha Ge Na Ti | Na Ke Dhi Na' },
    { id: 'jhoomra', name: 'Jhoomra', tempo: 50, marks: 'X 2 0 3',
      bols: 'Dhin -Dha TiRaKiTa | Dhin Dhin DhaGe TiRaKiTa | Tin -Ta TiRaKiTa | Dhin Dhin DhaGe TiRaKiTa' },
    { id: 'deepchandi', name: 'Deepchandi', tempo: 90, marks: 'X 2 0 3',
      bols: 'Dha Dhin - | Dha Dha Tin - | Ta Tin - | Dha Dha Dhin -' },
    { id: 'tilwada', name: 'Tilwada', tempo: 50, marks: 'X 2 0 3',
      bols: 'Dha TiRaKiTa Dhin Dhin | Dha Dha Tin Tin | Ta TiRaKiTa Dhin Dhin | Dha Dha Dhin Dhin' },
    { id: 'addha', name: 'Addha Teentaal', tempo: 110, marks: 'X 2 0 3',
      bols: 'Dha Dhin - Dha | Dha Dhin - Dha | Dha Tin - Ta | Ta Dhin - Dha' },
    { id: 'dhamar', name: 'Dhamar', tempo: 80, marks: 'X 2 0 3', drum: 'pakhawaj',
      bols: 'Ka Dhi Ta Dhi Ta | Dha - | Ga Ti Ta | Ti Ta Ta -' },
    { id: 'chautaal', name: 'Chautaal', tempo: 110, marks: 'X 0 2 0 3 4', drum: 'pakhawaj',
      bols: 'Dha Dha | Din Ta | KiTa Dha | Din Ta | TiTa KaTa | GaDi GeNe' },
    { id: 'sooltaal', name: 'Sooltaal', tempo: 110, marks: 'X 0 2 3 0', drum: 'pakhawaj',
      bols: 'Dha Dha | Din Ta | KiTa Dha | TiTa KaTa | GaDi GeNe' },
    { id: 'kayda1', name: 'Kayda — DhaDha TiTa (Teentaal)', tempo: 90, marks: 'X 2 0 3', kind: 'composition',
      bols: 'DhaDha TiTa DhaDha TinNa | TaTa TiTa DhaDha DhinNa | TaTa TiTa TaTa TinNa | DhaDha TiTa DhaDha DhinNa' },
  ];

  // ── Lehras ──────────────────────────────────────────────────────────────
  // Swar notation (see notation.js). A lehra loops in sync with the taal; it
  // fits any taal whose beat count equals its own.
  const LEHRAS = [
    { id: 'tt-yaman', name: 'Yaman', beats: 16,
      notes: 'G - - - | R G M P | M G R G | .N R S -' },
    { id: 'tt-bhairavi', name: 'Bhairavi', beats: 16,
      notes: 'S - r g | m - P - | d n d P | m g r -' },
    { id: 'tt-kirwani', name: 'Kirwani', beats: 16,
      notes: 'g - R S | .N S R g | m P d P | m g R -' },
    { id: 'ek-yaman', name: 'Yaman', beats: 12,
      notes: 'G - | R G | M P | M G | R S | .N R' },
    { id: 'ek-bhupali', name: 'Bhupali', beats: 12,
      notes: 'G R | S .D | S R | G P | D P | G R' },
    { id: 'jh-bilawal', name: 'Bilawal', beats: 10,
      notes: 'G - | R G M | P - | M G R' },
    { id: 'jh-malkauns', name: 'Malkauns', beats: 10,
      notes: 'm - | g m d | n - | d m g' },
    { id: 'ru-khamaj', name: 'Khamaj', beats: 7,
      notes: 'G - M | P D | P M' },
    { id: 'da-pahadi', name: 'Pahadi', beats: 6,
      notes: 'G P G | R S .D' },
    { id: 'ke-kafi', name: 'Kafi', beats: 8,
      notes: 'S R g - | m P g R' },
    { id: 'ke-bhupali', name: 'Bhupali', beats: 8,
      notes: 'G - P G | R S .D S' },
    { id: 'fourteen-yaman', name: 'Yaman', beats: 14,
      notes: 'G - - | R G M P | M G R | G R S -' },
  ];

  // Instruments for the sargam practice (the lehra is always santoor).
  const SARGAM_INSTRUMENTS = [
    { id: 'harmonium', name: 'Harmonium', sustain: true },
    { id: 'santoor', name: 'Santoor', sustain: false },
    { id: 'piano', name: 'Piano', sustain: false },
    { id: 'violin1', name: 'Violin 1', sustain: true },
    { id: 'violin2', name: 'Violin 2', sustain: true },
  ];

  // ── Ragas (for swarmandal) ──────────────────────────────────────────────
  const RAGAS = [
    { id: 'yaman', name: 'Yaman / Kalyan', scale: [0, 2, 4, 6, 7, 9, 11] },
    { id: 'bilawal', name: 'Bilawal', scale: [0, 2, 4, 5, 7, 9, 11] },
    { id: 'khamaj', name: 'Khamaj', scale: [0, 2, 4, 5, 7, 9, 10] },
    { id: 'kafi', name: 'Kafi', scale: [0, 2, 3, 5, 7, 9, 10] },
    { id: 'asavari', name: 'Asavari', scale: [0, 2, 3, 5, 7, 8, 10] },
    { id: 'bhairavi', name: 'Bhairavi', scale: [0, 1, 3, 5, 7, 8, 10] },
    { id: 'bhairav', name: 'Bhairav', scale: [0, 1, 4, 5, 7, 8, 11] },
    { id: 'purvi', name: 'Purvi', scale: [0, 1, 4, 6, 7, 8, 11] },
    { id: 'marwa', name: 'Marwa', scale: [0, 1, 4, 6, 7, 9, 11] },
    { id: 'todi', name: 'Todi', scale: [0, 1, 3, 6, 7, 8, 11] },
    { id: 'kirwani', name: 'Kirwani', scale: [0, 2, 3, 5, 7, 8, 11] },
    { id: 'bhupali', name: 'Bhupali', scale: [0, 2, 4, 7, 9] },
    { id: 'durga', name: 'Durga', scale: [0, 2, 5, 7, 9] },
    { id: 'malkauns', name: 'Malkauns', scale: [0, 3, 5, 8, 10] },
  ];

  // ── Alankars (sargam exercises) ─────────────────────────────────────────
  // Each pattern is a list of scale-degree offsets repeated from every starting
  // degree up to taar Sa (aroha), then mirrored back down (avaroha).
  const ALANKARS = [
    { id: 'scale', name: 'Aroha–avaroha (S R G M …)', pattern: [0] },
    { id: 'pairs', name: 'Pairs (SR RG GM …)', pattern: [0, 1] },
    { id: 'threes', name: 'Threes (SRG RGM …)', pattern: [0, 1, 2] },
    { id: 'fours', name: 'Fours (SRGM RGMP …)', pattern: [0, 1, 2, 3] },
    { id: 'skip', name: 'Skips (SG RM GP …)', pattern: [0, 2] },
    { id: 'turn3', name: 'Turns (SGR RMG …)', pattern: [0, 2, 1] },
    { id: 'zigzag', name: 'Zig-zag (SGRM RMGP …)', pattern: [0, 2, 1, 3] },
    { id: 'return', name: 'Return (SRGRS RGMGR …)', pattern: [0, 1, 2, 1, 0] },
  ];

  // Build an alankar in a raga scale. Returns semitone values (0 = madhya Sa).
  function buildAlankar(pattern, scale) {
    const len = scale.length;
    const semi = (deg) => scale[((deg % len) + len) % len] + 12 * Math.floor(deg / len);
    const span = Math.max(...pattern);
    const up = [];
    const down = [];
    for (let i = 0; i + span <= len; i++) pattern.forEach((o) => up.push(semi(i + o)));
    for (let i = len; i - span >= 0; i--) pattern.forEach((o) => down.push(semi(i - o)));
    if (down[down.length - 1] !== 0) down.push(0);   // always resolve on Sa
    return up.concat(down);
  }

  const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Show the built-in names in the interface language.
  if (root.I18n) {
    for (const list of [TANPURA_TONES, TANPURA_PATTERNS, TAALS, LEHRAS, SARGAM_INSTRUMENTS, RAGAS, ALANKARS]) {
      list.forEach((x) => { x.name = root.I18n.t(x.name); });
    }
  }

  root.Data = {
    SAMPLE_BASE_MIDI, SAMPLE_GROUPS, UNPITCHED, MELODIC,
    TANPURA_TONES, TANPURA_ROLE_SEMI, TANPURA_PATTERNS,
    TAALS, LEHRAS, SARGAM_INSTRUMENTS, RAGAS, KEYS, ALANKARS, buildAlankar,
  };
})(this);

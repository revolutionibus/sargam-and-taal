// UI wiring, persistence (localStorage), composer, sequences, presets, tuner.
(function () {
  'use strict';
  const D = window.Data;
  const N = window.Notation;
  const { t: tr, num } = window.I18n;
  const $ = (id) => document.getElementById(id);
  const STORE = 'taalStudio.v1';

  const DEFAULTS = {
    taalId: 'teentaal', tempo: 120, key: 1, fine: 0, master: 0.8,
    taalOn: true, drum: '', startBeat: 1, taalVol: 0.9, dayanVol: 1, bayanVol: 1, tablaFine: 0,
    manjeeraOn: false, manjeeraVol: 0.5, manjeeraMode: 'beats', manjeeraBeats: {},
    lehraOn: false, lehraId: 'tt-yaman', lehraVol: 0.6, lehraAuto: true,
    tanpuraOn: true, tanpuraPattern: 0, tanpuraTone: 'k1', tanpuraCount: 1, tanpuraSpeed: 1,
    tanpuraRandom: true, tanpuraVol: 0.6, tanpuraDelays: [1.0, 0.9, 0.9, 1.7],
    lehraOpen: false, tanpuraOpen: false, swarOpen: false, taalOpen: true,
    swarOn: false, swarRaga: 'yaman', swarEvery: 2, swarSpeed: 1, swarVol: 0.5,
    sargamPanel: true, sargamOn: true, sargamExercise: 'scale', sargamRaga: 'bilawal',
    sargamCustom: 'S R G M P - - - | P M G R S - - -', sargamPerBeat: 1, sargamMode: 'along',
    sargamInst: 'harmonium', sargamVol: 0.7, sargamCheck: false, sargamVisible: 4, sargamCollapsed: {},
    sargamLoop: 'all', sargamLoopLines: {},
    fadeOut: true, stopMode: 'immediate', accentSam: true, previews: true, sargamLang: 'bn', theme: 'auto',
  };
  // Settings captured by a preset (everything except app preferences).
  const APP_PREFS = ['fadeOut', 'stopMode', 'accentSam', 'previews', 'sargamPanel', 'sargamCheck', 'sargamLang', 'theme', 'sargamVisible', 'sargamCollapsed',
                     'lehraOpen', 'tanpuraOpen', 'swarOpen', 'taalOpen'];

  let store = { settings: {}, custom: [], sequences: [], presets: [], favorites: [], sargamFavorites: [], sargamLines: [] };
  try { Object.assign(store, JSON.parse(localStorage.getItem(STORE)) || {}); } catch (e) { /* fresh start */ }
  // The sargam panel used to be hidden by default; show it once for
  // settings saved before the instruments moved to the sidebar.
  if (store.settings && !('lehraOpen' in store.settings)) store.settings.sargamPanel = true;
  const S = Object.assign({}, DEFAULTS, store.settings);
  S.sargamCheck = false;   // never open the microphone without a click
  store.settings = S;

  // Writes are batched (sliders fire many times a second); `now` and page
  // hide flush immediately so a saved item is never lost on close.
  let saveTimer = null;
  function writeStore() {
    clearTimeout(saveTimer);
    saveTimer = null;
    try { localStorage.setItem(STORE, JSON.stringify(store)); } catch (e) {
      // Over the ~5 MB quota (thousands of imported sargam lines): those live
      // in sargam-lines.json, so keep everything else here without them.
      if (window.TAAL_STANDALONE) return;
      try { localStorage.setItem(STORE, JSON.stringify({ ...store, sargamLines: [] })); } catch (e2) { /* storage unavailable */ }
    }
  }
  function save(now) {
    if (now) { writeStore(); return; }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(writeStore, 200);
  }
  window.addEventListener('pagehide', () => { if (saveTimer) writeStore(); });

  // Compositions, presets and sargam lines also live in JSON files in the
  // project folder (written by server.py), so they can be shared. The files
  // win on load; localStorage keeps a copy for when they can't be reached.
  const FILES = { custom: 'compositions.json', presets: 'presets.json', sargamLines: 'sargam-lines.json' };
  // The standalone build has no server: it ships the files' contents in
  // js/saved.js as a starting point, and from then on keeps them in the browser.
  const STANDALONE = !!window.TAAL_STANDALONE;
  // The Android app (Capacitor) ships the files read-only, and keeps the
  // user's copies in the app's private storage, where a PUT would have gone.
  const CAP = window.Capacitor;
  const NATIVE = !!(CAP && CAP.isNativePlatform && CAP.isNativePlatform());
  // No bundler, so no @capacitor/core (and no registerPlugin): call the
  // plugins through the bridge's nativePromise, which the app always injects.
  const plugin = (name) => (NATIVE && CAP.nativePromise ? {
    readFile: (o) => CAP.nativePromise(name, 'readFile', o),
    writeFile: (o) => CAP.nativePromise(name, 'writeFile', o),
    share: (o) => CAP.nativePromise(name, 'share', o),
  } : null);
  const FS = plugin('Filesystem');
  const SHARE = plugin('Share');
  const BROWSER_ONLY = tr(STANDALONE ? 'Saved in this browser (Settings → Export all to back it up).'
    : 'Saved in this browser only (start the app with ./run.sh to save to the file).');
  function writeFile(key) {
    if (STANDALONE) return Promise.resolve(false);
    const body = JSON.stringify({ app: 'taal-studio', version: 1, [key]: store[key] });
    if (FS) {
      return FS.writeFile({ path: FILES[key], data: body, directory: 'DATA', encoding: 'utf8' })
        .then(() => true, () => false);
    }
    return fetch(FILES[key], { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body })
      .then((r) => r.ok, () => false);
  }
  function loadFiles() {
    if (FS) {
      // The device's copy wins; until there is one, use the bundled file.
      return Promise.all(Object.keys(FILES).map((key) =>
        FS.readFile({ path: FILES[key], directory: 'DATA', encoding: 'utf8' })
          .then((r) => JSON.parse(r.data))
          .catch(() => fetch(FILES[key]).then((r) => (r.ok ? r.json() : null)))
          .then((data) => { if (data && Array.isArray(data[key])) store[key] = data[key]; })
          .catch(() => { /* keep the copy in localStorage */ })));
    }
    if (STANDALONE) {
      if (!store.seeded) {
        for (const key of Object.keys(FILES)) {
          const list = ((window.TaalSaved || {})[key] || {})[key];
          if (Array.isArray(list) && !store[key].length) store[key] = list;
        }
        store.seeded = true;
      }
      return Promise.resolve();
    }
    return Promise.all(Object.keys(FILES).map((key) =>
      fetch(FILES[key], { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : r.status === 404 ? null : Promise.reject()))
        .then((data) => {
          // No file yet: create it from what is saved in this browser.
          if (!data) { if (store[key].length) writeFile(key); return; }
          if (Array.isArray(data[key])) store[key] = data[key];
        })
        .catch(() => { /* file unreachable: keep the browser's copy */ })));
  }

  // ── Sharing ──────────────────────────────────────────────────────────
  // A shared file has the same shape as "Export all", holding only the
  // items being shared, so either kind can be imported anywhere.
  function fileName(name, fallback) {
    const base = name.trim().replace(/[\\/:*?"<>|\s]+/g, '-').replace(/^-+|-+$/g, '');
    return (base || fallback) + '.taal.json';
  }
  function exportFile(name, items) {
    const json = JSON.stringify({ app: 'taal-studio', version: 1, ...items }, null, 2);
    if (FS) {
      // WebView can't download a blob: write it out and open the share sheet.
      FS.writeFile({ path: name, data: json, directory: 'CACHE', encoding: 'utf8' })
        .then((r) => SHARE.share({ title: name, url: r.uri }))
        .catch((err) => { if (!/cancel/i.test(err.message)) alert(tr('Could not export: {err}', { err: err.message })); });
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function importFile(input) {
    const f = input.files[0];
    input.value = '';
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const keys = ['custom', 'sequences', 'presets', 'sargamLines'].filter((k) => Array.isArray(data[k]) && data[k].length);
      if (!keys.length) throw new Error(tr('nothing to import in this file'));
      for (const key of keys) {
        const k = key === 'presets' ? 'name' : 'id';
        const at = new Map(store[key].map((x, i) => [x[k], i]));
        for (const item of data[key]) {
          const i = at.get(item[k]);
          if (i !== undefined) store[key][i] = item;
          else { at.set(item[k], store[key].length); store[key].push(item); }
        }
      }
      // Open what was shared: the first sargam line, or the first composition.
      if (data.sargamLines && data.sargamLines.length) S.sargamExercise = 'line:' + data.sargamLines[0].id;
      else if (data.custom && data.custom.length) S.taalId = data.custom[0].id;
      save(true);
      // The files replace what is stored on load, so update them first.
      await Promise.all(keys.filter((k) => FILES[k]).map(writeFile));
      location.reload();
    } catch (err) {
      alert(tr('Could not import: {err}', { err: err.message }));
    }
  }

  // ── Taal lookup ──────────────────────────────────────────────────────
  let draftTaal = null;   // composer "Play in player" without saving
  function allTaals() { return D.TAALS.concat(store.custom); }
  function rawTaal(id) {
    if (draftTaal && id === draftTaal.id) return draftTaal;
    return allTaals().find((t) => t.id === id);
  }
  function findTaal(id) {
    const t = rawTaal(id);
    if (!t) return null;
    return { ...t, drum: S.drum || t.drum || 'tabla' };
  }
  function lehrasFor(beats) { return D.LEHRAS.filter((l) => l.beats === beats); }

  // ── Engine & player ──────────────────────────────────────────────────
  const engine = new window.Engine();
  const player = new window.Player(engine, {
    settings: () => S,
    findTaal,
  });
  engine.setSa(S.key, S.fine);
  engine.tablaFine = S.tablaFine / 100;
  for (const k of ['master', 'taal', 'dayan', 'bayan', 'manjeera', 'lehra', 'tanpura', 'swar', 'sargam']) {
    engine.vol[k] = S[k + 'Vol'] !== undefined ? S[k + 'Vol'] : S.master;
  }
  engine.vol.master = S.master;

  // ── Populate selects ─────────────────────────────────────────────────
  function opt(value, text, sel) {
    const o = document.createElement('option');
    o.value = value; o.textContent = text;
    if (sel) o.selected = true;
    return o;
  }
  function group(label, items) {
    const g = document.createElement('optgroup');
    g.label = label;
    items.forEach((i) => g.appendChild(i));
    return g;
  }

  function taalLabel(t) {
    const beats = N.parseBols(t.bols).beats;
    return `${t.name} · ${num(beats)}`;
  }

  function fillTaalSelect(sel, current) {
    sel.innerHTML = '';
    const favs = allTaals().filter((t) => store.favorites.includes(t.id));
    const mk = (list) => list.map((t) => opt(t.id, taalLabel(t), t.id === current));
    if (favs.length) sel.appendChild(group(tr('★ Favourites'), favs.map((t) => opt(t.id, taalLabel(t)))));
    sel.appendChild(group(tr('Taals'), mk(D.TAALS.filter((t) => t.kind !== 'composition'))));
    sel.appendChild(group(tr('Compositions'), mk(D.TAALS.filter((t) => t.kind === 'composition'))));
    if (store.custom.length) sel.appendChild(group(tr('My compositions'), mk(store.custom)));
    if (draftTaal && current === draftTaal.id) sel.appendChild(group(tr('Draft'), [opt(draftTaal.id, draftTaal.name, true)]));
    sel.value = current;
  }

  function fillStatic() {
    D.KEYS.forEach((k, i) => $('key').appendChild(opt(i, k)));
    D.TANPURA_PATTERNS.forEach((p, i) => $('tanpuraPattern').appendChild(opt(i, p.name)));
    D.TANPURA_TONES.forEach((t) => $('tanpuraTone').appendChild(opt(t.id, t.name)));
    D.RAGAS.forEach((r) => $('swarRaga').appendChild(opt(r.id, r.name)));
  }

  function fillLehraSelect() {
    const taal = player.taal;
    const sel = $('lehraSelect');
    sel.innerHTML = '';
    const list = lehrasFor(taal.beats);
    sel.appendChild(opt('', list.length ? tr('None') : tr('No lehra for {n} beats', { n: taal.beats })));
    list.forEach((l) => sel.appendChild(opt(l.id, tr('{name} ({n} beats)', { name: l.name, n: l.beats }))));
    sel.value = list.some((l) => l.id === S.lehraId) ? S.lehraId : '';
    const l = D.LEHRAS.find((x) => x.id === sel.value);
    $('lehraNotes').textContent = l ? l.notes : '';
  }

  // Choose a lehra matching the taal (auto-load), then hand it to the player.
  function syncLehra(taal) {
    const cur = D.LEHRAS.find((l) => l.id === S.lehraId);
    if (S.lehraAuto && (!cur || cur.beats !== taal.beats)) {
      const first = lehrasFor(taal.beats)[0];
      if (first) S.lehraId = first.id;
    }
    const l = D.LEHRAS.find((x) => x.id === S.lehraId && x.beats === taal.beats);
    player.setLehra(l || null);
  }

  // ── Beat grid ────────────────────────────────────────────────────────
  let gridTaal = null;
  let gridCells = [];
  function renderGrid(container, taal) {
    container.innerHTML = '';
    const cells = [];
    let b = 0;
    taal.vibhags.forEach((len, vi) => {
      const v = document.createElement('div');
      v.className = 'vibhag';
      const m = document.createElement('div');
      const mark = taal.marks[vi] || '';
      m.className = 'mark' + (mark === '0' ? ' khali' : '');
      m.textContent = mark || ' ';
      const row = document.createElement('div');
      row.className = 'cells';
      for (let k = 0; k < len; k++, b++) {
        const c = document.createElement('div');
        const cell = taal.cells[b];
        c.className = 'cell' + (b === 0 ? ' sam' : '') + (cell.error ? ' error' : '');
        c.innerHTML = `<div class="num">${num(b + 1)}</div><div class="bol"></div>`;
        c.querySelector('.bol').textContent = cell.text;
        row.appendChild(c);
        cells.push(c);
      }
      v.append(m, row);
      container.appendChild(v);
    });
    return cells;
  }
  function showTaalGrid(taal) {
    gridTaal = taal;
    gridCells = renderGrid($('beatGrid'), taal);
    $('nowPlaying').textContent = taal.name;
    $('startBeat').max = taal.beats;
    renderSargam();
  }

  let lastOn = null;
  function highlight(beat) {
    if (lastOn) lastOn.classList.remove('on');
    lastOn = gridCells[beat] || null;
    if (lastOn) lastOn.classList.add('on');
    // The play button pulses with the beat; restart its ring animation.
    const btn = $('playBtn');
    btn.classList.remove('beat', 'sam');
    if (beat < 0) return;
    void btn.offsetWidth;
    btn.classList.add('beat');
    btn.classList.toggle('sam', beat === 0);
  }

  function frame() {
    // Show what is being heard, not what was just scheduled.
    const now = engine.now - ((engine.ctx && engine.ctx.outputLatency) || 0);
    const q = player.visual;
    while (q.length && q[0].time <= now) {
      const ev = q.shift();
      if (ev.taal !== gridTaal) showTaalGrid(ev.taal);
      highlight(ev.beat);
      $('avartan').textContent = num(ev.avartan + 1);
      if (ev.seq) markSeqStep(ev.seq.i);
      if (ev.final) {
        setTimeout(() => { if (!player.playing) { highlight(-1); markSeqStep(-1); } }, 600);
      }
    }
    const sq = player.sargamVisual;
    while (sq.length && sq[0].time <= now) sargamNote(sq.shift());
    if (player.playing) {
      const t = Math.max(0, now - player.startTime);
      $('elapsed').textContent = num(`${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`);
    }
    requestAnimationFrame(frame);
  }

  // ── Transport ────────────────────────────────────────────────────────
  function layaName(bpm) {
    if (bpm < 60) return tr('Vilambit');
    if (bpm < 160) return tr('Madhya');
    if (bpm < 320) return tr('Drut');
    return tr('Ati-drut');
  }
  function setTempo(v) {
    v = Math.round(Math.max(10, Math.min(800, Number(v) || S.tempo)));
    S.tempo = v;
    $('tempo').value = v;
    $('laya').textContent = '· ' + layaName(v);
    save();
  }
  function setKey(key, fine = S.fine) {
    S.key = ((key % 12) + 12) % 12;
    S.fine = Math.max(-100, Math.min(100, Math.round(fine)));
    $('key').value = S.key;
    $('fine').value = S.fine;
    engine.setSa(S.key, S.fine);
    $('saInfo').textContent = `· ${num(engine.saFrequency().toFixed(1))} Hz`;
    save();
  }

  const taps = [];
  function tap() {
    const t = performance.now();
    if (taps.length && t - taps[taps.length - 1] > 2500) taps.length = 0;
    taps.push(t);
    if (taps.length > 5) taps.shift();
    if (taps.length >= 2) {
      const avg = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
      setTempo(60000 / avg);
    }
  }

  function togglePlay() {
    if (player.playing) player.stop();
    else if (!player.starting) startPlayer();
  }
  async function startPlayer(sequence) {
    if (player.starting) return;   // still loading from the last click
    if (!sequence) {
      // A finished sequence may have left another taal loaded.
      const c = player.setTaal(findTaal(S.taalId));
      showTaalGrid(c);
      syncLehra(c);
      fillLehraSelect();
    }
    player.starting = true;
    try { await player.start({ sequence }); } finally { player.starting = false; }
  }

  player.onEvent = (type, data) => {
    const btn = $('playBtn');
    if (type === 'state') {
      btn.classList.toggle('playing', data);
      btn.classList.remove('pending');
      btn.setAttribute('aria-label', tr(data ? 'Stop' : 'Play'));
      if (!data) { highlight(-1); markSeqStep(-1); sargamStopped(); }
      else resetSargamScore();
    } else if (type === 'loading') {
      btn.classList.toggle('loading', data);
    } else if (type === 'pendingStop') {
      btn.classList.add('pending');
    } else if (type === 'tempo') {
      setTempo(data);
    } else if (type === 'taalChanged') {
      syncLehra(data);
      fillLehraSelect();
    } else if (type === 'seqStep') {
      syncLehra(data.taal);
      fillLehraSelect();
    }
  };

  // ── Channel settings binding ─────────────────────────────────────────
  function bind(id, key, { type = 'num', onChange } = {}) {
    const el = $(id);
    const isCheck = el.type === 'checkbox';
    if (isCheck) el.checked = !!S[key]; else el.value = S[key];
    el.addEventListener(isCheck || el.tagName === 'SELECT' ? 'change' : 'input', () => {
      let v = isCheck ? el.checked : el.value;
      if (type === 'num' && !isCheck) v = Number(v);
      S[key] = v;
      save();
      if (onChange) onChange(v);
    });
  }

  // Rail: Lehra, Tanpura, Swarmandal, Taal and Sargam each have an icon that
  // opens or closes their pane, and the layout slides (CSS transitions on the
  // flex sizes). While an instrument is open the sargam pane shrinks to make room.
  const PANES = {   // open-state setting -> element
    lehraOpen: 'card-lehra', tanpuraOpen: 'card-tanpura', swarOpen: 'card-swar',
    taalOpen: 'card-taal', sargamPanel: 'sargamPanel',
  };
  const INSTRUMENTS = ['lehraOpen', 'tanpuraOpen', 'swarOpen'];
  const SLIDE_MS = 350;   // matches the CSS transition
  const slideTimers = new Map();
  // A closed pane is display:none; .moving keeps it rendered while it slides.
  function slide(el, open, animate = true) {
    if (el.classList.contains('open') === open) return;
    clearTimeout(slideTimers.get(el));
    if (!animate) { el.classList.remove('moving'); el.classList.toggle('open', open); return; }
    el.classList.add('moving');
    if (open) { void el.offsetWidth; el.classList.add('open'); }   // render closed first, then open
    else el.classList.remove('open');
    slideTimers.set(el, setTimeout(() => el.classList.remove('moving'), SLIDE_MS));
  }
  function paneLayout(animate = true) {
    const anyInst = INSTRUMENTS.some((k) => S[k]);
    for (const [key, id] of Object.entries(PANES)) {
      // Instrument cards sit inside the instruments pane: only the last one to
      // close needs to stay while that pane slides shut.
      const inst = INSTRUMENTS.includes(key);
      slide($(id), !!S[key], animate && (!inst || !anyInst));
      const b = document.querySelector(`.inst-btn[data-open=${key}]`);
      b.classList.toggle('active', !!S[key]);
      b.setAttribute('aria-expanded', String(!!S[key]));
    }
    slide($('instruments'), anyInst, animate);
    $('playerLayout').classList.toggle('inst-open', anyInst);
  }
  function togglePane(key) {
    S[key] = !S[key];
    paneLayout();
    save();
  }
  function initPanes() {
    document.querySelectorAll('.inst-rail [data-open], .pane-close').forEach((el) => {
      el.addEventListener('click', () => togglePane(el.dataset.open));
    });
    paneLayout(false);
  }

  function cardState() {
    $('card-taal').classList.toggle('off', !S.taalOn);
    $('card-lehra').classList.toggle('off', !S.lehraOn);
    $('card-tanpura').classList.toggle('off', !S.tanpuraOn);
    $('card-swar').classList.toggle('off', !S.swarOn);
    // Rail icons show which parts are switched on.
    document.querySelectorAll('.inst-btn').forEach((b) => b.classList.toggle('on', !!S[b.dataset.on]));
  }

  // Custom manjeera positions are kept per taal (beat numbers differ).
  function showManjeera() {
    $('manjeeraCustom').hidden = S.manjeeraMode !== 'custom';
    $('manjeeraBeats').value = (S.manjeeraBeats || {})[S.taalId] || '';
    checkManjeera();
  }
  function checkManjeera() {
    const t = findTaal(S.taalId);
    const beats = t ? N.parseBols(t.bols).beats : 0;
    const p = N.parseManjeera($('manjeeraBeats').value, beats);
    $('manjeeraError').textContent = S.manjeeraMode === 'custom' ? p.errors.join(' · ') : '';
  }

  function selectTaal(id, { keepTempo = false } = {}) {
    const t = findTaal(id);
    if (!t) return;
    S.taalId = id;
    const c = player.setTaal(t);
    if (!player.playing) {
      if (!keepTempo) setTempo(t.tempo || S.tempo);
      showTaalGrid(c);
      syncLehra(c);
      fillLehraSelect();
    } else {
      $('nowPlaying').textContent = tr('{from} → {to} (on sam)', { from: gridTaal ? gridTaal.name : '', to: c.name });
    }
    S.startBeat = 1;
    $('startBeat').value = 1;
    showManjeera();
    updateFav();
    save();
  }

  function updateFav() { $('favBtn').textContent = store.favorites.includes(S.taalId) ? '★' : '☆'; }

  function preload() {
    engine.ensure();
    engine.load(player.neededFiles());
  }

  function initPlayerTab() {
    fillStatic();
    if (!rawTaal(S.taalId)) S.taalId = 'teentaal';
    fillTaalSelect($('taalSelect'), S.taalId);
    const c = player.setTaal(findTaal(S.taalId));
    showTaalGrid(c);
    syncLehra(c);
    fillLehraSelect();
    setTempo(S.tempo);
    setKey(S.key, S.fine);
    updateFav();
    $('avartan').textContent = num(0);
    $('elapsed').textContent = num('0:00');

    $('taalSelect').addEventListener('change', (e) => selectTaal(e.target.value));
    $('favBtn').addEventListener('click', () => {
      const i = store.favorites.indexOf(S.taalId);
      if (i >= 0) store.favorites.splice(i, 1); else store.favorites.push(S.taalId);
      fillTaalSelect($('taalSelect'), S.taalId);
      updateFav();
      save();
    });

    bind('taalOn', 'taalOn', { onChange: cardState });
    bind('drumSelect', 'drum', { type: 'str', onChange: () => selectTaal(S.taalId, { keepTempo: true }) });
    bind('startBeat', 'startBeat');
    bind('taalVol', 'taalVol', { onChange: (v) => engine.setVolume('taal', v) });
    bind('dayanVol', 'dayanVol', { onChange: (v) => engine.setVolume('dayan', v) });
    bind('bayanVol', 'bayanVol', { onChange: (v) => engine.setVolume('bayan', v) });
    bind('tablaFine', 'tablaFine', { onChange: (v) => { engine.tablaFine = v / 100; } });
    bind('manjeeraOn', 'manjeeraOn');
    bind('manjeeraVol', 'manjeeraVol', { onChange: (v) => engine.setVolume('manjeera', v) });
    bind('manjeeraMode', 'manjeeraMode', { type: 'str', onChange: showManjeera });
    $('manjeeraBeats').addEventListener('input', (e) => {
      S.manjeeraBeats = { ...S.manjeeraBeats, [S.taalId]: e.target.value };
      checkManjeera();
      save();
    });
    showManjeera();

    bind('lehraOn', 'lehraOn', { onChange: cardState });
    $('lehraSelect').addEventListener('change', (e) => {
      S.lehraId = e.target.value;
      syncLehra(player.taal);
      fillLehraSelect();
      save();
    });
    bind('lehraVol', 'lehraVol', { onChange: (v) => engine.setVolume('lehra', v) });
    bind('lehraAuto', 'lehraAuto');

    bind('tanpuraOn', 'tanpuraOn', { onChange: cardState });
    bind('tanpuraPattern', 'tanpuraPattern');
    bind('tanpuraTone', 'tanpuraTone', { type: 'str', onChange: (v) => engine.ctx && engine.load(engine.tanpuraFiles(v)) });
    bind('tanpuraCount', 'tanpuraCount');
    bind('tanpuraSpeed', 'tanpuraSpeed', { onChange: (v) => { $('tanpuraSpeedVal').textContent = num(v.toFixed(2)) + '×'; } });
    $('tanpuraSpeedVal').textContent = num(Number(S.tanpuraSpeed).toFixed(2)) + '×';
    bind('tanpuraRandom', 'tanpuraRandom');
    bind('tanpuraVol', 'tanpuraVol', { onChange: (v) => engine.setVolume('tanpura', v) });
    document.querySelectorAll('.tdelay').forEach((el) => {
      const i = Number(el.dataset.i);
      el.value = S.tanpuraDelays[i];
      el.addEventListener('input', () => {
        const v = Number(el.value);
        if (v >= 0.2) { S.tanpuraDelays[i] = v; save(); }
      });
    });

    bind('swarOn', 'swarOn', { onChange: cardState });
    bind('swarRaga', 'swarRaga', { type: 'str' });
    bind('swarEvery', 'swarEvery');
    bind('swarSpeed', 'swarSpeed');
    bind('swarVol', 'swarVol', { onChange: (v) => engine.setVolume('swar', v) });
    $('strumBtn').addEventListener('click', () => player.strumNow());
    cardState();
    initPanes();

    // Transport
    $('playBtn').addEventListener('click', togglePlay);
    // Float the play button once the transport scrolls out of view.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => $('playBtn').classList.toggle('floating', !e.isIntersecting))
        .observe(document.querySelector('.play-slot'));
    }
    $('tempo').addEventListener('change', (e) => setTempo(e.target.value));
    $('tempoUp').addEventListener('click', () => setTempo(S.tempo + 1));
    $('tempoDown').addEventListener('click', () => setTempo(S.tempo - 1));
    $('tempoHalf').addEventListener('click', () => setTempo(S.tempo / 2));
    $('tempoDouble').addEventListener('click', () => setTempo(S.tempo * 2));
    $('tempoReset').addEventListener('click', () => setTempo((rawTaal(S.taalId) || {}).tempo || 120));
    $('tapBtn').addEventListener('click', tap);
    $('key').addEventListener('change', (e) => setKey(Number(e.target.value)));
    $('keyUp').addEventListener('click', () => setKey(S.key + 1));
    $('keyDown').addEventListener('click', () => setKey(S.key - 1));
    $('fine').addEventListener('change', (e) => setKey(S.key, Number(e.target.value)));
    $('masterVol').value = S.master;
    $('masterVol').addEventListener('input', (e) => { S.master = Number(e.target.value); engine.setVolume('master', S.master); save(); });

    initPresets();
  }

  // ── Sargam practice sidebar ──────────────────────────────────────────
  let sargamSpans = [];      // note index -> its spans (a long note spans several beats)
  let sargamLineNotes = [];  // line -> indexes of the notes that start in it
  let sargamLineEls = [];
  let sargamEditing = false;   // the line editor shows only after pressing Edit
  let sargamOn = [];
  let checkNote = null;   // note being checked: { idx, semi, start, samples }
  const score = { ok: 0, low: 0, high: 0, miss: 0 };

  // 'custom' is an unsaved line; 'line:<id>' is a saved one. Both play the
  // text in the editor, so edits can be heard before saving.
  function isOwnLine() { return S.sargamExercise === 'custom' || S.sargamExercise.startsWith('line:'); }
  function savedLine() {
    const id = S.sargamExercise.startsWith('line:') ? S.sargamExercise.slice(5) : null;
    return id ? store.sargamLines.find((l) => l.id === id) || null : null;
  }

  // Notes as a timeline; unmarked swars last one Laya step (1 / notes per beat).
  function sargamNotes() {
    const step = 1 / Number(S.sargamPerBeat);
    $('sargamError').textContent = '';
    if (isOwnLine()) {
      const p = N.parseSargam(S.sargamCustom, step);
      $('sargamError').textContent = p.errors.join(' · ');
      return p.notes;
    }
    const a = D.ALANKARS.find((x) => x.id === S.sargamExercise) || D.ALANKARS[0];
    const raga = D.RAGAS.find((r) => r.id === S.sargamRaga) || D.RAGAS[0];
    return N.slotsToNotes(D.buildAlankar(a.pattern, raga.scale), step);
  }

  function applySargam() {
    player.setSargam(sargamNotes(), S.sargamMode);
    player.setSargamLoop(loopLines());
    $('sargamEditor').hidden = !(isOwnLine() && sargamEditing);
    $('sargamEdit').hidden = !isOwnLine();
    $('sargamEdit').setAttribute('aria-pressed', String(sargamEditing));
    $('sargamLineDelete').hidden = !savedLine();
    $('sargamShare').hidden = !savedLine();
    updateSargamFav();
    $('sargamRaga').disabled = isOwnLine();
    resetSargamScore();
    renderSargam();
    updateTurn(null);
  }

  function fillSargamExercise() {
    const ex = $('sargamExercise');
    ex.innerHTML = '';
    // Favourites on top (an exercise can also stay in its own group below).
    const favs = store.sargamFavorites.map(sargamExerciseName).filter((f) => f.name);
    if (favs.length) ex.appendChild(group(tr('★ Favourites'), favs.map((f) => opt(f.value, f.name))));
    ex.appendChild(group(tr('Alankars'), D.ALANKARS.map((a) => opt(a.id, a.name))));
    const mine = store.sargamLines.slice().sort((a, b) => a.name.localeCompare(b.name));
    $('sargamShareAll').hidden = !mine.length;
    // Lines without a list first, then one group per list.
    const loose = mine.filter((l) => !l.list);
    if (loose.length) ex.appendChild(group(tr('My lines'), loose.map((l) => opt('line:' + l.id, l.name))));
    const lists = sargamListNames();
    for (const name of lists) {
      ex.appendChild(group(name, mine.filter((l) => l.list === name).map((l) => opt('line:' + l.id, l.name))));
    }
    $('sargamListNames').replaceChildren(...lists.map((n) => opt(n, n)));
    ex.appendChild(group(tr('Your own'), [opt('custom', tr('New custom line…'))]));
    if (isOwnLine() && S.sargamExercise !== 'custom' && !savedLine()) S.sargamExercise = 'custom';
    ex.value = S.sargamExercise;
    renderSargamPicker();
  }

  // The picker is a custom dropdown built from the (hidden) select's groups,
  // because a native one can't collapse groups or limit its height.
  // Groups are collapsed unless opened, except favourites, alankars and the
  // group holding the current exercise; the user's choice is remembered.
  function renderSargamPicker() {
    const ex = $('sargamExercise');
    const menu = $('sargamPickMenu');
    const cur = ex.selectedOptions[0];
    $('sargamPickBtn').firstChild.textContent = cur ? cur.textContent : '';
    menu.innerHTML = '';
    for (const g of ex.querySelectorAll('optgroup')) {
      const hasCur = [...g.children].some((o) => o.value === ex.value);
      const fixed = g.label === tr('★ Favourites') || g.label === tr('Alankars') || g.label === tr('Your own');
      const open = g.label in S.sargamCollapsed ? !S.sargamCollapsed[g.label] : fixed || hasCur;
      const head = document.createElement('button');
      head.type = 'button';
      head.className = 'pk-head';
      head.setAttribute('aria-expanded', String(open));
      head.innerHTML = '<span class="pk-arrow">▸</span><span class="pk-label"></span><span class="pk-count"></span>';
      head.querySelector('.pk-label').textContent = g.label;
      head.querySelector('.pk-count').textContent = num(g.children.length);
      const list = document.createElement('div');
      list.className = 'pk-items';
      list.hidden = !open;
      // Items are made when the group first opens: imported libraries can
      // hold thousands of lines.
      const fill = () => {
        if (list.firstChild) return;
        for (const o of g.children) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'pk-item';
          b.dataset.value = o.value;
          b.setAttribute('role', 'option');
          b.setAttribute('aria-selected', String(o.value === ex.value));
          b.textContent = o.textContent;
          list.appendChild(b);
        }
      };
      if (open) fill();
      list.addEventListener('click', (e) => {
        const b = e.target.closest('.pk-item');
        if (b) { closeSargamPicker(); selectSargamExercise(b.dataset.value); }
      });
      head.addEventListener('click', () => {
        const nowOpen = list.hidden;
        if (nowOpen) fill();
        list.hidden = !nowOpen;
        head.setAttribute('aria-expanded', String(nowOpen));
        S.sargamCollapsed = { ...S.sargamCollapsed, [g.label]: !nowOpen };
        save();
      });
      menu.append(head, list);
    }
  }

  function openSargamPicker() {
    const menu = $('sargamPickMenu');
    menu.hidden = false;
    $('sargamPickBtn').setAttribute('aria-expanded', 'true');
    const sel = menu.querySelector('.pk-item[aria-selected=true]');
    if (sel && sel.offsetParent) { sel.scrollIntoView({ block: 'nearest' }); sel.focus(); }
  }
  function closeSargamPicker() {
    $('sargamPickMenu').hidden = true;
    $('sargamPickBtn').setAttribute('aria-expanded', 'false');
  }

  function initSargamPicker() {
    const btn = $('sargamPickBtn');
    const menu = $('sargamPickMenu');
    btn.addEventListener('click', () => (menu.hidden ? openSargamPicker() : closeSargamPicker()));
    document.addEventListener('pointerdown', (e) => {
      if (!menu.hidden && !e.target.closest('.sargam-picker')) closeSargamPicker();
    });
    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeSargamPicker(); btn.focus(); e.preventDefault(); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      // Step through the visible headers and items.
      const all = [...menu.querySelectorAll('button')].filter((b) => b.offsetParent);
      const i = all.indexOf(document.activeElement) + (e.key === 'ArrowDown' ? 1 : -1);
      if (all[i]) all[i].focus();
      e.preventDefault();
    });
  }

  // Name of an alankar id or 'line:<id>'; empty when it no longer exists.
  function sargamExerciseName(value) {
    const id = value.startsWith('line:') ? value.slice(5) : null;
    const item = id ? store.sargamLines.find((l) => l.id === id) : D.ALANKARS.find((a) => a.id === value);
    return { value, name: item ? item.name : '' };
  }

  function updateSargamFav() {
    const btn = $('sargamFav');
    const fav = store.sargamFavorites.includes(S.sargamExercise);
    btn.hidden = S.sargamExercise === 'custom';   // save the line first
    btn.textContent = fav ? '★' : '☆';
    btn.setAttribute('aria-pressed', String(fav));
  }

  function toggleSargamFav() {
    const v = S.sargamExercise;
    const i = store.sargamFavorites.indexOf(v);
    if (i >= 0) store.sargamFavorites.splice(i, 1); else store.sargamFavorites.push(v);
    save(true);
    fillSargamExercise();
    updateSargamFav();
  }

  function sargamListNames() {
    return [...new Set(store.sargamLines.map((l) => l.list).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  // The editor's default-taal picker: "none" plus every taal.
  function fillSargamLineTaal(value) {
    const sel = $('sargamLineTaal');
    fillTaalSelect(sel, value);
    sel.insertBefore(opt('', tr('No default taal')), sel.firstChild);
    sel.value = value && rawTaal(value) ? value : '';
  }

  // Show a line's fields in the editor. A new line starts on the current taal.
  function fillSargamEditor(line) {
    $('sargamLineName').value = line ? line.name : '';
    $('sargamLineList').value = line ? line.list || '' : '';
    fillSargamLineTaal(line ? line.taal : S.taalId);
  }

  function selectSargamExercise(value) {
    S.sargamExercise = value;
    if (value === 'custom') sargamEditing = true;   // nothing to see until it is written
    const line = savedLine();
    if (line) S.sargamCustom = line.notes;
    $('sargamCustom').value = S.sargamCustom;
    fillSargamEditor(line);
    // Switch to the line's default taal; the taal picker can still change it.
    if (line && line.taal && line.taal !== S.taalId && rawTaal(line.taal)) {
      selectTaal(line.taal);
      $('taalSelect').value = line.taal;
    }
    $('sargamLineStatus').textContent = '';
    $('sargamExercise').value = value;
    renderSargamPicker();
    save();
    applySargam();
  }

  function saveSargamLine() {
    const name = $('sargamLineName').value.trim();
    const notes = S.sargamCustom.trim();
    const status = $('sargamLineStatus');
    const p = N.parseSargam(notes, 1);
    if (!name) { status.textContent = tr('Give the line a name first.'); $('sargamLineName').focus(); return; }
    if (!p.notes.some((n) => n.semi !== null)) { status.textContent = tr('Write some swars first.'); return; }
    if (p.errors.length) { status.textContent = tr('Fix the errors before saving.'); return; }
    // Update the selected line, or one with the same name; otherwise add a new one.
    let line = savedLine() || store.sargamLines.find((l) => l.name.toLowerCase() === name.toLowerCase());
    if (line) Object.assign(line, { name, notes });
    else {
      line = { id: Date.now().toString(36), name, notes };
      store.sargamLines.push(line);
    }
    // Optional fields are left out of the file when empty.
    const list = $('sargamLineList').value.trim();
    const taal = $('sargamLineTaal').value;
    if (list) line.list = list; else delete line.list;
    if (taal) line.taal = taal; else delete line.taal;
    S.sargamExercise = 'line:' + line.id;
    sargamEditing = false;   // saved: close the editor
    save(true);
    fillSargamExercise();
    applySargam();
    status.textContent = tr('Saving…');
    writeFile('sargamLines').then((ok) => {
      status.textContent = ok ? tr('Saved to {file}.', { file: FILES.sargamLines }) : BROWSER_ONLY;
    });
  }

  function deleteSargamLine() {
    const line = savedLine();
    if (!line || !confirm(tr('Delete the line "{name}"?', { name: line.name }))) return;
    store.sargamLines = store.sargamLines.filter((l) => l !== line);
    store.sargamFavorites = store.sargamFavorites.filter((v) => v !== 'line:' + line.id);
    S.sargamExercise = 'custom';
    save(true);
    writeFile('sargamLines');
    fillSargamExercise();
    selectSargamExercise('custom');
  }

  // Search every exercise (alankars and saved lines) by name or list name.
  const SEARCH_MAX = 100;
  function initSargamSearch() {
    const input = $('sargamSearch');
    const box = $('sargamResults');
    let hits = [];
    let active = -1;
    const taalName = (id) => { const t = id && rawTaal(id); return t ? t.name : ''; };
    const close = () => {
      box.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      active = -1;
    };
    const mark = (i) => {
      active = i;
      [...box.children].forEach((li, j) => li.classList.toggle('active', j === i));
      if (box.children[i]) box.children[i].scrollIntoView({ block: 'nearest' });
    };
    const pick = (hit) => {
      input.value = '';
      close();
      selectSargamExercise(hit.value);
    };
    const search = () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { close(); return; }
      const all = D.ALANKARS.map((a) => ({ value: a.id, name: a.name, sub: tr('Alankars') }))
        .concat(store.sargamLines.map((l) => ({
          value: 'line:' + l.id, name: l.name, list: l.list || '',
          sub: [l.list || tr('My lines'), taalName(l.taal)].filter(Boolean).join(' · '),
        })));
      // Favourites first, then names that start with the query.
      const rank = (h) => (store.sargamFavorites.includes(h.value) ? 0 : 2) + (h.name.toLowerCase().startsWith(q) ? 0 : 1);
      hits = all.filter((h) => h.name.toLowerCase().includes(q) || (h.list && h.list.toLowerCase().includes(q)))
        .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
      box.innerHTML = '';
      if (!hits.length) {
        const li = document.createElement('li');
        li.className = 'empty';
        li.textContent = tr('No sargam found');
        box.appendChild(li);
      }
      // Only the best matches are listed; typing more narrows the rest.
      const more = hits.length - SEARCH_MAX;
      hits = hits.slice(0, SEARCH_MAX);
      hits.forEach((h, i) => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.textContent = (store.sargamFavorites.includes(h.value) ? '★ ' : '') + h.name;
        const small = document.createElement('small');
        small.textContent = h.sub;
        li.appendChild(small);
        // mousedown, so the input's blur doesn't close the list first.
        li.addEventListener('mousedown', (e) => { e.preventDefault(); pick(h); });
        li.addEventListener('mousemove', () => mark(i));
        box.appendChild(li);
      });
      if (more > 0) {
        const li = document.createElement('li');
        li.className = 'empty';
        li.textContent = tr('{n} more — type more to narrow the search', { n: more });
        box.appendChild(li);
      }
      box.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      mark(hits.length ? 0 : -1);
    };
    input.addEventListener('input', search);
    input.addEventListener('focus', search);
    input.addEventListener('blur', close);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' && hits.length) mark((active + 1) % hits.length);
      else if (e.key === 'ArrowUp' && hits.length) mark((active - 1 + hits.length) % hits.length);
      else if (e.key === 'Enter' && hits[active]) pick(hits[active]);
      else if (e.key === 'Escape') { input.value = ''; close(); }
      else return;
      e.preventDefault();
    });
  }

  // "Selected lines" loop: picked line indexes are kept per exercise.
  function loopLines() {
    if (S.sargamLoop !== 'selected') return null;
    return (S.sargamLoopLines || {})[S.sargamExercise] || [];
  }

  function toggleLoopLine(ln) {
    const cur = (S.sargamLoopLines || {})[S.sargamExercise] || [];
    const next = cur.includes(ln) ? cur.filter((l) => l !== ln) : cur.concat(ln).sort((a, b) => a - b);
    S.sargamLoopLines = { ...S.sargamLoopLines, [S.sargamExercise]: next };
    save();
    player.setSargamLoop(loopLines());
    showLoop();
  }

  function showLoop() {
    const on = S.sargamLoop === 'selected';
    // A line edited shorter may have lost picked lines; the player skips them too.
    const picked = (loopLines() || []).filter((l) => l < sargamLineEls.length);
    $('sargamLoopBar').hidden = !on;
    $('sargamLines').classList.toggle('has-picks', on && picked.length > 0);
    sargamLineEls.forEach((row, i) => {
      row.classList.toggle('pickable', on);
      row.classList.toggle('picked', on && picked.includes(i));
      if (on) {
        row.tabIndex = 0;
        row.setAttribute('role', 'checkbox');
        row.setAttribute('aria-checked', String(picked.includes(i)));
        row.title = tr('Line {n}: click to add to the loop or remove', { n: i + 1 });
      } else {
        row.removeAttribute('tabindex');
        row.removeAttribute('role');
        row.removeAttribute('aria-checked');
        row.removeAttribute('title');
      }
    });
    const list = picked.map((l) => num(l + 1)).join(', ');
    $('sargamLoopInfo').textContent = !picked.length
      ? tr('Click lines to choose them for the loop. None chosen yet, so every line plays.')
      : tr(picked.length === 1 ? 'Looping line {list}. Click lines to add or remove them.'
        : 'Looping lines {list}. Click lines to add or remove them.', { list });
    $('sargamLoopClear').hidden = !picked.length;
  }

  function swarSpan(semi, short) {
    const sp = document.createElement('span');
    const l = N.swarLabel(semi, S.sargamLang);
    sp.className = 'sw' + (l.komal ? ' komal' : '') + (l.tivra ? ' tivra' : '') +
      (l.octave < 0 ? ' mandra' : '') + (l.octave > 0 ? ' taar' : '') + (l.octave > 1 ? ' taar2' : '');
    sp.innerHTML = '<span class="nm"></span>';
    sp.firstChild.textContent = short ? l.short : l.name;
    return sp;
  }

  function plainSpan(cls, text) {
    const sp = document.createElement('span');
    sp.className = 'sw ' + cls;
    sp.textContent = text;
    return sp;
  }

  // One line per avartan, beats grouped by vibhag. Inside a beat each note
  // takes space in proportion to its length; a note continuing from the
  // previous beat shows as "–".
  function renderSargam() {
    const box = $('sargamLines');
    const taal = gridTaal || player.taal;
    $('sargamWarn').textContent = '';
    if (!box || !taal || !player.sargam) { if (box) box.innerHTML = ''; return; }
    const { notes } = player.sargam;
    const beats = taal.beats;
    const { lines } = player.sargamLayout(beats);
    const short = notes.some((n) => n.semi !== null && n.len < 0.99);
    const eps = 1e-6;
    sargamSpans = notes.map(() => []);
    sargamLineNotes = Array.from({ length: lines }, () => []);
    sargamLineEls = [];
    sargamOn = [];
    box.innerHTML = '';

    const crossing = notes.filter((n) => n.semi !== null && Math.floor(n.pos / beats + eps) !== Math.floor((n.pos + n.len) / beats - eps));
    if (crossing.length) {
      const n = crossing[0];
      $('sargamWarn').textContent = tr('A note at beat {beat} of line {line} runs past the avartan and is cut at the line end.',
        { beat: +(n.pos % beats + 1).toFixed(3), line: Math.floor(n.pos / beats) + 1 });
    }
    notes.forEach((n) => sargamLineNotes[Math.min(lines - 1, Math.floor(n.pos / beats + eps))].push(n.i));

    for (let ln = 0; ln < lines; ln++) {
      const row = document.createElement('div');
      row.className = 's-line';
      row.innerHTML = `<div class="ln">${num(ln + 1)}</div><div class="vibs"></div>`;
      let beat = 0;
      for (const vlen of taal.vibhags) {
        const vib = document.createElement('div');
        vib.className = 's-vib';
        for (let k = 0; k < vlen; k++, beat++) {
          const cell = document.createElement('div');
          cell.className = 's-beat' + (beat === 0 ? ' sam' : '');
          const b0 = ln * beats + beat;
          let covered = 0;
          for (const n of notes) {
            if (n.pos >= b0 + 1 - eps) break;
            if (n.pos + n.len <= b0 + eps) continue;
            const frac = Math.min(n.pos + n.len, b0 + 1) - Math.max(n.pos, b0);
            const starts = n.pos >= b0 - eps;
            let sp;
            if (!starts) sp = plainSpan(n.semi === null ? 'rest held' : 'held', '–');
            else if (n.semi === null) sp = plainSpan('rest', '~');
            else sp = swarSpan(n.semi, short);
            // Meend: a slur from the end of the swar to the swar it glides into.
            if (n.glideTo !== undefined && Math.min(n.pos + n.len, b0 + 1) >= n.pos + n.len - eps) sp.classList.add('meend');
            if (starts && n.slur) sp.classList.add('meend-in');
            sp.style.flexGrow = frac;
            sargamSpans[n.i].push(sp);
            cell.appendChild(sp);
            covered += frac;
          }
          if (covered < 1 - 1e-3) {   // thirds add up to 0.999999
            const pad = plainSpan('pad', '·');
            pad.style.flexGrow = 1 - covered;
            cell.appendChild(pad);
          }
          vib.appendChild(cell);
        }
        row.lastChild.appendChild(vib);
      }
      row.addEventListener('click', () => { if (S.sargamLoop === 'selected') toggleLoopLine(ln); });
      row.addEventListener('keydown', (e) => {
        if (S.sargamLoop !== 'selected' || (e.key !== ' ' && e.key !== 'Enter')) return;
        e.preventDefault();
        e.stopPropagation();   // Space here picks the line, it doesn't start playing
        toggleLoopLine(ln);
      });
      sargamLineEls.push(row);
      box.appendChild(row);
    }
    showLoop();
    fitSargamLines();
  }

  // The notation box shows S.sargamVisible lines and scrolls the rest.
  // Lines wrap at narrow widths, so the height is measured, not computed.
  function fitSargamLines() {
    const box = $('sargamLines');
    const handle = $('sargamResize');
    const rows = sargamLineEls;
    const n = Math.max(1, Math.min(S.sargamVisible, rows.length));
    handle.hidden = rows.length < 2;
    handle.lastChild.textContent = rows.length < 2 ? '' : tr('{n} of {total} lines', { n, total: rows.length });
    handle.setAttribute('aria-valuenow', n);
    handle.setAttribute('aria-valuemax', rows.length);
    if (n >= rows.length || !box.offsetParent) { box.style.maxHeight = ''; return; }
    const top = rows[0].getBoundingClientRect().top;
    box.style.maxHeight = Math.ceil(rows[n].getBoundingClientRect().top - top) + 'px';
  }

  function setSargamVisible(n) {
    n = Math.max(1, Math.min(n, sargamLineEls.length));
    if (n === Math.min(S.sargamVisible, sargamLineEls.length)) return;
    S.sargamVisible = n;
    fitSargamLines();
    save();
  }

  // Drag the handle under the lines; it snaps to whole lines.
  function initSargamResize() {
    const box = $('sargamLines');
    const handle = $('sargamResize');
    let drag = null;
    handle.addEventListener('pointerdown', (e) => {
      if (!sargamLineEls.length) return;
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      drag = { y: e.clientY, h: box.getBoundingClientRect().height };
      handle.classList.add('dragging');
    });
    handle.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const want = drag.h + e.clientY - drag.y;
      const top = sargamLineEls[0].getBoundingClientRect().top;
      // Lines whose middle is above the wanted height stay visible.
      let n = 0;
      for (const r of sargamLineEls) {
        const b = r.getBoundingClientRect();
        if (b.top - top + b.height / 2 > want) break;
        n++;
      }
      setSargamVisible(n);
    });
    const end = () => { drag = null; handle.classList.remove('dragging'); };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    handle.addEventListener('keydown', (e) => {
      const cur = Math.min(S.sargamVisible, sargamLineEls.length);
      if (e.key === 'ArrowDown') setSargamVisible(cur + 1);
      else if (e.key === 'ArrowUp') setSargamVisible(cur - 1);
      else return;
      e.preventDefault();
    });
    // Re-measure when the panel opens or changes width (lines rewrap).
    let width = 0;
    new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      if (w !== width) { width = w; fitSargamLines(); }
    }).observe($('sargamPanel'));
  }

  // Playback keeps the current line at the top of the box, but the user's own
  // scrolling wins: following resumes after FOLLOW_PAUSE ms without any.
  const FOLLOW_PAUSE = 10000;
  let sargamLine = -1;
  let userScrolling = false;
  let followTimer = 0;

  function showSargamLine() {
    const row = sargamLineEls[sargamLine];
    if (!row) return;
    const box = $('sargamLines');
    if (box.scrollHeight > box.clientHeight) {
      box.scrollTo({ top: box.scrollTop + row.getBoundingClientRect().top - box.getBoundingClientRect().top, behavior: 'smooth' });
    }
    // With many lines the row can also be off screen; bring it back only
    // while the panel is in view, so watching the beat grid isn't disturbed.
    const panel = $('sargamPanel').getBoundingClientRect();
    const r = row.getBoundingClientRect();
    const inView = panel.bottom > 0 && panel.top < innerHeight;
    if (inView && (r.top < 0 || r.bottom > innerHeight)) {
      scrollBy({ top: r.top - Math.min(80, innerHeight / 4), behavior: 'smooth' });
    }
  }

  function initSargamFollow() {
    const touched = () => {
      userScrolling = true;
      clearTimeout(followTimer);
      followTimer = setTimeout(() => {
        userScrolling = false;
        if (player.playing) showSargamLine();
      }, FOLLOW_PAUSE);
    };
    for (const t of ['wheel', 'touchstart', 'touchmove']) addEventListener(t, touched, { passive: true });
    // Dragging a scrollbar or keyboard scrolling inside the box.
    $('sargamLines').addEventListener('pointerdown', touched);
    addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) touched();
    });

    // Long pages: a button to jump back to the top.
    const top = $('toTop');
    const update = () => { top.hidden = scrollY < innerHeight; };
    addEventListener('scroll', update, { passive: true });
    update();
    top.addEventListener('click', () => {
      clearTimeout(followTimer);
      userScrolling = true;
      followTimer = setTimeout(() => { userScrolling = false; }, FOLLOW_PAUSE);
      scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function updateTurn(ev) {
    const el = $('sargamTurn');
    let text = tr('Starts on sam');
    let cls = '';
    if (ev && S.sargamOn) {
      if (S.sargamMode === 'call') {
        text = ev.yourTurn ? tr('Your turn — sing it back') : tr('Listen');
        cls = ev.yourTurn ? 'yours' : 'listen';
      } else {
        text = tr(S.sargamMode === 'silent' ? 'Sing — line {n}' : 'Sing along — line {n}', { n: ev.line + 1 });
        cls = 'yours';
      }
    }
    el.textContent = text;
    el.className = 'turn ' + cls;
  }

  function sargamNote(ev) {
    const checking = S.sargamCheck && (S.sargamMode !== 'call' || ev.yourTurn);
    if (ev.kind === 'line') {
      sargamLineEls.forEach((r, i) => r.classList.toggle('current', i === ev.line));
      sargamLine = ev.line;
      if (!userScrolling) showSargamLine();
      updateTurn(ev);
      finishCheck();
      // The line is about to be sung again: clear its old marks.
      if (checking) {
        for (const i of sargamLineNotes[ev.line] || []) {
          sargamSpans[i].forEach((sp) => sp.classList.remove('ok', 'low', 'high', 'miss'));
        }
      }
      return;
    }
    sargamOn.forEach((sp) => sp.classList.remove('on'));
    sargamOn = sargamSpans[ev.idx] || [];
    sargamOn.forEach((sp) => sp.classList.add('on'));
    // Pitch checking: each sung note collects pitch samples until the next note.
    finishCheck();
    // A swar that slides away (meend) is checked only until the slide.
    if (checking && ev.semi !== null) checkNote = { idx: ev.idx, semi: ev.semi, start: ev.time, until: ev.glideAt ?? null, samples: [] };
  }

  function sargamPitch(f) {
    if (!checkNote || !f || !player.playing) return;
    const heardAt = engine.now - ((engine.ctx && engine.ctx.outputLatency) || 0);
    if (heardAt - checkNote.start < 0.06) return;   // skip the slide into the note
    if (checkNote.until !== null && heardAt > checkNote.until) return;   // sliding away
    const expected = engine.saFrequency() * Math.pow(2, checkNote.semi / 12);
    let cents = 1200 * Math.log2(f / expected);
    cents = ((((cents + 600) % 1200) + 1200) % 1200) - 600;   // any octave counts
    checkNote.samples.push(cents);
  }

  function finishCheck() {
    const c = checkNote;
    checkNote = null;
    if (!c) return;
    let result = 'miss';
    if (c.samples.length) {
      const sorted = c.samples.slice().sort((a, b) => a - b);
      const med = sorted[Math.floor(sorted.length / 2)];
      result = Math.abs(med) <= 30 ? 'ok' : med < 0 ? 'low' : 'high';
    }
    score[result]++;
    (sargamSpans[c.idx] || []).forEach((sp) => sp.classList.add(result));
    showScore();
  }

  function showScore() {
    const total = score.ok + score.low + score.high + score.miss;
    $('sargamScore').innerHTML = !S.sargamCheck ? '' : `<div class="legend">
      <span><i style="background:var(--ok)"></i>${tr('In tune')} ${num(score.ok)}</span>
      <span><i style="background:var(--khali)"></i>${tr('Low')} ${num(score.low)}</span>
      <span><i style="background:var(--danger)"></i>${tr('High')} ${num(score.high)}</span>
      <span><i style="background:var(--muted)"></i>${tr('Missed')} ${num(score.miss)}</span>
      ${total ? `<b>${num(Math.round((100 * score.ok) / total))}%</b>` : ''}</div>`;
  }

  function resetSargamScore() {
    score.ok = score.low = score.high = score.miss = 0;
    checkNote = null;
    sargamSpans.forEach((spans) => spans.forEach((sp) => sp.classList.remove('ok', 'low', 'high', 'miss')));
    showScore();
  }

  function sargamStopped() {
    sargamLine = -1;
    finishCheck();
    sargamOn.forEach((sp) => sp.classList.remove('on'));
    sargamOn = [];
    sargamLineEls.forEach((r) => r.classList.remove('current'));
    updateTurn(null);
  }


  function initSargam() {
    fillSargamExercise();
    D.RAGAS.forEach((r) => $('sargamRaga').appendChild(opt(r.id, r.name)));
    D.SARGAM_INSTRUMENTS.forEach((i) => $('sargamInst').appendChild(opt(i.id, i.name)));

    bind('sargamOn', 'sargamOn', { onChange: () => { applySargam(); sargamStopped(); cardState(); } });
    $('sargamExercise').addEventListener('change', (e) => selectSargamExercise(e.target.value));
    bind('sargamRaga', 'sargamRaga', { type: 'str', onChange: applySargam });
    bind('sargamCustom', 'sargamCustom', { type: 'str', onChange: () => {
      $('sargamLineStatus').textContent = savedLine() ? tr('Unsaved changes') : '';
      applySargam();
    } });
    fillSargamEditor(savedLine());
    const changed = () => { if (savedLine()) $('sargamLineStatus').textContent = tr('Unsaved changes'); };
    $('sargamLineList').addEventListener('input', changed);
    $('sargamLineTaal').addEventListener('change', (e) => {
      changed();
      // Hear the line in the taal just picked.
      if (e.target.value && e.target.value !== S.taalId) {
        selectTaal(e.target.value);
        $('taalSelect').value = e.target.value;
      }
    });
    initSargamSearch();
    initSargamPicker();
    $('sargamFav').addEventListener('click', toggleSargamFav);
    $('sargamLineName').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveSargamLine(); });
    $('sargamLineSave').addEventListener('click', saveSargamLine);
    $('sargamLineDelete').addEventListener('click', deleteSargamLine);
    $('sargamShare').addEventListener('click', () => {
      const line = savedLine();
      if (line) exportFile(fileName(line.name, 'sargam'), { sargamLines: [line] });
    });
    $('sargamShareAll').addEventListener('click', () => {
      exportFile(FILES.sargamLines, { sargamLines: store.sargamLines });
    });
    $('sargamImport').addEventListener('change', (e) => importFile(e.target));
    // Android's picker filters by MIME type, and shared .json files often arrive
    // as text/plain or octet-stream: let any file be picked, importFile checks it.
    if (NATIVE) ['sargamImport', 'importFile'].forEach((id) => $(id).removeAttribute('accept'));
    // A blank line in the editor. An unsaved one being written is only
    // replaced after asking.
    $('sargamNew').addEventListener('click', () => {
      if (S.sargamExercise === 'custom' && S.sargamCustom.trim() && !confirm(tr('Discard the unsaved line?'))) return;
      S.sargamCustom = '';
      selectSargamExercise('custom');
      $('sargamLineName').focus();
    });
    $('sargamEdit').addEventListener('click', () => {
      sargamEditing = !sargamEditing;
      applySargam();
      if (sargamEditing) $('sargamCustom').focus();
    });
    initSargamResize();
    initSargamFollow();
    bind('sargamPerBeat', 'sargamPerBeat', { onChange: applySargam });
    bind('sargamMode', 'sargamMode', { type: 'str', onChange: applySargam });
    bind('sargamLoop', 'sargamLoop', { type: 'str', onChange: () => { player.setSargamLoop(loopLines()); showLoop(); } });
    $('sargamLoopClear').addEventListener('click', () => {
      S.sargamLoopLines = { ...S.sargamLoopLines, [S.sargamExercise]: [] };
      save();
      player.setSargamLoop(null);
      showLoop();
    });
    bind('sargamInst', 'sargamInst', { type: 'str', onChange: (v) => engine.ctx && engine.load(engine.melodicFiles(v)) });
    bind('sargamVol', 'sargamVol', { onChange: (v) => engine.setVolume('sargam', v) });
    $('sargamCheck').addEventListener('change', async (e) => {
      S.sargamCheck = e.target.checked;
      if (S.sargamCheck && !tuner.running) {
        try {
          await tuner.start();
          $('tStart').textContent = tr('Stop listening');
        } catch (err) {
          S.sargamCheck = e.target.checked = false;
          micUnavailable(err);
        }
      } else if (!S.sargamCheck && tuner.running) {
        tuner.stop();
        $('tStart').textContent = tr('Start listening');
      }
      resetSargamScore();
    });

    applySargam();
  }

  // ── Presets ──────────────────────────────────────────────────────────
  function initPresets() {
    const sel = $('presetSelect');
    const fill = (current) => {
      sel.innerHTML = '';
      sel.appendChild(opt('', store.presets.length ? tr('Choose…') : tr('No presets yet')));
      store.presets.forEach((p, i) => sel.appendChild(opt(i, p.name, p.name === current)));
    };
    fill();
    $('presetSave').addEventListener('click', () => {
      const name = prompt(tr('Preset name'), rawTaal(S.taalId).name);
      if (!name) return;
      const snap = {};
      for (const k of Object.keys(DEFAULTS)) if (!APP_PREFS.includes(k)) snap[k] = JSON.parse(JSON.stringify(S[k]));
      const i = store.presets.findIndex((p) => p.name === name);
      if (i >= 0) store.presets[i].settings = snap; else store.presets.push({ name, settings: snap });
      fill(name);
      save();
      writeFile('presets');
    });
    $('presetDelete').addEventListener('click', () => {
      const i = sel.value;
      if (i === '') return;
      if (!confirm(tr('Delete preset "{name}"?', { name: store.presets[i].name }))) return;
      store.presets.splice(Number(i), 1);
      fill();
      save();
      writeFile('presets');
    });
    sel.addEventListener('change', () => {
      const p = store.presets[sel.value];
      if (!p) return;
      Object.assign(S, p.settings);
      save();
      location.reload();   // simplest way to re-sync every control
    });
  }

  // ── Composer ─────────────────────────────────────────────────────────
  let editingId = null;
  const PADS = ['Dha', 'Dhin', 'Dhi', 'Di', 'Dhe', 'Dhum', 'Na', 'Ne', 'Ta', 'Tin', 'Sur', 'Tun', 'Ti',
                'Te', 'Ra', 'Tra', 'Ge', 'Gin', 'Ke', 'Kat', 'DhaGe', 'TiRaKiTa', 'TinNa', '-', '|'];
  // Notation keys: [label, text, tooltip]. They attach to the bol before the
  // cursor instead of starting a new beat; "( )" wraps the selection.
  const NOTATION_KEYS = [
    ['( )', '()', 'Group: wraps the selection, or opens a group'],
    ['#', '#', 'Accent: play the previous bol louder'],
    ['*', '*', 'Soft: play the previous bol softer'],
    ['~', '~', 'Gap: a silent stroke that takes its share of the group'],
    ['2', '2', 'Recording 2 of the previous bol'],
    ['3', '3', 'Recording 3 of the previous bol'],
    ['[1]', '[1]', 'Length: the previous group lasts 1 beat'],
    ['[2]', '[2]', 'Length: the previous group lasts 2 beats'],
    ['[0.5]', '[0.5]', 'Length: the previous group lasts half a beat'],
  ].map(([label, text, title]) => [label, text, tr(title)]);

  function composerTaal() {
    return {
      id: editingId || 'draft',
      name: $('cName').value.trim() || tr('Untitled'),
      marks: $('cMarks').value.trim(),
      tempo: Number($('cTempo').value) || 100,
      drum: $('cDrum').value,
      bols: $('cBols').value.replace(/\s+/g, ' ').trim(),
      kind: 'custom',
    };
  }

  function validateComposer() {
    const t = composerTaal();
    const c = window.compileTaal(t);
    const st = $('cStatus');
    if (!c.beats) { st.textContent = ''; $('cPreview').innerHTML = ''; return null; }
    renderGrid($('cPreview'), c);
    if (c.errors.length) {
      st.className = 'status-line err';
      st.textContent = c.errors.map((e) => e.msg).join(' · ');
      return null;
    }
    const markWarn = c.marks.length && c.marks.length !== c.vibhags.length
      ? tr(' · {m} marks for {v} vibhags', { m: c.marks.length, v: c.vibhags.length }) : '';
    st.className = 'status-line ' + (markWarn ? 'err' : 'ok');
    st.textContent = tr('{b} beats in {v} vibhags ({sum})', { b: c.beats, v: c.vibhags.length, sum: num(c.vibhags.join('+')) }) + markWarn;
    return t;
  }

  function loadIntoComposer(t) {
    editingId = t && t.id && t.kind === 'custom' ? t.id : null;
    $('cName').value = t ? t.name : '';
    $('cMarks').value = t ? t.marks : '';
    $('cTempo').value = t ? t.tempo : 100;
    $('cDrum').value = (t && t.drum) || 'tabla';
    $('cBols').value = t ? t.bols : '';
    validateComposer();
    renderCustomList();
    $('cShare').hidden = !editingId;
  }

  function renderCustomList() {
    const ul = $('customList');
    ul.innerHTML = '';
    $('cShareAll').hidden = !store.custom.length;
    if (!store.custom.length) {
      ul.innerHTML = `<li class="empty">${tr('Nothing saved yet. Built-in taals can be opened from here too:')}</li>`;
    }
    store.custom.forEach((t) => {
      const li = document.createElement('li');
      li.className = t.id === editingId ? 'sel' : '';
      li.innerHTML = `<span></span><span class="muted"></span>`;
      li.children[0].textContent = t.name;
      li.children[1].textContent = tr('{n} beats', { n: N.parseBols(t.bols).beats });
      li.addEventListener('click', () => loadIntoComposer(t));
      ul.appendChild(li);
    });
    const li = document.createElement('li');
    const sel = document.createElement('select');
    sel.appendChild(opt('', tr('Open a built-in taal as a starting point…')));
    D.TAALS.forEach((t) => sel.appendChild(opt(t.id, t.name)));
    sel.addEventListener('change', () => {
      const t = D.TAALS.find((x) => x.id === sel.value);
      if (t) loadIntoComposer({ ...t, id: null, kind: 'custom', name: tr('{name} (copy)', { name: t.name }) });
    });
    li.className = 'empty';
    li.appendChild(sel);
    ul.appendChild(li);
  }

  function insertAtCursor(text) {
    const ta = $('cBols');
    const { selectionStart: a, selectionEnd: b, value } = ta;
    const before = value.slice(0, a);
    const needSpace = before && !/[\s(]$/.test(before);
    const ins = (needSpace ? ' ' : '') + text + ' ';
    ta.value = before + ins + value.slice(b);
    ta.selectionStart = ta.selectionEnd = a + ins.length;
    ta.focus();
    validateComposer();
  }

  // Insert a notation key: "()" wraps the selection (or opens an empty group
  // with the cursor inside); the others join the previous bol, and a [length]
  // after the cursor's closing ")" goes after it.
  function insertNotation(text) {
    const ta = $('cBols');
    let { selectionStart: a, selectionEnd: b, value } = ta;
    let ins;
    let caret;
    if (text === '()') {
      const sel = value.slice(a, b).trim();
      const before = value.slice(0, a);
      const lead = before && !/[\s(|]$/.test(before) ? ' ' : '';
      ins = lead + '(' + sel + ')' + (sel ? ' ' : '');
      caret = sel ? ins.length : lead.length + 1;
    } else {
      if (text.startsWith('[') && value[b] === ')') a = b = b + 1;
      while (a > 0 && /\s/.test(value[a - 1])) a--;
      ins = text + (text.startsWith('[') ? ' ' : '');
      caret = ins.length;
    }
    ta.value = value.slice(0, a) + ins + value.slice(b);
    ta.selectionStart = ta.selectionEnd = a + caret;
    ta.focus();
    validateComposer();
  }

  function previewBol(text) {
    if (!S.previews) return;
    const parts = N.splitBols(text);
    if (!parts) return;
    engine.ensure();
    const bus = engine.preview;
    const drum = $('cDrum').value;
    const groups = [];
    for (const p of parts) {
      if (p.rest) continue;
      if (drum === 'pakhawaj') (N.PK_BOLS[p.bol] || []).forEach(([g, d]) => groups.push([g, d, p]));
      else {
        const b = N.BOLS[p.bol];
        if (b.r) groups.push([b.r, 0, p, bus.dayan]);
        if (b.l) groups.push([b.l, 0, p, bus.bayan]);
      }
    }
    const files = groups.flatMap(([g]) => engine.filesForGroup(g));
    engine.load(files).then(() => {
      const t0 = engine.now + 0.02;
      const step = 0.13;
      groups.forEach(([g, d, p, b]) => engine.stroke(g, t0 + parts.indexOf(p) * step + d, 0.9 * (p.vel || 1), b || bus.dayan, 0, p.variant));
    });
  }

  function initComposer() {
    const pads = $('bolPads');
    PADS.forEach((p) => {
      const b = document.createElement('button');
      b.textContent = p;
      b.addEventListener('click', () => {
        insertAtCursor(p);
        if (p !== '|' && p !== '-') previewBol(p);
        b.classList.add('flash');
        setTimeout(() => b.classList.remove('flash'), 120);
      });
      pads.appendChild(b);
    });
    NOTATION_KEYS.forEach(([label, text, title]) => {
      const b = document.createElement('button');
      b.className = 'notation';
      b.textContent = label;
      b.title = title;
      b.addEventListener('click', () => {
        insertNotation(text);
        b.classList.add('flash');
        setTimeout(() => b.classList.remove('flash'), 120);
      });
      pads.appendChild(b);
    });
    ['cName', 'cMarks', 'cTempo', 'cBols', 'cDrum'].forEach((id) => $(id).addEventListener('input', validateComposer));

    $('cPlay').addEventListener('click', () => {
      const t = validateComposer();
      if (!t) return;
      // Play exactly what is in the editor, saved or not.
      draftTaal = { ...t, id: 'draft', name: tr('{name} (draft)', { name: t.name }) };
      player.stop(true);
      fillTaalSelect($('taalSelect'), 'draft');
      selectTaal('draft');
      switchTab('player');
      startPlayer();
    });
    $('cSave').addEventListener('click', () => {
      const t = validateComposer();
      if (!t) return;
      if (editingId) {
        const i = store.custom.findIndex((x) => x.id === editingId);
        store.custom[i] = { ...t, id: editingId };
      } else {
        t.id = 'c-' + Date.now().toString(36);
        store.custom.push(t);
        editingId = t.id;
        $('cShare').hidden = false;
      }
      save();
      fillTaalSelect($('taalSelect'), S.taalId);
      renderCustomList();
      const st = $('cStatus');
      const base = st.textContent;
      st.textContent = base + ' · ' + tr('saving…');
      writeFile('custom').then((ok) => {
        st.textContent = base + ' · ' + (ok ? tr('saved to {file}', { file: FILES.custom }) : BROWSER_ONLY.toLowerCase());
      });
    });
    $('cNew').addEventListener('click', () => loadIntoComposer(null));
    $('cDelete').addEventListener('click', () => {
      if (!editingId) return;
      const t = store.custom.find((x) => x.id === editingId);
      if (!confirm(tr('Delete "{name}"?', { name: t.name }))) return;
      store.custom = store.custom.filter((x) => x.id !== editingId);
      store.favorites = store.favorites.filter((id) => id !== editingId);
      if (S.taalId === editingId) selectTaal('teentaal');
      save();
      writeFile('custom');
      fillTaalSelect($('taalSelect'), S.taalId);
      loadIntoComposer(null);
    });

    $('exportBtn').addEventListener('click', () => {
      exportFile('taal-studio-export.json', { custom: store.custom, sequences: store.sequences,
                                               presets: store.presets, sargamLines: store.sargamLines });
    });
    $('cShare').addEventListener('click', () => {
      const t = store.custom.find((x) => x.id === editingId);
      if (t) exportFile(fileName(t.name, 'composition'), { custom: [t] });
    });
    $('cShareAll').addEventListener('click', () => {
      exportFile(FILES.custom, { custom: store.custom });
    });
    $('importFile').addEventListener('change', (e) => importFile(e.target));

    loadIntoComposer(null);
  }

  // ── Sequences ────────────────────────────────────────────────────────
  let seqDraft = null;

  function newSeq() {
    return { id: null, name: '', loop: true, steps: [{ taalId: S.taalId, repeats: 4, tempo: '' }] };
  }

  function renderSeqList() {
    const ul = $('seqList');
    ul.innerHTML = '';
    if (!store.sequences.length) ul.innerHTML = `<li class="empty">${tr('No sequences yet.')}</li>`;
    store.sequences.forEach((q) => {
      const li = document.createElement('li');
      li.className = seqDraft && q.id === seqDraft.id ? 'sel' : '';
      li.innerHTML = '<span></span><span class="muted"></span>';
      li.children[0].textContent = q.name;
      li.children[1].textContent = tr('{n} steps', { n: q.steps.length });
      li.addEventListener('click', () => editSeq(JSON.parse(JSON.stringify(q))));
      ul.appendChild(li);
    });
  }

  function editSeq(q) {
    seqDraft = q;
    $('seqName').value = q.name;
    $('seqLoop').checked = q.loop;
    renderSteps();
    renderSeqList();
  }

  function renderSteps() {
    const tb = $('seqSteps');
    tb.innerHTML = '';
    seqDraft.steps.forEach((st, i) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${num(i + 1)}</td><td></td>
        <td><input type="number" min="1" max="99" class="rep"></td>
        <td><input type="number" min="10" max="800" class="tmp" placeholder="—"></td>
        <td class="row"><button class="up" title="${tr('Move up')}">↑</button><button class="dn" title="${tr('Move down')}">↓</button><button class="rm danger" title="${tr('Remove')}">✕</button></td>`;
      const sel = document.createElement('select');
      fillTaalSelect(sel, st.taalId);
      sel.addEventListener('change', () => { st.taalId = sel.value; });
      row.children[1].appendChild(sel);
      const rep = row.querySelector('.rep');
      rep.value = st.repeats;
      rep.addEventListener('input', () => { st.repeats = Math.max(1, Number(rep.value) || 1); });
      const tmp = row.querySelector('.tmp');
      tmp.value = st.tempo || '';
      tmp.addEventListener('input', () => { st.tempo = Number(tmp.value) || ''; });
      const move = (d) => {
        const j = i + d;
        if (j < 0 || j >= seqDraft.steps.length) return;
        [seqDraft.steps[i], seqDraft.steps[j]] = [seqDraft.steps[j], seqDraft.steps[i]];
        renderSteps();
      };
      row.querySelector('.up').addEventListener('click', () => move(-1));
      row.querySelector('.dn').addEventListener('click', () => move(1));
      row.querySelector('.rm').addEventListener('click', () => {
        if (seqDraft.steps.length > 1) { seqDraft.steps.splice(i, 1); renderSteps(); }
      });
      tb.appendChild(row);
    });
  }

  function markSeqStep(i) {
    document.querySelectorAll('#seqSteps tr').forEach((row, k) => row.classList.toggle('current', k === i));
  }

  function initSequences() {
    $('seqNew').addEventListener('click', () => editSeq(newSeq()));
    $('seqName').addEventListener('input', (e) => { seqDraft.name = e.target.value; });
    $('seqLoop').addEventListener('change', (e) => { seqDraft.loop = e.target.checked; });
    $('seqAddStep').addEventListener('click', () => {
      const last = seqDraft.steps[seqDraft.steps.length - 1];
      seqDraft.steps.push({ taalId: last ? last.taalId : S.taalId, repeats: 4, tempo: '' });
      renderSteps();
    });
    $('seqSave').addEventListener('click', () => {
      if (!seqDraft.name.trim()) seqDraft.name = tr('Sequence {n}', { n: store.sequences.length + 1 });
      $('seqName').value = seqDraft.name;
      if (!seqDraft.id) seqDraft.id = 's-' + Date.now().toString(36);
      // Store a copy: the step rows stay bound to seqDraft, so later edits
      // only reach the saved sequence on the next Save.
      const copy = JSON.parse(JSON.stringify(seqDraft));
      const i = store.sequences.findIndex((q) => q.id === seqDraft.id);
      if (i < 0) store.sequences.push(copy); else store.sequences[i] = copy;
      save();
      renderSeqList();
    });
    $('seqDelete').addEventListener('click', () => {
      if (!seqDraft.id || !confirm(tr('Delete "{name}"?', { name: seqDraft.name }))) return;
      store.sequences = store.sequences.filter((q) => q.id !== seqDraft.id);
      save();
      editSeq(newSeq());
    });
    $('seqPlay').addEventListener('click', () => {
      player.stop(true);
      if (!findTaal(seqDraft.steps[0].taalId)) return;
      startPlayer(JSON.parse(JSON.stringify(seqDraft)));
    });
    editSeq(store.sequences[0] ? JSON.parse(JSON.stringify(store.sequences[0])) : newSeq());
  }

  // ── Tuner ────────────────────────────────────────────────────────────
  let lastPitch = null;
  const tuner = new window.Tuner(engine, (f) => {
    sargamPitch(f);
    showTunerPitch(f);
  });

  function micUnavailable(err) {
    if (NATIVE) {
      alert(tr('Microphone unavailable: {err}\nAllow the microphone for Taal Studio in your phone\'s settings.', { err: err.message }));
      return;
    }
    alert(tr('Microphone unavailable: {err}\nOpen the app through ./run.sh (http://localhost) and allow the microphone.', { err: err.message }));
  }

  function showTunerPitch(f) {
    const needle = $('tNeedle');
    if (!f) { $('tSetSa').disabled = !lastPitch; return; }
    lastPitch = f;
    const midi = 69 + 12 * Math.log2(f / 440);
    const r = Math.round(midi);
    const cents = (midi - r) * 100;
    $('tNote').textContent = D.KEYS[((r % 12) + 12) % 12] + (Math.floor(r / 12) - 1);
    const rel = midi - (window.Data.SAMPLE_BASE_MIDI + engine.saSemis);
    const rr = Math.round(rel);
    $('tSargam').textContent = tr('{swar} relative to your Sa ({c}¢)', { swar: N.swarLabel(rr, S.sargamLang).fullName, c: Math.round((rel - rr) * 100) });
    $('tFreq').textContent = `${num(f.toFixed(1))} Hz · ${cents >= 0 ? '+' : ''}${num(cents.toFixed(0))} ${tr('cents')}`;
    needle.style.left = `calc(${50 + cents}% - 10px)`;
    needle.classList.toggle('good', Math.abs(cents) < 5);
    $('tSetSa').disabled = false;
  }

  function initTuner() {
    $('tStart').addEventListener('click', async () => {
      if (tuner.running) {
        tuner.stop();
        $('tStart').textContent = tr('Start listening');
        $('sargamCheck').checked = S.sargamCheck = false;
        resetSargamScore();
        return;
      }
      try {
        await tuner.start();
        $('tStart').textContent = tr('Stop listening');
      } catch (e) {
        micUnavailable(e);
      }
    });
    $('tSetSa').addEventListener('click', () => {
      if (!lastPitch) return;
      const midi = 69 + 12 * Math.log2(lastPitch / 440);
      const r = Math.round(midi);
      setKey(((r % 12) + 12) % 12, (midi - r) * 100);
    });
    $('tPreview').addEventListener('click', () => {
      engine.ensure();
      engine.load(engine.melodicFiles('harmonium')).then(() =>
        engine.melodic('harmonium', 0, engine.now + 0.02, 1.5, 0.8, engine.preview.lehra));
    });
  }

  // ── Settings tab ─────────────────────────────────────────────────────
  // Theme button: auto (follow the system) → light → dark.
  const THEMES = {
    auto: [tr('Theme: follows system'), '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>'],
    light: [tr('Theme: light'), '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'],
    dark: [tr('Theme: dark'), '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'],
  };
  function applyTheme() {
    if (!THEMES[S.theme]) S.theme = 'auto';
    if (S.theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = S.theme;
    const [title, icon] = THEMES[S.theme];
    $('themeBtn').title = tr('{title} (click to change)', { title });
    $('themeBtn').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + icon + '</svg>';
  }

  function initSettings() {
    applyTheme();
    $('themeBtn').addEventListener('click', () => {
      const order = Object.keys(THEMES);
      S.theme = order[(order.indexOf(S.theme) + 1) % order.length];
      applyTheme();
      save();
    });
    bind('fadeOut', 'fadeOut');
    bind('stopMode', 'stopMode', { type: 'str' });
    bind('accentSam', 'accentSam');
    bind('previews', 'previews');
    // The whole interface is translated on load, so a new language reloads.
    bind('sargamLang', 'sargamLang', { type: 'str', onChange: () => { save(true); location.reload(); } });
    $('resetSettings').addEventListener('click', () => {
      if (!confirm(tr('Reset all settings to their defaults?'))) return;
      store.settings = { ...DEFAULTS };
      try { localStorage.setItem(STORE, JSON.stringify(store)); } catch (e) { /* ignore */ }
      location.reload();
    });
  }

  function sampleStatus() {
    const loaded = engine.buffers.size;
    const missing = engine.missing.size;
    $('sampleStatus').textContent = tr('{n} samples loaded', { n: loaded }) +
      (missing ? tr(', {n} missing (synthesized instead).', { n: missing }) : tr('.'));
    const banner = $('banner');
    if (missing && !loaded) {
      banner.hidden = false;
      banner.textContent = tr(location.protocol === 'file:'
        ? 'Browsers block loading sound files from file://. Start the app with ./run.sh to use the real samples — using synthesized sounds for now.'
        : 'No samples found in sounds/. Run ./import_sounds.sh to copy them from TaalMala — using synthesized sounds for now.');
    } else banner.hidden = true;
  }
  engine.onSamplesChanged = () => {
    clearTimeout(sampleStatus.t);
    sampleStatus.t = setTimeout(sampleStatus, 100);
  };

  // ── Tabs & keyboard ──────────────────────────────────────────────────
  function switchTab(name) {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.id === 'tab-' + name));
  }
  document.querySelectorAll('.tab-btn').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));

  document.addEventListener('keydown', (e) => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.metaKey || e.ctrlKey) return;
    const step = e.shiftKey ? 10 : 1;
    switch (e.key) {
      case ' ': e.preventDefault(); togglePlay(); break;
      case 'ArrowUp': e.preventDefault(); setTempo(S.tempo + step); break;
      case 'ArrowDown': e.preventDefault(); setTempo(S.tempo - step); break;
      case 't': case 'T': tap(); break;
      case 's': case 'S': player.strumNow(); break;
      case 'g': case 'G': togglePane('sargamPanel'); break;
      case '[': setKey(S.key - 1); break;
      case ']': setKey(S.key + 1); break;
      default: return;
    }
  });

  // Start loading samples on the first interaction (audio needs a user gesture).
  document.addEventListener('pointerdown', function first() {
    document.removeEventListener('pointerdown', first, true);
    preload();
  }, true);

  loadFiles().then(() => {
    save();
    initSargam();
    initPlayerTab();
    initComposer();
    initSequences();
    initTuner();
    initSettings();
    requestAnimationFrame(frame);
  });
})();

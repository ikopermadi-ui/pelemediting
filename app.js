import { denoise, LEVELS } from './denoise.js';

/* =====================================================================
   Editor Video Mudah — PWA
   Bagian 1: utilitas, ikon, penyimpanan (IndexedDB), state, impor media
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fmt = (s) => { s = Math.max(0, s || 0); const m = Math.floor(s / 60), r = Math.floor(s % 60); return m + ':' + String(r).padStart(2, '0'); };
const fmtLong = (s) => { s = Math.max(0, s || 0); const m = Math.floor(s / 60), r = (s % 60); return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- Ikon ---------- */
const IC = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/>',
  play: '<polygon points="7 4 20 12 7 20 7 4"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  undo: '<path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8Z"/>',
  text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  wave: '<path d="M2 10v3M6 6v11M10 3v18M14 8v8M18 5v14M22 10v3"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  back: '<path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>',
  fwd: '<path d="m13 17 5-5-5-5M6 17l5-5-5-5"/>',
  vol: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  zoomin: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
  zoomout: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M8 11h6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  grow: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  frame: '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.2 0-1.1.9-2 2-2H17a5 5 0 0 0 5-5c0-4.4-4.5-8.5-10-8.5Z"/>',
  fade: '<path d="M3 17c4 0 5-10 9-10s5 10 9 10"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  film: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v16M17 4v16M2 12h20M2 8h5M2 16h5M17 8h5M17 16h5"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
};
const icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;
const hydrateIcons = (root = document) => $$('[data-i]', root).forEach((el) => { el.innerHTML = icon(el.dataset.i); });

/* ---------- Penyimpanan (IndexedDB) ---------- */
let _db = null;
const idb = () => new Promise((res, rej) => {
  if (_db) return res(_db);
  const r = indexedDB.open('editor-video-mudah', 1);
  r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('projects', { keyPath: 'id' }); d.createObjectStore('media'); };
  r.onsuccess = () => { _db = r.result; res(_db); };
  r.onerror = () => rej(r.error);
});
async function tx(store, mode, fn) {
  const db = await idb();
  return new Promise((res, rej) => {
    const t = db.transaction(store, mode); let out;
    const rq = fn(t.objectStore(store));
    if (rq) rq.onsuccess = () => { out = rq.result; };
    t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  });
}
const dbPutProject = (p) => tx('projects', 'readwrite', (s) => s.put(p));
const dbGetProject = (id) => tx('projects', 'readonly', (s) => s.get(id));
const dbListProjects = () => tx('projects', 'readonly', (s) => s.getAll());
const dbPutMedia = (k, b) => tx('media', 'readwrite', (s) => s.put(b, k));
const dbGetMedia = (k) => tx('media', 'readonly', (s) => s.get(k));
async function dbDelProject(id) {
  await tx('projects', 'readwrite', (s) => s.delete(id));
  await tx('media', 'readwrite', (s) => s.delete(IDBKeyRange.bound(id + ':', id + ':￿')));
}

/* ---------- State ---------- */
const state = { project: null, t: 0, sel: null, pps: 40, undo: [], redo: [] };
const rt = {};                 // data runtime per sumber (tidak disimpan)
const P = () => state.project;
let ac = null;                 // AudioContext
const AC = () => { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); return ac; };
let busyAudio = 0;             // jumlah tugas suara yang masih berjalan

function newProject() {
  return { id: uid(), name: 'Video Saya', created: Date.now(), updated: Date.now(), aspect: '16:9', quality: 720,
    nr: { level: 2, loud: true }, sources: {}, clips: [], overlays: [] };
}
function layout() {
  let s = 0;
  P().clips.forEach((c, i) => { c.start = s; c._i = i; s += c.dur; });
}
const totalDur = () => { const c = P()?.clips; if (!c || !c.length) return 0; const l = c[c.length - 1]; return l.start + l.dur; };
function clipAt(t) {
  const cs = P().clips; if (!cs.length) return null;
  for (let i = 0; i < cs.length; i++) { const c = cs[i]; if (t < c.start + c.dur - 1e-6) return c; }
  return cs[cs.length - 1];
}
function dims(q) {
  q = q || P().quality; const a = P().aspect; let w, h;
  if (a === '16:9') { h = q; w = Math.round(q * 16 / 9 / 2) * 2; }
  else if (a === '9:16') { w = q; h = Math.round(q * 16 / 9 / 2) * 2; }
  else { w = h = q; }
  return { w, h };
}
function previewDims() {
  const d = dims(720), k = Math.min(1, 960 / Math.max(d.w, d.h));
  return { w: Math.round(d.w * k / 2) * 2, h: Math.round(d.h * k / 2) * 2 };
}

/* ---------- Undo / simpan ---------- */
const snap = () => JSON.stringify({ clips: P().clips.map(({ id, src, in: i, dur, vol }) => ({ id, src, in: i, dur, vol })), overlays: P().overlays });
function mutate(fn, { keepSel = false } = {}) {
  pause();
  state.undo.push(snap()); if (state.undo.length > 80) state.undo.shift();
  state.redo = [];
  fn();
  layout();
  state.t = clamp(state.t, 0, totalDur());
  if (!keepSel) validateSel();
  afterChange();
}
function restore(s) {
  const o = JSON.parse(s); P().clips = o.clips; P().overlays = o.overlays; layout();
  state.t = clamp(state.t, 0, totalDur()); validateSel(); afterChange();
}
function undo() { if (!state.undo.length) return toast('Tidak ada langkah yang bisa dibatalkan'); pause(); state.redo.push(snap()); restore(state.undo.pop()); toast('Langkah terakhir dibatalkan'); }
function redo() { if (!state.redo.length) return toast('Tidak ada langkah untuk diulang'); pause(); state.undo.push(snap()); restore(state.redo.pop()); }
function validateSel() {
  const s = state.sel; if (!s) return;
  const ok = s.type === 'clip' ? P().clips.some((c) => c.id === s.id) : P().overlays.some((o) => o.id === s.id);
  if (!ok) state.sel = null;
}
let saveTimer = 0;
function afterChange() {
  renderTimeline(); renderToolbar(); updateTransport(); requestDraw(); updateEmpty(); scheduleSave();
}
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 700); }
async function saveNow() {
  const p = P(); if (!p) return;
  p.updated = Date.now(); p.duration = totalDur();
  try {
    const copy = JSON.parse(JSON.stringify(p, (k, v) => (k === '_i' ? undefined : v)));
    await dbPutProject(copy);
  } catch (e) { console.warn('simpan gagal', e); if (!saveNow.warned) { saveNow.warned = true; toast('Penyimpanan otomatis tidak tersedia di mode ini'); } }
}

/* ---------- Toast / status / dialog ---------- */
let toastT = 0;
function toast(msg, ms = 2800) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), ms);
}
function openSheet(html, { center = false, onClose, dismissable = true } = {}) {
  const sc = document.createElement('div'); sc.className = 'scrim' + (center ? ' center' : '');
  sc.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(sc); hydrateIcons(sc); $('#toast').classList.remove('show');
  const close = () => { sc.remove(); onClose && onClose(); };
  if (dismissable) sc.addEventListener('pointerdown', (e) => { if (e.target === sc) close(); });
  sc.close = close; return sc;
}
function confirmBox({ title, text, yes = 'Ya', no = 'Tidak', danger = false }) {
  return new Promise((res) => {
    const sc = openSheet(`<h2>${esc(title)}</h2>${text ? `<p class="sub">${esc(text)}</p>` : ''}
      <div class="row"><button class="btn ghost" data-r="0">${esc(no)}</button><button class="btn ${danger ? 'danger' : 'accent'}" data-r="1">${esc(yes)}</button></div>`,
      { center: true, onClose: () => res(false) });
    $$('[data-r]', sc).forEach((b) => b.onclick = () => { const v = b.dataset.r === '1'; sc.remove(); res(v); });
  });
}
function askText({ title, value = '', placeholder = '', multiline = false, ok = 'Selesai' }) {
  return new Promise((res) => {
    const sc = openSheet(`<h2>${esc(title)}</h2>
      ${multiline ? `<textarea class="field" id="askIn" placeholder="${esc(placeholder)}">${esc(value)}</textarea>` : `<input class="field" id="askIn" value="${esc(value)}" placeholder="${esc(placeholder)}">`}
      <div class="row"><button class="btn ghost" data-r="0">Batal</button><button class="btn accent" data-r="1">${esc(ok)}</button></div>`,
      { center: true, onClose: () => res(null) });
    const inp = $('#askIn', sc); setTimeout(() => { inp.focus(); inp.select && inp.select(); }, 60);
    $$('[data-r]', sc).forEach((b) => b.onclick = () => { const v = b.dataset.r === '1' ? inp.value : null; sc.remove(); res(v); });
  });
}
let statusEl = null;
function setStatus(msg) {
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(70px + env(safe-area-inset-top,0px));z-index:40;background:#000c;border:1px solid #fff3;color:#fff;border-radius:22px;padding:8px 16px;font-weight:700;font-size:15px;display:none;max-width:92vw;text-align:center';
    document.body.appendChild(statusEl);
  }
  if (msg) { statusEl.textContent = msg; statusEl.style.display = 'block'; } else statusEl.style.display = 'none';
}
function busyOverlay(title, sub) {
  const sc = openSheet(`<h2>${esc(title)}</h2><p class="sub" id="bSub">${esc(sub || '')}</p><div class="bar"><i id="bBar"></i></div><p class="note" id="bNote"></p>
    <div class="row hidden" id="bRow"><button class="btn ghost" id="bCancel">Batal</button></div>`, { center: true, dismissable: false });
  return {
    set(p, sub2, note) { $('#bBar', sc).style.width = Math.round(clamp(p, 0, 1) * 100) + '%'; if (sub2 != null) $('#bSub', sc).textContent = sub2; if (note != null) $('#bNote', sc).textContent = note; },
    cancelable(fn) { $('#bRow', sc).classList.remove('hidden'); $('#bCancel', sc).onclick = fn; },
    close() { sc.remove(); },
  };
}

/* ---------- Impor media ---------- */
function makeVid(url) {
  const v = document.createElement('video');
  v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
  v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', ''); v.disablePictureInPicture = true;
  v.src = url;
  v.addEventListener('seeked', () => requestDraw());
  v.addEventListener('loadeddata', () => requestDraw());
  return v;
}
function probeVideo(url) {
  return new Promise((res, rej) => {
    const v = document.createElement('video'); v.preload = 'metadata'; v.muted = true; v.playsInline = true;
    const to = setTimeout(() => rej(new Error('timeout')), 20000);
    v.onloadedmetadata = () => {
      clearTimeout(to);
      const d = v.duration;
      if (!isFinite(d) || d <= 0 || !v.videoWidth) return rej(new Error('meta'));
      res({ duration: d, w: v.videoWidth, h: v.videoHeight });
    };
    v.onerror = () => { clearTimeout(to); rej(new Error('err')); };
    v.src = url;
  });
}
async function addVideoFiles(files) {
  const list = [...files].filter((f) => f.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|mkv|3gp|avi)$/i.test(f.name));
  if (!list.length) return toast('File yang dipilih bukan video');
  if (!state.project) await startProject();
  const bo = busyOverlay('Membaca video…', 'Mohon tunggu sebentar');
  let added = 0;
  for (let k = 0; k < list.length; k++) {
    const f = list[k]; bo.set(k / list.length, `Membaca video ${k + 1} dari ${list.length}`);
    if (f.size > 1.6e9) { toast(`"${f.name}" terlalu besar (maksimal sekitar 1,5 GB)`, 4500); continue; }
    const url = URL.createObjectURL(f);
    try {
      const meta = await probeVideo(url);
      const id = uid();
      const first = P().clips.length === 0;
      if (first) {
        P().aspect = meta.h > meta.w * 1.15 ? '9:16' : (meta.w > meta.h * 1.15 ? '16:9' : '1:1');
        if (P().name === 'Video Saya') P().name = f.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'Video Saya';
        $('#projName').value = P().name;
        sizeCanvas();
      }
      P().sources[id] = { id, name: f.name, kind: 'video', duration: meta.duration, w: meta.w, h: meta.h, hasAudio: null };
      rt[id] = { blob: f, url, vids: [makeVid(url), makeVid(url)], thumbs: [], thumbStep: 1, bufOrig: null, bufClean: null, cleanKey: '', peaks: null };
      dbPutMedia(P().id + ':' + id, f).catch(() => {});
      mutate(() => { P().clips.push({ id: uid(), src: id, in: 0, dur: meta.duration, vol: 1 }); });
      added++;
      prepareSource(id);
    } catch (e) {
      URL.revokeObjectURL(url);
      toast(`Video "${f.name}" tidak bisa dibuka di perangkat ini`, 4500);
    }
  }
  bo.close();
  if (added) { state.t = Math.max(0, totalDur() - P().clips[P().clips.length - 1].dur); syncScroll(state.t); seekTo(state.t); toast(added > 1 ? `${added} video ditambahkan` : 'Video ditambahkan ✓'); maybeFirstTip(); }
}
async function processImage(file) {
  const url = URL.createObjectURL(file);
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const maxS = 1600, k = Math.min(1, maxS / Math.max(img.naturalWidth, img.naturalHeight));
  let blob = file, out = img;
  if (k < 1 || !/^image\/(png|jpeg|webp)$/.test(file.type)) {
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const png = /png|webp|gif/.test(file.type);
    blob = await new Promise((r) => c.toBlob(r, png ? 'image/png' : 'image/jpeg', 0.9));
    const u2 = URL.createObjectURL(blob);
    out = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u2; });
    URL.revokeObjectURL(url);
    return { blob, img: out, url: u2 };
  }
  return { blob, img: out, url };
}
async function addImageFiles(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|heic)$/i.test(f.name));
  if (!list.length) return toast('File yang dipilih bukan gambar');
  if (!P() || !P().clips.length) return toast('Tambahkan video dulu, baru tempel gambar');
  pause();
  let lastId = null, n = 0;
  for (const f of list) {
    try {
      const { blob, img, url } = await processImage(f);
      const id = uid();
      P().sources[id] = { id, name: f.name, kind: 'image', w: img.naturalWidth, h: img.naturalHeight };
      rt[id] = { blob, url, img };
      dbPutMedia(P().id + ':' + id, blob).catch(() => {});
      const total = totalDur();
      let start = Math.min(state.t + n * 0.4, Math.max(0, total - 1)); if (total - start < 2) start = Math.max(0, total - 3);
      const dur = Math.max(0.5, Math.min(5, total - start));
      const portrait = P().aspect === '9:16';
      const ov = { id: uid(), type: 'image', src: id, start, dur, x: 0.5, y: 0.5, w: portrait ? 0.74 : 0.46, frame: true, fade: true };
      mutate(() => { P().overlays.push(ov); }, { keepSel: true });
      lastId = ov.id; n++;
    } catch (e) { toast(`Gambar "${f.name}" tidak bisa dibuka`, 4000); }
  }
  if (lastId) {
    state.sel = { type: 'ov', id: lastId };
    const ov = P().overlays.find((o) => o.id === lastId);
    state.t = clamp(ov.start + Math.min(0.6, ov.dur / 2), 0, totalDur()); syncScroll(state.t); seekTo(state.t);
    afterChange();
    toast('Gambar ditempel ✓  Geser dengan jari. Besarkan dengan tombol "Besarkan".', 4800);
  }
}
async function addTextOverlay() {
  if (!P() || !P().clips.length) return toast('Tambahkan video dulu, baru tulis teks');
  const txt = await askText({ title: 'Tulis teks di video', placeholder: 'Contoh: Langkah 1 — Siapkan bahan', multiline: true, ok: 'Tempel' });
  if (!txt || !txt.trim()) return;
  const total = totalDur();
  let start = Math.min(state.t, Math.max(0, total - 1)); if (total - start < 2) start = Math.max(0, total - 3);
  const ov = { id: uid(), type: 'text', text: txt.trim(), start, dur: Math.max(0.5, Math.min(5, total - start)), x: 0.5, y: P().aspect === '9:16' ? 0.8 : 0.84, fs: 0.05, style: 0, fade: true };
  mutate(() => { P().overlays.push(ov); }, { keepSel: true });
  state.sel = { type: 'ov', id: ov.id }; state.t = clamp(ov.start + Math.min(0.6, ov.dur / 2), 0, total); syncScroll(state.t); seekTo(state.t); afterChange();
}

/* ---------- Suara: baca, bersihkan, gelombang, thumbnail ---------- */
async function decodeAudio(id) {
  const r = rt[id], src = P().sources[id];
  try {
    const ab = await r.blob.arrayBuffer();
    const oc = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 1, 48000);
    const dec = await new Promise((res, rej) => { const p = oc.decodeAudioData(ab, res, rej); if (p && p.catch) p.catch(rej); });
    const n = dec.length, mono = new Float32Array(n);
    for (let c = 0; c < dec.numberOfChannels; c++) { const d = dec.getChannelData(c); for (let i = 0; i < n; i++) mono[i] += d[i] / dec.numberOfChannels; }
    const b = AC().createBuffer(1, n, 48000); b.copyToChannel(mono, 0);
    r.bufOrig = b; src.hasAudio = true;
  } catch (e) {
    console.warn('decode audio gagal', e); src.hasAudio = false;
    toast(`Suara dari "${src.name}" tidak bisa dibaca, video ini akan tanpa suara`, 5000);
  }
}
let nrRun = 0;
let audioChain = Promise.resolve();
const enqueueAudio = (fn) => { const p = audioChain.then(fn, fn); audioChain = p.catch(() => {}); return p; };
const nrLoad = () => ({ moduleUrl: new URL('./vendor/rnnoise.js', import.meta.url).href, wasmUrl: new URL('./vendor/rnnoise.wasm', import.meta.url).href });
async function ensureClean(id, onP, token) {
  const r = rt[id], nr = P().nr;
  if (!r || !r.bufOrig || nr.level === 0) { if (r) { r.bufClean = null; r.cleanKey = ''; r.peaks = null; } return; }
  const key = nr.level + ':' + (nr.loud ? 1 : 0);
  if (r.cleanKey === key && r.bufClean) return;
  const y = await denoise(r.bufOrig.getChannelData(0), { level: nr.level, loud: nr.loud, onProgress: onP, load: nrLoad(), cancelled: () => token !== nrRun });
  const b = AC().createBuffer(1, y.length, 48000); b.copyToChannel(y, 0);
  r.bufClean = b; r.cleanKey = key; r.peaks = null;
}
function prepareSource(id) {
  busyAudio++;
  enqueueAudio(async () => {
    const tok = nrRun;
    try {
      setStatus('Menyiapkan suara…');
      if (!rt[id] || !P()) return;
      if (!rt[id].bufOrig) await decodeAudio(id);
      if (P().sources[id].hasAudio && P().nr.level > 0) {
        await ensureClean(id, (p) => setStatus(`Membersihkan suara… ${Math.round(p * 100)}%`), tok);
      }
    } catch (e) { if (e.message !== 'cancelled') { console.warn(e); toast('Pembersihan suara gagal. Suara asli dipakai.', 4500); } }
    finally { busyAudio--; if (!busyAudio) setStatus(''); renderTimeline(); }
  }).then(() => genThumbs(id));
}
// terapkan ulang pengaturan bersih-suara ke semua video di proyek
function applyNR(onProg) {
  const tok = ++nrRun;
  busyAudio++;
  return enqueueAudio(async () => {
    try {
      const ids = Object.keys(rt).filter((id) => P().sources[id]?.kind === 'video');
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        if (!rt[id].bufOrig) await decodeAudio(id);
        if (P().sources[id].hasAudio) await ensureClean(id, (p) => onProg && onProg((i + p) / ids.length), tok);
        onProg && onProg((i + 1) / ids.length);
      }
    } finally { busyAudio--; if (!busyAudio) setStatus(''); renderTimeline(); }
  });
}
async function genThumbs(id) {
  const r = rt[id], s = P().sources[id]; if (!r || r.thumbsBusy || s.kind !== 'video') return;
  r.thumbsBusy = true;
  try {
    const n = clamp(Math.ceil(s.duration / 1.5), 6, 90), step = s.duration / n; r.thumbStep = step;
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = r.url;
    await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = rej; setTimeout(rej, 15000); });
    const c = document.createElement('canvas'), h = 72, w = Math.round(h * s.w / s.h); c.width = w; c.height = h;
    const cx = c.getContext('2d'); const out = [];
    for (let i = 0; i < n; i++) {
      v.currentTime = Math.min(s.duration - 0.05, i * step + step / 2);
      await new Promise((res) => { const to = setTimeout(res, 1500); v.onseeked = () => { clearTimeout(to); res(); }; });
      cx.drawImage(v, 0, 0, w, h);
      out.push(c.toDataURL('image/jpeg', 0.5));
      if (i % 6 === 5) { r.thumbs = out.slice(); scheduleTimelineRepaint(); }
    }
    r.thumbs = out; scheduleTimelineRepaint();
    v.removeAttribute('src'); v.load();
  } catch (e) { /* thumbnail opsional */ } finally { r.thumbsBusy = false; }
}
const getBuf = (r, forceOrig = false) => (forceOrig || P().nr.level === 0 ? r.bufOrig : (r.bufClean || r.bufOrig));
function getPeaks(r) {
  const b = getBuf(r); if (!b) return null;
  if (r.peaks && r.peaksFor === b) return r.peaks;
  const d = b.getChannelData(0), per = 960, n = Math.ceil(d.length / per), pk = new Float32Array(n);
  let mx = 0;
  for (let i = 0; i < n; i++) { let m = 0; const e = Math.min(d.length, (i + 1) * per); for (let j = i * per; j < e; j += 2) { const a = Math.abs(d[j]); if (a > m) m = a; } pk[i] = m; if (m > mx) mx = m; }
  r.peaks = pk; r.peaksFor = b; r.peakMax = mx || 1; r.peakRate = 48000 / per; // 50 puncak/detik
  return pk;
}

/* =====================================================================
   Bagian 2: kanvas pratinjau, penggambar (render), mesin putar
   ===================================================================== */
const cv = $('#cv'), cx = cv.getContext('2d');
const lastCv = document.createElement('canvas'), lastCx = lastCv.getContext('2d');
let bbox = {};            // kotak tiap tempelan (pecahan 0..1) dari render terakhir
let drawReq = 0;

const TEXT_STYLES = [
  { name: 'Putih, kotak hitam', fg: '#ffffff', bg: 'rgba(0,0,0,.74)' },
  { name: 'Kuning, kotak hitam', fg: '#ffe14d', bg: 'rgba(0,0,0,.80)' },
  { name: 'Hitam, kotak putih', fg: '#111111', bg: 'rgba(255,255,255,.95)' },
  { name: 'Putih polos', fg: '#ffffff', bg: null },
];

function requestDraw() { if (drawReq) return; drawReq = requestAnimationFrame(() => { drawReq = 0; if (!playing) drawPreview(); }); }
function sizeCanvas() { const d = previewDims(); cv.width = d.w; cv.height = d.h; lastCv.width = d.w; lastCv.height = d.h; layoutStage(); requestDraw(); }
function layoutStage() {
  if (!P()) return;
  const st = $('#stage'), box = $('#stageBox');
  const aw = st.clientWidth - 16, ah = st.clientHeight - 16, d = previewDims();
  const k = Math.min(aw / d.w, ah / d.h);
  box.style.width = Math.max(10, Math.floor(d.w * k)) + 'px'; box.style.height = Math.max(10, Math.floor(d.h * k)) + 'px';
  updateSelBox();
}
function rr(c2, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); c2.beginPath(); c2.moveTo(x + r, y); c2.arcTo(x + w, y, x + w, y + h, r); c2.arcTo(x + w, y + h, x, y + h, r); c2.arcTo(x, y + h, x, y, r); c2.arcTo(x, y, x + w, y, r); c2.closePath();
}
function wrapText(c2, text, maxW) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    const words = para.split(/\s+/).filter(Boolean); let line = '';
    if (!words.length) { lines.push(''); continue; }
    for (const w of words) { const t = line ? line + ' ' + w : w; if (c2.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    lines.push(line);
  }
  return lines;
}
const vidFor = (c) => rt[c.src] && rt[c.src].vids && rt[c.src].vids[c._i % 2];

function drawOverlay(c2, o, W, H, t) {
  let a = 1;
  if (o.fade) a = clamp(Math.min((t - o.start) / 0.3, (o.start + o.dur - t) / 0.3), 0, 1);
  c2.save(); c2.globalAlpha = a;
  let box = null;
  if (o.type === 'image') {
    const im = rt[o.src] && rt[o.src].img;
    if (im) {
      const w = o.w * W, h = w * im.naturalHeight / im.naturalWidth, x = o.x * W - w / 2, y = o.y * H - h / 2;
      if (o.frame) { const pad = Math.max(4, W * 0.009); c2.shadowColor = 'rgba(0,0,0,.55)'; c2.shadowBlur = W * 0.02; c2.shadowOffsetY = W * 0.004; c2.fillStyle = '#fff'; c2.fillRect(x - pad, y - pad, w + 2 * pad, h + 2 * pad); c2.shadowColor = 'transparent'; }
      c2.drawImage(im, x, y, w, h);
      const p2 = o.frame ? Math.max(4, W * 0.009) : 0;
      box = { x: (x - p2) / W, y: (y - p2) / H, w: (w + 2 * p2) / W, h: (h + 2 * p2) / H };
    }
  } else {
    const fs = o.fs * W, st = TEXT_STYLES[o.style || 0] || TEXT_STYLES[0];
    c2.font = `700 ${fs}px system-ui,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif`; c2.textBaseline = 'middle'; c2.textAlign = 'center';
    const lines = wrapText(c2, o.text, W * 0.88), lh = fs * 1.28;
    let tw = 0; for (const l of lines) tw = Math.max(tw, c2.measureText(l).width);
    const px = fs * 0.55, py = fs * 0.38, bw = tw + 2 * px, bh = lines.length * lh + 2 * py, x = o.x * W - bw / 2, y = o.y * H - bh / 2;
    if (st.bg) { c2.fillStyle = st.bg; rr(c2, x, y, bw, bh, fs * 0.35); c2.fill(); }
    lines.forEach((l, i) => {
      const ty = y + py + lh * (i + 0.5);
      if (!st.bg) { c2.lineWidth = fs * 0.16; c2.strokeStyle = 'rgba(0,0,0,.85)'; c2.lineJoin = 'round'; c2.strokeText(l, o.x * W, ty); }
      c2.fillStyle = st.fg; c2.fillText(l, o.x * W, ty);
    });
    box = { x: x / W, y: y / H, w: bw / W, h: bh / H };
  }
  c2.restore();
  return box;
}
function drawFit(c2, v, vw, vh, W, H) {
  const k = Math.min(W / vw, H / vh), w = vw * k, h = vh * k;
  c2.drawImage(v, (W - w) / 2, (H - h) / 2, w, h);
}
function render(c2, W, H, t, { exp = false } = {}) {
  c2.fillStyle = '#000'; c2.fillRect(0, 0, W, H);
  const c = clipAt(t);
  if (c) {
    const v = vidFor(c);
    if (v && v.readyState >= 2 && v.videoWidth) {
      drawFit(c2, v, v.videoWidth, v.videoHeight, W, H);
      if (!exp && !playing) { lastCx.drawImage(c2.canvas, 0, 0, lastCv.width, lastCv.height); }
    } else if (!exp && W === lastCv.width) {
      c2.drawImage(lastCv, 0, 0, W, H);   // pertahankan bingkai terakhir saat menggeser (agar tidak berkedip)
    }
  }
  const boxes = {};
  for (const o of P().overlays) if (t >= o.start - 1e-6 && t < o.start + o.dur) { const b = drawOverlay(c2, o, W, H, t); if (b) boxes[o.id] = b; }
  return boxes;
}
function drawPreview() {
  if (!P()) return;
  bbox = render(cx, cv.width, cv.height, state.t);
  updateSelBox();
}

/* ---------- Mesin putar ---------- */
let playing = false, tlBase = 0, startAt = 0, raf = 0, playOpts = null, srcNodes = [], snipTimer = 0;
const curT = () => (playing ? clamp(tlBase + Math.max(0, AC().currentTime - startAt), 0, totalDur()) : state.t);

function scheduleAudio(t0, when, dest, forceOrig = false, maxDur = Infinity) {
  const a = AC();
  for (const c of P().clips) {
    const end = c.start + c.dur;
    if (end <= t0 + 1e-4) continue;
    if (c.start >= t0 + maxDur) break;
    const r = rt[c.src], buf = r && getBuf(r, forceOrig); if (!buf) continue;
    const s0 = Math.max(c.start, t0); let d = Math.min(end - s0, t0 + maxDur - s0); if (d <= 0) continue;
    const src = a.createBufferSource(); src.buffer = buf;
    const g = a.createGain(); g.gain.value = c.vol == null ? 1 : c.vol;
    src.connect(g); g.connect(dest);
    try { src.start(when + (s0 - t0), c.in + (s0 - c.start), d); srcNodes.push(src); } catch (e) { /* abaikan */ }
  }
}
function stopAudio() { for (const s of srcNodes) { try { s.stop(); } catch (e) {} try { s.disconnect(); } catch (e) {} } srcNodes = []; clearTimeout(snipTimer); }
function allVids(fn) { for (const id in rt) { const r = rt[id]; if (r.vids) r.vids.forEach(fn); } }

async function play(opts = {}) {
  if (playing || !P() || !totalDur()) return false;
  if (busyAudio) { toast('Tunggu sebentar, suara sedang disiapkan…'); return false; }
  stopAudio();
  const a = AC(); try { await a.resume(); } catch (e) {}
  if (state.t >= totalDur() - 0.05) state.t = 0;
  playOpts = opts; playing = true; tlBase = state.t; startAt = a.currentTime + 0.18;
  scheduleAudio(tlBase, startAt, opts.dest || a.destination, false);
  allVids((v) => { v.pause(); v._prepared = null; });
  const c = clipAt(tlBase), v = vidFor(c);
  if (v) { v.playbackRate = 1; const tgt = c.in + (tlBase - c.start); if (Math.abs(v.currentTime - tgt) > 0.03) v.currentTime = tgt; }
  updatePlayBtn(); raf = requestAnimationFrame(tick);
  return true;
}
function syncVideos(t) {
  const a = AC().currentTime, c = clipAt(t); if (!c) return;
  const v = vidFor(c), exp = c.in + (t - c.start);
  if (a >= startAt - 0.02 && v) {
    if (v.paused) { v._prepared = null; v.play().catch(() => {}); }
    if (!v.seeking) {
      const drift = v.currentTime - exp;
      if (Math.abs(drift) > 0.4) v.currentTime = exp;
      else if (Math.abs(drift) > 0.03) v.playbackRate = clamp(1 - drift * 1.5, 0.88, 1.12);
      else if (v.playbackRate !== 1) v.playbackRate = 1;
    }
  }
  allVids((x) => { if (x !== v && !x.paused) x.pause(); });
  const nx = P().clips[c._i + 1];
  if (nx && c.start + c.dur - t < 2) {
    const nv = vidFor(nx), key = nx.id + ':' + nx.in;
    if (nv && nv !== v && nv._prepared !== key) { nv.pause(); nv.playbackRate = 1; nv.currentTime = nx.in; nv._prepared = key; }
  }
}
function tick() {
  if (!playing) return;
  const t = curT(), total = totalDur(); state.t = t;
  syncVideos(t);
  if (playOpts && playOpts.canvas) {
    render(playOpts.cx, playOpts.W, playOpts.H, t, { exp: true });
    playOpts.onProgress && playOpts.onProgress(t / total);
  } else {
    bbox = render(cx, cv.width, cv.height, t); updateSelBox(); updateTransportTime(t); syncScroll(t);
  }
  if (t >= total - 0.02) { const end = playOpts && playOpts.onEnd; pause(true); end && end(); return; }
  raf = requestAnimationFrame(tick);
}
function pause(atEnd = false) {
  if (!playing) { stopAudio(); return; }
  const t = curT(); playing = false; cancelAnimationFrame(raf); stopAudio();
  allVids((v) => { v.pause(); v.playbackRate = 1; v._prepared = null; });
  state.t = atEnd ? totalDur() : t; playOpts = null;
  updatePlayBtn(); syncScroll(state.t); seekTo(state.t); updateTransport();
}
function seekTo(t) {
  state.t = clamp(t, 0, totalDur());
  const c = clipAt(state.t);
  if (c) {
    const v = vidFor(c), s = P().sources[c.src];
    const tgt = clamp(c.in + (state.t - c.start), 0, Math.max(0, s.duration - 0.04));
    if (v) { v._prepared = null; if (Math.abs(v.currentTime - tgt) > 0.01) { try { v.currentTime = tgt; } catch (e) {} } }
  }
  requestDraw(); updateTransportTime(state.t);
}
function playSnippet(forceOrig, secs = 8) {
  pause(); const a = AC(); a.resume(); stopAudio();
  scheduleAudio(state.t, a.currentTime + 0.05, a.destination, forceOrig, secs);
  snipTimer = setTimeout(stopAudio, secs * 1000 + 300);
}
function togglePlay() { if (playing) pause(); else play(); }

/* =====================================================================
   Bagian 3: garis waktu (timeline) ala CapCut — garis putih di tengah
   ===================================================================== */
const tl = $('#tl'), inner = $('#tlInner'), rulerEl = $('#ruler'), ovLane = $('#ovLane'), vidLane = $('#vidLane'), addEndBtn = $('#addEnd');
const PAD = () => Math.floor(tl.clientWidth / 2);
let lastProg = -1, paintReq = 0, repaintReq = 0;

function syncScroll(t) {
  if (!P()) return;
  const x = Math.round(t * state.pps);
  if (Math.abs(tl.scrollLeft - x) >= 1) { tl.scrollLeft = x; }
  lastProg = tl.scrollLeft;
  schedulePaint();
}
function schedulePaint() { if (paintReq) return; paintReq = requestAnimationFrame(() => { paintReq = 0; paintClips(false); }); }
function scheduleTimelineRepaint() { if (repaintReq) return; repaintReq = requestAnimationFrame(() => { repaintReq = 0; paintClips(true); }); }

tl.addEventListener('scroll', () => {
  if (!P()) return;
  if (tl.scrollLeft === lastProg) { schedulePaint(); return; }
  lastProg = tl.scrollLeft;
  if (playing) pause();
  state.t = clamp(tl.scrollLeft / state.pps, 0, totalDur());
  seekTo(state.t); schedulePaint();
  if (state.sel && state.sel.type === 'ov') updateSelBox();
}, { passive: true });

/* seret dengan mouse (komputer) + roda mouse */
(() => {
  let drag = null, moved = false;
  tl.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if (e.target.closest('.grip') || e.target.closest('.ov.sel') || e.target.closest('#addEnd')) return;
    drag = { x: e.clientX, sl: tl.scrollLeft }; moved = false;
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return; const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) moved = true;
    if (moved) tl.scrollLeft = drag.sl - dx;
  });
  window.addEventListener('pointerup', () => { if (drag && moved) { tl._suppressClick = true; setTimeout(() => { tl._suppressClick = false; }, 50); } drag = null; });
  tl.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) { zoom(e.deltaY < 0 ? 1.2 : 1 / 1.2); return; }
    tl.scrollLeft += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  }, { passive: false });
})();

function zoom(k) {
  if (!P()) return;
  const t = state.t; state.pps = clamp(state.pps * k, 3, 220);
  renderTimeline(); syncScroll(t);
}
function tickStep() { const pps = state.pps; for (const s of [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600]) if (s * pps >= 70) return s; return 900; }
function assignLanes() {
  const arr = [...P().overlays].sort((a, b) => a.start - b.start), ends = [], map = {};
  for (const o of arr) { let l = 0; while (l < ends.length && ends[l] > o.start + 1e-6) l++; ends[l] = o.start + o.dur; map[o.id] = Math.min(l, 2); }
  return { map, count: Math.min(Math.max(ends.length, 1), 3) };
}
const srcLabel = (c) => { const s = P().sources[c.src]; return (s ? s.name.replace(/\.[^.]+$/, '') : 'Video'); };

function renderTimeline() {
  if (!P()) return;
  const pad = PAD(), pps = state.pps, total = totalDur();
  inner.style.width = (total * pps + pad * 2) + 'px';
  /* penggaris waktu */
  const step = tickStep(); let h = '';
  for (let s = 0; s <= total + 1e-6; s += step) h += `<div class="tick" style="left:${pad + s * pps}px">${fmt(s)}</div>`;
  rulerEl.innerHTML = h;
  /* jalur tempelan */
  const lanes = assignLanes(), ovH = lanes.count * 34, wrapH = tl.clientHeight;
  ovLane.style.top = '28px'; ovLane.style.height = ovH + 'px';
  const vTop = 28 + ovH + 6, vH = clamp(wrapH - vTop - 8, 60, 104);
  vidLane.style.top = vTop + 'px'; vidLane.style.height = vH + 'px';
  addEndBtn.style.left = (pad + total * pps + 10) + 'px'; addEndBtn.style.top = (vTop + (vH - 56) / 2) + 'px';
  ovLane.innerHTML = '';
  for (const o of P().overlays) {
    const el = document.createElement('div');
    el.className = 'ov ' + o.type + (state.sel && state.sel.type === 'ov' && state.sel.id === o.id ? ' sel' : '');
    el.dataset.id = o.id;
    el.style.left = (pad + o.start * pps) + 'px'; el.style.width = Math.max(34, o.dur * pps - 2) + 'px'; el.style.top = (lanes.map[o.id] * 34) + 'px';
    const r = o.type === 'image' ? rt[o.src] : null;
    el.innerHTML = (o.type === 'image' ? (r ? `<img src="${r.url}" alt="">` : '') + '<span>Gambar</span>' : `${icon('text')}<span>${esc(o.text).slice(0, 40)}</span>`) + '<i class="grip l"></i><i class="grip r"></i>';
    el.firstChild && el.querySelectorAll('svg.i').forEach((s) => { s.style.width = '18px'; s.style.height = '18px'; });
    ovLane.appendChild(el);
  }
  /* jalur video */
  vidLane.innerHTML = '';
  for (const c of P().clips) {
    const el = document.createElement('div');
    el.className = 'clip' + (state.sel && state.sel.type === 'clip' && state.sel.id === c.id ? ' sel' : '');
    el.dataset.id = c.id; el.style.left = (pad + c.start * pps) + 'px'; el.style.width = Math.max(10, c.dur * pps - 3) + 'px';
    el.innerHTML = `<div class="tiles"></div><div class="wavewrap"><canvas class="wave" height="22"></canvas></div><span class="cname">${esc(srcLabel(c))} · ${fmt(c.dur)}</span><i class="grip l"></i><i class="grip r"></i>`;
    vidLane.appendChild(el);
  }
  paintClips(true);
}
function updateGeometry() {    // dipakai saat menggeser pegangan (tanpa membangun ulang elemen)
  const pad = PAD(), pps = state.pps, total = totalDur();
  inner.style.width = (total * pps + pad * 2) + 'px';
  for (const c of P().clips) { const el = vidLane.querySelector(`[data-id="${c.id}"]`); if (el) { el.style.left = (pad + c.start * pps) + 'px'; el.style.width = Math.max(10, c.dur * pps - 3) + 'px'; el._pw = null; const nm = $('.cname', el); if (nm) nm.textContent = srcLabel(c) + ' · ' + fmt(c.dur); } }
  for (const o of P().overlays) { const el = ovLane.querySelector(`[data-id="${o.id}"]`); if (el) { el.style.left = (pad + o.start * pps) + 'px'; el.style.width = Math.max(34, o.dur * pps - 2) + 'px'; } }
  addEndBtn.style.left = (pad + total * pps + 10) + 'px';
  paintClips(true);
}

/* menggambar kotak-kotak bingkai & gelombang suara hanya di area yang terlihat */
function paintClips(force) {
  if (!P()) return;
  const pad = PAD(), pps = state.pps, sl = tl.scrollLeft, vw = tl.clientWidth;
  for (const c of P().clips) {
    const el = vidLane.querySelector(`[data-id="${c.id}"]`); if (!el) continue;
    const cl = pad + c.start * pps, cw = c.dur * pps;
    const na = Math.max(0, sl - cl), nb = Math.min(cw, sl + vw - cl);
    if (nb <= na) { if (el._pw) { el._pw = null; $('.tiles', el).innerHTML = ''; } continue; }
    if (!force && el._pw && na >= el._pw.a - 0.5 && nb <= el._pw.b + 0.5) continue;
    const a = Math.max(0, na - vw), b = Math.min(cw, nb + vw);
    el._pw = { a, b };
    const r = rt[c.src], tiles = $('.tiles', el), tw = 64;
    const k0 = Math.floor(a / tw), k1 = Math.ceil(b / tw);
    let html = '';
    if (r && r.thumbs && r.thumbs.length) {
      for (let k = k0; k < k1; k++) {
        const tt = c.in + (k * tw + tw / 2) / pps, idx = clamp(Math.floor(tt / r.thumbStep), 0, r.thumbs.length - 1);
        html += `<img src="${r.thumbs[idx]}" style="left:${k * tw}px;width:${tw}px" alt="">`;
      }
    }
    tiles.innerHTML = html;
    drawWave(el, c, a, b);
  }
}
function drawWave(el, c, a, b) {
  const cvs = $('canvas.wave', el), r = rt[c.src], pps = state.pps;
  const w = Math.max(1, Math.ceil(b - a)); cvs.width = w; cvs.style.left = a + 'px'; cvs.style.width = w + 'px';
  const g = cvs.getContext('2d'); g.clearRect(0, 0, w, 22);
  const pk = r && getPeaks(r); if (!pk) return;
  g.fillStyle = P().nr.level > 0 && r.bufClean ? '#3be0c3' : '#8fa0bf';
  const rate = r.peakRate, mx = r.peakMax;
  for (let x = 0; x < w; x += 2) {
    const t0 = c.in + (a + x) / pps, t1 = c.in + (a + x + 2) / pps;
    let i0 = Math.floor(t0 * rate), i1 = Math.max(i0 + 1, Math.ceil(t1 * rate)), m = 0;
    for (let i = i0; i < i1 && i < pk.length; i++) if (pk[i] > m) m = pk[i];
    const v = Math.pow(Math.min(1, m / (mx * 0.85)), 0.6), hh = Math.max(1, v * 20);
    g.fillRect(x, 11 - hh / 2, 1.6, hh);
  }
}

/* ---------- klik/pilih ---------- */
function setSel(sel) { state.sel = sel; renderTimeline(); renderToolbar(); updateSelBox(); }
inner.addEventListener('click', (e) => {
  if (tl._suppressClick) return;
  if (e.target.closest('#addEnd')) return pickVideo();
  if (e.target.closest('.grip')) return;
  const ovEl = e.target.closest('.ov'), clEl = e.target.closest('.clip');
  if (ovEl) {
    const o = P().overlays.find((x) => x.id === ovEl.dataset.id); if (!o) return;
    setSel({ type: 'ov', id: o.id });
    if (state.t < o.start || state.t > o.start + o.dur) { state.t = clamp(o.start + Math.min(0.6, o.dur / 2), 0, totalDur()); syncScroll(state.t); seekTo(state.t); }
  } else if (clEl) setSel({ type: 'clip', id: clEl.dataset.id });
  else if (state.sel) setSel(null);
});
addEndBtn.addEventListener('click', (e) => { e.stopPropagation(); pickVideo(); });

/* ---------- pegangan potong (trim) klip ---------- */
inner.addEventListener('pointerdown', (e) => {
  const grip = e.target.closest('.grip'); if (!grip) return;
  const clEl = grip.closest('.clip'), ovEl = grip.closest('.ov');
  e.preventDefault(); e.stopPropagation();
  pause();
  const side = grip.classList.contains('l') ? 'l' : 'r', pps = state.pps, x0 = e.clientX;
  grip.setPointerCapture(e.pointerId);
  const before = snap();
  let changed = false;
  if (clEl) {
    const c = P().clips.find((x) => x.id === clEl.dataset.id), s = P().sources[c.src], in0 = c.in, d0 = c.dur;
    const mv = (ev) => {
      const dx = (ev.clientX - x0) / pps;
      if (side === 'r') c.dur = clamp(d0 + dx, 0.2, s.duration - in0);
      else { const d = clamp(dx, -in0, d0 - 0.2); c.in = in0 + d; c.dur = d0 - d; }
      changed = true; layout(); updateGeometry();
      state.t = side === 'l' ? c.start : c.start + c.dur - 0.05; state.t = clamp(state.t, 0, totalDur()); seekTo(state.t);
      updateTransportTime(state.t);
    };
    const up = () => {
      grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up);
      if (changed) { state.undo.push(before); state.redo = []; layout(); afterChange(); syncScroll(state.t); seekTo(state.t); }
    };
    grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
  } else if (ovEl) {
    const o = P().overlays.find((x) => x.id === ovEl.dataset.id), s0 = o.start, d0 = o.dur, total = totalDur();
    const mv = (ev) => {
      const dx = (ev.clientX - x0) / pps;
      if (side === 'r') o.dur = clamp(d0 + dx, 0.5, Math.max(0.5, total - s0));
      else { const d = clamp(dx, -s0, d0 - 0.5); o.start = s0 + d; o.dur = d0 - d; }
      changed = true; updateGeometry();
    };
    const up = () => {
      grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up);
      if (changed) { state.undo.push(before); state.redo = []; afterChange(); requestDraw(); }
    };
    grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
  }
});
/* geser seluruh tempelan yang sedang dipilih di garis waktu */
inner.addEventListener('pointerdown', (e) => {
  const ovEl = e.target.closest('.ov.sel'); if (!ovEl || e.target.closest('.grip')) return;
  const o = P().overlays.find((x) => x.id === ovEl.dataset.id); if (!o) return;
  e.preventDefault(); pause();
  const pps = state.pps, x0 = e.clientX, s0 = o.start, total = totalDur(), before = snap(); let changed = false;
  ovEl.setPointerCapture(e.pointerId);
  const mv = (ev) => { const dx = (ev.clientX - x0) / pps; if (Math.abs(ev.clientX - x0) > 3) changed = true; o.start = clamp(s0 + dx, 0, Math.max(0, total - o.dur)); updateGeometry(); };
  const up = () => {
    ovEl.removeEventListener('pointermove', mv); ovEl.removeEventListener('pointerup', up); ovEl.removeEventListener('pointercancel', up);
    if (changed) { state.undo.push(before); state.redo = []; afterChange(); requestDraw(); tl._suppressClick = true; setTimeout(() => { tl._suppressClick = false; }, 60); }
  };
  ovEl.addEventListener('pointermove', mv); ovEl.addEventListener('pointerup', up); ovEl.addEventListener('pointercancel', up);
});

/* =====================================================================
   Interaksi di layar pratinjau: geser, besarkan, cubit dua jari
   ===================================================================== */
const stageBox = $('#stageBox'), hit = $('#hit'), selBox = $('#selBox'), selHandle = $('#selHandle');
const selOv = () => (state.sel && state.sel.type === 'ov' ? P().overlays.find((o) => o.id === state.sel.id) : null);
function updateSelBox() {
  const o = P() && selOv(), b = o && bbox[o.id];
  if (!b || playing) { selBox.style.display = 'none'; return; }
  selBox.style.display = 'block';
  selBox.style.left = (b.x * 100) + '%'; selBox.style.top = (b.y * 100) + '%'; selBox.style.width = (b.w * 100) + '%'; selBox.style.height = (b.h * 100) + '%';
}
const normPt = (e) => { const r = stageBox.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, r }; };
const sizeVal = (o) => (o.type === 'image' ? o.w : o.fs);
const setSize = (o, v) => { if (o.type === 'image') o.w = clamp(v, 0.06, 1.5); else o.fs = clamp(v, 0.018, 0.16); };
function visibleAt(o) { return state.t >= o.start - 1e-6 && state.t < o.start + o.dur; }

const ptrs = new Map();
let gesture = null;
hit.addEventListener('pointerdown', (e) => {
  if (!P()) return;
  e.preventDefault(); hit.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const n = normPt(e);
  if (ptrs.size === 1) {
    pause();
    let target = null;
    const cur = selOv();
    if (cur && visibleAt(cur) && bbox[cur.id] && inBox(bbox[cur.id], n)) target = cur;
    else {
      const ovs = P().overlays.filter((o) => visibleAt(o) && bbox[o.id] && inBox(bbox[o.id], n));
      target = ovs[ovs.length - 1] || null;
    }
    if (target) {
      if (!cur || cur.id !== target.id) { state.sel = { type: 'ov', id: target.id }; renderTimeline(); renderToolbar(); }
      gesture = { kind: 'move', o: target, nx: n.x, ny: n.y, ox: target.x, oy: target.y, before: snap(), changed: false };
    } else { gesture = { kind: 'tap' }; }
  } else if (ptrs.size === 2 && selOv()) {
    const o = selOv(), [a, b] = [...ptrs.values()];
    gesture = { kind: 'pinch', o, d0: Math.hypot(a.x - b.x, a.y - b.y), s0: sizeVal(o), before: gesture && gesture.before || snap(), changed: false };
  }
});
hit.addEventListener('pointermove', (e) => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (!gesture) return;
  if (gesture.kind === 'move' && ptrs.size === 1) {
    const n = normPt(e), o = gesture.o;
    o.x = clamp(gesture.ox + (n.x - gesture.nx), 0, 1); o.y = clamp(gesture.oy + (n.y - gesture.ny), 0, 1);
    if (Math.abs(n.x - gesture.nx) + Math.abs(n.y - gesture.ny) > 0.004) gesture.changed = true;
    requestDraw();
  } else if (gesture.kind === 'pinch' && ptrs.size === 2) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    setSize(gesture.o, gesture.s0 * d / Math.max(10, gesture.d0)); gesture.changed = true; requestDraw();
  }
});
const endPtr = (e) => {
  ptrs.delete(e.pointerId);
  if (ptrs.size === 0 && gesture) {
    if (gesture.kind === 'tap') { if (state.sel) setSel(null); }
    else if (gesture.changed) { state.undo.push(gesture.before); state.redo = []; scheduleSave(); }
    gesture = null;
  }
};
hit.addEventListener('pointerup', endPtr); hit.addEventListener('pointercancel', endPtr);
const inBox = (b, n) => n.x >= b.x - 0.01 && n.x <= b.x + b.w + 0.01 && n.y >= b.y - 0.01 && n.y <= b.y + b.h + 0.01;

/* pegangan sudut: besarkan / kecilkan */
selHandle.addEventListener('pointerdown', (e) => {
  const o = selOv(); if (!o) return;
  e.preventDefault(); e.stopPropagation(); selHandle.setPointerCapture(e.pointerId); pause();
  const b = bbox[o.id], r = stageBox.getBoundingClientRect();
  const cxp = r.left + (b.x + b.w / 2) * r.width, cyp = r.top + (b.y + b.h / 2) * r.height;
  const d0 = Math.max(20, Math.hypot(e.clientX - cxp, e.clientY - cyp)), s0 = sizeVal(o), before = snap(); let changed = false;
  const mv = (ev) => { const d = Math.hypot(ev.clientX - cxp, ev.clientY - cyp); setSize(o, s0 * d / d0); changed = true; requestDraw(); };
  const up = () => { selHandle.removeEventListener('pointermove', mv); selHandle.removeEventListener('pointerup', up); selHandle.removeEventListener('pointercancel', up); if (changed) { state.undo.push(before); state.redo = []; scheduleSave(); } };
  selHandle.addEventListener('pointermove', mv); selHandle.addEventListener('pointerup', up); selHandle.addEventListener('pointercancel', up);
});

/* =====================================================================
   Bagian 4: toolbar, aksi edit, bersihkan suara, ekspor, bantuan
   ===================================================================== */
const pickVideo = () => { const f = $('#fileVideo'); f.value = ''; f.click(); };
const pickImage = () => {
  if (!P() || !P().clips.length) return toast('Tambahkan video dulu, baru tempel gambar');
  const f = $('#fileImage'); f.value = ''; f.click();
};

function updatePlayBtn() {
  $('#btnPlay').innerHTML = playing ? icon('pause', 'fill') : icon('play', 'fill');
  $('#btnPlay').setAttribute('aria-label', playing ? 'Berhenti sebentar' : 'Putar');
}
function updateTransportTime(t) { $('#tcur').textContent = fmt(t); }
function updateTransport() {
  updateTransportTime(state.t); $('#tdur').textContent = fmt(totalDur());
  $('#btnUndo').disabled = !state.undo.length; $('#btnRedo').disabled = !state.redo.length;
  $('#btnPlay').disabled = !totalDur(); $('#btnExport').disabled = !totalDur();
}
function updateEmpty() { $('#emptyHint').style.display = P() && P().clips.length ? 'none' : 'grid'; }
const nrBadge = () => { const l = P() ? P().nr.level : 0; return l ? LEVELS[l].name : 'Mati'; };

/* ---------- Toolbar ---------- */
function renderToolbar() {
  const bar = $('#toolbar'); if (!P()) { bar.innerHTML = ''; return; }
  const sel = state.sel, o = selOv();
  const clip = sel && sel.type === 'clip' ? P().clips.find((c) => c.id === sel.id) : null;
  let items;
  const back = { label: 'Selesai', ic: 'check', cls: 'back', fn: () => setSel(null) };
  const nr = { label: 'Bersihkan Suara', ic: 'wave', fn: openNR, badge: nrBadge() };
  if (clip) {
    items = [back, { label: 'Potong di sini', ic: 'scissors', cls: 'accent', fn: splitAtPlayhead },
      { label: 'Hapus', ic: 'trash', cls: 'danger', fn: deleteSelected },
      { label: 'Geser ke kiri', ic: 'left', fn: () => moveClip(-1) }, { label: 'Geser ke kanan', ic: 'right', fn: () => moveClip(1) },
      { label: 'Volume', ic: 'vol', fn: openVolume }, nr];
  } else if (o) {
    items = [back, { label: 'Besarkan', ic: 'zoomin', fn: () => resizeSel(1.14) }, { label: 'Kecilkan', ic: 'zoomout', fn: () => resizeSel(1 / 1.14) },
      { label: 'Mulai di sini', ic: 'left', fn: () => setOvEdge('start') }, { label: 'Berhenti di sini', ic: 'right', fn: () => setOvEdge('end') }];
    if (o.type === 'text') items.push({ label: 'Ubah Teks', ic: 'edit', fn: editText }, { label: 'Warna Teks', ic: 'palette', fn: cycleStyle });
    else items.push({ label: o.frame ? 'Bingkai: Ada' : 'Bingkai: Tidak', ic: 'frame', fn: () => toggleOv('frame') });
    items.push({ label: o.fade ? 'Muncul halus: Ya' : 'Muncul halus: Tidak', ic: 'fade', fn: () => toggleOv('fade') }, { label: 'Hapus', ic: 'trash', cls: 'danger', fn: deleteSelected });
  } else {
    items = [{ label: 'Tambah Video', ic: 'video', fn: pickVideo }, { label: 'Tempel Gambar', ic: 'image', fn: pickImage }, { label: 'Tulis Teks', ic: 'text', fn: addTextOverlay },
      { label: 'Potong', ic: 'scissors', cls: 'accent', fn: splitAtPlayhead }, nr];
  }
  bar.innerHTML = '';
  for (const it of items) {
    const b = document.createElement('button'); b.className = 'tool ' + (it.cls || '');
    b.innerHTML = icon(it.ic) + `<span>${esc(it.label)}</span>` + (it.badge ? `<span class="badge">${esc(it.badge)}</span>` : '');
    b.onclick = () => it.fn(); bar.appendChild(b);
  }
}

/* ---------- Aksi edit ---------- */
function splitAtPlayhead() {
  if (!P() || !P().clips.length) return toast('Tambahkan video dulu');
  pause();
  const t = state.t, c = clipAt(t);
  if (!c || t < c.start + 0.15 || t > c.start + c.dur - 0.15) return toast('Geser garis putih ke tempat yang ingin dipotong, lalu tekan Potong lagi', 4500);
  mutate(() => {
    const off = t - c.start, n = { id: uid(), src: c.src, in: c.in + off, dur: c.dur - off, vol: c.vol };
    c.dur = off; P().clips.splice(c._i + 1, 0, n);
  }, { keepSel: true });
  setSel(null);
  toast('Sudah dipotong ✓  Sentuh bagian yang mau dibuang, lalu tekan Hapus.', 5000);
}
async function deleteSelected() {
  const s = state.sel; if (!s) return;
  if (s.type === 'clip') {
    const ok = await confirmBox({ title: 'Hapus potongan ini?', text: 'Bagian video ini akan dibuang dari hasil akhir. Anda masih bisa membatalkan dengan tombol panah kembali.', yes: 'Ya, hapus', no: 'Jangan', danger: true });
    if (!ok) return;
    mutate(() => { P().clips = P().clips.filter((c) => c.id !== s.id); }); state.sel = null; renderTimeline(); renderToolbar();
    seekTo(state.t); syncScroll(state.t);
  } else {
    mutate(() => { P().overlays = P().overlays.filter((o) => o.id !== s.id); }); state.sel = null; renderTimeline(); renderToolbar();
  }
  toast('Dihapus. Salah hapus? Tekan tombol panah kembali.', 3500);
}
function moveClip(dir) {
  const s = state.sel; if (!s) return;
  const i = P().clips.findIndex((c) => c.id === s.id), j = i + dir;
  if (j < 0 || j >= P().clips.length) return toast(dir < 0 ? 'Sudah paling awal' : 'Sudah paling akhir');
  mutate(() => { const a = P().clips; [a[i], a[j]] = [a[j], a[i]]; }, { keepSel: true });
  const c = P().clips[j]; state.t = c.start; syncScroll(state.t); seekTo(state.t);
}
function resizeSel(k) {
  const o = selOv(); if (!o) return;
  const before = snap(); setSize(o, sizeVal(o) * k); state.undo.push(before); state.redo = []; scheduleSave(); requestDraw(); updateTransport();
}
function toggleOv(key) {
  const o = selOv(); if (!o) return;
  mutate(() => { o[key] = !o[key]; }, { keepSel: true }); toast(key === 'frame' ? (o.frame ? 'Bingkai putih dipasang' : 'Bingkai dilepas') : (o.fade ? 'Muncul dan hilang dengan halus' : 'Muncul dan hilang langsung'));
}
function setOvEdge(which) {
  const o = selOv(); if (!o) return; const t = state.t, end = o.start + o.dur;
  if (which === 'start') { if (t >= end - 0.5) return toast('Garis putih harus ada sebelum akhir tampilan'); mutate(() => { o.dur = end - t; o.start = t; }, { keepSel: true }); toast('Tampil mulai dari garis putih'); }
  else { if (t <= o.start + 0.5) return toast('Geser garis putih ke kanan dulu'); mutate(() => { o.dur = t - o.start; }, { keepSel: true }); toast('Berhenti tampil di garis putih'); }
}
async function editText() {
  const o = selOv(); if (!o || o.type !== 'text') return;
  const v = await askText({ title: 'Ubah teks', value: o.text, multiline: true });
  if (v && v.trim()) mutate(() => { o.text = v.trim(); }, { keepSel: true });
}
function cycleStyle() { const o = selOv(); if (!o) return; mutate(() => { o.style = ((o.style || 0) + 1) % TEXT_STYLES.length; }, { keepSel: true }); toast(TEXT_STYLES[o.style].name); }
function openVolume() {
  const c = state.sel && state.sel.type === 'clip' ? P().clips.find((x) => x.id === state.sel.id) : null; if (!c) return;
  const v0 = Math.round((c.vol == null ? 1 : c.vol) * 100);
  const sc = openSheet(`<h2>Volume suara</h2><p class="sub">Untuk potongan video yang dipilih</p>
    <div style="font-size:34px;font-weight:800;text-align:center" id="volVal">${v0}%</div>
    <input type="range" id="volR" min="0" max="200" step="5" value="${v0}" aria-label="Volume">
    <div class="seg"><button data-v="0">Hening</button><button data-v="100">Normal</button><button data-v="150">Keras</button></div>
    <div class="row"><button class="btn accent" id="volOk">Selesai</button></div>`);
  const r = $('#volR', sc), lab = $('#volVal', sc);
  r.oninput = () => { lab.textContent = r.value + '%'; };
  $$('[data-v]', sc).forEach((b) => b.onclick = () => { r.value = b.dataset.v; lab.textContent = r.value + '%'; });
  $('#volOk', sc).onclick = () => { const nv = +r.value / 100; sc.remove(); if (Math.abs(nv - (c.vol == null ? 1 : c.vol)) > 0.001) mutate(() => { c.vol = nv; }, { keepSel: true }); };
}

/* ---------- Bersihkan suara ---------- */
function openNR() {
  if (!P() || !P().clips.length) return toast('Tambahkan video dulu');
  pause();
  const opts = [[0, 'Mati', 'Suara asli, tidak diubah'], [1, 'Ringan', 'Mengurangi bising halus seperti kipas atau dengung'], [2, 'Kuat', 'Menghilangkan kebanyakan bising latar. Paling cocok untuk orang bicara'], [3, 'Sangat Kuat', 'Untuk tempat yang sangat bising atau ramai. Suara bisa terdengar sedikit “tipis”']];
  const sc = openSheet(`<h2>Bersihkan Suara</h2><p class="sub">Menghilangkan bising seperti kipas, AC, angin, dan keramaian, supaya suara bicara jelas.</p>
    <div id="nrOpts"></div>
    <label class="check"><input type="checkbox" id="nrLoud" ${P().nr.loud ? 'checked' : ''}> Buat suara bicara lebih keras dan rata</label>
    <div class="bar hidden" id="nrBarW"><i id="nrBar"></i></div><p class="note" id="nrNote"></p>
    <p class="note" style="margin-top:14px"><b>Coba dengarkan</b> (8 detik mulai dari garis putih):</p>
    <div class="row" style="margin-top:6px"><button class="btn" id="nrOrig">${icon('play', 'fill')}Suara asli</button><button class="btn accent" id="nrClean">${icon('play', 'fill')}Suara bersih</button></div>
    <div class="row"><button class="btn ghost" id="nrDone">Selesai</button></div>`, { onClose: () => { stopAudio(); renderToolbar(); } });
  const box = $('#nrOpts', sc);
  const draw = () => {
    box.innerHTML = opts.map(([l, n, d]) => `<button class="opt ${P().nr.level === l ? 'on' : ''}" data-l="${l}"><span class="dot"></span><span><b>${n}</b><span>${d}</span></span></button>`).join('');
    $$('.opt', box).forEach((b) => b.onclick = () => apply(+b.dataset.l, P().nr.loud));
  };
  let working = false;
  async function apply(level, loud) {
    if (working) return;
    if (level === P().nr.level && loud === P().nr.loud && (level === 0 || Object.values(rt).some((r) => r.bufClean))) return;
    working = true; P().nr.level = level; P().nr.loud = loud; draw();
    const barW = $('#nrBarW', sc), bar = $('#nrBar', sc), note = $('#nrNote', sc);
    note.className = 'note'; note.textContent = level ? 'Sedang membersihkan suara… mohon tunggu' : 'Mengembalikan suara asli…';
    barW.classList.toggle('hidden', !level); bar.style.width = '0%';
    try {
      await applyNR((p) => { bar.style.width = Math.round(p * 100) + '%'; note.textContent = `Sedang membersihkan suara… ${Math.round(p * 100)}%`; });
      note.className = 'note ok'; note.textContent = level ? 'Selesai ✓ Tekan “Suara bersih” untuk mendengarkan hasilnya.' : 'Suara asli dipakai.';
      scheduleSave();
    } catch (e) { if (e.message !== 'cancelled') { note.textContent = 'Gagal membersihkan suara. Suara asli dipakai.'; console.warn(e); } }
    barW.classList.add('hidden'); working = false;
  }
  draw();
  $('#nrLoud', sc).onchange = (e) => { if (P().nr.level) apply(P().nr.level, e.target.checked); else { P().nr.loud = e.target.checked; scheduleSave(); } };
  $('#nrOrig', sc).onclick = () => { if (busyAudio) return toast('Tunggu sebentar…'); playSnippet(true); };
  $('#nrClean', sc).onclick = () => { if (busyAudio) return toast('Tunggu sebentar…'); if (!P().nr.level) toast('Pilih Ringan, Kuat, atau Sangat Kuat dulu'); playSnippet(false); };
  $('#nrDone', sc).onclick = () => sc.close();
}

/* ---------- Pengaturan ---------- */
function openSettings() {
  if (!P()) return;
  const A = [['16:9', 'Lebar', 'untuk TV / YouTube'], ['9:16', 'Tegak', 'untuk HP / Status'], ['1:1', 'Kotak', 'untuk Facebook / Instagram']];
  const Q = [[720, 'Standar (HD 720p)', 'lebih cepat dan file lebih kecil'], [1080, 'Sangat tajam (Full HD)', 'lebih lama diproses']];
  const sc = openSheet(`<h2>Pengaturan Video</h2><p class="sub">Bentuk layar</p><div class="seg" id="sA"></div><p class="sub" style="margin-top:16px">Kualitas hasil</p><div id="sQ"></div>
    <div class="row"><button class="btn accent" id="setOk">Selesai</button></div>`);
  const draw = () => {
    $('#sA', sc).innerHTML = A.map(([k, n, d]) => `<button data-a="${k}" class="${P().aspect === k ? 'on' : ''}">${n}<br><span style="font-weight:400;font-size:13px;color:var(--muted)">${d}</span></button>`).join('');
    $('#sQ', sc).innerHTML = Q.map(([k, n, d]) => `<button class="opt ${P().quality === k ? 'on' : ''}" data-q="${k}"><span class="dot"></span><span><b>${n}</b><span>${d}</span></span></button>`).join('');
    $$('[data-a]', sc).forEach((b) => b.onclick = () => { P().aspect = b.dataset.a; sizeCanvas(); renderTimeline(); scheduleSave(); draw(); });
    $$('[data-q]', sc).forEach((b) => b.onclick = () => { P().quality = +b.dataset.q; scheduleSave(); draw(); });
  };
  draw(); $('#setOk', sc).onclick = () => sc.close();
}

/* ---------- Ekspor ---------- */
function pickMime() {
  const c = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  if (!window.MediaRecorder) return null;
  return c.find((m) => MediaRecorder.isTypeSupported(m)) || '';
}
let exporting = false;
async function doExport() {
  if (!P() || !totalDur() || exporting) return;
  if (busyAudio) return toast('Tunggu sebentar, suara sedang disiapkan…');
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    return openSheet(`<h2>Maaf</h2><p class="sub">Peramban ini belum bisa menyimpan video. Mohon buka aplikasi ini dengan Google Chrome (HP Android / komputer) atau Safari terbaru (iPhone).</p><div class="row"><button class="btn accent" onclick="this.closest('.scrim').remove()">Mengerti</button></div>`, { center: true });
  }
  pause(); setSel(null);
  const ok = await confirmBox({ title: 'Simpan video sekarang?', text: `Video akan dibuat selama kira-kira ${fmt(totalDur())} menit (sepanjang durasinya). Selama proses, jangan menutup layar atau pindah ke aplikasi lain.`, yes: 'Mulai', no: 'Nanti dulu' });
  if (!ok) return;
  exporting = true;
  const { w: W, h: H } = dims(), ec = document.createElement('canvas'); ec.width = W; ec.height = H;
  const ectx = ec.getContext('2d', { alpha: false });
  const a = AC(); await a.resume();
  const dest = a.createMediaStreamDestination();
  const stream = ec.captureStream(30); dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
  const mime = pickMime(); const isMp4 = /mp4/.test(mime);
  let rec; const chunks = [];
  try { rec = new MediaRecorder(stream, { mimeType: mime || undefined, videoBitsPerSecond: P().quality >= 1080 ? 8e6 : 4.5e6, audioBitsPerSecond: 160000 }); }
  catch (e) { exporting = false; return toast('Peramban ini tidak bisa membuat video. Coba pakai Google Chrome.', 5000); }
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const bo = busyOverlay('Sedang membuat video…', 'Jangan tutup layar atau pindah aplikasi');
  bo.cancelable(() => { cancelled = true; });
  let cancelled = false, interrupted = false, wake = null;
  try { if (navigator.wakeLock) wake = await navigator.wakeLock.request('screen'); } catch (e) {}
  const onVis = () => { if (document.hidden) { interrupted = true; cancelled = true; } };
  document.addEventListener('visibilitychange', onVis);
  const finished = new Promise((res) => {
    rec.onstop = res;
  });
  state.t = 0; rec.start(1000);
  const done = new Promise(async (res) => {
    const started = await play({ dest, canvas: true, cx: ectx, W, H, onProgress: (p) => { bo.set(p, null, `${Math.round(p * 100)}% selesai · sisa kira-kira ${fmt(totalDur() * (1 - p))}`); if (cancelled) { pause(); res('cancel'); } }, onEnd: () => res('end') });
    if (!started) res('fail');
  });
  const why = await done;
  await sleep(450);
  try { rec.state !== 'inactive' && rec.stop(); } catch (e) {}
  await finished;
  document.removeEventListener('visibilitychange', onVis); try { wake && wake.release(); } catch (e) {}
  stopAudio(); bo.close(); exporting = false;
  state.t = 0; syncScroll(0); seekTo(0);
  if (why === 'cancel') { toast(interrupted ? 'Pembuatan video terhenti karena layar berpindah. Silakan coba lagi dan biarkan layar tetap terbuka.' : 'Pembuatan video dibatalkan', 6000); return; }
  if (why === 'fail' || !chunks.length) return toast('Video gagal dibuat. Silakan coba lagi.', 5000);
  const blob = new Blob(chunks, { type: (mime || 'video/webm').split(';')[0] });
  showResult(blob, isMp4 ? 'mp4' : 'webm', rec.mimeType || mime || '');
}
function showResult(blob, ext, actualMime = '') {
  const odd = ext === 'mp4' && /vp8|vp9|av01/i.test(actualMime);
  const url = URL.createObjectURL(blob), name = (P().name || 'video').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') + '.' + ext;
  const file = new File([blob], name, { type: blob.type });
  const canShare = navigator.canShare && navigator.canShare({ files: [file] });
  const sc = openSheet(`<h2>Video sudah jadi ✓</h2><video class="vid-res" src="${url}" controls playsinline></video>
    <p class="note">${esc(name)} · ${(blob.size / 1048576).toFixed(1)} MB</p>
    ${ext === 'webm' || odd ? '<p class="note" style="color:var(--warn)">Bila WhatsApp atau pemutar di HP tidak bisa memutar video ini, buka aplikasi lewat Google Chrome versi terbaru di HP Android atau Safari di iPhone, lalu simpan ulang.</p>' : ''}
    <div class="row"><button class="btn accent" id="rSave">${icon('download')}Simpan ke perangkat</button></div>
    ${canShare ? `<div class="row"><button class="btn" id="rShare">${icon('share')}Kirim (WhatsApp, dll.)</button></div>` : ''}
    <div class="row"><button class="btn ghost" id="rClose">Kembali mengedit</button></div>`, { onClose: () => URL.revokeObjectURL(url) });
  $('#rSave', sc).onclick = () => { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast('Video sedang disimpan. Cek folder Download / Unduhan.', 5000); };
  const sh = $('#rShare', sc); if (sh) sh.onclick = async () => { try { await navigator.share({ files: [file], title: P().name }); } catch (e) {} };
  $('#rClose', sc).onclick = () => sc.close();
}

/* ---------- Bantuan ---------- */
function openHelp() {
  const steps = [
    ['Tambah video', 'Tekan “Tambah Video”, lalu pilih rekaman Anda dari HP atau komputer.'],
    ['Potong bagian yang tidak perlu', 'Geser garis garis waktu (tarik ke kiri/kanan) sampai garis putih ada di tempat yang ingin dipotong. Tekan “Potong”. Sentuh bagian yang mau dibuang, lalu tekan “Hapus”.'],
    ['Tempel gambar penjelasan', 'Geser garis putih ke saat gambar harus muncul. Tekan “Tempel Gambar”, pilih gambar. Geser gambar dengan jari di layar, besarkan dengan tombol “Besarkan”.'],
    ['Bersihkan suara bising', 'Tekan “Bersihkan Suara”, pilih “Kuat”. Anda bisa mendengarkan perbandingan suara asli dan suara bersih.'],
    ['Simpan video', 'Tekan tombol hijau “Simpan Video” di kanan atas. Setelah jadi, simpan atau kirim lewat WhatsApp.'],
  ];
  const sc = openSheet(`<h2>Cara Memakai</h2><p class="sub">Lima langkah mudah</p>${steps.map((s, i) => `<div class="tut-step"><div class="n">${i + 1}</div><div><b>${s[0]}</b><span>${s[1]}</span></div></div>`).join('')}
    <p class="note">Salah tekan? Tekan tombol panah melengkung (Batal) di atas garis waktu. Pekerjaan Anda tersimpan otomatis.</p>
    <div class="row"><button class="btn accent" id="hOk">Mengerti</button></div>`);
  $('#hOk', sc).onclick = () => { try { localStorage.setItem('evm_help_seen', '1'); } catch (e) {} sc.close(); };
}
function maybeFirstTip() {
  try { if (localStorage.getItem('evm_tip1')) return; localStorage.setItem('evm_tip1', '1'); } catch (e) {}
  setTimeout(() => toast('Tarik garis waktu ke kiri/kanan untuk memilih bagian video. Garis putih adalah posisi sekarang.', 7000), 1500);
}

/* =====================================================================
   Bagian 5: beranda, buka/tutup proyek, pemasangan awal
   ===================================================================== */
async function startProject() {
  state.project = newProject(); state.t = 0; state.sel = null; state.undo = []; state.redo = []; layout();
  $('#projName').value = P().name;
  showEditor(); sizeCanvas(); renderTimeline(); renderToolbar(); updateTransport(); updateEmpty(); updatePlayBtn();
  await saveNow();
}
function showEditor() {
  $('#home').classList.add('hidden'); $('#editor').classList.remove('hidden');
  layoutStage(); setTimeout(() => { layoutStage(); renderTimeline(); syncScroll(state.t); }, 60);
}
async function goHome() {
  pause(); setStatus('');
  if (P()) { await saveNow(); }
  for (const id in rt) { try { URL.revokeObjectURL(rt[id].url); } catch (e) {} if (rt[id].vids) rt[id].vids.forEach((v) => { v.pause(); v.removeAttribute('src'); v.load(); }); delete rt[id]; }
  state.project = null; nrRun++;
  $('#editor').classList.add('hidden'); $('#home').classList.remove('hidden');
  renderHome();
}
async function openProject(id) {
  const bo = busyOverlay('Membuka video…', 'Mohon tunggu sebentar');
  try {
    const p = await dbGetProject(id); if (!p) throw new Error('hilang');
    state.project = p; state.t = 0; state.sel = null; state.undo = []; state.redo = [];
    const missing = [];
    for (const sid of Object.keys(p.sources)) {
      const s = p.sources[sid]; const blob = await dbGetMedia(p.id + ':' + sid);
      if (!blob) { missing.push(sid); continue; }
      const url = URL.createObjectURL(blob);
      rt[sid] = s.kind === 'video'
        ? { blob, url, vids: [makeVid(url), makeVid(url)], thumbs: [], thumbStep: 1, bufOrig: null, bufClean: null, cleanKey: '', peaks: null }
        : { blob, url, img: await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = url; }) };
    }
    if (missing.length) { p.clips = p.clips.filter((c) => !missing.includes(c.src)); p.overlays = p.overlays.filter((o) => !missing.includes(o.src)); toast('Sebagian berkas tidak ditemukan dan dilewati', 5000); }
    p.nr = p.nr || { level: 2, loud: true }; p.quality = p.quality || 720;
    layout(); $('#projName').value = p.name;
    showEditor(); sizeCanvas(); renderTimeline(); renderToolbar(); updateTransport(); updateEmpty(); updatePlayBtn(); seekTo(0);
    Object.keys(rt).filter((sid) => p.sources[sid].kind === 'video').forEach(prepareSource);
  } catch (e) { console.warn(e); toast('Proyek tidak bisa dibuka', 4000); }
  bo.close();
}
async function renderHome() {
  const box = $('#projList'); let list = [];
  try { list = (await dbListProjects()).sort((a, b) => b.updated - a.updated); } catch (e) {}
  if (!list.length) { box.innerHTML = ''; return; }
  box.innerHTML = '<div class="sec-title">Video saya</div>' + list.map((p) => `<div class="proj" data-id="${p.id}">
    <button class="open"><b>${esc(p.name)}</b><span>${p.duration ? fmt(p.duration) + ' menit · ' : ''}disimpan ${new Date(p.updated).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} ${new Date(p.updated).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></button>
    <button class="del" aria-label="Hapus proyek ${esc(p.name)}">${icon('trash')}</button></div>`).join('');
  $$('.proj', box).forEach((el) => {
    $('.open', el).onclick = () => openProject(el.dataset.id);
    $('.del', el).onclick = async () => {
      const ok = await confirmBox({ title: 'Hapus video ini?', text: 'Proyek beserta semua bahan di dalamnya akan dihapus dari perangkat dan tidak bisa dikembalikan.', yes: 'Ya, hapus', no: 'Jangan', danger: true });
      if (ok) { await dbDelProject(el.dataset.id); renderHome(); toast('Proyek dihapus'); }
    };
  });
}

/* ---------- Pasang awal ---------- */
function bind() {
  hydrateIcons();
  $('#logoMark').innerHTML = icon('film').replace('class="i "', 'class="i" style="width:34px;height:34px"');
  $('#btnNew').onclick = () => { state.project = null; pickVideo(); };
  $('#btnHelpHome').onclick = openHelp; $('#btnHelp').onclick = openHelp;
  $('#btnHome').onclick = goHome; $('#btnSettings').onclick = openSettings; $('#btnExport').onclick = doExport;
  $('#btnEmptyAdd').onclick = pickVideo;
  $('#btnPlay').onclick = togglePlay;
  $('#btnBack1').onclick = () => { pause(); state.t = clamp(state.t - 1, 0, totalDur()); syncScroll(state.t); seekTo(state.t); };
  $('#btnFwd1').onclick = () => { pause(); state.t = clamp(state.t + 1, 0, totalDur()); syncScroll(state.t); seekTo(state.t); };
  $('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo;
  $('#zIn').onclick = () => zoom(1.4); $('#zOut').onclick = () => zoom(1 / 1.4);
  $('#projName').addEventListener('change', (e) => { if (P()) { P().name = e.target.value.trim() || 'Video Saya'; e.target.value = P().name; scheduleSave(); } });
  $('#fileVideo').addEventListener('change', (e) => { const f = [...e.target.files]; if (f.length) addVideoFiles(f); });
  $('#fileImage').addEventListener('change', (e) => { const f = [...e.target.files]; if (f.length) addImageFiles(f); });
  window.addEventListener('resize', () => { if (!P()) return; layoutStage(); renderTimeline(); syncScroll(state.t); });
  window.addEventListener('orientationchange', () => setTimeout(() => { if (!P()) return; layoutStage(); renderTimeline(); syncScroll(state.t); }, 250));
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (!exporting) pause(); saveNow(); } });
  window.addEventListener('pagehide', () => { saveNow(); });
  window.addEventListener('keydown', (e) => {
    if (!P() || /INPUT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName)) return;
    if (document.querySelector('.scrim')) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); togglePlay(); }
    else if (k === 's') splitAtPlayhead();
    else if (k === 'delete' || k === 'backspace') deleteSelected();
    else if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if (k === 'arrowleft') { pause(); state.t = clamp(state.t - (e.shiftKey ? 5 : 0.5), 0, totalDur()); syncScroll(state.t); seekTo(state.t); }
    else if (k === 'arrowright') { pause(); state.t = clamp(state.t + (e.shiftKey ? 5 : 0.5), 0, totalDur()); syncScroll(state.t); seekTo(state.t); }
  });
  /* seret & lepas file (komputer) */
  const mask = $('#dropMask'); let dc = 0;
  window.addEventListener('dragenter', (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { dc++; mask.style.display = 'grid'; } });
  window.addEventListener('dragleave', () => { dc = Math.max(0, dc - 1); if (!dc) mask.style.display = 'none'; });
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault(); dc = 0; mask.style.display = 'none';
    const fs = [...(e.dataTransfer?.files || [])]; const vids = fs.filter((f) => f.type.startsWith('video/')), imgs = fs.filter((f) => f.type.startsWith('image/'));
    (async () => { if (vids.length) await addVideoFiles(vids); if (imgs.length && P()) await addImageFiles(imgs); })();
  });
  /* pasang ke layar utama */
  let dip = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); dip = e; $('#btnInstall').classList.remove('hidden'); });
  $('#btnInstall').onclick = async () => { if (!dip) return; dip.prompt(); try { await dip.userChoice; } catch (e) {} dip = null; $('#btnInstall').classList.add('hidden'); };
  window.addEventListener('appinstalled', () => $('#btnInstall').classList.add('hidden'));
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
  if (ios) { const t = $('#installTip'); t.classList.remove('hidden'); t.textContent = 'Di iPhone/iPad: tekan tombol Bagikan di Safari, lalu pilih “Tambah ke Layar Utama” agar aplikasi ini mudah dibuka.'; }
}
async function init() {
  bind(); updatePlayBtn();
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) { navigator.serviceWorker.register('sw.js').catch(() => {}); }
  await renderHome();
  try { if (!localStorage.getItem('evm_help_seen')) setTimeout(openHelp, 400); } catch (e) {}
}
window.__evm = { state, rt, P, addVideoFiles, addImageFiles, play, pause, seekTo, splitAtPlayhead, doExport, applyNR, totalDur };   // untuk pengujian
init();

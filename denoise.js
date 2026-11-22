// Mesin pengurang noise: RNNoise (jaringan saraf) + pintu suara berbasis VAD + penguat suara otomatis.
// Dipakai di browser (modul ES) dan di Node untuk uji.
const FRAME = 480; // 10 ms @ 48 kHz
let rnn = null;

export async function loadRnnoise(opts = {}) {
  if (rnn) return rnn;
  const factory = (await import(opts.moduleUrl || './vendor/rnnoise.js')).default;
  let wasmBinary = opts.wasmBinary;
  if (!wasmBinary && opts.wasmUrl) {
    wasmBinary = new Uint8Array(await (await fetch(opts.wasmUrl)).arrayBuffer());
  }
  rnn = await factory({ wasmBinary, locateFile: (p) => (opts.wasmUrl || p) });
  return rnn;
}

// High-pass biquad (Butterworth 2nd order) untuk membuang dengung/rumble
function highpass(x, fc, sr) {
  const w0 = 2 * Math.PI * fc / sr, c = Math.cos(w0), s = Math.sin(w0);
  const alpha = s / Math.SQRT2;
  const b0 = (1 + c) / 2, b1 = -(1 + c), b2 = (1 + c) / 2;
  const a0 = 1 + alpha, a1 = -2 * c, a2 = 1 - alpha;
  const B0 = b0 / a0, B1 = b1 / a0, B2 = b2 / a0, A1 = a1 / a0, A2 = a2 / a0;
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    const yi = B0 * xi + B1 * x1 + B2 * x2 - A1 * y1 - A2 * y2;
    y[i] = yi; x2 = x1; x1 = xi; y2 = y1; y1 = yi;
  }
  return y;
}

const tick = () => new Promise((r) => setTimeout(r, 0));

// Satu lintasan RNNoise. Mengembalikan {out, vad[]}. Keluaran sudah dikoreksi tunda 1 frame.
async function rnnoisePass(m, x, onProgress, cancelled) {
  const nFrames = Math.ceil(x.length / FRAME) + 1; // +1 frame untuk membilas tunda
  const st = m._rnnoise_create(0);
  const inPtr = m._malloc(FRAME * 4), outPtr = m._malloc(FRAME * 4);
  const out = new Float32Array(nFrames * FRAME);
  const vad = new Float32Array(nFrames);
  for (let f = 0; f < nFrames; f++) {
    const heap = m.HEAPF32;
    const ib = inPtr >> 2;
    const base = f * FRAME;
    for (let i = 0; i < FRAME; i++) {
      const v = base + i < x.length ? x[base + i] : 0;
      heap[ib + i] = v * 32768;
    }
    vad[f] = m._rnnoise_process_frame(st, outPtr, inPtr);
    const ob = outPtr >> 2, h2 = m.HEAPF32;
    for (let i = 0; i < FRAME; i++) out[base + i] = h2[ob + i] / 32768;
    if (f % 400 === 0) {
      onProgress && onProgress(f / nFrames); await tick();
      if (cancelled && cancelled()) { m._free(inPtr); m._free(outPtr); m._rnnoise_destroy(st); throw new Error('cancelled'); }
    }
  }
  m._free(inPtr); m._free(outPtr); m._rnnoise_destroy(st);
  // RNNoise memberi tunda 1 frame (480 sampel): geser agar sejajar dengan input
  const aligned = out.subarray(FRAME, FRAME + x.length);
  const outAligned = new Float32Array(x.length);
  outAligned.set(aligned);
  // vad[f] menggambarkan frame f-1 (karena tunda)
  const vadAl = new Float32Array(nFrames);
  for (let f = 1; f < nFrames; f++) vadAl[f - 1] = vad[f];
  return { out: outAligned, vad: vadAl };
}

// Pintu suara halus berdasarkan VAD: saat tak ada ucapan, redam sampai `floor`.
function applyGate(x, vad, floor, thr) {
  const y = new Float32Array(x.length);
  const nF = vad.length;
  const g = new Float32Array(nF);
  let cur = 1;
  const rel = Math.exp(-1 / 14), att = 0.2; // lepas ~140 ms, serang cepat
  // hangover: tahan terbuka 120 ms setelah suara terakhir
  let hold = 0;
  for (let f = 0; f < nF; f++) {
    const speech = vad[f] > thr;
    if (speech) hold = 12; else if (hold > 0) hold--;
    const target = (speech || hold > 0) ? 1 : floor;
    cur = target > cur ? cur + (target - cur) * (1 - att) : target + (cur - target) * rel;
    g[f] = cur;
  }
  for (let f = 0; f < nF; f++) {
    const g0 = g[f], g1 = f + 1 < nF ? g[f + 1] : g[f];
    const base = f * FRAME;
    for (let i = 0; i < FRAME && base + i < x.length; i++) {
      y[base + i] = x[base + i] * (g0 + (g1 - g0) * (i / FRAME));
    }
  }
  return y;
}

function softLimit(x) {
  for (let i = 0; i < x.length; i++) {
    const v = x[i], a = Math.abs(v) / 0.93;
    x[i] = v / Math.pow(1 + Math.pow(a, 8), 0.125);
  }
}

function normalizeSpeech(x, vad) {
  // RMS hanya pada frame berbicara
  let sum = 0, cnt = 0;
  for (let f = 0; f < vad.length; f++) {
    if (vad[f] < 0.6) continue;
    const base = f * FRAME;
    for (let i = 0; i < FRAME && base + i < x.length; i++) { sum += x[base + i] * x[base + i]; cnt++; }
  }
  if (cnt < FRAME * 20) return 1;
  const rms = Math.sqrt(sum / cnt);
  if (rms < 1e-5) return 1;
  const target = 0.105; // ~ -19.5 dBFS
  return Math.max(0.5, Math.min(target / rms, 8));
}

export const LEVELS = {
  0: { name: 'Mati' },
  1: { name: 'Ringan', wet: 0.75, passes: 1, floor: 1.0, thr: 0 },
  2: { name: 'Kuat', wet: 1.0, passes: 1, floor: 0.30, thr: 0.25 },
  3: { name: 'Sangat Kuat', wet: 1.0, passes: 2, floor: 0.04, thr: 0.35 },
};

/**
 * x: Float32Array mono 48 kHz. Mengembalikan Float32Array baru.
 * opts: {level:1..3, loud:boolean, onProgress(0..1)}
 */
export async function denoise(x, opts = {}) {
  const level = opts.level || 2, cfg = LEVELS[level];
  const m = await loadRnnoise(opts.load || {});
  const prog = opts.onProgress || (() => {});
  const pre = highpass(x, 85, 48000);
  const p1 = await rnnoisePass(m, pre, (p) => prog(p * (cfg.passes === 2 ? 0.5 : 1) * 0.92), opts.cancelled);
  let y = p1.out, vad = p1.vad;
  if (cfg.passes === 2) {
    const p2 = await rnnoisePass(m, y, (p) => prog(0.46 + p * 0.46), opts.cancelled);
    y = p2.out;
    // gabungkan VAD (ambil yang paling yakin ada ucapan)
    for (let i = 0; i < vad.length; i++) vad[i] = Math.max(vad[i], p2.vad[i] || 0) * 0.5 + vad[i] * 0.5;
  }
  if (cfg.wet < 1) { for (let i = 0; i < y.length; i++) y[i] = y[i] * cfg.wet + pre[i] * (1 - cfg.wet); }
  if (cfg.floor < 1) y = applyGate(y, vad, cfg.floor, cfg.thr);
  if (opts.loud !== false) {
    const g = normalizeSpeech(y, vad);
    for (let i = 0; i < y.length; i++) y[i] *= g;
  }
  softLimit(y);
  prog(1);
  return y;
}

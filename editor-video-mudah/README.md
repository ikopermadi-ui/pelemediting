# Editor Video Mudah (PWA)

Editor video untuk membuat video penjelasan (monolog) dengan gambar/teks tempelan. UI ala CapCut, tombol besar berlabel bahasa Indonesia, cocok untuk orang tua.

## Fitur
- Tambah video (bisa banyak), potong, hapus bagian, geser urutan, atur volume
- Tempel gambar dan teks di atas video (geser dengan jari, cubit/besarkan, atur kapan muncul & hilang)
- **Bersihkan Suara**: RNNoise (jaringan saraf, berjalan di perangkat) + pintu suara + penguat suara bicara. 4 tingkat: Mati / Ringan / Kuat / Sangat Kuat, bisa dibandingkan asli vs bersih
- Simpan otomatis (IndexedDB), bisa dibuka lagi; bekerja offline setelah dibuka sekali
- Ekspor MP4 (Chrome/Safari terbaru) atau WebM; bisa langsung dibagikan ke WhatsApp

## Cara pasang (harus lewat HTTPS, tidak bisa dibuka langsung dari file://)
1. **Netlify**: buka app.netlify.com/drop, seret seluruh folder ini.
2. **GitHub Pages**: unggah seluruh isi folder ke repo, aktifkan Pages.
3. Buka alamatnya di Chrome HP -> menu -> "Pasang aplikasi" / "Tambah ke layar utama". Di iPhone: Safari -> Bagikan -> Tambah ke Layar Utama.

## Uji lokal
    python3 -m http.server 8765   # lalu buka http://localhost:8765

## Struktur
- index.html, app.css, app.js — aplikasi (vanilla JS, tanpa framework)
- denoise.js — mesin pengurang noise; vendor/rnnoise.js + rnnoise.wasm — RNNoise (Jitsi, Apache-2.0)
- sw.js, manifest.webmanifest, icons/ — bagian PWA. Naikkan `VERSION` di sw.js setiap memperbarui berkas.

## Batasan yang perlu diketahui
- Ekspor berjalan **real-time** (video 5 menit = ±5 menit proses) dan layar harus tetap menyala.
- Suara dibaca penuh ke memori: disarankan video < 30 menit per berkas (maks ±1,5 GB).
- Pastikan membuka lewat Chrome terbaru agar hasil ekspor H.264 .mp4 (paling aman untuk WhatsApp).

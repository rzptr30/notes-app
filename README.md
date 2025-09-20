# Notes App (Submission Proyek Pertama)

Aplikasi catatan sederhana menggunakan:
- Vanilla JS + Web Components (4 custom elements)
- CSS Grid untuk layout daftar (responsif auto-fill)
- Realtime validation pada form
- Custom attributes pada custom elements
- Aksi per catatan: Arsipkan/Keluarkan dari Arsip, Hapus

## Pemetaan Kriteria

- Kriteria Wajib 1: Menampilkan daftar catatan dari data dumi
  - Data resmi ditempel di `src/data/notes.js`, dirender ke `<note-list>` sebagai `<note-item>`.
- Kriteria Wajib 2: Formulir tambah catatan
  - Komponen `<note-form>` memiliki input `judul (text)` dan `isi (textarea)`.
- Kriteria Wajib 3: CSS Grid sebagai layouting
  - Komponen `<note-list>` menggunakan CSS Grid: `repeat(auto-fill, minmax(var(--min), 1fr))`.
- Kriteria Wajib 4: Web Components minimal tiga
  - `<app-bar>`, `<note-form>`, `<note-list>`, `<note-item>` (empat elemen).

Opsional (nilai lebih):
- Tampilan menarik
  - Palet warna netral, tipografi sistem, spacing rapi, elevasi halus.
- Realtime validation
  - Dilakukan di `<note-form>` pada event `input` (Constraint Validation API).
- Custom attribute pada custom element
  - `<app-bar title variant>`, `<note-form title-minlength body-minlength submit-text>`, `<note-list min gap>`, `<note-item pinned archived>`.
- Responsive
  - CSS Grid auto-fill; penyesuaian padding di mobile.

## Cara Menjalankan

1. Buka `index.html` langsung di browser modern atau gunakan VS Code + ekstensi Live Server.
2. Pastikan data sample tampil, bisa menambah catatan, arsip/hapus berjalan.

## Struktur Proyek

```
.
├── index.html
├── src
│   ├── index.js
│   ├── data
│   │   └── notes.js
│   └── components
│       ├── app-bar.js
│       ├── note-form.js
│       ├── note-list.js
│       └── note-item.js
└── README.md
```

## Validasi Realtime

- Error muncul saat mengetik (`input`), tanpa harus klik submit.
- Pesan tampil di bawah setiap field dengan `aria-live="polite"`.

## Keamanan DOM

- Konten input pengguna dipasang via `textContent` (bukan `innerHTML`).

## Deploy ke GitHub Pages

1. Inisialisasi repo git:
   ```
   git init
   git add .
   git commit -m "Initial commit: Notes App"
   ```
2. Buat repo di GitHub (mis. `notes-app`) lalu:
   ```
   git branch -M main
   git remote add origin https://github.com/<username>/notes-app.git
   git push -u origin main
   ```
3. Aktifkan Pages:
   - GitHub → repo → Settings → Pages → Source: "Deploy from a branch"
   - Branch: `main` dan folder `/ (root)` → Save
4. Tunggu URL aktif, lalu uji di perangkat mobile dan desktop.

## Tips Pemeriksaan

- Buka DevTools → Elements: pastikan `<note-item>` muncul (bukti render DOM).
- Coba ketik field form: error muncul realtime.
- Klik Arsipkan/Keluarkan dari Arsip → status badge berubah.
- Klik Hapus → item hilang dari daftar.
- Pastikan tidak ada error di Console.

Selamat mengerjakan submission!
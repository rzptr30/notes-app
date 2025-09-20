# Notes App

Aplikasi catatan sederhana dengan:
- Vanilla JS + Web Components (4 custom elements).
- CSS Grid untuk layout responsif (auto-fill).
- Realtime validation pada form.
- Aksi per catatan: Arsipkan/Keluarkan dari Arsip, Hapus.

## Demo (GitHub Pages)
Isi setelah deploy:
- URL: https://rzptr30.github.io/notes-app/

## Pemetaan Kriteria Penilaian

Wajib
1) Menampilkan daftar catatan dari data dummy
   - Data resmi di `src/data/notes.js`, dirender ke `<note-list>` sebagai `<note-item>`.
2) Formulir tambah catatan
   - Komponen `<note-form>` (judul: input text, isi: textarea).
3) CSS Grid sebagai layouting
   - `<note-list>` menggunakan `grid-template-columns: repeat(auto-fill, minmax(var(--min), 1fr))`.
4) Minimal tiga Web Components
   - `<app-bar>`, `<note-form>`, `<note-list>`, `<note-item>` (total 4).

Opsional
- Tampilan menarik: tipografi sistem, palet netral, elevasi halus.
- Realtime validation: pesan error saat mengetik (Constraint Validation API).
- Custom attributes:
  - `app-bar[title|variant]`
  - `note-form[title-minlength|body-minlength|submit-text]`
  - `note-list[min|gap]`
  - `note-item[pinned|archived]`
- Responsif: grid auto-fill; padding menyesuaikan di mobile.

## Cara Menjalankan Lokal
- Buka `index.html` dengan Live Server (disarankan) atau langsung di browser modern.
- Jika ada error module saat buka langsung, gunakan Live Server.

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

## Checklist Uji Fungsional

- [ ] Semua catatan sample tampil; `<note-list>` berisi banyak `<note-item>`.
- [ ] Form tambah catatan bekerja; catatan baru muncul di paling atas.
- [ ] Tombol Arsipkan/Keluarkan dari Arsip mengubah status badge dan gaya.
- [ ] Tombol Hapus menghapus item (dengan konfirmasi).
- [ ] Layout daftar menggunakan CSS Grid dan responsif.
- [ ] Realtime validation aktif (pesan muncul saat mengetik).
- [ ] Console bersih (tanpa error).
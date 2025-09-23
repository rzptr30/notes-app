# Notes App — Final Submission

Aplikasi catatan berbasis Web Components dengan penyimpanan lokal, tema gelap/terang, filter, pencarian, import/export JSON, dialog konfirmasi kustom, serta animasi transisi (FLIP) dan micro-interactions.

Demo
- GitHub Pages: https://rzptr30.github.io/notes-app/

Fitur Utama
- Data awal (seeding) dan persistensi via localStorage
- Tambah catatan dengan validasi realtime
- Aksi per catatan: Sematkan/Lepas, Arsip/Unarsip, Hapus
- Filter tab: Semua, Aktif, Arsip, Disematkan
- Pencarian judul/isi (debounced)
- Dark/Light mode toggle (persist)
- Badge jumlah item per tab (dinamis, mengikuti pencarian)
- Dialog konfirmasi hapus kustom (tema-aware, aksesibel)
- Import/Export data JSON (backup/restore)
- Animasi transisi (enter/exit/reorder via FLIP) + micro-interactions (hover/press, ring flash, toast)
- Responsif dan A11y dasar

Teknologi
- Vanilla JS, Web Components (Shadow DOM)
- CSS Variables untuk tema
- Web Animations API
- localStorage

Struktur Komponen
- <app-bar>: header aplikasi
- <note-form>: formulir tambah catatan (validasi realtime)
- <note-toolbar>: filter, pencarian, badge counts, tema, import/export
- <note-list>: kontainer grid responsif
- <note-item>: kartu catatan + aksi
- <confirm-dialog>: dialog konfirmasi kustom
- <toast-snackbar>: notifikasi ringan

Cara Menjalankan
- Lokal: buka index.html dengan Live Server atau static server apa pun.
  - Jika perlu reset data, hapus key localStorage berikut:
    - notes-app/v1 dan notes-app/seeded
- Produksi: aktifkan GitHub Pages (branch main, root) lalu akses URL Pages repositori.

Import/Export
- Export JSON: mengunduh file berisi seluruh data catatan saat ini.
- Import JSON: memilih file .json akan menampilkan dialog konfirmasi sebelum menggantikan data.

Aksesibilitas
- Label terhubung (aria-describedby), fokus jelas (focus-visible)
- Dialog: aria-modal, trap fokus, Escape untuk menutup
- Kontras dan warna mengikuti tema

Catatan Penilai
- Uji di mobile viewport dan mode incognito (cek seeding awal).
- Semua fitur wajib dan sebagian besar opsional sudah tersedia.
- Animasi memakai WAAPI sehingga aman untuk komponen ber-Shadow DOM.

Lisensi
MIT — bebas digunakan untuk pembelajaran.
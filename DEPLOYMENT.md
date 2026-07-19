# Deployment To-Do — Vercel

Checklist lengkap untuk deploy Valrise Class Manager (Vite + React) ke Vercel,
tersambung ke Supabase yang sudah kamu siapkan sebelumnya.

---

## 1. Persiapan Repo

- [ ] Pastikan proyek berjalan mulus secara lokal dengan `VITE_USE_MOCK_AUTH=false`
      dan kredensial Supabase asli (jangan deploy sambil masih mengetes mode mock).
- [ ] Inisialisasi git kalau belum:
  ```bash
  cd valrise-class-manager
  git init
  git add .
  git commit -m "Initial commit"
  ```
- [ ] Tambahkan `.env` ke `.gitignore` (harus sudah ada dari template Vite) —
      **jangan pernah commit** file `.env` berisi key asli. Hanya `.env.example`
      yang boleh masuk repo.
- [ ] Push ke GitHub/GitLab/Bitbucket (Vercel butuh salah satu ini untuk
      auto-deploy):
  ```bash
  git remote add origin https://github.com/<username>/valrise-class-manager.git
  git branch -M main
  git push -u origin main
  ```

---

## 2. Setup Akun & Import Project di Vercel

- [ ] Daftar/masuk ke [vercel.com](https://vercel.com) — bisa langsung
      pakai akun GitHub agar repo otomatis terdeteksi.
- [ ] Klik **Add New → Project**, pilih repo `valrise-class-manager`.
- [ ] Vercel akan otomatis mendeteksi framework **Vite** karena
      `package.json` & `vite.config.js` sudah ada. Konfigurasi default
      biasanya sudah benar:
  | Setting | Value |
  |---|---|
  | Framework Preset | Vite |
  | Build Command | `npm run build` (atau `vite build`) |
  | Output Directory | `dist` |
  | Install Command | `npm install` |
- [ ] **Jangan klik Deploy dulu** — isi environment variables terlebih
      dahulu (langkah berikut), supaya build pertama sudah tersambung ke
      Supabase yang benar.

---

- [ ] Deploy dua Edge Function yang dibutuhkan `UserManagement` (perlu
      [Supabase CLI](https://supabase.com/docs/guides/cli)):
  ```bash
  supabase login
  supabase link --project-ref <project-ref-kamu>
  supabase functions deploy create-user
  supabase functions deploy delete-user
  ```
  Tanpa ini, tombol "Tambah Pengguna" / hapus pengguna di menu Pengguna akan
  gagal memanggil fungsi yang belum ada.

---

## 3. Environment Variables (paling krusial)

Di halaman konfigurasi project → **Environment Variables**, tambahkan:

| Key | Value | Environment |
|---|---|---|
| `VITE_SUPABASE_URL` | URL project Supabase kamu | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | anon public key Supabase kamu | Production, Preview, Development |
| `VITE_USE_MOCK_AUTH` | `false` | **Production wajib `false`** |

- [ ] Set ketiga variabel di atas.
- [ ] **Double-check `VITE_USE_MOCK_AUTH` = `false` di environment Production.**
      Kalau ini kelewat `true`, akun uji coba (`admin/admin123`, dst.) di
      `src/lib/mockAccounts.js` bisa dipakai login oleh siapa pun yang
      membaca source code publikmu.
- [ ] Kalau kamu ingin tetap punya mode mock khusus untuk preview deployment
      (mis. untuk demo tanpa expose data asli), boleh set
      `VITE_USE_MOCK_AUTH=true` khusus di environment **Preview** saja —
      Production tetap `false`.

---

## 4. Konfigurasi Supabase agar Menerima Domain Vercel

- [ ] Buka Supabase dashboard → **Authentication → URL Configuration**.
- [ ] Tambahkan domain Vercel-mu (mis. `https://valrise-class-manager.vercel.app`)
      ke **Site URL** dan/atau **Redirect URLs**, supaya auth flow tidak
      diblok CORS/redirect mismatch.
- [ ] Kalau nanti pakai custom domain (langkah 6), ulangi langkah ini dengan
      domain barunya.

---

## 5. Deploy & Verifikasi

- [ ] Klik **Deploy**. Tunggu build selesai (biasanya 1–2 menit untuk
      proyek Vite sekecil ini).
- [ ] Buka preview URL yang diberikan Vercel, lalu tes:
  - [ ] Login sebagai masing-masing role (developer/secretary/teacher) —
        pastikan sidebar RBAC menyaring menu dengan benar (termasuk menu
        NOTIFIKASI yang developer-only).
  - [ ] CRUD Data Siswa, input Absensi, Kas Kelas, Nilai — pastikan data
        benar-benar tersimpan ke Supabase (cek Table Editor di dashboard
        Supabase setelah input).
  - [ ] Buka dari HP asli (bukan cuma resize browser) untuk cek layout
        mobile-first sungguhan — termasuk drawer sidebar dan tabel yang
        di-scroll horizontal.
  - [ ] Buka DevTools Console, pastikan tidak ada error merah (terutama
        soal env var yang undefined — tanda ada typo nama variabel).
- [ ] Cek tab **Network** untuk memastikan request ke Supabase memakai
      domain project yang benar (bukan placeholder).

---

## 6. (Opsional) Custom Domain

- [ ] Di project Vercel → **Settings → Domains**, tambahkan domain sekolah/
      pribadi (mis. `kelas.tkj3.sch.id`).
- [ ] Ikuti instruksi Vercel untuk menambahkan record DNS (`CNAME` atau `A`)
      di penyedia domainmu.
- [ ] Setelah domain aktif, ulangi langkah 4 (update Site URL/Redirect URLs
      di Supabase dengan domain baru).

---

## 7. Alur Kerja Berkelanjutan (CI/CD)

- [ ] Setiap `git push` ke branch `main` otomatis men-deploy ke Production —
      tidak perlu langkah manual lagi setelah setup awal.
- [ ] Push ke branch lain / buka Pull Request otomatis membuat **Preview
      Deployment** terpisah dengan URL unik — bagus untuk mengetes fitur
      baru (mis. saat kamu lanjut membangun modul Analytics) sebelum
      digabung ke `main`.
- [ ] Pertimbangkan proteksi branch `main` di GitHub (require PR review)
      supaya tidak ada perubahan yang langsung ke production tanpa dicek.

---

## 8. Pasca-Deploy — Hal yang Sering Terlewat

- [ ] Pastikan tabel `users`, `students`, dll. di Supabase production
      **kosong dari data uji coba** (`Ahmad Fauzan`, dsb.) sebelum
      dipakai sungguhan oleh kelas — ganti dengan data siswa asli.
- [ ] Buat minimal 1 akun developer asli lewat Supabase Auth + tabel
      `users` (lihat `TESTING.md` §Mode Nyata) — jangan hanya mengandalkan
      mock account.
- [ ] Cek kuota gratis Supabase (database size, monthly active users,
      egress) di **Project Settings → Billing** kalau kelas cukup besar
      atau dipakai lintas semester.
- [ ] Simpan `supabase/schema.sql` sebagai sumber kebenaran skema di repo —
      kalau ada perubahan tabel di masa depan, tulis sebagai migration baru
      (`supabase/migrations/000x_*.sql`) alih-alih mengedit langsung lewat
      dashboard tanpa dicatat.
- [ ] Tambahkan file `vercel.json` **hanya jika** nanti kamu menambah
      client-side routing (react-router). Untuk versi sekarang (navigasi
      berbasis state, bukan URL) tidak diperlukan rewrite rule apa pun.

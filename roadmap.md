# Valrise Class Manager — Implementation Roadmap

Rencana lengkap untuk merealisasikan to-do list menjadi aplikasi manajemen
kelas XI-TKJ III yang berjalan di atas **Vite + React**, **Supabase
(PostgreSQL + Auth)**, **Tailwind CSS v4**, dan **Framer Motion**.

---

## 0. Apa yang sudah dikerjakan di scaffold ini

| To-Do (dari PDF) | Status | Keterangan |
|---|---|---|
| Fix CSS nesting error | ✅ | `src/index.css` dirapikan; ditambah styling dark-mode untuk `input/select/textarea` (poin 2 di to-do) |
| Sinkronisasi logo mobile | ✅ | `Sidebar.jsx` (drawer mobile) sekarang menampilkan "XI - TKJ III", bukan "VALRISE GAMING" |
| Active nav state di mobile | ✅ | `NavItem` dipakai bersama desktop & mobile, kontras teks & pill aktif konsisten |
| Font-family swapping (`heroHeading`, `heroParagraph`) | ⚠️ manual | Token sudah ada di `index.css`; terapkan di halaman Login / hero sesuai selera visual |
| Audit Tailwind v4 migration | ✅ | `@theme` dipertahankan, `vite.config.js` memakai plugin `@tailwindcss/vite` (lihat langkah 3) |
| Dark-mode form elements | ✅ | Ditambahkan di `index.css` |
| Breakdown sub-modules | ✅ | `components/` (Sidebar, Header, DashboardCard) + `views/` (8 view) |
| `layoutId` sidebar animation | ✅ | `Sidebar.jsx` pakai `motion.span layoutId="nav-active-pill"` |
| Data Siswa layout matrix | ✅ | `views/StudentsList.jsx` — No Absen, Nama, Gender, CRUD |
| Notifications system | ✅ | `notifications` + `notification_reads` tabel; bell di `Header.jsx` (semua role, unread badge nyata) + `views/NotificationsCenter.jsx` (developer-only, buat/hapus notifikasi) |
| Semua view tersambung ke Supabase asli | ✅ | Tidak ada lagi `useState` mock sebagai sumber data — lihat §0.1 di bawah |
| Absensi Harian grid | ✅ | `views/AttendanceTracker.jsx` — status button autosave |
| Struktur direktori target | ✅ | Diperluas (lihat §2) karena fitur lebih detail dari to-do awal |

Semua panggilan Supabase ditandai `// TODO(supabase): ...` di dalam kode —
scaffold awalnya berjalan dengan **mock data lokal**. Update terbaru: semua
view sudah disambungkan ke query Supabase sungguhan.

### 0.1 Rincian koneksi data per view

| View | Query Supabase |
|---|---|
| `DashboardHome` | `count` siswa aktif, `attendance` hari ini & bulan berjalan (diagregasi di client), `subjects` difilter `day_of_week` = hari ini |
| `StudentsList` | CRUD penuh ke tabel `students` |
| `AttendanceTracker` | fetch siswa aktif + `attendance` pada tanggal terpilih, `upsert` saat tombol status ditekan |
| `AttendanceRecap` | fetch `attendance` dalam rentang bulan, diagregasi per siswa di client, lalu di-export via SheetJS |
| `ClassFunds` | fetch siswa + `class_funds` pada periode terpilih, `upsert` saat nominal diubah |
| `SubjectsManagement` | CRUD ke tabel `subjects`, termasuk field baru `day_of_week` |
| `GradeManagement` | `subjects` difilter `teacher_user_id` (kecuali developer), fetch/`upsert` ke `grades` saat Enter ditekan |
| `UserManagement` | fetch tabel `users`; create/delete akun memanggil **Edge Function** (lihat §0.2) karena butuh service-role key |
| `NotificationsCenter` | CRUD ke tabel `notifications`, dibatasi RLS untuk role developer |

### 0.2 Edge Functions (wajib di-deploy terpisah)

Membuat/menghapus akun login (`UserManagement`) tidak bisa dilakukan langsung
dari browser karena butuh `SUPABASE_SERVICE_ROLE_KEY` — key ini tidak boleh
pernah dikirim ke client. Solusinya dua Edge Function di
`supabase/functions/`:

- `create-user` — membuat user di Supabase Auth + baris di tabel `users`
  sekaligus (rollback otomatis kalau salah satu gagal)
- `delete-user` — menghapus baris `users` **dan** akun Auth-nya (menghapus
  baris `users` saja akan meninggalkan akun login yang "yatim")

Deploy dengan Supabase CLI:
```bash
supabase functions deploy create-user
supabase functions deploy delete-user
```
Keduanya sudah memverifikasi bahwa pemanggilnya berrole `developer` sebelum
melakukan apa pun — jadi aman dipanggil dari `supabase.functions.invoke(...)`
di client tanpa perlu pengecekan tambahan di frontend.

---

## 1. Prasyarat

- Node.js 18+ dan npm/pnpm
- Akun [Supabase](https://supabase.com) (tier gratis cukup untuk kelas)
- Editor dengan ESLint + Tailwind IntelliSense

---

## 2. Struktur direktori final

To-do awal menyebut 4 view (`StudentsList`, `AttendanceTracker`,
`AssignmentGrades`, `ClassSettings`). Karena daftar fitur yang kamu berikan
jauh lebih rinci (Kas Kelas, Rekap Absensi, Manajemen Pengguna, Manajemen
Mata Pelajaran terpisah dari Nilai), struktur diperluas:

```
src/
├── assets/
├── components/
│   ├── Sidebar.jsx        # DesktopSidebar + MobileSidebar + NavItem (layoutId)
│   ├── Header.jsx         # judul halaman, notifikasi, profil
│   └── DashboardCard.jsx  # kartu ringkasan analitik
├── views/
│   ├── Login.jsx
│   ├── DashboardHome.jsx
│   ├── StudentsList.jsx
│   ├── AttendanceTracker.jsx
│   ├── AttendanceRecap.jsx   # sub-modul rekap + export Excel
│   ├── ClassFunds.jsx
│   ├── SubjectsManagement.jsx
│   ├── GradeManagement.jsx
│   └── UserManagement.jsx
├── lib/
│   ├── supabaseClient.js
│   └── AuthContext.jsx    # session, profile, signIn/signOut, RBAC `can()`
├── App.jsx                # Gate (Login vs Shell) + navigasi RBAC-aware
└── index.css
supabase/
└── schema.sql             # tabel, index, RLS policy
```

---

## 3. Langkah setup proyek

1. **Inisialisasi Vite + React**
   ```bash
   npm create vite@latest valrise-class-manager -- --template react
   cd valrise-class-manager
   ```
2. **Install dependencies**
   ```bash
   npm install @supabase/supabase-js framer-motion lucide-react xlsx
   npm install -D tailwindcss @tailwindcss/vite
   ```
3. **Aktifkan Tailwind v4 di Vite** (`vite.config.js`):
   ```js
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';
   import tailwindcss from '@tailwindcss/vite';

   export default defineConfig({
     plugins: [react(), tailwindcss()],
   });
   ```
4. **Salin file dari scaffold ini** ke `src/` dan `supabase/` proyekmu
   (lihat daftar file di §2).
5. **ESLint** — jalankan `npm init @eslint/config@latest` lalu pilih React;
   scaffold ini sudah mengikuti konvensi hooks standar sehingga lolos
   `eslint-plugin-react-hooks`.
6. Salin `.env.example` → `.env` dan isi dengan kredensial proyek Supabase-mu
   (didapat dari langkah berikutnya).

---

## 4. Setup Supabase (backend)

1. Buat project baru di [supabase.com](https://supabase.com/dashboard).
2. Buka **SQL Editor** → jalankan isi `supabase/schema.sql` dari scaffold ini.
   File ini membuat:
   - Tabel `users`, `students`, `subjects`, `attendance`, `class_funds`, `grades`
   - Index untuk query tanggal/mapel yang sering dipakai
   - **Row Level Security (RLS)** per role: `developer`, `secretary`, `teacher`
3. Ambil `Project URL` dan `anon public key` dari **Project Settings > API**,
   masukkan ke `.env`.
4. **Login berbasis username** — Supabase Auth native-nya berbasis email.
   Solusi paling sederhana: petakan `username` → email pseudo
   `username@valrise.local` saat sign up/sign in (sudah diimplementasikan di
   `AuthContext.signIn`). Alternatif lebih formal: pakai Supabase Edge
   Function khusus yang memvalidasi username dari tabel `users` lalu
   memanggil `auth.admin` API di sisi server.
5. Untuk membuat akun awal (developer pertama):
   - Di **Authentication > Users**, klik "Add user" dengan email
     `admin@valrise.local` dan password sementara.
   - Di **Table Editor > users**, insert baris dengan `auth_id` = UUID user
     tadi, `username = 'admin'`, `role = 'developer'`.
6. Simpan `supabase/schema.sql` di git agar skema tetap versioned; setiap
   perubahan skema berikutnya tulis sebagai migration baru
   (`supabase/migrations/0002_xxx.sql`) — bisa pakai Supabase CLI
   (`supabase migration new nama_perubahan`) kalau proyek sudah dihubungkan
   ke CLI.

---

## 5. RBAC (Role-Based Access Control)

Tiga role: **developer**, **secretary**, **teacher**.

- **Frontend**: `lib/AuthContext.jsx` menyediakan `can(role, permission)` dan
  `App.jsx` memfilter item sidebar berdasarkan hasilnya — user tidak akan
  *melihat* menu yang bukan haknya.
- **Backend (yang sebenarnya menegakkan keamanan)**: RLS policy di
  `schema.sql`. Front-end filtering hanya UX; kalau seseorang memanggil API
  Supabase langsung, RLS-lah yang mencegah akses tak sah. Contoh: guru hanya
  bisa `update` baris `grades` untuk `subject_id` miliknya sendiri
  (`teacher_write_own_grades` policy).
- Tambahkan permission baru dengan pola yang sama: perbarui `matrix` di
  `AuthContext.jsx` dan tulis policy SQL yang sepadan — jangan andalkan salah
  satu sisi saja.

---

## 6. Fitur lanjutan yang perlu kamu lengkapi

Scaffold ini memberi kerangka & pola kerja, bukan implementasi 100% siap
produksi. Yang masih perlu kamu sambungkan/uji:

1. **Analitik Dashboard** — ganti mock `stats` di `DashboardHome.jsx` dengan
   query agregat (`count`, `group by`) ke Supabase, idealnya lewat **Postgres
   view** (`create view v_dashboard_summary as ...`) agar query di frontend
   simpel.
2. **Realtime opsional** — Supabase mendukung `supabase.channel()` untuk
   update live (mis. saat sekretaris menyimpan absensi, dashboard guru lain
   ikut ter-update tanpa refresh). Tambahkan jika diperlukan.
3. **Validasi form** — tambahkan validasi (mis. `absent_no` unik, email
   format) sebelum insert, baik di client maupun lewat `CHECK`/`UNIQUE`
   constraint (sudah sebagian ada di `schema.sql`).
4. **Export Excel** — sudah berjalan di `AttendanceRecap.jsx` dengan
   `xlsx`(SheetJS). Terapkan pola sama untuk export nilai/kas kelas jika
   dibutuhkan.
5. **Testing di perangkat mobile asli** — karena prioritas mobile-first, uji
   breakpoint `sm/md` di device sungguhan, khususnya tabel-tabel lebar
   (Attendance, Grades) yang memakai `overflow-x-auto`.
6. **Deploy**:
   - Frontend: Vercel/Netlify (set `VITE_SUPABASE_URL` &
     `VITE_SUPABASE_ANON_KEY` sebagai environment variables build-time).
   - Backend: tetap di Supabase — tidak perlu server terpisah.

---

## 7. Urutan pengerjaan yang disarankan (roadmap eksekusi)

1. Setup proyek (Vite, Tailwind v4, ESLint) → tempel scaffold ini.
2. Jalankan `schema.sql` di Supabase, buat 1 akun developer manual.
3. Sambungkan `Login.jsx` → pastikan sign-in bekerja, `profile.role` termuat.
4. Aktifkan CRUD **Data Siswa** dulu (fondasi untuk fitur lain yang
   mereferensikan `student_id`).
5. Lanjut **Mata Pelajaran** (dibutuhkan Grade Management).
6. Bangun **Absensi Harian** + **Rekap Absensi** (termasu export Excel).
7. Bangun **Kas Kelas**.
8. Bangun **Nilai (Grade Management)** dengan filter guru-pemilik-mapel.
9. Bangun **Manajemen Pengguna** (developer only) — terakhir karena butuh
   alur pembuatan akun Supabase Auth yang lebih hati-hati (idealnya lewat
   Edge Function, bukan langsung dari client).
10. Sambungkan **Dashboard Analytics** paling akhir, setelah semua tabel
    terisi data asli sehingga agregatnya bermakna.
11. Polish: typography hero (`font-heroHeading`/`font-heroParagraph`),
    micro-interactions, empty/error states, aksesibilitas fokus.

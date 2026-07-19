# Testing Locally

Ada dua cara menjalankan proyek ini secara lokal: **mode mock** (tanpa
Supabase sama sekali, langsung bisa login) dan **mode nyata** (tersambung ke
Supabase project-mu).

---

## Cara tercepat: Mode Mock (tanpa Supabase)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Salin env contoh:
   ```bash
   cp .env.example .env
   ```
   Pastikan baris ini ada dan bernilai `true`:
   ```
   VITE_USE_MOCK_AUTH=true
   ```
   (Isi `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` boleh dibiarkan placeholder
   di mode ini — tidak dipakai selama mock aktif.)
3. Jalankan dev server:
   ```bash
   npm run dev
   ```
4. Buka `http://localhost:5173`, lalu login dengan salah satu akun di
   `src/lib/mockAccounts.js` (juga ditampilkan otomatis di bawah form login
   saat mode mock aktif):

   | Username | Password | Role |
   |---|---|---|
   | `admin` | `admin123` | developer (akses penuh) |
   | `sekretaris` | `sekretaris123` | secretary (siswa, absensi, kas kelas) |
   | `guru` | `guru123` | teacher (nilai) |

5. Ganti-ganti akun untuk melihat bagaimana sidebar berubah sesuai RBAC
   (`can()` di `src/lib/AuthContext.jsx`).

**Catatan penting (berubah sejak views disambungkan ke Supabase asli)**: di
awal, `VITE_USE_MOCK_AUTH=true` juga membuat semua tabel (siswa, absensi, dst.)
memakai data contoh lokal. Sekarang bahwa setiap view sudah memanggil query
Supabase yang sesungguhnya, mock mode **hanya membuat proses login/RBAC bisa
dites** — begitu masuk, tiap halaman (Data Siswa, Absensi, dst.) akan tetap
mencoba menghubungi Supabase asli. Jadi kalau `.env` masih placeholder,
halaman-halaman data akan menampilkan pesan error network, bukan data contoh.

Untuk benar-benar mengetes alur data end-to-end, siapkan project Supabase asli
(§Mode Nyata di bawah) dan jalankan `supabase/schema.sql` — cukup satu project
gratis, tidak perlu server terpisah.

### Menambah/mengubah akun uji
Edit langsung array di `src/lib/mockAccounts.js` — tidak perlu restart
server (Vite HMR akan reload otomatis).

---

## Mode Nyata: Tersambung ke Supabase

1. Ikuti `ROADMAP.md` §4 untuk membuat project Supabase & menjalankan
   `supabase/schema.sql`.
2. Di `.env`, isi kredensial asli dan **matikan** mock:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxxx
   VITE_USE_MOCK_AUTH=false
   ```
3. Buat satu akun developer manual (lihat ROADMAP §4 langkah 5):
   - Authentication > Users > Add user → email `admin@valrise.local`,
     set password.
   - Table Editor > `users` → insert baris dengan `auth_id` = UUID user
     tadi, `username = 'admin'`, `full_name`, `role = 'developer'`.
4. `npm run dev`, lalu login di halaman Login dengan `username = admin` dan
   password yang tadi di-set. `AuthContext` akan menerjemahkannya jadi
   `admin@valrise.local` secara otomatis di baliknya.
5. Dari sini, view-view yang masih pakai mock `useState` (StudentsList,
   AttendanceTracker, dst.) perlu diganti satu per satu memakai query
   Supabase sesuai komentar `// TODO(supabase): ...` di masing-masing file —
   ikuti urutan di `ROADMAP.md` §7.

---

## Build untuk production

```bash
npm run build
npm run preview   # cek hasil build secara lokal sebelum deploy
```

Sebelum deploy: pastikan `VITE_USE_MOCK_AUTH` **tidak** `true` di environment
variables production (Vercel/Netlify), supaya login tidak bisa dibobol pakai
akun mock yang tertulis di kode sumber.

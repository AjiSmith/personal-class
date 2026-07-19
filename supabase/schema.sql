-- =====================================================================
-- VALRISE CLASS MANAGER - SCHEMA
-- Jalankan file ini di Supabase SQL Editor (Project > SQL Editor > New query)
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. USERS (akun aplikasi, terhubung ke Supabase Auth via auth_id)
-- ---------------------------------------------------------------------
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  auth_id uuid unique references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  role text not null check (role in ('developer', 'secretary', 'teacher')),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- 2. STUDENTS (Data Siswa)
-- ---------------------------------------------------------------------
create table if not exists students (
  id uuid primary key default uuid_generate_v4(),
  absent_no int not null unique,       -- Nomor Absen
  full_name text not null,
  gender text not null check (gender in ('L', 'P')), -- Laki-laki / Perempuan
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- 3. SUBJECTS (Mata Pelajaran - dikelola developer, bisa via array/const
--    di frontend ATAU tabel ini; tabel dipakai agar Grade & Jadwal relational)
-- ---------------------------------------------------------------------
create table if not exists subjects (
  id uuid primary key default uuid_generate_v4(),
  subject_name text not null,
  teacher_name text not null,
  teacher_user_id uuid references users(id), -- dipakai untuk RBAC guru hanya lihat mapelnya
  duration_minutes int not null default 45,
  created_at timestamptz default now()
);
-- Ditambahkan belakangan untuk fitur "Mata Pelajaran Hari Ini" di Dashboard.
-- Aman dijalankan ulang meski tabel `subjects` sudah ada sebelumnya.
alter table subjects add column if not exists day_of_week smallint check (day_of_week between 0 and 6);

-- ---------------------------------------------------------------------
-- 4. ATTENDANCE (Absensi Harian) - satu baris per siswa per tanggal
-- ---------------------------------------------------------------------
create table if not exists attendance (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references students(id) on delete cascade,
  attendance_date date not null,
  status text not null check (status in ('hadir', 'izin', 'sakit', 'alfa')),
  recorded_by uuid references users(id),
  updated_at timestamptz default now(),
  unique (student_id, attendance_date)
);

-- ---------------------------------------------------------------------
-- 5. CLASS FUNDS (Kas Kelas) - satu baris per siswa per periode (mis. bulan)
-- ---------------------------------------------------------------------
create table if not exists class_funds (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references students(id) on delete cascade,
  period date not null,           -- gunakan tanggal 1 di bulan terkait, mis. 2026-07-01
  amount numeric(12,2) not null default 0,
  updated_at timestamptz default now(),
  unique (student_id, period)
);

-- ---------------------------------------------------------------------
-- 6. GRADES (Nilai) - satu baris per siswa per mata pelajaran
-- ---------------------------------------------------------------------
create table if not exists grades (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references students(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  daily_score numeric(5,2),
  midterm_score numeric(5,2),
  final_score numeric(5,2),
  updated_at timestamptz default now(),
  unique (student_id, subject_id)
);

-- ---------------------------------------------------------------------
-- 7. NOTIFICATIONS (dibuat oleh developer, dibaca semua user)
-- ---------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  message text not null,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- Menyimpan siapa saja yang sudah membaca notifikasi tertentu, agar bell
-- icon bisa menghitung unread count secara akurat per-user.
create table if not exists notification_reads (
  notification_id uuid references notifications(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  read_at timestamptz default now(),
  primary key (notification_id, user_id)
);

-- ---------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------
create index if not exists idx_attendance_date on attendance(attendance_date);
create index if not exists idx_grades_subject on grades(subject_id);
create index if not exists idx_classfunds_period on class_funds(period);

-- =====================================================================
-- ROW LEVEL SECURITY (RBAC diberlakukan di level database)
-- =====================================================================
alter table users enable row level security;
alter table students enable row level security;
alter table subjects enable row level security;
alter table attendance enable row level security;
alter table class_funds enable row level security;
alter table grades enable row level security;
alter table notifications enable row level security;
alter table notification_reads enable row level security;

-- Helper: fungsi untuk mengambil role user yang sedang login
create or replace function current_role_name() returns text as $$
  select role from users where auth_id = auth.uid();
$$ language sql stable;

-- Semua user login boleh membaca (dashboard butuh data lintas modul)
create policy "read_all_authenticated" on students for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated" on subjects for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated" on attendance for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated" on class_funds for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated" on grades for select using (auth.role() = 'authenticated');
create policy "read_own_or_dev" on users for select using (
  auth.uid() = auth_id or current_role_name() = 'developer'
);

-- Secretary + Developer: kelola siswa, absensi, kas kelas
create policy "secretary_write_students" on students for all using (
  current_role_name() in ('secretary', 'developer')
);
create policy "secretary_write_attendance" on attendance for all using (
  current_role_name() in ('secretary', 'developer')
);
create policy "secretary_write_classfunds" on class_funds for all using (
  current_role_name() in ('secretary', 'developer')
);

-- Developer only: kelola subjects & users
create policy "developer_write_subjects" on subjects for all using (
  current_role_name() = 'developer'
);
create policy "developer_write_users" on users for all using (
  current_role_name() = 'developer'
);

-- Teacher: hanya boleh mengubah nilai pada subject miliknya sendiri
create policy "teacher_write_own_grades" on grades for all using (
  current_role_name() = 'developer'
  or exists (
    select 1 from subjects s
    join users u on u.id = s.teacher_user_id
    where s.id = grades.subject_id and u.auth_id = auth.uid()
  )
);

-- Notifications: semua user login boleh baca (dipakai bell icon di Header),
-- tapi hanya developer yang boleh membuat/menghapus (dipakai NotificationsCenter).
create policy "read_notifications_authenticated" on notifications for select using (
  auth.role() = 'authenticated'
);
create policy "developer_write_notifications" on notifications for insert with check (
  current_role_name() = 'developer'
);
create policy "developer_update_notifications" on notifications for update using (
  current_role_name() = 'developer'
);
create policy "developer_delete_notifications" on notifications for delete using (
  current_role_name() = 'developer'
);

-- notification_reads: setiap user hanya boleh menandai baris miliknya sendiri
-- sebagai "sudah dibaca" (insert/select terbatas pada user_id = diri sendiri).
create policy "read_own_notification_reads" on notification_reads for select using (
  exists (select 1 from users u where u.id = notification_reads.user_id and u.auth_id = auth.uid())
);
create policy "insert_own_notification_reads" on notification_reads for insert with check (
  exists (select 1 from users u where u.id = notification_reads.user_id and u.auth_id = auth.uid())
);

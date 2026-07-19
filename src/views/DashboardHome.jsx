import React, { useEffect, useState } from 'react';
import { DashboardCard } from '../components/DashboardCard';
import { supabase } from '../lib/supabaseClient';

// TODO(supabase): ganti mock di bawah dengan query agregat, contoh:
// const { count: totalStudents } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true);
// const { data: today } = await supabase.from('attendance').select('status').eq('attendance_date', new Date().toISOString().slice(0,10));

export function DashboardHome() {
  const [stats, setStats] = useState({
    totalStudents: 36,
    presentToday: 34,
    activeAssignments: 2,
    monthlyAttendancePct: 94.4,
  });
  const [todaySubjects, setTodaySubjects] = useState([
    { name: 'Pemrograman Web', teacher: 'Bu Ratna', time: '07:00 - 08:30' },
    { name: 'Basis Data', teacher: 'Pak Yusuf', time: '08:30 - 10:00' },
  ]);

  useEffect(() => {
    // contoh pemanggilan nyata (nonaktif sampai tabel terisi):
    // supabase.from('subjects').select('subject_name, teacher_name').then(({ data }) => { ... });
  }, []);

  return (
    <div className="space-y-[18px]">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[18px]">
        <DashboardCard label="Total Siswa" value={stats.totalStudents} />
        <DashboardCard
          label="Hadir Hari Ini"
          value={stats.presentToday}
          suffix={`/ ${stats.totalStudents}`}
        />
        <DashboardCard label="Kurikulum Kelas" value={String(stats.activeAssignments).padStart(2, '0')} accent="text-primary" />
        <DashboardCard label="Persentase Kehadiran per-Bulan" value={`${stats.monthlyAttendancePct}%`} />
      </div>

      <div className="bg-tertiary text-on-surface border border-border rounded-xl p-[24px]">
        <h3 className="text-on-surface-muted font-sans text-xs uppercase tracking-[0.14em] font-semibold mb-4">
          Mata Pelajaran Hari Ini
        </h3>
        <div className="space-y-3">
          {todaySubjects.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between border-b border-border last:border-0 pb-3 last:pb-0"
            >
              <div>
                <p className="font-semibold text-secondary text-sm">{s.name}</p>
                <p className="text-xs text-on-surface-muted">{s.teacher}</p>
              </div>
              <span className="text-xs text-on-surface-muted font-mono">{s.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { DashboardCard } from '../components/DashboardCard';
import { supabase } from '../lib/supabaseClient';

export function DashboardHome() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    monthlyAttendancePct: 0,
  });
  const [todaySubjects, setTodaySubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError('');

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const monthStart = `${todayStr.slice(0, 7)}-01`;

    const [
      { count: totalStudents, error: studentsErr },
      { data: todayAttendance, error: todayErr },
      { data: monthAttendance, error: monthErr },
      { data: subjectsToday, error: subjectsErr },
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('attendance').select('status').eq('attendance_date', todayStr),
      supabase.from('attendance').select('status').gte('attendance_date', monthStart).lte('attendance_date', todayStr),
      supabase
        .from('subjects')
        .select('subject_name, teacher_name, duration_minutes')
        .eq('day_of_week', today.getDay()),
    ]);

    const firstError = studentsErr || todayErr || monthErr || subjectsErr;
    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    const presentToday = (todayAttendance ?? []).filter((r) => r.status === 'hadir').length;
    const monthTotal = (monthAttendance ?? []).length;
    const monthPresent = (monthAttendance ?? []).filter((r) => r.status === 'hadir').length;
    const monthlyAttendancePct = monthTotal === 0 ? 0 : ((monthPresent / monthTotal) * 100).toFixed(1);

    setStats({ totalStudents: totalStudents ?? 0, presentToday, monthlyAttendancePct });
    setTodaySubjects(subjectsToday ?? []);
    setLoading(false);
  }

  if (loading) {
    return <div className="text-on-surface-muted text-sm">Memuat ringkasan dashboard...</div>;
  }

  return (
    <div className="space-y-[18px]">
      {error && <p className="text-primary text-xs font-semibold">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
        <DashboardCard label="Total Siswa" value={stats.totalStudents} />
        <DashboardCard
          label="Hadir Hari Ini"
          value={stats.presentToday}
          suffix={`/ ${stats.totalStudents}`}
        />
        <DashboardCard label="Persentase Kehadiran Bulan Ini" value={`${stats.monthlyAttendancePct}%`} />
      </div>

      <div className="bg-tertiary text-on-surface border border-border rounded-xl p-[24px]">
        <h3 className="text-on-surface-muted font-sans text-xs uppercase tracking-[0.14em] font-semibold mb-4">
          Mata Pelajaran Hari Ini
        </h3>
        {todaySubjects.length === 0 ? (
          <p className="text-xs text-on-surface-muted">
            Tidak ada mata pelajaran terjadwal hari ini (atur hari di menu Mata Pelajaran).
          </p>
        ) : (
          <div className="space-y-3">
            {todaySubjects.map((s) => (
              <div
                key={s.subject_name}
                className="flex items-center justify-between border-b border-border last:border-0 pb-3 last:pb-0"
              >
                <div>
                  <p className="font-semibold text-secondary text-sm">{s.subject_name}</p>
                  <p className="text-xs text-on-surface-muted">{s.teacher_name}</p>
                </div>
                <span className="text-xs text-on-surface-muted font-mono">{s.duration_minutes} menit</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

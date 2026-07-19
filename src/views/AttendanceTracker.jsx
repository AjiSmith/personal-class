import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

const STATUS_OPTIONS = [
  { key: 'hadir', label: 'Hadir' },
  { key: 'izin', label: 'Izin' },
  { key: 'sakit', label: 'Sakit' },
  { key: 'alfa', label: 'Alfa' },
];

const STATUS_STYLE = {
  hadir: 'bg-primary text-secondary',
  izin: 'bg-surface-2 text-secondary border border-border',
  sakit: 'bg-surface-2 text-secondary border border-border',
  alfa: 'bg-surface-2 text-secondary border border-border',
};

export function AttendanceTracker() {
  const { profile } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({}); // { studentId: status }
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    loadAttendanceForDate(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, students.length]);

  async function loadStudents() {
    const { data, error } = await supabase
      .from('students')
      .select('id, absent_no, full_name')
      .eq('is_active', true)
      .order('absent_no', { ascending: true });
    if (error) setError(error.message);
    else setStudents(data ?? []);
    setLoading(false);
  }

  async function loadAttendanceForDate(selectedDate) {
    const { data, error } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('attendance_date', selectedDate);
    if (error) return setError(error.message);
    const map = {};
    (data ?? []).forEach((row) => {
      map[row.student_id] = row.status;
    });
    setStatusMap(map);
  }

  async function setStatus(studentId, status) {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }));
    setSavingId(studentId);

    const { error } = await supabase.from('attendance').upsert(
      { student_id: studentId, attendance_date: date, status, recorded_by: profile?.id },
      { onConflict: 'student_id,attendance_date' }
    );
    if (error) setError(error.message);

    setTimeout(() => setSavingId(null), 400);
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-primary text-xs font-semibold">{error}</p>}
      <div className="flex items-center gap-3">
        <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em] font-semibold">
          Tanggal
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md px-3 py-2 text-secondary text-sm"
        />
      </div>

      <div className="bg-tertiary border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-on-surface-muted text-xs uppercase tracking-[0.1em] border-b border-border">
              <th className="text-left font-semibold px-4 py-3">No.</th>
              <th className="text-left font-semibold px-4 py-3">Nama Siswa</th>
              <th className="text-left font-semibold px-4 py-3">Status Kehadiran</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-on-surface-muted">
                  Memuat data siswa...
                </td>
              </tr>
            )}
            {!loading && students.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-on-surface-muted">{s.absent_no}</td>
                <td className="px-4 py-3 text-secondary font-medium">{s.full_name}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((opt) => {
                      const active = statusMap[s.id] === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => setStatus(s.id, opt.key)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-[0.06em] transition-opacity ${
                            active ? STATUS_STYLE[opt.key] : 'bg-surface-2 text-on-surface-muted'
                          } ${savingId === s.id ? 'opacity-60' : ''}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-on-surface-muted">
        Perubahan status tersimpan otomatis ke basis data setiap kali tombol ditekan.
      </p>
    </div>
  );
}

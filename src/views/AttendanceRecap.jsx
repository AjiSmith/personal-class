import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';

export function AttendanceRecap() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [recap, setRecap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRecap(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  async function loadRecap(selectedMonth) {
    setLoading(true);
    setError('');

    const startDate = `${selectedMonth}-01`;
    const [year, m] = selectedMonth.split('-').map(Number);
    const endDate = new Date(year, m, 0).toISOString().slice(0, 10); // hari terakhir bulan itu

    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, absent_no, full_name')
      .eq('is_active', true)
      .order('absent_no', { ascending: true });
    if (studentsError) {
      setError(studentsError.message);
      setLoading(false);
      return;
    }

    const { data: attendanceRows, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, status')
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate);
    if (attendanceError) {
      setError(attendanceError.message);
      setLoading(false);
      return;
    }

    // Agregasi di client: hitung total tiap status per siswa.
    const counts = {};
    (attendanceRows ?? []).forEach((row) => {
      counts[row.student_id] ??= { hadir: 0, izin: 0, sakit: 0, alfa: 0 };
      counts[row.student_id][row.status] += 1;
    });

    const rows = (students ?? []).map((s) => ({
      absent_no: s.absent_no,
      full_name: s.full_name,
      hadir: counts[s.id]?.hadir ?? 0,
      izin: counts[s.id]?.izin ?? 0,
      sakit: counts[s.id]?.sakit ?? 0,
      alfa: counts[s.id]?.alfa ?? 0,
    }));

    setRecap(rows);
    setLoading(false);
  }

  function pctFor(row) {
    const total = row.hadir + row.izin + row.sakit + row.alfa;
    return total === 0 ? 0 : ((row.hadir / total) * 100).toFixed(1);
  }

  function exportToExcel() {
    const rows = recap.map((r) => ({
      'No. Absen': r.absent_no,
      Nama: r.full_name,
      'Total Hadir': r.hadir,
      'Total Izin': r.izin,
      'Total Sakit': r.sakit,
      'Total Alfa': r.alfa,
      'Persentase Kehadiran (%)': pctFor(r),
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Absensi');
    XLSX.writeFile(workbook, `Rekap-Absensi-${month}.xlsx`);
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-primary text-xs font-semibold">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em] font-semibold">
            Bulan
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md px-3 py-2 text-secondary text-sm"
          />
        </div>
        <button
          onClick={exportToExcel}
          disabled={recap.length === 0}
          className="flex items-center gap-2 bg-primary hover:bg-primary-90 text-secondary font-bold text-xs tracking-[0.1em] rounded-full px-5 py-2.5 disabled:opacity-50"
        >
          <Download size={14} /> EXPORT EXCEL
        </button>
      </div>

      <div className="bg-tertiary border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-on-surface-muted text-xs uppercase tracking-[0.1em] border-b border-border">
              <th className="text-left font-semibold px-4 py-3">No.</th>
              <th className="text-left font-semibold px-4 py-3">Nama</th>
              <th className="text-center font-semibold px-4 py-3">Hadir</th>
              <th className="text-center font-semibold px-4 py-3">Izin</th>
              <th className="text-center font-semibold px-4 py-3">Sakit</th>
              <th className="text-center font-semibold px-4 py-3">Alfa</th>
              <th className="text-right font-semibold px-4 py-3">% Kehadiran</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-on-surface-muted">
                  Menghitung rekap...
                </td>
              </tr>
            )}
            {!loading && recap.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-on-surface-muted">
                  Tidak ada data absensi bulan ini.
                </td>
              </tr>
            )}
            {!loading && recap.map((r) => (
              <tr key={r.absent_no} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-on-surface-muted">{r.absent_no}</td>
                <td className="px-4 py-3 text-secondary font-medium">{r.full_name}</td>
                <td className="px-4 py-3 text-center text-on-surface-muted">{r.hadir}</td>
                <td className="px-4 py-3 text-center text-on-surface-muted">{r.izin}</td>
                <td className="px-4 py-3 text-center text-on-surface-muted">{r.sakit}</td>
                <td className="px-4 py-3 text-center text-on-surface-muted">{r.alfa}</td>
                <td className="px-4 py-3 text-right font-semibold text-secondary">{pctFor(r)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

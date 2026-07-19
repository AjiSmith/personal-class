import React, { useState } from 'react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

// TODO(supabase): hitung rekap dengan query agregat per siswa dalam rentang
// bulan terpilih, contoh (pseudo):
// select student_id, count(*) filter (where status='hadir') as total_hadir, ...
// from attendance where attendance_date >= :start and attendance_date <= :end
// group by student_id;

export function AttendanceRecap() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [recap] = useState([
    { absent_no: 1, full_name: 'Ahmad Fauzan', hadir: 18, izin: 1, sakit: 0, alfa: 1 },
    { absent_no: 2, full_name: 'Siti Aisyah', hadir: 19, izin: 0, sakit: 1, alfa: 0 },
  ]);

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
          className="flex items-center gap-2 bg-primary hover:bg-primary-90 text-secondary font-bold text-xs tracking-[0.1em] rounded-full px-5 py-2.5"
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
            {recap.map((r) => (
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

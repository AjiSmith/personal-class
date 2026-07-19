import React, { useMemo, useState } from 'react';

// TODO(supabase): upsert ke tabel `class_funds` (student_id, period, amount)
// setiap kali input di-blur / berubah, mirip pola AttendanceTracker.

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
}

export function ClassFunds() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState([
    { id: '1', absent_no: 1, full_name: 'Ahmad Fauzan', amount: 20000 },
    { id: '2', absent_no: 2, full_name: 'Siti Aisyah', amount: 15000 },
  ]);

  const total = useMemo(() => rows.reduce((sum, r) => sum + Number(r.amount || 0), 0), [rows]);

  function updateAmount(id, value) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, amount: value } : r)));
    // TODO(supabase): await supabase.from('class_funds').upsert({ student_id: id, period: `${period}-01`, amount: value }, { onConflict: 'student_id,period' });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="bg-tertiary border border-border rounded-xl px-6 py-4">
          <p className="text-xs text-on-surface-muted uppercase tracking-[0.14em] font-semibold">
            Total Kas Kelas
          </p>
          <p className="text-2xl font-bold text-primary mt-1">{formatRupiah(total)}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em] font-semibold">
            Periode
          </label>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-md px-3 py-2 text-secondary text-sm"
          />
        </div>
      </div>

      <div className="bg-tertiary border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-on-surface-muted text-xs uppercase tracking-[0.1em] border-b border-border">
              <th className="text-left font-semibold px-4 py-3">Absen</th>
              <th className="text-left font-semibold px-4 py-3">Nama</th>
              <th className="text-right font-semibold px-4 py-3">Jumlah (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-on-surface-muted">{r.absent_no}</td>
                <td className="px-4 py-3 text-secondary font-medium">{r.full_name}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={r.amount}
                    onChange={(e) => updateAmount(r.id, e.target.value)}
                    className="w-full text-right rounded-md px-3 py-1.5 text-secondary"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-on-surface-muted">
        Nominal tersimpan otomatis ke basis data saat nilai diubah.
      </p>
    </div>
  );
}

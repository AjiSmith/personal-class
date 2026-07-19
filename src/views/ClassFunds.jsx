import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
}

export function ClassFunds() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFunds(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  async function loadFunds(selectedPeriod) {
    setLoading(true);
    setError('');
    const periodDate = `${selectedPeriod}-01`;

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

    const { data: funds, error: fundsError } = await supabase
      .from('class_funds')
      .select('student_id, amount')
      .eq('period', periodDate);
    if (fundsError) {
      setError(fundsError.message);
      setLoading(false);
      return;
    }

    const amountByStudent = {};
    (funds ?? []).forEach((f) => {
      amountByStudent[f.student_id] = f.amount;
    });

    setRows(
      (students ?? []).map((s) => ({
        id: s.id,
        absent_no: s.absent_no,
        full_name: s.full_name,
        amount: amountByStudent[s.id] ?? 0,
      }))
    );
    setLoading(false);
  }

  const total = useMemo(() => rows.reduce((sum, r) => sum + Number(r.amount || 0), 0), [rows]);

  async function updateAmount(id, value) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, amount: value } : r)));
    const periodDate = `${period}-01`;
    const { error } = await supabase
      .from('class_funds')
      .upsert({ student_id: id, period: periodDate, amount: Number(value) || 0 }, { onConflict: 'student_id,period' });
    if (error) setError(error.message);
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-primary text-xs font-semibold">{error}</p>}
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
              <th className="text-left font-semibold px-4 py-3">No. Absen</th>
              <th className="text-left font-semibold px-4 py-3">Nama</th>
              <th className="text-right font-semibold px-4 py-3">Jumlah (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-on-surface-muted">
                  Memuat data kas kelas...
                </td>
              </tr>
            )}
            {!loading && rows.map((r) => (
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

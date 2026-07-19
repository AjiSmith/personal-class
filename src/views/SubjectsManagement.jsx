import React, { useEffect, useState } from 'react';
import { Plus, Pencil, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const emptyForm = { subject_name: '', teacher_name: '', duration_minutes: 45, day_of_week: '' };

const DAYS = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
  { value: 0, label: 'Minggu' },
];

export function SubjectsManagement() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('subject_name', { ascending: true });
    if (error) setError(error.message);
    else setSubjects(data ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(subject) {
    setEditingId(subject.id);
    setForm({
      subject_name: subject.subject_name,
      teacher_name: subject.teacher_name,
      duration_minutes: subject.duration_minutes,
      day_of_week: subject.day_of_week ?? '',
    });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    const payload = { ...form, day_of_week: form.day_of_week === '' ? null : Number(form.day_of_week) };
    if (editingId) {
      const { error } = await supabase.from('subjects').update(payload).eq('id', editingId);
      if (error) return setError(error.message);
      setSubjects((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...payload } : s)));
    } else {
      const { data, error } = await supabase.from('subjects').insert(payload).select().single();
      if (error) return setError(error.message);
      setSubjects((prev) => [...prev, data]);
    }
    setError('');
    setModalOpen(false);
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-primary text-xs font-semibold">{error}</p>}
      <div className="flex justify-end">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary hover:bg-primary-90 text-secondary font-bold text-xs tracking-[0.1em] rounded-full px-5 py-2.5"
        >
          <Plus size={14} /> TAMBAH MATA PELAJARAN
        </button>
      </div>

      <div className="bg-tertiary border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-on-surface-muted text-xs uppercase tracking-[0.1em] border-b border-border">
              <th className="text-left font-semibold px-4 py-3">Mata Pelajaran</th>
              <th className="text-left font-semibold px-4 py-3">Guru Pengampu</th>
              <th className="text-left font-semibold px-4 py-3">Hari</th>
              <th className="text-left font-semibold px-4 py-3">Durasi (menit)</th>
              <th className="text-right font-semibold px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-on-surface-muted">
                  Memuat mata pelajaran...
                </td>
              </tr>
            )}
            {!loading && subjects.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-on-surface-muted">
                  Belum ada mata pelajaran.
                </td>
              </tr>
            )}
            {subjects.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-secondary font-medium">{s.subject_name}</td>
                <td className="px-4 py-3 text-on-surface-muted">{s.teacher_name}</td>
                <td className="px-4 py-3 text-on-surface-muted">
                  {DAYS.find((d) => d.value === s.day_of_week)?.label ?? '-'}
                </td>
                <td className="px-4 py-3 text-on-surface-muted">{s.duration_minutes}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(s)} className="p-1.5 hover:text-primary text-on-surface-muted">
                    <Pencil size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-neutral/80 backdrop-blur-xs z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-tertiary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-secondary">
                {editingId ? 'Ubah Mata Pelajaran' : 'Tambah Mata Pelajaran'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-on-surface-muted hover:text-secondary">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em]">Nama Mata Pelajaran</label>
                <input
                  required
                  value={form.subject_name}
                  onChange={(e) => setForm({ ...form, subject_name: e.target.value })}
                  className="mt-1 w-full rounded-md px-3 py-2 text-secondary"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em]">Nama Guru</label>
                <input
                  required
                  value={form.teacher_name}
                  onChange={(e) => setForm({ ...form, teacher_name: e.target.value })}
                  className="mt-1 w-full rounded-md px-3 py-2 text-secondary"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em]">Durasi Kelas (menit)</label>
                <input
                  type="number"
                  required
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md px-3 py-2 text-secondary"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em]">Hari</label>
                <select
                  value={form.day_of_week}
                  onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                  className="mt-1 w-full rounded-md px-3 py-2 text-secondary"
                >
                  <option value="">- Pilih Hari -</option>
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-90 text-secondary font-bold text-xs tracking-[0.1em] rounded-full py-2.5 mt-2"
              >
                SIMPAN
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

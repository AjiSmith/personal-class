import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const emptyForm = { absent_no: '', full_name: '', gender: 'L' };

export function StudentsList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('absent_no', { ascending: true });
    if (error) setError(error.message);
    else setStudents(data ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(student) {
    setEditingId(student.id);
    setForm({ absent_no: student.absent_no, full_name: student.full_name, gender: student.gender });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    const payload = { ...form, absent_no: Number(form.absent_no) };

    if (editingId) {
      const { error } = await supabase.from('students').update(payload).eq('id', editingId);
      if (error) return setError(error.message);
      setStudents((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...payload } : s)));
    } else {
      const { data, error } = await supabase.from('students').insert(payload).select().single();
      if (error) return setError(error.message);
      setStudents((prev) => [...prev, data]);
    }
    setError('');
    setModalOpen(false);
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) return setError(error.message);
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-primary text-xs font-semibold">{error}</p>}
      <div className="flex justify-end">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary hover:bg-primary-90 text-secondary font-bold text-xs tracking-[0.1em] rounded-full px-5 py-2.5 transition-colors"
        >
          <Plus size={14} /> TAMBAH SISWA
        </button>
      </div>

      <div className="bg-tertiary border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-on-surface-muted text-xs uppercase tracking-[0.1em] border-b border-border">
              <th className="text-left font-semibold px-4 py-3">No. Absen</th>
              <th className="text-left font-semibold px-4 py-3">Nama Siswa</th>
              <th className="text-left font-semibold px-4 py-3">Gender</th>
              <th className="text-right font-semibold px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-on-surface-muted">
                  Memuat data siswa...
                </td>
              </tr>
            )}
            {!loading && students.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-on-surface-muted">
                  Belum ada data siswa.
                </td>
              </tr>
            )}
            {students.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-on-surface-muted">{s.absent_no}</td>
                <td className="px-4 py-3 text-secondary font-medium">{s.full_name}</td>
                <td className="px-4 py-3 text-on-surface-muted">{s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(s)} className="p-1.5 hover:text-primary text-on-surface-muted">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:text-primary text-on-surface-muted">
                      <Trash2 size={14} />
                    </button>
                  </div>
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
              <h3 className="font-semibold text-secondary">{editingId ? 'Ubah Data Siswa' : 'Tambah Siswa'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-on-surface-muted hover:text-secondary">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em]">No. Absen</label>
                <input
                  type="number"
                  required
                  value={form.absent_no}
                  onChange={(e) => setForm({ ...form, absent_no: e.target.value })}
                  className="mt-1 w-full rounded-md px-3 py-2 text-secondary"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em]">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="mt-1 w-full rounded-md px-3 py-2 text-secondary"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em]">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="mt-1 w-full rounded-md px-3 py-2 text-secondary"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
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

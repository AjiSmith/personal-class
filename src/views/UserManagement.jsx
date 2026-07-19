import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Password TIDAK disimpan/ditampilkan di tabel `users` (lihat supabase/schema.sql
// - memang tidak ada kolomnya). Membuat & menghapus akun login dikerjakan lewat
// Edge Function (supabase/functions/create-user, delete-user) karena butuh
// SUPABASE_SERVICE_ROLE_KEY yang tidak boleh berada di kode frontend.

const emptyForm = { username: '', full_name: '', role: 'secretary', password: '' };

export function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, role')
      .order('full_name', { ascending: true });
    if (error) setError(error.message);
    else setUsers(data ?? []);
    setLoading(false);
  }

  function openAdd() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const { error: invokeError } = await supabase.functions.invoke('create-user', {
      body: form,
    });

    setSubmitting(false);
    if (invokeError) {
      setError(invokeError.message);
      return;
    }
    setModalOpen(false);
    loadUsers();
  }

  async function handleDelete(id) {
    setError('');
    const { error: invokeError } = await supabase.functions.invoke('delete-user', {
      body: { user_id: id },
    });
    if (invokeError) {
      setError(invokeError.message);
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-primary text-xs font-semibold">{error}</p>}
      <div className="flex justify-end">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary hover:bg-primary-90 text-secondary font-bold text-xs tracking-[0.1em] rounded-full px-5 py-2.5"
        >
          <Plus size={14} /> TAMBAH PENGGUNA
        </button>
      </div>

      <div className="bg-tertiary border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-on-surface-muted text-xs uppercase tracking-[0.1em] border-b border-border">
              <th className="text-left font-semibold px-4 py-3">Nama</th>
              <th className="text-left font-semibold px-4 py-3">Username</th>
              <th className="text-left font-semibold px-4 py-3">Role</th>
              <th className="text-right font-semibold px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-on-surface-muted">
                  Memuat pengguna...
                </td>
              </tr>
            )}
            {!loading && users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-secondary font-medium">{u.full_name}</td>
                <td className="px-4 py-3 text-on-surface-muted">{u.username}</td>
                <td className="px-4 py-3 text-on-surface-muted capitalize">{u.role}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(u.id)} className="p-1.5 hover:text-primary text-on-surface-muted">
                    <Trash2 size={14} />
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
              <h3 className="font-semibold text-secondary">Tambah Pengguna</h3>
              <button onClick={() => setModalOpen(false)} className="text-on-surface-muted hover:text-secondary">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em]">Nama Lengkap</label>
                <input
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="mt-1 w-full rounded-md px-3 py-2 text-secondary"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em]">Username</label>
                <input
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="mt-1 w-full rounded-md px-3 py-2 text-secondary"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em]">Password Awal</label>
                <input
                  type="text"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="mt-1 w-full rounded-md px-3 py-2 text-secondary"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em]">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="mt-1 w-full rounded-md px-3 py-2 text-secondary"
                >
                  <option value="developer">Developer</option>
                  <option value="secretary">Sekretaris</option>
                  <option value="teacher">Guru</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary-90 text-secondary font-bold text-xs tracking-[0.1em] rounded-full py-2.5 mt-2 disabled:opacity-50"
              >
                {submitting ? 'MEMBUAT...' : 'BUAT AKUN'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

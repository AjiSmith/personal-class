import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, X } from 'lucide-react';

// TODO(supabase): membuat user baru butuh 2 langkah:
// 1) supabase.auth.admin.createUser({ email: `${username}@valrise.local`, password }) - JALANKAN DARI SERVER/EDGE FUNCTION,
//    jangan expose service_role key di frontend.
// 2) insert baris ke tabel `users` (auth_id, username, full_name, role).
// Password asli tidak pernah disimpan sebagai teks-biasa; tombol show/hide di
// bawah hanya untuk password sementara yang di-set ulang oleh developer.

const emptyForm = { username: '', full_name: '', role: 'secretary', password: '' };

export function UserManagement() {
  const [users, setUsers] = useState([
    { id: '1', username: 'wade', full_name: 'Wade', role: 'secretary', password: 'valrise123' },
    { id: '2', username: 'ratna', full_name: 'Bu Ratna', role: 'teacher', password: 'guruweb2026' },
  ]);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(u) {
    setEditingId(u.id);
    setForm({ ...u, password: '' });
    setModalOpen(true);
  }

  function handleSave(e) {
    e.preventDefault();
    if (editingId) {
      setUsers((prev) => prev.map((u) => (u.id === editingId ? { ...u, ...form, password: form.password || u.password } : u)));
    } else {
      setUsers((prev) => [...prev, { id: crypto.randomUUID(), ...form }]);
    }
    setModalOpen(false);
  }

  function handleDelete(id) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  function toggleVisibility(id) {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-4">
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
              <th className="text-left font-semibold px-4 py-3">Username</th>
              <th className="text-left font-semibold px-4 py-3">Password</th>
              <th className="text-left font-semibold px-4 py-3">Role</th>
              <th className="text-right font-semibold px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-secondary font-medium">{u.username}</td>
                <td className="px-4 py-3 text-on-surface-muted font-mono">
                  <div className="flex items-center gap-2">
                    <span>{visiblePasswords[u.id] ? u.password : '••••••••'}</span>
                    <button onClick={() => toggleVisibility(u.id)} className="hover:text-primary">
                      {visiblePasswords[u.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-on-surface-muted capitalize">{u.role}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(u)} className="p-1.5 hover:text-primary text-on-surface-muted">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="p-1.5 hover:text-primary text-on-surface-muted">
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
              <h3 className="font-semibold text-secondary">{editingId ? 'Ubah Pengguna' : 'Tambah Pengguna'}</h3>
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
                <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em]">
                  Password {editingId && '(kosongkan jika tidak diubah)'}
                </label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="mt-1 w-full rounded-md px-3 py-2 text-secondary"
                  required={!editingId}
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

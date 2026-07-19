import React, { useEffect, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

// RLS di supabase/schema.sql (`developer_write_notifications`) sudah membatasi
// insert/update/delete hanya untuk role developer - kalau ada yang memanggil
// endpoint ini lewat cara lain, database tetap menolaknya.

export function NotificationsCenter() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', message: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) setError(error.message);
    else setNotifications(data ?? []);
    setLoading(false);
  }

  async function handleSend(e) {
    e.preventDefault();
    setSending(true);
    setError('');

    const { data, error } = await supabase
      .from('notifications')
      .insert({ title: form.title, message: form.message, created_by: profile?.id })
      .select()
      .single();

    setSending(false);
    if (error) return setError(error.message);
    setNotifications((prev) => [data, ...prev]);
    setForm({ title: '', message: '' });
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) return setError(error.message);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-primary text-xs font-semibold">{error}</p>}
      <div className="bg-tertiary border border-border rounded-xl p-6">
        <h3 className="text-on-surface-muted font-sans text-xs uppercase tracking-[0.14em] font-semibold mb-4">
          Buat Notifikasi Baru
        </h3>
        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em]">Judul</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-md px-3 py-2 text-secondary"
              placeholder="Contoh: Jadwal UTS Diperbarui"
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em]">Pesan</label>
            <textarea
              required
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="mt-1 w-full rounded-md px-3 py-2 text-secondary resize-none"
              placeholder="Isi pesan notifikasi untuk seluruh pengguna..."
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="flex items-center gap-2 bg-primary hover:bg-primary-90 text-secondary font-bold text-xs tracking-[0.1em] rounded-full px-5 py-2.5 disabled:opacity-50"
          >
            <Send size={14} /> {sending ? 'MENGIRIM...' : 'KIRIM KE SEMUA PENGGUNA'}
          </button>
        </form>
      </div>

      <div className="bg-tertiary border border-border rounded-xl overflow-hidden">
        <h3 className="text-on-surface-muted font-sans text-xs uppercase tracking-[0.14em] font-semibold px-6 pt-6">
          Riwayat Notifikasi
        </h3>
        <div className="divide-y divide-border mt-3">
          {loading && <p className="text-xs text-on-surface-muted px-6 py-4">Memuat riwayat...</p>}
          {!loading && notifications.length === 0 && (
            <p className="text-xs text-on-surface-muted px-6 py-4">Belum ada notifikasi terkirim.</p>
          )}
          {notifications.map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-3 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-secondary">{n.title}</p>
                <p className="text-xs text-on-surface-muted mt-1">{n.message}</p>
                <p className="text-[10px] text-on-surface-muted mt-1 font-mono">
                  {new Date(n.created_at).toLocaleString('id-ID')}
                </p>
              </div>
              <button onClick={() => handleDelete(n.id)} className="p-1.5 hover:text-primary text-on-surface-muted shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

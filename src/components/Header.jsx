import React, { useEffect, useState } from 'react';
import { Menu, Bell, UserCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { MOCK_NOTIFICATIONS } from '../lib/mockNotifications';

const ROLE_LABEL = {
  developer: 'Developer',
  secretary: 'Sekretaris',
  teacher: 'Guru Mata Pelajaran',
};

const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
const SUPABASE_READY = isSupabaseConfigured();

export function Header({ title, onOpenMobileMenu }) {
  const { profile } = useAuth();
  const [showAlerts, setShowAlerts] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());

  useEffect(() => {
    if (!profile) return;

    if (USE_MOCK_AUTH || !SUPABASE_READY) {
      setNotifications(MOCK_NOTIFICATIONS);
      return;
    }

    // Ambil 20 notifikasi terbaru + baris `notification_reads` milik user ini,
    // agar unread count akurat per-user (lihat supabase/schema.sql).
    async function load() {
      const { data: notifs } = await supabase
        .from('notifications')
        .select('id, title, message, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifications(notifs ?? []);

      const { data: reads } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', profile.id);
      setReadIds(new Set((reads ?? []).map((r) => r.notification_id)));
    }
    load();
  }, [profile]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  async function handleOpen() {
    setShowAlerts((v) => !v);
    if (USE_MOCK_AUTH || !profile) return;

    if (!supabase) return;

    // Tandai semua notifikasi yang terlihat sebagai sudah dibaca.
    const unread = notifications.filter((n) => !readIds.has(n.id));
    if (unread.length === 0) return;
    const rows = unread.map((n) => ({ notification_id: n.id, user_id: profile.id }));
    await supabase.from('notification_reads').upsert(rows, { onConflict: 'notification_id,user_id' });
    setReadIds((prev) => new Set([...prev, ...unread.map((n) => n.id)]));
  }

  return (
    <header className="h-20 bg-neutral border-b border-border sticky top-0 z-20 flex items-center justify-between px-4 md:px-[40px]">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 border border-border text-secondary rounded-md md:hidden bg-surface"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-[20px] font-sans font-semibold text-secondary hidden md:block">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-4 relative">
        <button onClick={handleOpen} className="relative p-2 text-on-surface-muted hover:text-primary transition-colors">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center rounded-full bg-primary text-[9px] font-bold text-secondary">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        {showAlerts && (
          <div className="absolute top-10 right-24 md:right-32 w-72 max-h-80 overflow-y-auto bg-tertiary border border-border rounded-lg p-3 shadow-lg space-y-2 z-30">
            {notifications.length === 0 ? (
              <p className="text-xs text-on-surface-muted">Belum ada notifikasi.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="border-b border-border last:border-0 pb-2 last:pb-0">
                  <p className="text-xs font-semibold text-secondary">{n.title}</p>
                  <p className="text-[11px] text-on-surface-muted mt-0.5">{n.message}</p>
                </div>
              ))
            )}
          </div>
        )}
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-3">
          <UserCircle size={24} className="text-primary" />
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-secondary font-sans">
              {profile?.full_name ?? 'Pengguna'}
            </p>
            <p className="text-[12px] text-on-surface-muted font-sans font-light">
              {ROLE_LABEL[profile?.role] ?? '-'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

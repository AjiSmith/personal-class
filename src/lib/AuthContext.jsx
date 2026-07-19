import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { MOCK_ACCOUNTS } from './mockAccounts';

// Role yang didukung sistem. Simpan juga sebagai CHECK constraint di kolom
// `role` pada tabel `users` (lihat supabase/schema.sql).
export const ROLES = {
  DEVELOPER: 'developer',   // akses penuh, kelola Subjects & seluruh sistem
  SECRETARY: 'secretary',   // kelola Absensi, Kas Kelas, Data Siswa
  TEACHER: 'teacher',       // input nilai untuk mata pelajaran yang diampu
};

// Set VITE_USE_MOCK_AUTH=true di .env untuk login pakai akun lokal
// (src/lib/mockAccounts.js) tanpa perlu Supabase sudah tersambung sama sekali.
// Berguna untuk mengetes UI & RBAC lebih dulu. JANGAN nyalakan ini di build
// production.
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // baris dari tabel `users` (role, nama, dsb.)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (USE_MOCK_AUTH) {
      // Mode mock: tidak ada sesi tersimpan antar refresh, murni untuk testing.
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, role')
      .eq('auth_id', userId)
      .single();
    if (!error) setProfile(data);
    setLoading(false);
  }

  async function signIn(username, password) {
    if (USE_MOCK_AUTH) {
      const account = MOCK_ACCOUNTS.find(
        (a) => a.username === username && a.password === password
      );
      if (!account) {
        return { data: null, error: { message: 'Invalid mock credentials' } };
      }
      // Sesi & profile palsu, cukup untuk melewati Gate di App.jsx.
      setSession({ user: { id: account.id } });
      setProfile({
        id: account.id,
        username: account.username,
        full_name: account.full_name,
        role: account.role,
      });
      return { data: { user: { id: account.id } }, error: null };
    }

    // Login berbasis username: kita mapping username -> email pseudo di Supabase Auth
    // (mis. `${username}@valrise.local`) agar tetap bisa memakai Supabase Auth password-based.
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${username}@valrise.local`,
      password,
    });
    return { data, error };
  }

  async function signOut() {
    if (USE_MOCK_AUTH) {
      setSession(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
  }

  const value = { session, profile, loading, signIn, signOut, role: profile?.role };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Helper RBAC: dipakai untuk menyembunyikan menu / memblokir route.
// 'notifications.manage' sengaja HANYA ada di daftar developer ('*') -
// secretary & teacher tidak mendapat item ini sama sekali, sehingga menu
// "NOTIFIKASI" di sidebar otomatis tersembunyi untuk mereka.
export function can(role, permission) {
  const matrix = {
    [ROLES.DEVELOPER]: ['*'],
    [ROLES.SECRETARY]: [
      'students.manage',
      'attendance.manage',
      'classfunds.manage',
      'dashboard.view',
    ],
    [ROLES.TEACHER]: ['grades.manage.own', 'dashboard.view'],
  };
  const perms = matrix[role] || [];
  return perms.includes('*') || perms.includes(permission);
}

import { createClient } from '@supabase/supabase-js';

// Ambil dari file .env (lihat .env.example) - JANGAN hardcode key di sini.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const isMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

function hasValidSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) return false;

  const placeholders = ['YOUR-PROJECT-REF', 'YOUR-ANON-PUBLIC-KEY'];
  return !placeholders.some((placeholder) =>
    supabaseUrl.includes(placeholder) || supabaseAnonKey.includes(placeholder)
  );
}

const supabaseEnabled = hasValidSupabaseConfig();

if (!supabaseEnabled && !isMockAuth) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diset dengan benar. Aplikasi akan berjalan dalam mode aman untuk preview deployment.'
  );
}

export const supabase = supabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export function isSupabaseConfigured() {
  return Boolean(supabase);
}

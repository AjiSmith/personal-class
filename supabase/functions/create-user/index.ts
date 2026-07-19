// supabase/functions/create-user/index.ts
//
// Deploy dengan Supabase CLI:
//   supabase functions deploy create-user
//
// Fungsi ini berjalan di server Supabase (Deno), BUKAN di browser, sehingga
// aman memakai SUPABASE_SERVICE_ROLE_KEY - key ini tidak pernah boleh
// dikirim ke client. Hanya user dengan role 'developer' yang boleh
// memanggil fungsi ini (dicek manual di bawah, karena admin API tidak
// tunduk pada RLS).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
    }

    // Client dibuat dengan token pemanggil, untuk memverifikasi identitas & role-nya.
    const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: callerAuthUser }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerAuthUser) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
    }

    const { data: callerProfile } = await callerClient
      .from('users')
      .select('role')
      .eq('auth_id', callerAuthUser.id)
      .single();

    if (callerProfile?.role !== 'developer') {
      return new Response(JSON.stringify({ error: 'Forbidden: developer only' }), { status: 403 });
    }

    const { username, password, full_name, role } = await req.json();
    if (!username || !password || !full_name || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Client admin terpisah (service role) khusus untuk operasi yang butuh hak penuh.
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: `${username}@valrise.local`,
      password,
      email_confirm: true,
    });
    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400 });
    }

    const { data: profileRow, error: insertError } = await adminClient
      .from('users')
      .insert({ auth_id: created.user.id, username, full_name, role })
      .select()
      .single();
    if (insertError) {
      // Rollback auth user kalau insert profil gagal, supaya tidak ada akun "yatim".
      await adminClient.auth.admin.deleteUser(created.user.id);
      return new Response(JSON.stringify({ error: insertError.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ user: profileRow }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

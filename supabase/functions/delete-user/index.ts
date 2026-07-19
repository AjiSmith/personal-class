// supabase/functions/delete-user/index.ts
//
// Deploy: supabase functions deploy delete-user
// Menghapus baris `users` SAJA tidak akan menghapus akun login di
// Supabase Auth - fungsi ini menghapus keduanya sekaligus dengan benar,
// dan tetap membatasi pemanggilan hanya untuk role 'developer'.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
    }

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

    const { user_id } = await req.json(); // id baris di tabel `users` (bukan auth_id)
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400 });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: target, error: fetchError } = await adminClient
      .from('users')
      .select('auth_id')
      .eq('id', user_id)
      .single();
    if (fetchError || !target) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    await adminClient.from('users').delete().eq('id', user_id);
    if (target.auth_id) {
      await adminClient.auth.admin.deleteUser(target.auth_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

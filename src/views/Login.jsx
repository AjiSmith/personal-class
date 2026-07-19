import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export function Login() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error } = await signIn(username.trim(), password);
    setBusy(false);
    if (error) setError('Username atau password salah.');
  }

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-sm bg-tertiary border border-border rounded-xl p-8">
        <div className="text-center mb-8">
          <h1 className="font-monospace font-black text-3xl text-primary tracking-[0.08em]">
            LOG-IN
          </h1>
          <p className="text-[12px] text-on-surface-muted tracking-[0.14em] font-semibold mt-1">
            Masukkan username dan password untuk log-in.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-on-surface-muted uppercase tracking-[0.12em] font-semibold">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-md px-3 py-2 text-secondary"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-muted uppercase tracking-[0.12em] font-semibold">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md px-3 py-2 text-secondary"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="text-primary text-xs font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-90 text-secondary font-bold tracking-[0.1em] rounded-full py-3 transition-colors disabled:opacity-50"
          >
            <LogIn size={16} />
            {busy ? 'MEMPROSES...' : 'LOG-IN'}
          </button>
        </form>

        {import.meta.env.VITE_USE_MOCK_AUTH === 'true' && (
          <div className="mt-6 text-[11px] text-on-surface-muted border-t border-border pt-4 space-y-1">
            <p className="font-semibold uppercase tracking-[0.1em]">Mode Testing Aktif</p>
            <p>admin / admin123 — Developer</p>
            <p>sekretaris / sekretaris123 — Sekretaris</p>
            <p>guru / guru123 — Guru</p>
          </div>
        )}
      </div>
    </div>
  );
}

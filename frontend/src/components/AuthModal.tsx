import React, { useState } from 'react';
import { registerUser, loginUser } from '../services/api';
import type { User } from '../types';

interface Props {
  onSuccess: (token: string, user: User) => void;
  onClose: () => void;
}

export default function AuthModal({ onSuccess, onClose }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = mode === 'login'
        ? await loginUser({ email: form.email, password: form.password })
        : await registerUser({ username: form.username, email: form.email, password: form.password });
      onSuccess(result.token, result.user);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(4,7,14,0.85)' }} onClick={onClose}>
      <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}
        style={{ background: '#080F1C', border: '1px solid rgba(245,166,35,0.2)', boxShadow: '0 0 60px rgba(245,166,35,0.08), 0 24px 64px rgba(0,0,0,0.6)' }}>
        {/* Top gold line */}
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #F5A623 30%, #FFD166 50%, #F5A623 70%, transparent)' }} />

        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-5 text-wc-dim transition-colors hover:text-wc-text"
            aria-label="Close"
          >
            ✕
          </button>

          <div className="mb-6 text-center">
            <div className="mb-3 text-5xl">⚽</div>
            <h2 className="font-bold text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {mode === 'login' ? 'Bienvenido de vuelta' : 'Únete al juego'}
            </h2>
            <p className="mt-1 text-sm text-wc-muted">
              {mode === 'login' ? 'Inicia sesión para enviar tus pronósticos' : 'Crea una cuenta para empezar a predecir'}
            </p>
          </div>

          <div className="mb-6 flex rounded-xl p-1" style={{ background: '#04070E' }}>
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className="flex-1 rounded-lg py-2 text-sm font-bold transition-all"
                style={mode === m ? {
                  background: 'linear-gradient(135deg, #F5A623 0%, #E8920F 100%)',
                  color: '#04070E',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  boxShadow: '0 2px 12px rgba(245,166,35,0.3)',
                } : {
                  color: '#5B6E8C',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-wc-muted"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em' }}>Nombre de usuario</label>
                <input name="username" value={form.username} onChange={handleChange} placeholder="tu_usuario" required className="input" />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-wc-muted"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em' }}>Correo electrónico</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="vos@ejemplo.com" required className="input" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-wc-muted"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em' }}>Contraseña</label>
              <input
                type="password" name="password" value={form.password} onChange={handleChange}
                placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : '••••••••'}
                required minLength={mode === 'register' ? 8 : undefined}
                className="input"
              />
            </div>

            {error && (
              <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(240,62,62,0.08)', border: '1px solid rgba(240,62,62,0.25)', color: '#F03E3E' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-2 w-full py-2.5">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-wc-bg/30 border-t-wc-bg" />
                  {mode === 'login' ? 'Iniciando sesión…' : 'Creando cuenta…'}
                </span>
              ) : (
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.05rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { registerUser, loginUser, googleAuth } from '../services/api';
import type { User } from '../types';

interface Props {
  onSuccess: (token: string, user: User) => void;
  onClose: () => void;
}

export default function AuthModal({ onSuccess, onClose }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', code: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogleSuccess(credential: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await googleAuth(credential, mode === 'register' ? form.code : undefined);
      onSuccess(result.token, result.user);
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data?.error ?? 'Google sign-in failed';
      const field = data?.field;
      if (field) { setFieldErrors({ [field]: msg }); setError(null); }
      else { setError(msg); setFieldErrors({}); }
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: undefined }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = mode === 'login'
        ? await loginUser({ email: form.email, password: form.password })
        : await registerUser({ name: form.name, username: form.username, email: form.email, password: form.password, code: form.code });
      onSuccess(result.token, result.user);
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data?.error ?? 'Something went wrong';
      const field = data?.field;
      if (field) {
        setFieldErrors({ [field]: msg });
        setError(null);
      } else {
        setError(msg);
        setFieldErrors({});
      }
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
                onClick={() => { setMode(m); setError(null); setFieldErrors({}); }}
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
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em' }}>Nombre completo</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Tu nombre" required minLength={5} className="input"
                  style={fieldErrors.name ? { borderColor: 'rgba(240,62,62,0.7)', boxShadow: '0 0 0 2px rgba(240,62,62,0.15)' } : undefined} />
                {fieldErrors.name && <p className="mt-1 text-xs" style={{ color: '#F03E3E', fontFamily: 'Barlow Condensed, sans-serif' }}>⚠ {fieldErrors.name}</p>}
              </div>
            )}
            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-wc-muted"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em' }}>Nombre de usuario</label>
                <input name="username" value={form.username} onChange={handleChange} placeholder="tu_usuario" required className="input"
                  style={fieldErrors.username ? { borderColor: 'rgba(240,62,62,0.7)', boxShadow: '0 0 0 2px rgba(240,62,62,0.15)' } : undefined} />
                {fieldErrors.username && <p className="mt-1 text-xs" style={{ color: '#F03E3E', fontFamily: 'Barlow Condensed, sans-serif' }}>⚠ {fieldErrors.username}</p>}
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-wc-muted"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em' }}>Correo electrónico</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="vos@ejemplo.com" required className="input"
                style={fieldErrors.email ? { borderColor: 'rgba(240,62,62,0.7)', boxShadow: '0 0 0 2px rgba(240,62,62,0.15)' } : undefined} />
              {fieldErrors.email && <p className="mt-1 text-xs" style={{ color: '#F03E3E', fontFamily: 'Barlow Condensed, sans-serif' }}>⚠ {fieldErrors.email}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-wc-muted"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em' }}>Contraseña</label>
              <input
                type="password" name="password" value={form.password} onChange={handleChange}
                placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : '••••••••'}
                required minLength={mode === 'register' ? 8 : undefined}
                className="input"
                style={fieldErrors.password ? { borderColor: 'rgba(240,62,62,0.7)', boxShadow: '0 0 0 2px rgba(240,62,62,0.15)' } : undefined}
              />
              {fieldErrors.password && <p className="mt-1 text-xs" style={{ color: '#F03E3E', fontFamily: 'Barlow Condensed, sans-serif' }}>⚠ {fieldErrors.password}</p>}
            </div>

            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-wc-muted"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em' }}>Código de acceso</label>
                <input
                  name="code" value={form.code} onChange={handleChange}
                  placeholder="000000" required maxLength={6}
                  className="input"
                  style={{
                    letterSpacing: '0.3em',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    ...(fieldErrors.code ? { borderColor: 'rgba(240,62,62,0.7)', boxShadow: '0 0 0 2px rgba(240,62,62,0.15)' } : {}),
                  }}
                />
                {fieldErrors.code
                  ? <p className="mt-1 text-xs" style={{ color: '#F03E3E', fontFamily: 'Barlow Condensed, sans-serif' }}>⚠ {fieldErrors.code}</p>
                  : <p className="mt-1 text-xs text-wc-dim" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Ingresá el código de 6 dígitos que recibiste</p>
                }
              </div>
            )}

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

          {/* Google Sign-In */}
          <div className="mt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(245,166,35,0.15)' }} />
              <span className="text-xs text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>o continúa con</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(245,166,35,0.15)' }} />
            </div>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={(res) => { if (res.credential) handleGoogleSuccess(res.credential); }}
                onError={() => setError('Google sign-in was cancelled or failed')}
                theme="filled_black"
                shape="rectangular"
                width="368"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

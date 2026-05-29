import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/api';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const token     = params.get('token') ?? '';

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) { setError('El enlace es inválido. Solicita uno nuevo.'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirm)  { setError('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'El enlace es inválido o ya expiró. Solicita uno nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: '#04070E' }}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl"
        style={{ background: '#080F1C', border: '1px solid rgba(245,166,35,0.2)', boxShadow: '0 0 60px rgba(245,166,35,0.08), 0 24px 64px rgba(0,0,0,0.6)' }}>
        {/* Gold line */}
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #F5A623 30%, #FFD166 50%, #F5A623 70%, transparent)' }} />

        <div className="p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">✅</div>
              <h2 className="font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.8rem', color: '#00C87A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ¡Contraseña actualizada!
              </h2>
              <p className="text-sm text-wc-muted">Tu contraseña fue restablecida correctamente. Serás redirigido al inicio en unos segundos…</p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div className="text-3xl mb-3">🔐</div>
                <h2 className="font-bold text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Nueva contraseña
                </h2>
                <p className="mt-1 text-sm text-wc-muted">Elige una contraseña segura para tu cuenta</p>
              </div>

              {!token && (
                <div className="rounded-lg px-4 py-3 text-sm mb-4" style={{ background: 'rgba(240,62,62,0.08)', border: '1px solid rgba(240,62,62,0.25)', color: '#F03E3E' }}>
                  ⚠ Enlace inválido. Por favor solicita un nuevo correo de restablecimiento.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-wc-muted"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em' }}>Nueva contraseña</label>
                  <input
                    type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="Mínimo 8 caracteres" required minLength={8}
                    className="input" disabled={!token}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-wc-muted"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em' }}>Confirmar contraseña</label>
                  <input
                    type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                    placeholder="Repite la contraseña" required minLength={8}
                    className="input" disabled={!token}
                  />
                </div>

                {error && (
                  <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(240,62,62,0.08)', border: '1px solid rgba(240,62,62,0.25)', color: '#F03E3E' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading || !token} className="btn-primary mt-2 w-full py-2.5">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-wc-bg/30 border-t-wc-bg" />
                      Guardando…
                    </span>
                  ) : (
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.05rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Establecer nueva contraseña
                    </span>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

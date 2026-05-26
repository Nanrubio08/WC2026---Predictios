import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyBonusAnswer, submitBonusAnswer } from '../services/api';
import { useAuthToken } from '../hooks/useAuthToken';
import type { BonusAnswer } from '../types';

// WC2026 qualified teams (can be updated as needed)
const WC_TEAMS = [
  'Argentina', 'Brasil', 'Francia', 'Inglaterra', 'España', 'Alemania',
  'Portugal', 'Países Bajos', 'Bélgica', 'Uruguay', 'Colombia', 'Mexico',
  'Estados Unidos', 'Canadá', 'Marruecos', 'Senegal', 'Nigeria', 'Ghana',
  'Japón', 'Corea del Sur', 'Australia', 'Arabia Saudita', 'Irán', 'Qatar',
  'Polonia', 'Croacia', 'Serbia', 'Dinamarca', 'Suiza', 'Austria',
  'Ecuador', 'Perú', 'Chile', 'Venezuela', 'Bolivia', 'Paraguay',
  'Costa Rica', 'Honduras', 'Panamá', 'Jamaica', 'Argelia', 'Egipto',
  'Camerún', 'Costa de Marfil', 'Túnez', 'Sudáfrica', 'China', 'Indonesia',
].sort();

export default function GoldenBallPage() {
  const { isAuthenticated } = useAuthToken();
  const navigate = useNavigate();
  const [bonus, setBonus] = useState<BonusAnswer | null>(null);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/'); return; }
    fetchMyBonusAnswer()
      .then((b) => { setBonus(b); setSelected(b.answer ?? ''); })
      .catch(() => setError('No se pudo cargar la pregunta.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await submitBonusAnswer(selected);
      setBonus(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg py-10">
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-wc-muted"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.2em' }}>
          Pregunta Bonus
        </p>
        <h1 className="mb-2 leading-none"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 'clamp(2.5rem, 8vw, 4rem)', color: '#E8EDF5', textTransform: 'uppercase' }}>
          BALÓN <span className="text-gold-shimmer">DE ORO</span>
        </h1>
        <p className="text-wc-muted text-sm">Una predicción extra que puede marcar la diferencia</p>
      </div>

      {loading && <div className="card animate-pulse h-64" />}

      {!loading && (
        <div className="card p-6 space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-3">🏆</div>
            <h2 className="text-xl font-black text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              ¿Quién ganará el Mundial 2026?
            </h2>
            <p className="text-wc-muted text-xs mt-1">Podés cambiar tu respuesta hasta que comience el torneo</p>
          </div>

          {bonus?.answer && (
            <div className="rounded-lg px-4 py-3 text-center"
              style={{ background: 'rgba(0,200,122,0.07)', border: '1px solid rgba(0,200,122,0.2)' }}>
              <p className="text-xs text-wc-muted mb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>TU ELECCIÓN ACTUAL</p>
              <p className="text-lg font-black text-wc-gold" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>{bonus.answer}</p>
              {bonus.points > 0 && (
                <p className="text-xs mt-1" style={{ color: '#F5A623' }}>🎉 Ganaste {bonus.points} puntos bonus</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-wc-muted mb-2"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Seleccioná un equipo
              </label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold text-wc-text focus:outline-none"
                style={{ background: '#0D1829', border: `1px solid ${selected ? 'rgba(245,166,35,0.3)' : '#152136'}`, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}
              >
                <option value="">— Elegí un equipo —</option>
                {WC_TEAMS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            {saved && <p className="text-xs text-center" style={{ color: '#00C87A', fontFamily: 'Barlow Condensed, sans-serif' }}>✓ Respuesta guardada correctamente</p>}

            <button
              type="submit"
              disabled={!selected || saving}
              className="btn-primary w-full"
            >
              {saving ? 'Guardando…' : bonus?.answer ? 'Actualizar elección' : 'Confirmar elección'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

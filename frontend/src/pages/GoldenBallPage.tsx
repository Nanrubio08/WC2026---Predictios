import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyBonusAnswer, submitBonusAnswer } from '../services/api';
import { useAuthToken } from '../hooks/useAuthToken';
import type { BonusAnswer } from '../types';

// Deadline: June 17, 2026 at 23:59 local time
const DEADLINE = new Date('2026-06-17T23:59:00');

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

  const winnerDeclared = !!bonus?.tournamentWinner;
  const pastDeadline = Date.now() > DEADLINE.getTime();
  const isLocked = winnerDeclared || pastDeadline;
  const userWon = winnerDeclared && bonus?.answer === bonus?.tournamentWinner;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || isLocked) return;
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
          GOL <span className="text-gold-shimmer">DE ORO</span>
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
            {!isLocked && (
              <p className="text-wc-muted text-xs mt-1">Puedes cambiar tu respuesta hasta el <strong className="text-wc-text">17 de junio a las 23:59</strong></p>
            )}
          </div>

          {/* Tournament winner declared banner */}
          {winnerDeclared && (
            <div className="rounded-lg px-4 py-4 text-center"
              style={{ background: userWon ? 'rgba(245,166,35,0.12)' : 'rgba(0,200,122,0.07)', border: `1px solid ${userWon ? 'rgba(245,166,35,0.4)' : 'rgba(0,200,122,0.2)'}` }}>
              <p className="text-xs text-wc-muted mb-1 uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>
                🌍 Campeón del Mundial 2026
              </p>
              <p className="text-2xl font-black" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#F5A623', letterSpacing: '0.05em' }}>
                {bonus.tournamentWinner}
              </p>
              {userWon ? (
                <p className="text-sm mt-2 font-bold" style={{ color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  🎉 ¡Acertaste! Ganaste <span className="text-lg">+30 pts</span> bonus
                </p>
              ) : (
                <p className="text-xs mt-2 text-wc-muted">Tu elección fue: <strong className="text-wc-text">{bonus.answer ?? '(sin elección)'}</strong></p>
              )}
            </div>
          )}

          {/* User's current pick (before winner declared, but deadline may have passed) */}
          {bonus?.answer && !winnerDeclared && (
            <div className="rounded-lg px-4 py-3 text-center"
              style={{ background: 'rgba(0,200,122,0.07)', border: '1px solid rgba(0,200,122,0.2)' }}>
              <p className="text-xs text-wc-muted mb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>TU ELECCIÓN</p>
              <p className="text-lg font-black text-wc-gold" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>{bonus.answer}</p>
              {bonus.points > 0 && (
                <p className="text-xs mt-1" style={{ color: '#F5A623' }}>🎉 Ganaste {bonus.points} puntos bonus</p>
              )}
              {pastDeadline && !winnerDeclared && (
                <p className="text-xs mt-1 text-wc-dim">🔒 Plazo cerrado · esperando al ganador del torneo</p>
              )}
            </div>
          )}

          {/* Deadline passed, no pick made */}
          {!bonus?.answer && pastDeadline && !winnerDeclared && (
            <div className="rounded-lg px-4 py-3 text-center"
              style={{ background: 'rgba(91,110,140,0.08)', border: '1px solid rgba(91,110,140,0.2)' }}>
              <p className="text-sm text-wc-muted">No hiciste una elección antes del cierre.</p>
            </div>
          )}

          {!isLocked && (
            <form onSubmit={handleSubmit} className="space-y-4">              <div>
                <label className="block text-xs font-bold text-wc-muted mb-2"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Selecciona un equipo
                </label>
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold text-wc-text focus:outline-none"
                  style={{ background: '#0D1829', border: `1px solid ${selected ? 'rgba(245,166,35,0.3)' : '#152136'}`, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}
                >
                  <option value="">— Elige un equipo —</option>
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
          )}

          {/* Points summary if earned */}
          {bonus && bonus.points > 0 && (
            <div className="text-center pt-2">
              <span className="text-xs px-3 py-1.5 rounded-full font-bold"
                style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
                +{bonus.points} PTS BONUS EN TU CUENTA
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

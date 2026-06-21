import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyBonusAnswer, submitBonusAnswer } from '../services/api';
import { useAuthToken } from '../hooks/useAuthToken';
import type { BonusAnswer } from '../types';

// Deadline: June 27, 2026 at 23:59 local time
const DEADLINE = new Date('2026-06-27T23:59:00');

// WC2026 qualified teams — 48 participants
const WC_TEAMS = [
  // CONMEBOL (6)
  'Argentina', 'Brasil', 'Colombia', 'Ecuador', 'Paraguay', 'Uruguay',
  // UEFA (16)
  'Alemania', 'Austria', 'Bélgica', 'Bosnia y Herzegovina', 'Croacia',
  'España', 'Escocia', 'Francia', 'Inglaterra', 'Noruega', 'Países Bajos',
  'Portugal', 'República Checa', 'Suecia', 'Suiza', 'Turquía',
  // CONCACAF (6)
  'Canadá', 'Curazao', 'Estados Unidos', 'Haití', 'México', 'Panamá',
  // CAF (10)
  'Argelia', 'Cabo Verde', 'Costa de Marfil', 'Egipto', 'Ghana',
  'Marruecos', 'República Democrática del Congo', 'Senegal', 'Sudáfrica', 'Túnez',
  // AFC (9)
  'Arabia Saudita', 'Australia', 'Catar', 'Corea del Sur', 'Irak',
  'Irán', 'Japón', 'Jordania', 'Uzbekistán',
  // OFC (1)
  'Nueva Zelanda',
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
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isAuthenticated) { navigate('/'); return; }
    fetchMyBonusAnswer()
      .then((b) => { setBonus(b); setSelected(b.answer ?? ''); })
      .catch(() => setError('No se pudo cargar la pregunta.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  // Live countdown tick
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const winnerDeclared = !!bonus?.tournamentWinner;
  const pastDeadline = now > DEADLINE.getTime();
  const isLocked = winnerDeclared || pastDeadline;
  const userWon = winnerDeclared && bonus?.answer === bonus?.tournamentWinner;

  // Remaining time helpers
  const msLeft = DEADLINE.getTime() - now;
  const daysLeft = Math.floor(msLeft / 86_400_000);
  const hoursLeft = Math.floor((msLeft % 86_400_000) / 3_600_000);

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
      {/* ── Header ── */}
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
        <div className="space-y-4">

          {/* ── Info panel ── */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,215,0,0.2)', background: 'rgba(255,215,0,0.03)' }}>
            {/* Top bar */}
            <div className="px-5 py-4 flex items-center justify-between gap-4"
              style={{ borderBottom: '1px solid rgba(255,215,0,0.12)', background: 'rgba(255,215,0,0.05)' }}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏆</span>
                <div>
                  <p className="font-black text-wc-text uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.05rem', letterSpacing: '0.05em' }}>
                    ¿Quién ganará el Mundial 2026?
                  </p>
                  <p className="text-xs text-wc-muted mt-0.5" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Elige la selección campeona antes del cierre
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-black tabular-nums" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: '#FFD700', lineHeight: 1, textShadow: '0 0 12px rgba(255,215,0,0.4)' }}>
                  +30
                </div>
                <div className="text-xs font-bold text-wc-dim" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>PTS BONUS</div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x" style={{ borderBottom: '1px solid rgba(255,215,0,0.1)', '--tw-divide-opacity': 1 } as React.CSSProperties}>
              {[
                { icon: '🎯', label: 'Premio', value: '30 pts' },
                { icon: '📅', label: 'Cierre', value: '27 Jun · 23:59' },
                { icon: pastDeadline ? '🔒' : '⏳', label: pastDeadline ? 'Estado' : 'Tiempo', value: pastDeadline ? 'Cerrado' : daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft}h` },
              ].map(({ icon, label, value }) => (
                <div key={label} className="py-3 text-center">
                  <div className="text-base mb-0.5">{icon}</div>
                  <div className="font-bold text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.85rem', letterSpacing: '0.04em' }}>{value}</div>
                  <div className="text-xs text-wc-dim" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.6rem' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Rules */}
            <div className="px-5 py-3 space-y-1.5">
              {[
                { dot: 'rgba(255,215,0,0.8)', text: 'Aciertas la selección campeona → +30 puntos bonus de golpe' },
                { dot: 'rgba(91,110,140,0.6)', text: 'Solo una elección por usuario — modifícala las veces que quieras antes del cierre' },
                { dot: 'rgba(91,110,140,0.6)', text: 'Una vez declarado el campeón, los puntos se otorgan automáticamente' },
              ].map(({ dot, text }) => (
                <div key={text} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dot }} />
                  <p className="text-xs text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Main card ── */}
          <div className="card p-6 space-y-5">

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

            {/* Current pick */}
            {bonus?.answer && !winnerDeclared && (
              <div className="rounded-lg px-4 py-3 text-center"
                style={{ background: 'rgba(0,200,122,0.07)', border: '1px solid rgba(0,200,122,0.2)' }}>
                <p className="text-xs text-wc-muted mb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>TU ELECCIÓN ACTUAL</p>
                <p className="text-lg font-black text-wc-gold" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>{bonus.answer}</p>
                {bonus.points > 0 && (
                  <p className="text-xs mt-1" style={{ color: '#F5A623' }}>🎉 Ganaste {bonus.points} puntos bonus</p>
                )}
                {pastDeadline && !winnerDeclared && (
                  <p className="text-xs mt-1 text-wc-dim">🔒 Plazo cerrado · esperando al ganador del torneo</p>
                )}
              </div>
            )}

            {/* Deadline passed, no pick */}
            {!bonus?.answer && pastDeadline && !winnerDeclared && (
              <div className="rounded-lg px-4 py-3 text-center"
                style={{ background: 'rgba(91,110,140,0.08)', border: '1px solid rgba(91,110,140,0.2)' }}>
                <p className="text-sm text-wc-muted">No hiciste una elección antes del cierre.</p>
              </div>
            )}

            {/* Selection form */}
            {!isLocked && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
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

                <button type="submit" disabled={!selected || saving} className="btn-primary w-full">
                  {saving ? 'Guardando…' : bonus?.answer ? 'Actualizar elección' : 'Confirmar elección'}
                </button>
              </form>
            )}

            {/* Points earned summary */}
            {bonus && bonus.points > 0 && (
              <div className="text-center pt-1">
                <span className="text-xs px-3 py-1.5 rounded-full font-bold"
                  style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
                  +{bonus.points} PTS BONUS EN TU CUENTA
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

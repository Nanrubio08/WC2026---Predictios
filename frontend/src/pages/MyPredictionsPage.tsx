import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyPredictions } from '../services/api';
import { useAuthToken } from '../hooks/useAuthToken';
import type { MyPrediction } from '../types';

function PointsBadge({ points }: { points: number }) {
  if (points === 5) return (
    <span className="rounded-full px-2.5 py-1 text-xs font-black"
      style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
      ⭐ {points} pts
    </span>
  );
  if (points === 3) return (
    <span className="rounded-full px-2.5 py-1 text-xs font-black"
      style={{ background: 'rgba(0,200,122,0.1)', border: '1px solid rgba(0,200,122,0.25)', color: '#00C87A', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
      ✓ {points} pts
    </span>
  );
  if (points === 0) return (
    <span className="rounded-full px-2.5 py-1 text-xs font-bold"
      style={{ background: 'rgba(91,110,140,0.1)', border: '1px solid rgba(91,110,140,0.2)', color: '#5B6E8C', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
      {points} pts
    </span>
  );
  return null;
}

function TeamLogo({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black shrink-0"
        style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.15)', color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.6rem' }}>
        {alt.slice(0, 3).toUpperCase()}
      </div>
    );
  return <img src={src} alt={alt} className="h-8 w-8 object-contain shrink-0" onError={() => setFailed(true)} />;
}

export default function MyPredictionsPage() {
  const { isAuthenticated } = useAuthToken();
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState<MyPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/'); return; }
    fetchMyPredictions()
      .then(setPredictions)
      .catch(() => setError('No se pudieron cargar tus pronósticos.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const finished = predictions.filter((p) => p.match?.status === 'finished');
  const totalPoints = finished.reduce((s, p) => s + p.pointsEarned, 0);
  const exactHits = finished.filter((p) => p.pointsEarned === 5).length;
  const correctOutcome = finished.filter((p) => p.pointsEarned === 3).length;
  const accuracy = finished.length > 0 ? Math.round(((exactHits + correctOutcome) / finished.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 py-10 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-wc-muted"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.2em' }}>
          Mi historial
        </p>
        <h1 className="mb-2 leading-none"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 'clamp(2.5rem, 8vw, 4rem)', color: '#E8EDF5', textTransform: 'uppercase' }}>
          MIS <span className="text-gold-shimmer">PRONÓSTICOS</span>
        </h1>
      </div>

      {/* Stats bar */}
      {!loading && !error && finished.length > 0 && (
        <div className="mb-6 grid grid-cols-4 gap-3">
          {[
            { label: 'PUNTOS', value: totalPoints, color: '#F5A623' },
            { label: 'EXACTOS', value: exactHits, color: '#F5A623' },
            { label: 'RESULTADO', value: correctOutcome, color: '#00C87A' },
            { label: 'ACIERTOS', value: `${accuracy}%`, color: '#E8EDF5' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center py-4">
              <div className="font-black text-2xl tabular-nums" style={{ fontFamily: 'Bebas Neue, sans-serif', color, letterSpacing: '0.05em' }}>{value}</div>
              <div className="text-xs font-bold text-wc-muted mt-1" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-20" />
          ))}
        </div>
      )}

      {error && (
        <div className="py-16 text-center text-wc-muted">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-4">Reintentar</button>
        </div>
      )}

      {!loading && !error && predictions.length === 0 && (
        <div className="py-16 text-center text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem' }}>
          Aún no enviaste ningún pronóstico. ¡Empieza a predecir en la sección de Partidos!
        </div>
      )}

      {!loading && !error && predictions.length > 0 && (
        <div className="space-y-3">
          {predictions.map((p) => {
            const m = p.match;
            const isFinished = m?.status === 'finished';
            const kickoff = m ? new Date(m.kickoffTime) : null;
            return (
              <div key={p.matchId} className="card p-4">
                {/* Date + group row */}
                <div className="mb-3 flex items-center gap-2">
                  {kickoff && (
                    <span className="text-xs text-wc-dim" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {kickoff.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {m?.group && (
                    <span className="text-xs text-wc-dim" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                      · {m.group.replace('GROUP_', 'Gr. ')}
                    </span>
                  )}
                  {/* Points badge pushed to right */}
                  <div className="ml-auto shrink-0">
                    {isFinished ? (
                      <PointsBadge points={p.pointsEarned} />
                    ) : (
                      <span className="rounded-full px-2.5 py-1 text-xs font-bold"
                        style={{ background: 'rgba(0,200,122,0.08)', border: '1px solid rgba(0,200,122,0.2)', color: '#00C87A', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>

                {/* Teams + score row: [Home] [Score/Prediction] [Away] */}
                <div className="flex items-center gap-2">
                  {/* Home team */}
                  <div className="flex flex-1 flex-col items-center gap-1 min-w-0">
                    <TeamLogo src={m?.homeLogoUrl ?? null} alt={m?.homeTeam ?? '?'} />
                    <span className="text-center text-xs font-bold text-wc-text uppercase leading-tight w-full"
                      style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}>
                      {m?.homeTeam ?? '?'}
                    </span>
                  </div>

                  {/* Score / Prediction (centre) */}
                  <div className="shrink-0 text-center space-y-1 px-2">
                    <div className="text-xs text-wc-dim" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>TU PRON.</div>
                    <div className="font-black tabular-nums text-wc-text" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', letterSpacing: '0.05em' }}>
                      {p.homeScorePredicted} – {p.awayScorePredicted}
                    </div>
                    {isFinished && m?.homeScoreActual !== null && (
                      <div className="text-xs text-wc-muted tabular-nums" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                        Real: {m.homeScoreActual} – {m.awayScoreActual}
                      </div>
                    )}
                  </div>

                  {/* Away team */}
                  <div className="flex flex-1 flex-col items-center gap-1 min-w-0">
                    <TeamLogo src={m?.awayLogoUrl ?? null} alt={m?.awayTeam ?? '?'} />
                    <span className="text-center text-xs font-bold text-wc-text uppercase leading-tight w-full"
                      style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}>
                      {m?.awayTeam ?? '?'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

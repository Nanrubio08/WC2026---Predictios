import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { fetchUserPredictions } from '../services/api';
import { useAuthToken } from '../hooks/useAuthToken';
import type { MyPrediction } from '../types';

type StageFilter = 'all' | 'GROUP_STAGE' | 'ROUND_OF_16' | 'QUARTER_FINALS' | 'SEMI_FINALS' | 'FINAL';

const STAGE_LABELS: Record<StageFilter, string> = {
  all: 'Todos',
  GROUP_STAGE: 'Fase de Grupos',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINALS: 'Cuartos',
  SEMI_FINALS: 'Semis',
  FINAL: 'Final',
};

function getMatchDay(kickoffTime: string): number {
  const d = new Date(kickoffTime);
  const matchLocalMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const tournamentLocalMidnight = new Date(2026, 5, 11).getTime();
  return Math.floor((matchLocalMidnight - tournamentLocalMidnight) / 86_400_000) + 1;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'live') return (
    <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black uppercase"
      style={{ background: 'rgba(240,62,62,0.12)', border: '1px solid rgba(240,62,62,0.3)', color: '#F03E3E', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em' }}>
      <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: '#F03E3E' }} />
      EN VIVO
    </span>
  );
  return (
    <span className="rounded-full px-2.5 py-1 text-xs font-bold uppercase"
      style={{ background: 'rgba(91,110,140,0.15)', border: '1px solid rgba(91,110,140,0.2)', color: '#5B6E8C', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em' }}>
      FINAL
    </span>
  );
}

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
  return (
    <span className="rounded-full px-2.5 py-1 text-xs font-bold"
      style={{ background: 'rgba(91,110,140,0.1)', border: '1px solid rgba(91,110,140,0.2)', color: '#5B6E8C', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
      {points} pts
    </span>
  );
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

export default function UserPredictionsPage() {
  const { isAuthenticated } = useAuthToken();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const displayName = searchParams.get('name') ?? searchParams.get('username') ?? userId ?? '';
  const username = searchParams.get('username') ?? '';

  const [predictions, setPredictions] = useState<MyPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/'); return; }
    if (!userId) { navigate('/leaderboard'); return; }
    fetchUserPredictions(userId)
      .then(setPredictions)
      .catch(() => setError('No se pudieron cargar los pronósticos.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate, userId]);

  // Sort: live first, then newest-first by kickoffTime
  const sorted = useMemo(() =>
    [...predictions].sort((a, b) => {
      const aLive = a.match?.status === 'live' ? 0 : 1;
      const bLive = b.match?.status === 'live' ? 0 : 1;
      if (aLive !== bLive) return aLive - bLive;
      const tA = a.match ? new Date(a.match.kickoffTime).getTime() : 0;
      const tB = b.match ? new Date(b.match.kickoffTime).getTime() : 0;
      return tB - tA;
    }),
    [predictions]
  );

  const availableStages = useMemo(() => {
    const stages = new Set(sorted.map((p) => p.match?.stage).filter(Boolean) as string[]);
    const order: StageFilter[] = ['GROUP_STAGE', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'];
    return order.filter((s) => stages.has(s));
  }, [sorted]);

  const availableDays = useMemo(() => {
    const base = stageFilter === 'all' ? sorted : sorted.filter((p) => p.match?.stage === stageFilter);
    const days = new Set(base.filter((p) => p.match).map((p) => getMatchDay(p.match!.kickoffTime)));
    return Array.from(days).sort((a, b) => a - b);
  }, [sorted, stageFilter]);

  const availableTeams = useMemo(() => {
    const teams = new Set(sorted.flatMap((p) => p.match ? [p.match.homeTeam, p.match.awayTeam] : []));
    return Array.from(teams).sort();
  }, [sorted]);

  const filtered = useMemo(() => {
    return sorted.filter((p) => {
      const m = p.match;
      const stageOk = stageFilter === 'all' || m?.stage === stageFilter;
      const dayOk = selectedDay === null || (m && getMatchDay(m.kickoffTime) === selectedDay);
      const teamOk = selectedTeam === null || m?.homeTeam === selectedTeam || m?.awayTeam === selectedTeam;
      return stageOk && dayOk && teamOk;
    });
  }, [sorted, stageFilter, selectedDay, selectedTeam]);

  const totalPoints = predictions.reduce((s, p) => s + p.pointsEarned, 0);
  const exactHits = predictions.filter((p) => p.pointsEarned === 5).length;
  const correctOutcome = predictions.filter((p) => p.pointsEarned === 3).length;
  const accuracy = predictions.length > 0 ? Math.round(((exactHits + correctOutcome) / predictions.length) * 100) : 0;

  const pillBase = 'shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-all';
  const activePill = {
    background: 'linear-gradient(135deg, #F5A623 0%, #E8920F 100%)',
    color: '#04070E',
    fontFamily: 'Barlow Condensed, sans-serif',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    boxShadow: '0 2px 12px rgba(245,166,35,0.3)',
  };
  const inactivePill = {
    background: 'rgba(21,33,54,0.6)',
    border: '1px solid #152136',
    color: '#5B6E8C',
    fontFamily: 'Barlow Condensed, sans-serif',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 py-10 text-center">
        <Link to="/leaderboard" className="inline-flex items-center gap-1.5 mb-4 text-xs font-bold text-wc-muted hover:text-wc-text transition-colors"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          ← Tabla de posiciones
        </Link>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-wc-muted"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.2em' }}>
          Pronósticos de
        </p>
        <h1 className="mb-1 leading-none"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 'clamp(2rem, 7vw, 3.5rem)', color: '#E8EDF5', textTransform: 'uppercase' }}>
          <span className="text-gold-shimmer">{displayName}</span>
        </h1>
        {username && displayName !== username && (
          <p className="text-xs text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>@{username}</p>
        )}
      </div>

      {/* Stats bar */}
      {!loading && !error && predictions.length > 0 && (
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

      {/* Filters */}
      {!loading && !error && predictions.length > 0 && (
        <div className="mb-5 space-y-3">
          {availableStages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => { setStageFilter('all'); setSelectedDay(null); }} className={pillBase}
                style={stageFilter === 'all' ? activePill : inactivePill}>
                Todos
              </button>
              {availableStages.map((s) => (
                <button key={s} onClick={() => { setStageFilter(s); setSelectedDay(null); }} className={pillBase}
                  style={stageFilter === s ? activePill : inactivePill}>
                  {STAGE_LABELS[s]}
                </button>
              ))}
            </div>
          )}

          {availableDays.length > 0 && (
            <div className="flex items-center gap-3">
              <label htmlFor="day-filter" className="shrink-0 text-sm font-bold text-wc-muted"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Día:
              </label>
              <select id="day-filter" value={selectedDay ?? ''} onChange={(e) => setSelectedDay(e.target.value === '' ? null : Number(e.target.value))}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-wc-text focus:outline-none"
                style={{ background: '#0D1829', border: '1px solid #152136', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
                <option value="">Todos los días</option>
                {availableDays.map((day) => <option key={day} value={day}>Día {day}</option>)}
              </select>
            </div>
          )}

          {availableTeams.length > 0 && (
            <div className="flex items-center gap-3">
              <label htmlFor="team-filter" className="shrink-0 text-sm font-bold text-wc-muted"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Equipo:
              </label>
              <select id="team-filter" value={selectedTeam ?? ''} onChange={(e) => setSelectedTeam(e.target.value === '' ? null : e.target.value)}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-wc-text focus:outline-none"
                style={{ background: '#0D1829', border: '1px solid #152136', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', minWidth: '160px' }}>
                <option value="">Todos los equipos</option>
                {availableTeams.map((team) => <option key={team} value={team}>{team}</option>)}
              </select>
            </div>
          )}
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
          Este usuario aún no tiene pronósticos en partidos finalizados.
        </div>
      )}

      {!loading && !error && predictions.length > 0 && filtered.length === 0 && (
        <div className="py-16 text-center text-wc-muted"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem', letterSpacing: '0.05em' }}>
          No hay pronósticos en esta categoría.
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((p) => {
            const m = p.match;
            const kickoff = m ? new Date(m.kickoffTime) : null;
            return (
              <div key={p.matchId} className="card p-4" style={m?.status === 'live' ? { borderColor: 'rgba(240,62,62,0.4)' } : {}}>
                {m?.status === 'live' && (
                  <div className="h-0.5 w-full mb-3 rounded-full" style={{ background: 'linear-gradient(90deg, #F03E3E 0%, rgba(240,62,62,0) 100%)' }} />
                )}
                <div className="mb-3 flex items-center gap-2 flex-wrap">
                  <StatusBadge status={m?.status ?? 'finished'} />
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
                  <div className="ml-auto shrink-0">
                    <PointsBadge points={p.pointsEarned} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-1 flex-col items-center gap-1 min-w-0">
                    <TeamLogo src={m?.homeLogoUrl ?? null} alt={m?.homeTeam ?? '?'} />
                    <span className="text-center text-xs font-bold text-wc-text uppercase leading-tight w-full"
                      style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}>
                      {m?.homeTeam ?? '?'}
                    </span>
                  </div>

                  <div className="shrink-0 text-center space-y-1.5 px-2">
                    <div className="flex items-baseline justify-center gap-2">
                      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: '#F5A623', letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>PRON.</span>
                      <span className="font-black tabular-nums text-wc-text" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', letterSpacing: '0.05em', lineHeight: 1 }}>
                        {p.homeScorePredicted} – {p.awayScorePredicted}
                      </span>
                    </div>
                    {m && m.homeScoreActual !== null && (
                      <div className="flex items-baseline justify-center gap-2">
                        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: '#5B6E8C', letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>REAL</span>
                        <span className="tabular-nums" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1rem', color: '#5B6E8C', letterSpacing: '0.03em' }}>
                          {m.homeScoreActual} – {m.awayScoreActual}
                        </span>
                      </div>
                    )}
                  </div>

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

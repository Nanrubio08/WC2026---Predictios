import { useEffect, useMemo, useState } from 'react';
import MatchCard from '../components/MatchCard';
import { fetchMatches, fetchMyPredictions } from '../services/api';
import type { Match } from '../types';

interface Props {
  isAuthenticated?: boolean;
}

type StatusFilter = 'all' | 'scheduled' | 'live' | 'finished';
type StageFilter = 'all' | 'GROUP_STAGE' | 'ROUND_OF_16' | 'QUARTER_FINALS' | 'SEMI_FINALS' | 'FINAL';
type TeamFilter = string | null;

// Day 1 = June 11 2026. Uses local date so matches group by the viewer's timezone day.
function getMatchDay(kickoffTime: string): number {
  const d = new Date(kickoffTime);
  const matchLocalMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const tournamentLocalMidnight = new Date(2026, 5, 11).getTime(); // June 11 2026 local midnight
  return Math.floor((matchLocalMidnight - tournamentLocalMidnight) / 86_400_000) + 1;
}

const STAGE_LABELS: Record<StageFilter, string> = {
  all: 'Todos',
  GROUP_STAGE: 'Fase de Grupos',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINALS: 'Cuartos',
  SEMI_FINALS: 'Semis',
  FINAL: 'Final',
};

function MatchSkeleton() {
  return (
    <div className="match-card animate-pulse">
      <div className="h-0.5 w-full" style={{ background: 'rgba(245,166,35,0.1)' }} />
      <div className="p-4">
        <div className="mb-4 flex justify-between">
          <div className="h-5 w-16 rounded-full" style={{ background: '#0D1829' }} />
          <div className="h-4 w-20 rounded" style={{ background: '#0D1829' }} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full" style={{ background: '#0D1829' }} />
            <div className="h-4 w-20 rounded" style={{ background: '#0D1829' }} />
          </div>
          <div className="mx-4 h-10 w-14 rounded-xl" style={{ background: '#0D1829' }} />
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full" style={{ background: '#0D1829' }} />
            <div className="h-4 w-20 rounded" style={{ background: '#0D1829' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MatchListPage({ isAuthenticated }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamFilter>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadMatches = async (): Promise<Match[]> => {
      const [matches, predictions] = await Promise.all([
        fetchMatches(),
        isAuthenticated ? fetchMyPredictions().catch(() => []) : Promise.resolve([]),
      ]);

      if (!isAuthenticated || predictions.length === 0) return matches;

      const predMap = new Map(
        predictions.map((p) => [
          p.matchId,
          { homeScorePredicted: p.homeScorePredicted, awayScorePredicted: p.awayScorePredicted, pointsEarned: p.pointsEarned },
        ])
      );

      return matches.map((m) => ({
        ...m,
        userPrediction: predMap.get(m.id) ?? m.userPrediction ?? null,
      }));
    };

    loadMatches()
      .then(setMatches)
      .catch(() => setError('No se pudieron cargar los partidos. Por favor intentá de nuevo.'))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      loadMatches().then(setMatches).catch(() => {});
    }, 60_000);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshKey]);

  // Available stages that have at least one match
  const availableStages = useMemo(() => {
    const stages = new Set(matches.map((m) => m.stage).filter(Boolean));
    const order: StageFilter[] = ['GROUP_STAGE', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'];
    return order.filter((s) => stages.has(s));
  }, [matches]);

  // Sorted list of unique days that actually have matches
  const availableDays = useMemo(() => {
    const filtered = stageFilter === 'all' ? matches : matches.filter((m) => m.stage === stageFilter);
    const days = new Set(filtered.map((m) => getMatchDay(m.kickoffTime)));
    return Array.from(days).sort((a, b) => a - b);
  }, [matches, stageFilter]);

  // Sorted unique team list derived from matches
  const availableTeams = useMemo(() => {
    const teams = new Set(matches.flatMap((m) => [m.homeTeam, m.awayTeam]));
    return Array.from(teams).sort();
  }, [matches]);

  const liveCount = matches.filter((m) => m.status === 'live').length;

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      const statusOk = statusFilter === 'all' || m.status === statusFilter;
      const stageOk = stageFilter === 'all' || m.stage === stageFilter;
      const dayOk = selectedDay === null || getMatchDay(m.kickoffTime) === selectedDay;
      const teamOk = selectedTeam === null || m.homeTeam === selectedTeam || m.awayTeam === selectedTeam;
      return statusOk && stageOk && dayOk && teamOk;
    });
  }, [matches, statusFilter, stageFilter, selectedDay, selectedTeam]);

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: `Todos` },
    { key: 'live', label: `🔴 En vivo${liveCount > 0 ? ` (${liveCount})` : ''}` },
    { key: 'scheduled', label: 'Próximos' },
    { key: 'finished', label: 'Finalizados' },
  ];

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
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 py-10 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-wc-muted"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.2em' }}>
          🇺🇸 🇨🇦 🇲🇽 Copa del Mundo 2026
        </p>
        <h1 className="mb-2 leading-none"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 'clamp(2.5rem, 8vw, 4rem)', color: '#E8EDF5', textTransform: 'uppercase' }}>
          CALENDARIO DE <span className="text-gold-shimmer">PARTIDOS</span>
        </h1>
        <p className="text-wc-muted">Predice el marcador. Sube en la tabla. Gana la gloria.</p>
      </div>

      {!loading && !error && (
        <div className="mb-5 space-y-3">
          {/* Stage filter */}
          {availableStages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button key="all" onClick={() => { setStageFilter('all'); setSelectedDay(null); }} className={pillBase}
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

          {/* Status filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {statusFilters.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={pillBase}
                style={statusFilter === key ? activePill : inactivePill}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Day filter */}
          {availableDays.length > 0 && (
            <div className="flex items-center gap-3">
              <label htmlFor="day-filter" className="shrink-0 text-sm font-bold text-wc-muted"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Día:
              </label>
              <select
                id="day-filter"
                value={selectedDay ?? ''}
                onChange={(e) => setSelectedDay(e.target.value === '' ? null : Number(e.target.value))}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-wc-text focus:outline-none"
                style={{ background: '#0D1829', border: '1px solid #152136', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}
              >
                <option value="">Todos los días</option>
                {availableDays.map((day) => (
                  <option key={day} value={day}>Día {day}</option>
                ))}
              </select>
            </div>
          )}

          {/* Team filter */}
          {availableTeams.length > 0 && (
            <div className="flex items-center gap-3">
              <label htmlFor="team-filter" className="shrink-0 text-sm font-bold text-wc-muted"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Equipo:
              </label>
              <select
                id="team-filter"
                value={selectedTeam ?? ''}
                onChange={(e) => setSelectedTeam(e.target.value === '' ? null : e.target.value)}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-wc-text focus:outline-none"
                style={{ background: '#0D1829', border: '1px solid #152136', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', minWidth: '160px' }}
              >
                <option value="">Todos los equipos</option>
                {availableTeams.map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MatchSkeleton key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="py-16 text-center">
          <div className="mb-3 text-4xl">😕</div>
          <p className="text-wc-muted">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-4">
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="py-16 text-center text-wc-muted"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem', letterSpacing: '0.05em' }}>
          {statusFilter === 'live' ? 'No hay partidos en vivo ahora.' : 'No hay partidos en esta categoría.'}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m} isAuthenticated={isAuthenticated} onPredictionSaved={() => setRefreshKey(k => k + 1)} />
          ))}
        </div>
      )}
    </div>
  );
}

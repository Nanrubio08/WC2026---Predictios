import { useEffect, useMemo, useState } from 'react';
import { fetchMatches } from '../services/api';
import type { Match } from '../types';

interface TeamStats {
  team: string;
  logoUrl: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

function calcGroupStandings(matches: Match[]): Record<string, TeamStats[]> {
  const groups: Record<string, Record<string, TeamStats>> = {};

  const groupMatches = matches.filter(
    (m) => m.stage === 'GROUP_STAGE' && m.group
  );

  for (const m of groupMatches) {
    const g = m.group!;
    if (!groups[g]) groups[g] = {};

    const initTeam = (team: string, logo: string | null): TeamStats =>
      groups[g][team] ?? (groups[g][team] = { team, logoUrl: logo, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 });

    const home = initTeam(m.homeTeam, m.homeLogoUrl);
    const away = initTeam(m.awayTeam, m.awayLogoUrl);

    if (m.status === 'finished' && m.homeScoreActual !== null && m.awayScoreActual !== null) {
      const hg = m.homeScoreActual;
      const ag = m.awayScoreActual;
      home.played++;
      away.played++;
      home.goalsFor += hg;
      home.goalsAgainst += ag;
      away.goalsFor += ag;
      away.goalsAgainst += hg;

      if (hg > ag) { home.won++; home.points += 3; away.lost++; }
      else if (hg < ag) { away.won++; away.points += 3; home.lost++; }
      else { home.drawn++; home.points++; away.drawn++; away.points++; }
    }
  }

  const result: Record<string, TeamStats[]> = {};
  for (const [g, teams] of Object.entries(groups)) {
    result[g] = Object.values(teams).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) return gdB - gdA;
      return b.goalsFor - a.goalsFor;
    });
  }
  return result;
}

function TeamLogo({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-black shrink-0"
        style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.15)', color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.55rem' }}>
        {alt.slice(0, 3).toUpperCase()}
      </div>
    );
  }
  return <img src={src} alt={alt} className="h-6 w-6 object-contain shrink-0" onError={() => setFailed(true)} />;
}

function GroupTable({ group, teams }: { group: string; teams: TeamStats[] }) {
  const label = group.replace('GROUP_', 'Grupo ');
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(245,166,35,0.15)', background: 'rgba(245,166,35,0.04)' }}>
        <h2 className="font-black text-wc-gold" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {label}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(21,33,54,0.8)' }}>
              <th className="py-2 pl-4 text-left text-xs font-bold text-wc-muted w-6" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>#</th>
              <th className="py-2 pl-2 text-left text-xs font-bold text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>EQUIPO</th>
              {['PJ', 'G', 'E', 'P', 'GF', 'GC', 'DG', 'PTS'].map((h) => (
                <th key={h} className="py-2 px-2 text-center text-xs font-bold text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => {
              const qualified = i < 2;
              return (
                <tr key={t.team} style={{ borderBottom: '1px solid rgba(21,33,54,0.5)', background: qualified ? 'rgba(0,200,122,0.03)' : undefined }}>
                  <td className="py-2.5 pl-4 text-xs font-bold" style={{ color: qualified ? '#00C87A' : '#5B6E8C', fontFamily: 'Barlow Condensed, sans-serif' }}>{i + 1}</td>
                  <td className="py-2.5 pl-2">
                    <div className="flex items-center gap-2">
                      <TeamLogo src={t.logoUrl} alt={t.team} />
                      <span className="text-xs font-bold text-wc-text truncate max-w-[120px]" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{t.team}</span>
                    </div>
                  </td>
                  {[t.played, t.won, t.drawn, t.lost, t.goalsFor, t.goalsAgainst, t.goalsFor - t.goalsAgainst].map((v, idx) => (
                    <td key={idx} className="py-2.5 px-2 text-center text-xs text-wc-muted tabular-nums" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{v >= 0 && idx === 6 && v > 0 ? `+${v}` : v}</td>
                  ))}
                  <td className="py-2.5 px-2 text-center text-xs font-black tabular-nums" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#E8EDF5' }}>{t.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function GroupStandingsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches()
      .then(setMatches)
      .catch(() => setError('No se pudieron cargar los datos.'))
      .finally(() => setLoading(false));
  }, []);

  const standings = useMemo(() => calcGroupStandings(matches), [matches]);
  const sortedGroups = Object.keys(standings).sort();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 py-10 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-wc-muted"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.2em' }}>
          🇺🇸 🇨🇦 🇲🇽 Copa del Mundo 2026
        </p>
        <h1 className="mb-2 leading-none"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 'clamp(2.5rem, 8vw, 4rem)', color: '#E8EDF5', textTransform: 'uppercase' }}>
          TABLA DE <span className="text-gold-shimmer">GRUPOS</span>
        </h1>
        <p className="text-wc-muted">Posiciones actualizadas en tiempo real · Los 2 primeros de cada grupo avanzan</p>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-48" />
          ))}
        </div>
      )}

      {error && (
        <div className="py-16 text-center text-wc-muted">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-4">Reintentar</button>
        </div>
      )}

      {!loading && !error && sortedGroups.length === 0 && (
        <div className="py-16 text-center text-wc-muted"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem' }}>
          Los grupos aún no están disponibles. Volvé cuando comience la fase de grupos.
        </div>
      )}

      {!loading && !error && sortedGroups.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedGroups.map((g) => (
            <GroupTable key={g} group={g} teams={standings[g]} />
          ))}
        </div>
      )}
    </div>
  );
}

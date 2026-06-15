import { useEffect, useState } from 'react';
import LeaderboardTable from '../components/LeaderboardTable';
import { fetchLeaderboard } from '../services/api';
import type { LeaderboardEntry, User } from '../types';

interface Props {
  currentUser: User | null;
  isAuthenticated?: boolean;
}

export default function LeaderboardPage({ currentUser, isAuthenticated }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard()
      .then(setEntries)
      .catch(() => setError('No se pudo cargar la tabla de posiciones.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 py-10 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-wc-muted"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.2em' }}>
          Posiciones
        </p>
        <h1 className="mb-1 leading-none"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 'clamp(2.8rem, 8vw, 4rem)', color: '#E8EDF5', textTransform: 'uppercase' }}>
          🏆 <span className="text-gold-shimmer">TABLA DE POSICIONES</span>
        </h1>
        <p className="text-wc-muted">Los mejores pronosticadores del Mundial 2026</p>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card flex animate-pulse items-center gap-3">
              <div className="h-6 w-6 rounded bg-slate-700" />
              <div className="h-8 w-8 rounded-full bg-slate-700" />
              <div className="h-4 flex-1 rounded bg-slate-700" />
              <div className="h-6 w-12 rounded bg-slate-700" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="py-12 text-center text-slate-400">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-4">
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && <LeaderboardTable entries={entries} currentUserId={currentUser?.id} isAuthenticated={isAuthenticated} />}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminFetchMatches, adminUpdateScore, adminFetchAuditLogs, adminLeaderboardExportUrl } from '../services/api';
import { useAuthToken } from '../hooks/useAuthToken';
import type { Match, AuditLog } from '../types';

function ScoreEditor({ match, onUpdated }: { match: Match; onUpdated: (m: Match) => void }) {
  const [home, setHome] = useState(String(match.homeScoreActual ?? ''));
  const [away, setAway] = useState(String(match.awayScoreActual ?? ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError('Ingresá marcadores válidos (0-99)');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await adminUpdateScore(match.id, h, a);
      onUpdated(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: '#0D1829',
    border: '1px solid #152136',
    color: '#E8EDF5',
    width: 52,
    textAlign: 'center' as const,
    borderRadius: 6,
    padding: '4px 0',
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: '1.1rem',
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input type="number" min={0} max={99} value={home} onChange={(e) => setHome(e.target.value)} style={inputStyle} />
      <span style={{ color: '#2A3A52', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>–</span>
      <input type="number" min={0} max={99} value={away} onChange={(e) => setAway(e.target.value)} style={inputStyle} />
      <button type="submit" disabled={loading}
        className="rounded px-3 py-1 text-xs font-bold uppercase"
        style={{ background: loading ? 'rgba(245,166,35,0.1)' : 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
        {loading ? '...' : success ? '✓' : 'GUARDAR'}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </form>
  );
}

export default function AdminPage() {
  const { user, isAuthenticated } = useAuthToken();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'matches' | 'audit'>('matches');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') { navigate('/'); return; }
    Promise.all([adminFetchMatches(), adminFetchAuditLogs()])
      .then(([m, a]) => { setMatches(m); setAuditLogs(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, navigate]);

  const handleMatchUpdated = (updated: Match) => {
    setMatches((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
    adminFetchAuditLogs().then(setAuditLogs).catch(() => {});
  };

  const pillBase = 'rounded-full px-4 py-1.5 text-sm font-bold transition-all cursor-pointer';
  const activeStyle = { background: 'linear-gradient(135deg, #F5A623 0%, #E8920F 100%)', color: '#04070E', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' as const };
  const inactiveStyle = { background: 'rgba(21,33,54,0.6)', border: '1px solid #152136', color: '#5B6E8C', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' as const };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 py-8 text-center">
        <h1 className="leading-none"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 'clamp(2rem, 7vw, 3.5rem)', color: '#E8EDF5', textTransform: 'uppercase' }}>
          ⚙️ PANEL <span className="text-gold-shimmer">ADMIN</span>
        </h1>
      </div>

      <div className="mb-5 flex items-center gap-3 flex-wrap">
        <button className={pillBase} style={tab === 'matches' ? activeStyle : inactiveStyle} onClick={() => setTab('matches')}>Partidos</button>
        <button className={pillBase} style={tab === 'audit' ? activeStyle : inactiveStyle} onClick={() => setTab('audit')}>Audit Log</button>
        <a
          href={adminLeaderboardExportUrl()}
          className={`${pillBase} no-underline`}
          style={{ background: 'rgba(0,200,122,0.1)', border: '1px solid rgba(0,200,122,0.25)', color: '#00C87A', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}
          download="leaderboard.csv"
        >
          ↓ Exportar CSV
        </a>
      </div>

      {loading && <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="card animate-pulse h-16" />)}</div>}

      {!loading && tab === 'matches' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(21,33,54,0.8)', background: 'rgba(245,166,35,0.04)' }}>
                  {['ID', 'PARTIDO', 'ESTADO', 'FECHA', 'MARCADOR'].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-bold text-wc-muted"
                      style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  const kickoff = new Date(m.kickoffTime);
                  const statusColor = m.status === 'live' ? '#F03E3E' : m.status === 'finished' ? '#5B6E8C' : '#00C87A';
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(21,33,54,0.5)' }}>
                      <td className="py-3 px-4 text-xs text-wc-dim tabular-nums">{m.id}</td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-bold text-wc-text uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}>
                          {m.homeTeam} vs {m.awayTeam}
                        </div>
                        {m.group && <div className="text-xs text-wc-dim">{m.group.replace('GROUP_', 'Gr. ')} · MD{m.matchday}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold uppercase" style={{ color: statusColor, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>{m.status}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {kickoff.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} {kickoff.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <ScoreEditor match={m} onUpdated={handleMatchUpdated} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tab === 'audit' && (
        <div className="card overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>No hay entradas en el audit log todavía.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(21,33,54,0.8)', background: 'rgba(245,166,35,0.04)' }}>
                    {['FECHA', 'PARTIDO ID', 'ANTERIOR', 'NUEVO', 'ADMIN'].map((h) => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-bold text-wc-muted"
                        style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(21,33,54,0.5)' }}>
                      <td className="py-3 px-4 text-xs text-wc-muted tabular-nums" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {new Date(log.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-xs text-wc-muted tabular-nums">{log.matchId}</td>
                      <td className="py-3 px-4 text-xs text-wc-dim tabular-nums">
                        {log.previousHome !== null ? `${log.previousHome}–${log.previousAway}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-xs font-bold text-wc-text tabular-nums" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {log.newHome}–{log.newAway}
                      </td>
                      <td className="py-3 px-4 text-xs text-wc-dim font-mono truncate max-w-[100px]">{log.adminUserId.slice(0, 8)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

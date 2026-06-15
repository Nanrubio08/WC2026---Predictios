import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { LeaderboardEntry, MyPrediction } from '../types';
import { fetchUserPredictions } from '../services/api';

interface Props {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isAuthenticated?: boolean;
}

const PODIUM_STYLES: Record<number, { bg: string; border: string; color: string; label: string; size: string }> = {
  1: { bg: 'rgba(245,166,35,0.12)', border: 'rgba(245,166,35,0.4)', color: '#F5A623', label: '🥇', size: '1.5rem' },
  2: { bg: 'rgba(180,188,200,0.08)', border: 'rgba(180,188,200,0.3)', color: '#B4BCC8', label: '🥈', size: '1.3rem' },
  3: { bg: 'rgba(176,109,60,0.1)', border: 'rgba(176,109,60,0.3)', color: '#B06D3C', label: '🥉', size: '1.2rem' },
};

function PointsBadge({ points }: { points: number }) {
  if (points === 5) return (
    <span className="rounded-full px-2 py-0.5 text-xs font-black"
      style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif' }}>
      ⭐ {points}
    </span>
  );
  if (points === 3) return (
    <span className="rounded-full px-2 py-0.5 text-xs font-black"
      style={{ background: 'rgba(0,200,122,0.1)', border: '1px solid rgba(0,200,122,0.25)', color: '#00C87A', fontFamily: 'Barlow Condensed, sans-serif' }}>
      ✓ {points}
    </span>
  );
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-bold"
      style={{ background: 'rgba(91,110,140,0.1)', border: '1px solid rgba(91,110,140,0.2)', color: '#5B6E8C', fontFamily: 'Barlow Condensed, sans-serif' }}>
      {points}
    </span>
  );
}

function TeamLogo({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed)
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-black shrink-0"
        style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.15)', color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.5rem' }}>
        {alt.slice(0, 3).toUpperCase()}
      </div>
    );
  return <img src={src} alt={alt} className="h-6 w-6 object-contain shrink-0" onError={() => setFailed(true)} />;
}

type PredCache = { data: MyPrediction[]; loading: boolean; error: boolean };

export default function LeaderboardTable({ entries, currentUserId, isAuthenticated }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, PredCache>>({});

  const toggle = useCallback((userId: string) => {
    if (!isAuthenticated) return;
    setExpandedId((prev) => {
      const next = prev === userId ? null : userId;
      if (next && !cache[userId]) {
        setCache((c) => ({ ...c, [userId]: { data: [], loading: true, error: false } }));
        fetchUserPredictions(userId)
          .then((data) => setCache((c) => ({ ...c, [userId]: { data, loading: false, error: false } })))
          .catch(() => setCache((c) => ({ ...c, [userId]: { data: [], loading: false, error: true } })));
      }
      return next;
    });
  }, [isAuthenticated, cache]);

  if (!entries.length) {
    return (
      <div className="py-20 text-center text-wc-muted">
        <div className="mb-4 text-5xl">🏆</div>
        <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem', letterSpacing: '0.05em' }}>
          Aún no hay posiciones. ¡Juega algunos partidos primero!
        </p>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const p1 = PODIUM_STYLES[1];
  const p2 = PODIUM_STYLES[2];
  const p3 = PODIUM_STYLES[3];

  return (
    <div>
      {/* ── Podium ── */}
      {top3.length >= 1 && (
        <>
          {/* Mobile: stacked list (shown below md) */}
          <div className="mb-8 flex flex-col gap-3 md:hidden">
            {top3.map((entry, i) => {
              const rank = (i + 1) as 1 | 2 | 3;
              const ps = PODIUM_STYLES[rank];
              return (
                <div key={entry.userId} className="flex items-center gap-4 rounded-xl px-4 py-3"
                  style={{ background: ps.bg, border: `1px solid ${ps.border}` }}>
                  <span className="text-3xl shrink-0">{ps.label}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-black leading-tight"
                      style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.05rem', color: ps.color, letterSpacing: '0.03em', textTransform: 'uppercase', wordBreak: 'break-word' }}>
                      {entry.name ?? entry.username}
                    </div>
                    {entry.name && (
                      <div className="text-xs mt-0.5" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#5B6E8C' }}>
                        @{entry.username}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: ps.color, lineHeight: 1 }}>
                      {entry.totalPoints}
                    </div>
                    <div className="text-xs text-wc-dim" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>PTS</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: tiered podium (shown from md up) */}
          <div className="mx-auto mb-10 hidden md:flex items-end justify-center gap-3 max-w-lg px-2">
            {/* 2nd place */}
            <div className="flex-1 min-w-0 flex flex-col items-center gap-2">
              <div className="text-3xl">{p2.label}</div>
              <div className="w-full rounded-xl p-3 text-center flex flex-col justify-center"
                style={{ background: p2.bg, border: `1px solid ${p2.border}`, minHeight: 115 }}>
                <div className="w-full mb-1 font-black"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.9rem', color: p2.color, letterSpacing: '0.03em', textTransform: 'uppercase', wordBreak: 'break-word', lineHeight: 1.25 }}>
                  {top3[1]?.name ?? top3[1]?.username ?? '—'}
                </div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: p2.color, lineHeight: 1 }}>
                  {top3[1]?.totalPoints ?? 0}
                </div>
                <div className="text-xs text-wc-dim mt-0.5" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>PTS</div>
              </div>
            </div>

            {/* 1st place — taller */}
            <div className="flex-1 min-w-0 flex flex-col items-center gap-2">
              <div className="text-4xl">{p1.label}</div>
              <div className="w-full rounded-xl p-3 text-center gold-glow flex flex-col justify-center"
                style={{ background: p1.bg, border: `1px solid ${p1.border}`, minHeight: 150 }}>
                <div className="w-full mb-1 font-black"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1rem', color: p1.color, letterSpacing: '0.03em', textTransform: 'uppercase', wordBreak: 'break-word', lineHeight: 1.25 }}>
                  {top3[0]?.name ?? top3[0]?.username ?? '—'}
                </div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: p1.color, lineHeight: 1 }}>
                  {top3[0]?.totalPoints ?? 0}
                </div>
                <div className="text-xs text-wc-dim mt-0.5" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>PTS</div>
              </div>
            </div>

            {/* 3rd place */}
            <div className="flex-1 min-w-0 flex flex-col items-center gap-2">
              <div className="text-3xl">{p3.label}</div>
              <div className="w-full rounded-xl p-3 text-center flex flex-col justify-center"
                style={{ background: p3.bg, border: `1px solid ${p3.border}`, minHeight: 100 }}>
                <div className="w-full mb-1 font-black"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.9rem', color: p3.color, letterSpacing: '0.03em', textTransform: 'uppercase', wordBreak: 'break-word', lineHeight: 1.25 }}>
                  {top3[2]?.name ?? top3[2]?.username ?? '—'}
                </div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: p3.color, lineHeight: 1 }}>
                  {top3[2]?.totalPoints ?? 0}
                </div>
                <div className="text-xs text-wc-dim mt-0.5" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>PTS</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Full table ── */}
      <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid #152136' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#0D1829', borderBottom: '1px solid #152136' }}>
              <th className="w-14 px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-wc-dim"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>#</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-wc-dim"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>Jugador</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-wc-dim"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>Puntos</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, idx) => {
              const isCurrentUser = e.userId === currentUserId;
              const isExpanded = expandedId === e.userId;
              const podium = PODIUM_STYLES[e.rank];
              const pred = cache[e.userId];
              const nameParam = encodeURIComponent(e.name ?? e.username);
              const usernameParam = encodeURIComponent(e.username);
              const viewAllHref = `/player/${e.userId}?name=${nameParam}&username=${usernameParam}`;

              // Stats from cached data
              const finishedPreds = pred?.data ?? [];
              const exactHits = finishedPreds.filter((p) => p.pointsEarned === 5).length;
              const correctOutcome = finishedPreds.filter((p) => p.pointsEarned === 3).length;
              const accuracy = finishedPreds.length > 0
                ? Math.round(((exactHits + correctOutcome) / finishedPreds.length) * 100)
                : 0;
              const last5 = [...finishedPreds]
                .sort((a, b) => {
                  const tA = a.match ? new Date(a.match.kickoffTime).getTime() : 0;
                  const tB = b.match ? new Date(b.match.kickoffTime).getTime() : 0;
                  return tB - tA;
                })
                .slice(0, 5);

              return (
                <>
                  <tr key={e.userId}
                    onClick={() => toggle(e.userId)}
                    className="transition-colors"
                    style={{
                      borderBottom: isExpanded ? 'none' : idx < entries.length - 1 ? '1px solid rgba(21,33,54,0.8)' : 'none',
                      background: isExpanded
                        ? 'rgba(21,33,54,0.6)'
                        : isCurrentUser ? 'rgba(0,200,122,0.04)' : 'transparent',
                      cursor: isAuthenticated ? 'pointer' : 'default',
                    }}
                    onMouseEnter={(ev) => {
                      if (!isAuthenticated) return;
                      if (!isExpanded && !isCurrentUser) (ev.currentTarget as HTMLElement).style.background = 'rgba(21,33,54,0.4)';
                    }}
                    onMouseLeave={(ev) => {
                      if (!isAuthenticated) return;
                      if (!isExpanded && !isCurrentUser) (ev.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <td className="px-4 py-3.5 text-sm">
                      {podium ? (
                        <span style={{ fontSize: '1.1rem' }}>{podium.label}</span>
                      ) : (
                        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.95rem', fontWeight: 700, color: '#2A3A52' }}>{e.rank}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black"
                          style={{
                            background: isCurrentUser ? 'rgba(0,200,122,0.12)' : podium ? `${podium.color}15` : 'rgba(21,33,54,0.8)',
                            border: `1px solid ${isCurrentUser ? 'rgba(0,200,122,0.3)' : podium ? `${podium.color}30` : 'rgba(21,33,54,1)'}`,
                            color: isCurrentUser ? '#00C87A' : podium ? podium.color : '#5B6E8C',
                            fontFamily: 'Barlow Condensed, sans-serif',
                            fontSize: '0.8rem',
                          }}>
                          {(e.name ?? e.username)[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-bold"
                              style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1rem', color: isCurrentUser ? '#00C87A' : '#E8EDF5', letterSpacing: '0.03em' }}>
                              {e.name ?? e.username}
                            </span>
                            {isCurrentUser && (
                              <span className="text-xs font-bold"
                                style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(0,200,122,0.7)', letterSpacing: '0.08em' }}>
                                TÚ
                              </span>
                            )}
                          </div>
                          {e.name && (
                            <span className="block text-xs" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#5B6E8C', letterSpacing: '0.04em' }}>
                              @{e.username}
                            </span>
                          )}
                        </div>
                        {isAuthenticated && (
                          <span className="shrink-0 text-wc-dim transition-transform duration-200"
                            style={{ fontSize: '0.65rem', display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                            ▼
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: podium ? podium.color : isCurrentUser ? '#00C87A' : '#E8EDF5', letterSpacing: '0.05em' }}>
                        {e.totalPoints}
                      </span>
                      <span className="ml-1 text-xs text-wc-dim" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>PTS</span>
                    </td>
                  </tr>

                  {/* ── Expanded panel ── */}
                  {isExpanded && (
                    <tr key={`${e.userId}-exp`}
                      style={{ borderBottom: idx < entries.length - 1 ? '1px solid rgba(21,33,54,0.8)' : 'none' }}>
                      <td colSpan={3} className="px-4 pb-4 pt-1" style={{ background: 'rgba(21,33,54,0.6)' }}>

                        {pred?.loading && (
                          <div className="space-y-2 pt-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'rgba(13,24,41,0.6)' }} />
                            ))}
                          </div>
                        )}

                        {pred?.error && (
                          <p className="py-3 text-center text-xs text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                            No se pudieron cargar los pronósticos.
                          </p>
                        )}

                        {!pred?.loading && !pred?.error && pred?.data.length === 0 && (
                          <p className="py-3 text-center text-xs text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                            Aún no hay pronósticos en partidos finalizados.
                          </p>
                        )}

                        {!pred?.loading && !pred?.error && pred && pred.data.length > 0 && (
                          <div className="space-y-3 pt-2">
                            {/* Mini stats bar */}
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { label: 'PTS', value: e.totalPoints, color: '#F5A623' },
                                { label: 'EXACTOS', value: exactHits, color: '#F5A623' },
                                { label: 'RESULT.', value: correctOutcome, color: '#00C87A' },
                                { label: 'ACIERTOS', value: `${accuracy}%`, color: '#E8EDF5' },
                              ].map(({ label, value, color }) => (
                                <div key={label} className="rounded-lg py-2 text-center" style={{ background: '#0D1829', border: '1px solid #152136' }}>
                                  <div className="font-black tabular-nums" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.15rem', color, letterSpacing: '0.05em', lineHeight: 1 }}>{value}</div>
                                  <div className="font-bold text-wc-muted mt-0.5" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', fontSize: '0.6rem', textTransform: 'uppercase' }}>{label}</div>
                                </div>
                              ))}
                            </div>

                            {/* Last 5 predictions */}
                            <div>
                              <p className="mb-2 text-xs font-bold text-wc-dim uppercase"
                                style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
                                Últimos 5 pronósticos
                              </p>
                              <div className="space-y-1.5">
                                {last5.map((p) => {
                                  const m = p.match;
                                  return (
                                    <div key={p.matchId} className="flex items-center gap-2 rounded-lg px-3 py-2"
                                      style={{ background: '#0D1829', border: `1px solid ${p.match?.status === 'live' ? 'rgba(240,62,62,0.3)' : '#152136'}` }}>
                                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                        {p.match?.status === 'live' && (
                                          <span className="h-1.5 w-1.5 animate-pulse rounded-full shrink-0" style={{ background: '#F03E3E' }} />
                                        )}
                                        <TeamLogo src={m?.homeLogoUrl ?? null} alt={m?.homeTeam ?? '?'} />
                                        <span className="text-xs font-bold text-wc-text truncate uppercase"
                                          style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.02em' }}>
                                          {m?.homeTeam ?? '?'}
                                        </span>
                                      </div>
                                      <div className="shrink-0 px-2 space-y-0.5">
                                        <div className="flex items-baseline gap-1.5">
                                          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.58rem', fontWeight: 700, color: '#F5A623', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>PRON.</span>
                                          <span className="font-black tabular-nums"
                                            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: '#E8EDF5', letterSpacing: '0.05em', lineHeight: 1 }}>
                                            {p.homeScorePredicted}–{p.awayScorePredicted}
                                          </span>
                                        </div>
                                        {m && m.homeScoreActual !== null && (
                                          <div className="flex items-baseline gap-1.5">
                                            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.58rem', fontWeight: 700, color: '#5B6E8C', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>REAL</span>
                                            <span className="tabular-nums"
                                              style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.85rem', color: '#5B6E8C', letterSpacing: '0.03em', lineHeight: 1 }}>
                                              {m.homeScoreActual}–{m.awayScoreActual}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                                        <span className="text-xs font-bold text-wc-text truncate uppercase text-right"
                                          style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.02em' }}>
                                          {m?.awayTeam ?? '?'}
                                        </span>
                                        <TeamLogo src={m?.awayLogoUrl ?? null} alt={m?.awayTeam ?? '?'} />
                                      </div>
                                      <div className="shrink-0 ml-1">
                                        <PointsBadge points={p.pointsEarned} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Ver Todo */}
                            <div className="flex justify-end">
                              <Link to={viewAllHref}
                                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-black uppercase transition-opacity hover:opacity-80"
                                style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}
                                onClick={(ev) => ev.stopPropagation()}>
                                Ver todos los pronósticos →
                              </Link>
                            </div>
                          </div>
                        )}

                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

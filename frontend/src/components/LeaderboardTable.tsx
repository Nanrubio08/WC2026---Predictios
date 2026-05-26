import type { LeaderboardEntry } from '../types';

interface Props {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

const PODIUM_STYLES: Record<number, { bg: string; border: string; color: string; label: string; size: string }> = {
  1: { bg: 'rgba(245,166,35,0.12)', border: 'rgba(245,166,35,0.4)', color: '#F5A623', label: '🥇', size: '1.5rem' },
  2: { bg: 'rgba(180,188,200,0.08)', border: 'rgba(180,188,200,0.3)', color: '#B4BCC8', label: '🥈', size: '1.3rem' },
  3: { bg: 'rgba(176,109,60,0.1)', border: 'rgba(176,109,60,0.3)', color: '#B06D3C', label: '🥉', size: '1.2rem' },
};

export default function LeaderboardTable({ entries, currentUserId }: Props) {
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
        <div className="mx-auto mb-10 flex items-end justify-center gap-3 max-w-lg px-2">
          {/* 2nd place */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="text-3xl">{p2.label}</div>
            <div className="w-full rounded-xl p-3 text-center"
              style={{ background: p2.bg, border: `1px solid ${p2.border}`, minHeight: 100 }}>
              <div className="mb-1 font-black truncate" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.05rem', color: p2.color, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                {top3[1]?.name ?? top3[1]?.username ?? '—'}
              </div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: p2.color, lineHeight: 1 }}>
                {top3[1]?.totalPoints ?? 0}
              </div>
              <div className="text-xs text-wc-dim mt-0.5" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>PTS</div>
            </div>
          </div>

          {/* 1st place — taller */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="text-4xl">{p1.label}</div>
            <div className="w-full rounded-xl p-3 text-center gold-glow"
              style={{ background: p1.bg, border: `1px solid ${p1.border}`, minHeight: 130 }}>
              <div className="mb-1 font-black truncate" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.15rem', color: p1.color, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                {top3[0]?.name ?? top3[0]?.username ?? '—'}
              </div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: p1.color, lineHeight: 1 }}>
                {top3[0]?.totalPoints ?? 0}
              </div>
              <div className="text-xs text-wc-dim mt-0.5" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>PTS</div>
            </div>
          </div>

          {/* 3rd place */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="text-3xl">{p3.label}</div>
            <div className="w-full rounded-xl p-3 text-center"
              style={{ background: p3.bg, border: `1px solid ${p3.border}`, minHeight: 90 }}>
              <div className="mb-1 font-black truncate" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.05rem', color: p3.color, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                {top3[2]?.name ?? top3[2]?.username ?? '—'}
              </div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: p3.color, lineHeight: 1 }}>
                {top3[2]?.totalPoints ?? 0}
              </div>
              <div className="text-xs text-wc-dim mt-0.5" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>PTS</div>
            </div>
          </div>
        </div>
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
              const podium = PODIUM_STYLES[e.rank];

              return (
                <tr key={e.userId}
                  className="transition-colors"
                  style={{
                    borderBottom: idx < entries.length - 1 ? '1px solid rgba(21,33,54,0.8)' : 'none',
                    background: isCurrentUser ? 'rgba(0,200,122,0.04)' : 'transparent',
                  }}
                  onMouseEnter={(ev) => { if (!isCurrentUser) (ev.currentTarget as HTMLElement).style.background = 'rgba(21,33,54,0.4)'; }}
                  onMouseLeave={(ev) => { if (!isCurrentUser) (ev.currentTarget as HTMLElement).style.background = 'transparent'; }}
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
                      <div>
                        <span className="text-sm font-bold"
                          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1rem', color: isCurrentUser ? '#00C87A' : '#E8EDF5', letterSpacing: '0.03em' }}>
                          {e.name ?? e.username}
                        </span>
                        {e.name && (
                          <span className="block text-xs" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#5B6E8C', letterSpacing: '0.04em' }}>
                            @{e.username}
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs font-bold"
                            style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'rgba(0,200,122,0.7)', letterSpacing: '0.08em' }}>
                            TÚ
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: podium ? podium.color : isCurrentUser ? '#00C87A' : '#E8EDF5', letterSpacing: '0.05em' }}>
                      {e.totalPoints}
                    </span>
                    <span className="ml-1 text-xs text-wc-dim" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>PTS</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


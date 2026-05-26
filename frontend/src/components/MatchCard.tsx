import { useState, useEffect } from 'react';
import type { Match } from '../types';
import PredictionForm from './PredictionForm';

interface Props {
  match: Match;
  isAuthenticated?: boolean;
}

function StatusBadge({ status }: { status: Match['status'] }) {
  if (status === 'live') {
    return (
      <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wider"
        style={{ background: 'rgba(240,62,62,0.12)', border: '1px solid rgba(240,62,62,0.3)', color: '#F03E3E', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em' }}>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: '#F03E3E' }} />
        EN VIVO
      </span>
    );
  }
  if (status === 'finished') {
    return (
      <span className="rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
        style={{ background: 'rgba(91,110,140,0.15)', border: '1px solid rgba(91,110,140,0.2)', color: '#5B6E8C', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em' }}>
        FINAL
      </span>
    );
  }
  return (
    <span className="rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
      style={{ background: 'rgba(0,200,122,0.08)', border: '1px solid rgba(0,200,122,0.2)', color: '#00C87A', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em' }}>
    PRÓXIMO
    </span>
  );
}

function TeamLogo({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-black"
        style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.15)', color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.7rem' }}>
        {alt.slice(0, 3).toUpperCase()}
      </div>
    );
  }
  return <img src={src} alt={alt} className="h-10 w-10 object-contain" onError={() => setFailed(true)} />;
}

const LOCK_MINUTES = 30;

function useCountdown(kickoffTime: string) {
  const lockMs = new Date(kickoffTime).getTime() - LOCK_MINUTES * 60 * 1000;

  const getRemaining = () => {
    const diff = lockMs - Date.now();
    return diff > 0 ? diff : 0;
  };

  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (r <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [kickoffTime]);

  return remaining;
}

function CountdownTimer({ kickoffTime }: { kickoffTime: string }) {
  const remaining = useCountdown(kickoffTime);

  if (remaining <= 0) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isUrgent = remaining < 30 * 60 * 1000; // less than 30min
  const color = isUrgent ? '#F03E3E' : '#F5A623';

  const pad = (n: number) => String(n).padStart(2, '0');
  const display = hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;

  return (
    <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"
      style={{ background: isUrgent ? 'rgba(240,62,62,0.08)' : 'rgba(245,166,35,0.06)', border: `1px solid ${isUrgent ? 'rgba(240,62,62,0.2)' : 'rgba(245,166,35,0.15)'}`, color, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
      <span>⏱</span>
      <span className="font-bold">CIERRE EN {display}</span>
    </div>
  );
}

export default function MatchCard({ match, isAuthenticated }: Props) {
  const kickoff = new Date(match.kickoffTime);
  const dateStr = kickoff.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = kickoff.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const canPredict = match.status === 'scheduled' && isAuthenticated;
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const hasScore = match.homeScoreActual !== null && match.awayScoreActual !== null;

  return (
    <div className="match-card group">
      {/* Top accent line for live matches */}
      {isLive && (
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #F03E3E 30%, #F03E3E 70%, transparent)' }} />
      )}
      {!isLive && (
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.2) 30%, rgba(245,166,35,0.2) 70%, transparent)' }} />
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="mb-4 flex items-center justify-between">
          <StatusBadge status={match.status} />
          <div className="text-right">
            <div className="text-xs font-semibold text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>{dateStr}</div>
            <div className="text-xs text-wc-dim">{timeStr}</div>
          </div>
        </div>

        {/* Teams + score */}
        <div className="flex items-center justify-between gap-3">
          {/* Home team */}
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <TeamLogo src={match.homeLogoUrl} alt={match.homeTeam} />
            <span className="text-center text-xs font-bold leading-tight text-wc-text w-full"
              style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.8rem', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              {match.homeTeam}
            </span>
          </div>

          {/* Score / VS */}
          <div className="shrink-0 flex flex-col items-center">
            {(isFinished || isLive) && hasScore ? (
              <div className="rounded-xl px-4 py-2 text-center tabular-nums"
                style={{
                  background: isLive ? 'rgba(240,62,62,0.08)' : 'rgba(245,166,35,0.06)',
                  border: `1px solid ${isLive ? 'rgba(240,62,62,0.2)' : 'rgba(245,166,35,0.15)'}`,
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '1.8rem',
                  letterSpacing: '0.05em',
                  color: isLive ? '#F03E3E' : '#E8EDF5',
                  lineHeight: 1,
                }}>
                {match.homeScoreActual} <span style={{ color: isLive ? 'rgba(240,62,62,0.5)' : 'rgba(232,237,245,0.3)' }}>–</span> {match.awayScoreActual}
              </div>
            ) : (
              <div className="rounded-xl px-5 py-2"
                style={{ background: 'rgba(21,33,54,0.5)', border: '1px solid #152136' }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#2A3A52', letterSpacing: '0.1em' }}>VS</span>
              </div>
            )}
          </div>

          {/* Away team */}
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <TeamLogo src={match.awayLogoUrl} alt={match.awayTeam} />
            <span className="text-center text-xs font-bold leading-tight text-wc-text w-full"
              style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.8rem', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              {match.awayTeam}
            </span>
          </div>
        </div>

        {/* Countdown to lock */}
        {match.status === 'scheduled' && (
          <CountdownTimer kickoffTime={match.kickoffTime} />
        )}

        {/* User's prediction */}
        {match.userPrediction && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs"
            style={{ background: 'rgba(0,200,122,0.07)', border: '1px solid rgba(0,200,122,0.18)', color: '#00C87A', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
            <span>🎯</span>
            <span className="font-bold">TU PRONÓSTICO: {match.userPrediction.homeScorePredicted} – {match.userPrediction.awayScorePredicted}</span>
          </div>
        )}

        {/* Prediction form */}
        {canPredict && (
          <div className="mt-4" style={{ borderTop: '1px solid #152136', paddingTop: '0.75rem' }}>
            <p className="mb-2 text-center text-xs text-wc-dim"
              style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Ingresa tu pronóstico
            </p>
            <PredictionForm
              matchId={match.id}
              initialHome={match.userPrediction?.homeScorePredicted}
              initialAway={match.userPrediction?.awayScorePredicted}
            />
          </div>
        )}

        {/* Login to predict */}
        {match.status === 'scheduled' && !isAuthenticated && (
          <div className="mt-4 text-center" style={{ borderTop: '1px solid #152136', paddingTop: '0.75rem' }}>
            <button
              className="text-xs font-bold uppercase tracking-wider transition-colors hover:text-wc-gold"
              style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em', color: 'rgba(245,166,35,0.6)' }}
              onClick={() => document.querySelector<HTMLButtonElement>('[data-auth-trigger]')?.click()}
            >
              Inicia sesión para predecir →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


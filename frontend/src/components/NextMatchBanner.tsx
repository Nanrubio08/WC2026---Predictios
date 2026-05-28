import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchMatches } from '../services/api';
import type { Match } from '../types';

const SLIDE_HEIGHT = 220; // px — explicit height keeps layout reliable

// ── Tournament stage slides ──────────────────────────────────────────────────
const STAGE_SLIDES = [
  { emoji: '⚽', title: 'Fase de Grupos',    dates: '12 Jun – 2 Jul · 2026',  detail: '72 partidos · 48 selecciones · 3 países', accent: '#F5A623', bg: 'rgba(245,166,35,0.08)' },
  { emoji: '🔥', title: 'Ronda de 32',       dates: '4 – 8 Jul · 2026',       detail: 'Los mejores 32 equipos se enfrentan',       accent: '#00C87A', bg: 'rgba(0,200,122,0.08)' },
  { emoji: '⚡', title: 'Octavos de Final',  dates: '11 – 14 Jul · 2026',     detail: 'Eliminación directa · 16 equipos',          accent: '#4FC3F7', bg: 'rgba(79,195,247,0.08)' },
  { emoji: '🏅', title: 'Cuartos de Final',  dates: '18 – 19 Jul · 2026',     detail: 'Solo los 8 mejores del torneo',              accent: '#CE93D8', bg: 'rgba(206,147,216,0.08)' },
  { emoji: '🌟', title: 'Semifinales',       dates: '22 – 23 Jul · 2026',     detail: 'A un paso de la gloria mundial',             accent: '#F5A623', bg: 'rgba(245,166,35,0.08)' },
  { emoji: '🏆', title: 'La Gran Final',     dates: '26 Jul · 2026',          detail: 'MetLife Stadium · Nueva Jersey',             accent: '#FFD700', bg: 'rgba(255,215,0,0.08)' },
];

// ── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(iso: string | null) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0, past: true });
  useEffect(() => {
    if (!iso) return;
    const calc = () => {
      const diff = new Date(iso).getTime() - Date.now();
      if (diff <= 0) { setT({ d: 0, h: 0, m: 0, s: 0, past: true }); return; }
      setT({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff % 86_400_000) / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
        past: false,
      });
    };
    calc();
    const id = setInterval(calc, 1_000);
    return () => clearInterval(id);
  }, [iso]);
  return t;
}

function TimeUnit({ v, label }: { v: number; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.55rem', lineHeight: 1, color: '#F5A623', textShadow: '0 0 10px rgba(245,166,35,0.5)', minWidth: '2ch', textAlign: 'center' }}>
        {String(v).padStart(2, '0')}
      </span>
      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.55rem', letterSpacing: '0.12em', color: '#5B6E8C', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}

const SEP = <span style={{ color: 'rgba(245,166,35,0.35)', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', lineHeight: 1, alignSelf: 'flex-start', marginTop: 2 }}>:</span>;

// ── Next-match slide ─────────────────────────────────────────────────────────
function MatchSlide({ match }: { match: Match }) {
  const cd = useCountdown(match.kickoffTime);
  const d  = new Date(match.kickoffTime);
  const dateStr = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ height: SLIDE_HEIGHT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px' }}>
      {/* Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 99, padding: '2px 12px' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F5A623', display: 'inline-block', animation: 'pulse 2s infinite' }} />
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.62rem', letterSpacing: '0.18em', color: '#F5A623', textTransform: 'uppercase' }}>
          Próximo Partido · {match.stage ?? 'Fase de Grupos'}{match.group ? ` · ${match.group}` : ''}
        </span>
      </div>

      {/* Teams row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' }}>
        {/* Home */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
          {match.homeLogoUrl
            ? <img src={match.homeLogoUrl} alt={match.homeTeam} style={{ width: 40, height: 40, objectFit: 'contain' }} />
            : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>⚽</div>
          }
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#E8EDF5', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.04em', maxWidth: 72 }}>
            {match.homeTeam}
          </span>
        </div>

        {/* VS + datetime */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: '#3A4A60', letterSpacing: '0.1em' }}>VS</span>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.63rem', color: '#A0B0C8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{dateStr}</span>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.68rem', color: '#F5A623', letterSpacing: '0.05em' }}>{timeStr}</span>
        </div>

        {/* Away */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
          {match.awayLogoUrl
            ? <img src={match.awayLogoUrl} alt={match.awayTeam} style={{ width: 40, height: 40, objectFit: 'contain' }} />
            : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>⚽</div>
          }
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#E8EDF5', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.04em', maxWidth: 72 }}>
            {match.awayTeam}
          </span>
        </div>
      </div>

      {/* Countdown */}
      {!cd.past && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, background: 'rgba(13,24,41,0.85)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: 12, padding: '6px 14px' }}>
          {cd.d > 0 && <><TimeUnit v={cd.d} label="días" />{SEP}</>}
          <TimeUnit v={cd.h} label="hrs" />{SEP}
          <TimeUnit v={cd.m} label="min" />{SEP}
          <TimeUnit v={cd.s} label="seg" />
        </div>
      )}

      {/* Link */}
      <Link to="/matches" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F5A623', background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 99, padding: '3px 14px' }}>
        Predice ahora →
      </Link>
    </div>
  );
}

// ── Stage slide ──────────────────────────────────────────────────────────────
function StageSlide({ s }: { s: typeof STAGE_SLIDES[0] }) {
  return (
    <div style={{ height: SLIDE_HEIGHT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 24px', textAlign: 'center' }}>
      <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>{s.emoji}</span>
      <div style={{ background: s.bg, border: `1px solid ${s.accent}40`, borderRadius: 99, padding: '2px 12px' }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.6rem', letterSpacing: '0.18em', color: s.accent, textTransform: 'uppercase' }}>Próximamente</span>
      </div>
      <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '1.35rem', letterSpacing: '0.06em', color: '#E8EDF5', textTransform: 'uppercase', lineHeight: 1.1, margin: 0 }}>
        {s.title}
      </h3>
      <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.82rem', letterSpacing: '0.08em', color: s.accent, textTransform: 'uppercase', margin: 0 }}>
        {s.dates}
      </p>
      <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: '0.76rem', color: '#5B6E8C', margin: 0 }}>
        {s.detail}
      </p>
    </div>
  );
}

// ── Main banner ──────────────────────────────────────────────────────────────
export default function NextMatchBanner() {
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [current, setCurrent]     = useState(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchMatches()
      .then((matches) => {
        const now = Date.now();
        const nxt = matches
          .filter((m) => m.status === 'scheduled' && new Date(m.kickoffTime).getTime() > now)
          .sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime())[0] ?? null;
        setNextMatch(nxt);
      })
      .catch(() => {});
  }, []);

  // Build slides array — match first (when available), then stages
  const slides: JSX.Element[] = [
    ...(nextMatch ? [<MatchSlide key="match" match={nextMatch} />] : []),
    ...STAGE_SLIDES.map((s, i) => <StageSlide key={i} s={s} />),
  ];
  const total = slides.length;

  const goTo = (idx: number) => setCurrent((idx + total) % total);

  // Auto-advance every 3 s
  const startAuto = () => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => setCurrent((c) => (c + 1) % total), 6_000);
  };
  useEffect(() => { startAuto(); return () => { if (autoRef.current) clearInterval(autoRef.current); }; }, [total]);

  // Touch swipe
  const tx = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { tx.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (tx.current === null) return;
    const dx = e.changedTouches[0].clientX - tx.current;
    tx.current = null;
    if (Math.abs(dx) < 40) return;
    if (autoRef.current) clearInterval(autoRef.current);
    goTo(dx < 0 ? current + 1 : current - 1);
    startAuto();
  };

  return (
    <div
      style={{
        background: 'rgba(8,15,28,0.97)',
        borderTop: '1px solid rgba(245,166,35,0.15)',
        borderBottom: '1px solid rgba(245,166,35,0.15)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Gold accent line */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #F5A623 30%, #FFD166 50%, #F5A623 70%, transparent)', opacity: 0.55 }} />

      {/* Viewport */}
      <div style={{ overflow: 'hidden', height: SLIDE_HEIGHT }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {/* Track */}
        <div
          style={{
            display: 'flex',
            width: `${total * 100}%`,
            height: SLIDE_HEIGHT,
            transform: `translateX(-${(current * 100) / total}%)`,
            transition: 'transform 0.42s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {slides.map((slide, i) => (
            <div key={i} style={{ width: `${100 / total}%`, flexShrink: 0, height: SLIDE_HEIGHT }}>
              {slide}
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators + prev/next buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, paddingBottom: 10 }}>
        {/* Prev button */}
        <button
          onClick={() => { if (autoRef.current) clearInterval(autoRef.current); goTo(current - 1); startAuto(); }}
          aria-label="Anterior"
          style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#F5A623', flexShrink: 0, transition: 'background 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245,166,35,0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(245,166,35,0.1)')}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M6.5 2L3.5 5l3 3" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        {/* Dots */}
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { if (autoRef.current) clearInterval(autoRef.current); goTo(i); startAuto(); }}
            aria-label={`Slide ${i + 1}`}
            style={{
              width: i === current ? 18 : 6,
              height: 6,
              borderRadius: 99,
              background: i === current ? '#F5A623' : 'rgba(245,166,35,0.2)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'width 0.3s, background 0.3s',
            }}
          />
        ))}

        {/* Next button */}
        <button
          onClick={() => { if (autoRef.current) clearInterval(autoRef.current); goTo(current + 1); startAuto(); }}
          aria-label="Siguiente"
          style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#F5A623', flexShrink: 0, transition: 'background 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245,166,35,0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(245,166,35,0.1)')}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 2l3 3-3 3" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}

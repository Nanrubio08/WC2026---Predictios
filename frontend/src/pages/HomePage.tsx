import { Link } from 'react-router-dom';

const STADIUM_IMG   = '/images/equipos.jpg';
const STADIUM_NIGHT = '/images/copa_4.jpg';
const ACTION_IMG    = '/images/lucho2.webp';
const FANS_IMG      = '/images/seleccion.jpg';
const BALL_IMG      = '/images/stadium.jpg';

const tickerItems = [
  '⚽ 72 partidos de fase de grupos',
  '🌎 3 países anfitriones · USA · Canadá · México',
  '🏟️ 16 ciudades sede',
  '🌍 48 selecciones en competencia',
  '🏆 El evento más visto del planeta',
  '🎯 5 puntos por marcador exacto',
  '⚡ Las predicciones cierran 30 min antes del pitido inicial',
  '🥇 El TOP 3 de mejores puntuaciones ganarán premios',
];

const steps = [
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10">
        <circle cx="24" cy="24" r="20" stroke="#F5A623" strokeWidth="2" fill="rgba(245,166,35,0.08)" />
        <path d="M16 24h16M24 16v16" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M14 32l4-4M34 32l-4-4" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
    step: '01',
    title: 'Regístrate',
    description: 'Crea tu cuenta gratis en segundos. Sin tarjeta de crédito. Sin complicaciones.',
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10">
        <circle cx="24" cy="24" r="18" stroke="#F5A623" strokeWidth="2" fill="rgba(245,166,35,0.08)"/>
        <circle cx="24" cy="24" r="6" fill="#F5A623" opacity="0.6"/>
        <path d="M24 6v6M24 36v6M6 24h6M36 24h6" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10.9 10.9l4.2 4.2M32.9 32.9l4.2 4.2M37.1 10.9l-4.2 4.2M15.1 32.9l-4.2 4.2" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
    step: '02',
    title: 'Predice',
    description: 'Elige el marcador exacto para cada partido. Las predicciones se cierran 30 minutos antes del pitido inicial.',
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10">
        <path d="M24 6L18 18H6l10 7.3L12 38l12-8.7 12 8.7-4-12.7L42 18H30L24 6z" fill="rgba(245,166,35,0.15)" stroke="#F5A623" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M24 12l4 8h8l-6.5 4.7 2.5 7.7L24 27l-8 5.4 2.5-7.7L12 20h8l4-8z" fill="#F5A623" opacity="0.4"/>
      </svg>
    ),
    step: '03',
    title: 'Domina',
    description: 'Suma puntos con cada predicción acertada. Sube en la tabla de posiciones en vivo tras el pitido final.',
  },
];

const scoringRows = [
  { result: 'Marcador exacto', example: 'Eliges 2-1 · Final 2-1', points: 5, width: '100%', color: '#F5A623', glow: 'rgba(245,166,35,0.3)' },
  { result: 'Resultado correcto', example: 'Eliges 2-1 · Final 3-1 (local gana)', points: 3, width: '60%', color: '#00C87A', glow: 'rgba(0,200,122,0.3)' },
  { result: 'Predicción incorrecta', example: 'Eliges 2-1 · Final 1-1 (empate)', points: 0, width: '0%', color: '#5B6E8C', glow: 'transparent' },
];

const goldenBallRow = { result: '🏆 Gol de Oro', example: 'Eliges el campeón del torneo', points: 30, width: '100%', color: '#FFD700', glow: 'rgba(255,215,0,0.4)' };

const faqs = [
  { q: '¿Cuándo se cierran las predicciones?', a: '30 minutos antes del horario oficial del partido. Después de eso, el formulario desaparece y no se aceptan cambios.' },
  { q: '¿Puedo modificar mi predicción?', a: 'Sí, todas las veces que quieras hasta que se cierre la ventana de predicción.' },
  { q: '¿Cuándo se asignan los puntos?', a: 'Automáticamente una vez que el partido finaliza y se confirma el marcador final.' },
  { q: '¿Qué cuenta como resultado correcto?', a: 'Victoria local, victoria visitante o empate — según el resultado a los 90 minutos. No se tienen en cuenta el alargue ni los penaltis.' },
  { q: '¿Qué es el Gol de Oro?', a: 'Una predicción especial: eliges que selección ganará el Mundial 2026. Si aciertas, sumas 30 puntos bonus de golpe. Puedes cambiar tu elección hasta el 17 de junio a las 23:59. Después de esa fecha queda bloqueada.' },
];

const stats = [
  { value: '72', label: 'Partidos de grupo' },
  { value: '48', label: 'Selecciones' },
  { value: '3', label: 'Países anfitriones' },
  { value: '5', label: 'Puntos por Marcador exacto' },
];

//function WC2026SVGLogo() {
  //return (
    //<div className="flex flex-col items-center">
      //<img src="/images/logomundial.jpg" alt="Logo Mundial 2026" className="h-48 w-48 sm:h-56 sm:w-56 object-contain" />
    //</div>
  //);
//}

export default function HomePage() {
  const tickerContent = [...tickerItems, ...tickerItems];

  return (
    <div className="mx-auto max-w-5xl space-y-0">

      {/* ── Hero ── */}
      <section className="relative -mx-4 overflow-hidden sm:-mx-0 sm:mt-4 sm:rounded-3xl" style={{ minHeight: '88vh' }}>
        {/* Background image */}
        <img src={STADIUM_NIGHT} alt="Stadium at night" className="absolute inset-0 h-full w-full object-cover object-center" />
        {/* Layered overlays */}
        <div className="hero-gradient absolute inset-0" />
        <div className="hero-radial absolute inset-0" />
        {/* Subtle noise */}
        <div className="relative flex flex-col items-center px-6 py-16 text-center sm:py-24 lg:py-32">

          {/* Tournament badge chip */}
          <div className="animate-fade-in-up delay-200 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623' }}>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: '#F5A623' }} />
            Juego de predicciones · Mundial 2026
          </div>

          {/* Main title */}
          <h1 className="animate-fade-in-up delay-300 mb-3 leading-none text-shadow-gold"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 'clamp(4rem, 12vw, 8rem)', color: '#E8EDF5', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            MUNDIAL DE<br />
            <span className="text-gold-shimmer">FUTBOL 2026</span>
          </h1>

          <p className="animate-fade-in-up delay-400 mx-auto mb-8 max-w-lg text-lg font-medium text-wc-muted sm:text-xl" style={{ fontFamily: 'Barlow, sans-serif' }}>
            Predice el marcador. Gánate la gloria.<br className="hidden sm:block" />
            Compite con tus amigos en la tabla de posiciones en vivo.
          </p>

          <div className="animate-fade-in-up delay-500 flex flex-wrap justify-center gap-3 mb-12">
            <Link to="/matches" className="btn-primary px-8 py-3 text-base">
              ⚽ Empieza a predecir
            </Link>
            <Link to="/leaderboard" className="btn-outline px-8 py-3 text-base">
              🏆 Tabla de posiciones
            </Link>
          </div>

          {/* Quick stats */}
          <div className="animate-fade-in-up delay-600 flex flex-wrap justify-center gap-8 sm:gap-14">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-shadow-gold leading-none"
                  style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.8rem', color: '#F5A623' }}>
                  {s.value}
                </div>
                <div className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-wc-muted"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: 'linear-gradient(to bottom, transparent, #04070E)' }} />
      </section>

      {/* ── Ticker tape ── */}
      <div className="overflow-hidden py-4" style={{ background: 'rgba(245,166,35,0.06)', borderTop: '1px solid rgba(245,166,35,0.12)', borderBottom: '1px solid rgba(245,166,35,0.12)' }}>
        <div className="ticker-track flex gap-12 px-4">
          {tickerContent.map((item, i) => (
            <span key={i} className="shrink-0 text-sm font-semibold" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#F5A623', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section className="space-y-8 px-2 pt-16">
        <div className="text-center">
          <h2 className="leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', color: '#E8EDF5', textTransform: 'uppercase' }}>
            ¿CÓMO <span className="text-gold-shimmer">FUNCIONA</span>?
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {steps.map((step, idx) => (
            <div key={step.step} className="card-pitch group relative overflow-hidden transition-all duration-300 hover:border-wc-border-bright hover:-translate-y-1"
              style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="absolute -right-3 -top-4 select-none leading-none"
                style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '5rem', color: 'rgba(245,166,35,0.07)', fontWeight: 900 }}>
                {step.step}
              </div>
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.15)' }}>
                  {step.icon}
                </div>
                <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#E8EDF5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-wc-muted">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Photo mosaic ── */}
      <section className="px-2 pt-14">
        <div className="grid grid-cols-12 grid-rows-2 gap-3" style={{ height: 360 }}>
          {/* Large left image */}
          <div className="col-span-7 row-span-2 relative overflow-hidden rounded-2xl">
            <img src={STADIUM_IMG} alt="Stadium" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(4,7,14,0.5) 0%, transparent 60%)' }} />
            <div className="absolute bottom-4 left-4">
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#F5A623', letterSpacing: '0.2em' }}>El Futbol nos une</div>
              <div className="text-xl font-bold text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Juntos por una pasión</div>
            </div>
          </div>
          {/* Top right */}
          <div className="col-span-5 row-span-1 relative overflow-hidden rounded-2xl">
            <img src={ACTION_IMG} alt="Soccer action" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(4,7,14,0.7) 0%, transparent 60%)' }} />
            <span className="absolute bottom-3 left-3 text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#F5A623', letterSpacing: '0.15em' }}>Predice marcadores</span>
          </div>
          {/* Bottom right */}
          <div className="col-span-5 row-span-1 relative overflow-hidden rounded-2xl">
            <img src={FANS_IMG} alt="Hinchas de fútbol" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(4,7,14,0.7) 0%, transparent 60%)' }} />
            <span className="absolute bottom-3 left-3 text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#00C87A', letterSpacing: '0.15em' }}>Siente la pasión</span>
          </div>
        </div>
      </section>

      {/* Grass divider */}
      <div className="px-2 py-10">
        <div className="grass-divider" />
      </div>

      {/* ── Scoring system ── */}
      <section className="px-2 space-y-7">
        <div className="text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.2em' }}>Sistema de puntos</p>
          <h2 className="leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', color: '#E8EDF5', textTransform: 'uppercase' }}>
            SISTEMA DE <span className="text-gold-shimmer">PUNTOS</span>
          </h2>
          <p className="mt-2 text-wc-muted">Puntos asignados tras el pitido final.</p>
        </div>

        <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid #152136' }}>
          {/* Header */}
          <div className="grid grid-cols-3 px-6 py-3 text-xs font-bold uppercase tracking-widest text-wc-dim" style={{ background: '#0D1829', borderBottom: '1px solid #152136', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em' }}>
            <span>Escenario</span>
            <span className="hidden sm:block">Ejemplo</span>
            <span className="text-right">Puntos</span>
          </div>

          {scoringRows.map((row, i) => (
            <div key={i}
              className="grid grid-cols-3 items-center px-6 py-5 transition-colors hover:bg-wc-surface2"
              style={{ borderBottom: '1px solid rgba(21,33,54,0.8)', background: '#080F1C' }}>
              <div>
                <span className="font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.05rem', color: row.color, letterSpacing: '0.03em' }}>
                  {row.result}
                </span>
                <div className="mt-2 h-1 w-28 rounded-full" style={{ background: '#152136' }}>
                  <div className="h-1 rounded-full transition-all duration-500" style={{ width: row.width, background: row.color, boxShadow: `0 0 8px ${row.glow}` }} />
                </div>
              </div>
              <span className="hidden pr-4 text-sm text-wc-muted sm:block">{row.example}</span>
              <div className="flex justify-end">
                <span className="rounded-full px-3 py-1 text-sm font-black tabular-nums"
                  style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.15rem', color: row.color, background: `${row.color}15`, border: `1px solid ${row.color}30`, letterSpacing: '0.05em' }}>
                  {row.points} PTS
                </span>
              </div>
            </div>
          ))}
          {/* Golden Ball bonus row */}
          <div className="grid grid-cols-3 items-center px-6 py-5 transition-colors hover:bg-wc-surface2"
            style={{ background: 'rgba(255,215,0,0.03)', borderTop: '1px solid rgba(255,215,0,0.15)' }}>
            <div>
              <span className="font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.05rem', color: goldenBallRow.color, letterSpacing: '0.03em' }}>
                {goldenBallRow.result}
              </span>
              <div className="mt-1 text-xs text-wc-dim" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.04em' }}>
                Cierra el 17 Jun · 23:59
              </div>
              <div className="mt-1.5 h-1 w-28 rounded-full" style={{ background: '#152136' }}>
                <div className="h-1 rounded-full" style={{ width: goldenBallRow.width, background: goldenBallRow.color, boxShadow: `0 0 10px ${goldenBallRow.glow}` }} />
              </div>
            </div>
            <span className="hidden pr-4 text-sm text-wc-muted sm:block">{goldenBallRow.example}</span>
            <div className="flex justify-end">
              <span className="rounded-full px-3 py-1 text-sm font-black tabular-nums"
                style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.15rem', color: goldenBallRow.color, background: `${goldenBallRow.color}15`, border: `1px solid ${goldenBallRow.color}40`, letterSpacing: '0.05em', textShadow: `0 0 12px ${goldenBallRow.glow}` }}>
                +30 PTS
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-2 pt-14 pb-4 space-y-6">
        <div className="text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.2em' }}>¿Tienes dudas?</p>
          <h2 className="leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', color: '#E8EDF5', textTransform: 'uppercase' }}>PREGUNTAS <span className="text-gold-shimmer">FRECUENTES</span></h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {faqs.map((faq, i) => (
            <div key={i} className="card-pitch group space-y-2 transition-all duration-200 hover:-translate-y-0.5"
              style={{ borderLeft: '2px solid rgba(245,166,35,0.25)' }}>
              <h3 className="font-bold text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem', letterSpacing: '0.03em' }}>
                {faq.q}
              </h3>
              <p className="text-sm leading-relaxed text-wc-muted">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative mt-10 overflow-hidden rounded-3xl mx-2 mb-6">
        <img src={BALL_IMG} alt="Soccer ball" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.12) 0%, rgba(4,7,14,0.9) 60%)' }} />
        {/* Decorative circle */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-10" style={{ border: '2px solid #F5A623' }} />
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10" style={{ border: '1px solid #FFD166' }} />

        <div className="relative rounded-3xl py-16 text-center px-6" style={{ border: '1px solid rgba(245,166,35,0.2)' }}>
          <div className="mb-2 text-4xl">🏆</div>
          <div className="mb-1 text-sm font-bold uppercase tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#F5A623', letterSpacing: '0.2em' }}>
            ¿Listo para jugar?
          </div>
          <h2 className="mb-5 leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 'clamp(2.8rem, 7vw, 4.5rem)', color: '#E8EDF5', textTransform: 'uppercase' }}>
            UNETE AL <span className="text-gold-shimmer">JUEGO</span>
          </h2>
          <p className="mb-8 text-wc-muted">Crea tu cuenta y predice todos los partidos del Mundial.<br className="hidden sm:block" /> Que gane el mejor.</p>
          <Link to="/matches" className="btn-primary px-10 py-3 text-base">
            ⚽ Empieza a predecir →
          </Link>
        </div>
      </section>

      <div className="h-8" />
    </div>
  );
}


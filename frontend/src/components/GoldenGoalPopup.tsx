import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyBonusAnswer } from '../services/api';
import { useAuthToken } from '../hooks/useAuthToken';

const DEADLINE = new Date('2026-06-27T23:59:00');
const OPEN_FROM = new Date('2026-06-16T00:00:00');

export default function GoldenGoalPopup() {
  const { isAuthenticated } = useAuthToken();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const now = Date.now();
    // Only show between June 16 and June 27
    if (now < OPEN_FROM.getTime() || now > DEADLINE.getTime()) return;
    if (!isAuthenticated) return;

    fetchMyBonusAnswer()
      .then((b) => {
        // Show only if the user hasn't picked yet
        if (!b.answer) setVisible(true);
      })
      .catch(() => {
        // If we can't fetch, don't show — fail silently
      });
  }, [isAuthenticated]);

  if (!visible) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(4,7,14,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={() => setVisible(false)}
    >
      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => { e.stopPropagation(); navigate('/bonus'); }}
        className="relative w-full max-w-sm rounded-2xl overflow-hidden cursor-pointer"
        style={{
          background: 'linear-gradient(160deg, #0D1829 0%, #07111F 100%)',
          border: '1px solid rgba(255,215,0,0.3)',
          boxShadow: '0 0 40px rgba(255,215,0,0.15), 0 24px 48px rgba(0,0,0,0.6)',
          animation: 'fadeSlideUp 0.25s ease-out',
        }}
      >
        {/* Gold top accent */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, rgba(255,215,0,0) 0%, #FFD700 50%, rgba(255,215,0,0) 100%)' }} />

        {/* Dismiss button */}
        <button
          onClick={(e) => { e.stopPropagation(); setVisible(false); }}
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full text-wc-muted transition-colors hover:text-wc-text"
          style={{ background: 'rgba(255,255,255,0.05)', fontFamily: 'sans-serif', fontSize: '1rem', lineHeight: 1 }}
          aria-label="Cerrar"
        >
          ✕
        </button>

        <div className="px-6 py-6 space-y-4">
          {/* Header */}
          <div className="text-center">
            <div className="text-5xl mb-2">🏆</div>
            <p className="text-xs font-bold uppercase tracking-widest text-wc-muted mb-1"
              style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.2em' }}>
              Pregunta Bonus
            </p>
            <h2 className="leading-none"
              style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: '2.2rem', color: '#E8EDF5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              GOL <span style={{ color: '#FFD700' }}>DE ORO</span>
            </h2>
          </div>

          {/* Points highlight */}
          <div className="rounded-xl py-3 text-center"
            style={{ background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.2)' }}>
            <div className="font-black" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.4rem', color: '#FFD700', lineHeight: 1, textShadow: '0 0 18px rgba(255,215,0,0.5)' }}>
              +30 PTS
            </div>
            <p className="text-xs text-wc-muted mt-0.5" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
              BONUS SI ACIERTAS AL CAMPEÓN
            </p>
          </div>

          {/* Info rows */}
          <div className="space-y-2">
            {[
              { icon: '⚽', text: 'Elige la selección que ganará el Mundial 2026' },
              { icon: '✏️', text: 'Puedes cambiar tu elección cuando quieras hasta el cierre' },
              { icon: '📅', text: 'Cierre: sábado 27 de junio a las 23:59' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2.5">
                <span className="text-base shrink-0">{icon}</span>
                <p className="text-sm text-wc-muted leading-snug" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}>{text}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="pt-1">
            <div className="w-full rounded-xl py-3 text-center font-black uppercase"
              style={{ background: 'linear-gradient(135deg, #F5A623 0%, #E8920F 100%)', color: '#04070E', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em', fontSize: '1.05rem', boxShadow: '0 4px 16px rgba(245,166,35,0.35)' }}>
              Hacer mi elección →
            </div>
            <p className="text-center text-xs text-wc-dim mt-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              ¡No pierdas la oportunidad de ganar 30 puntos extra!
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthModal from './AuthModal';
import type { User } from '../types';

interface Props {
  isAuthenticated: boolean;
  user: User | null;
  onLogin: (token: string, user: User) => void;
  onLogout: () => void;
}

function WC2026Badge() {
  return (
    <img src="/images/logo.png" alt="minuto90.site logo" style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: '50%' }} />
  );
}

export default function Navbar({ isAuthenticated, user, onLogin, onLogout }: Props) {
  const [showAuth, setShowAuth] = useState(false);
  const location = useLocation();

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className="relative text-sm font-semibold tracking-wide transition-all duration-200"
      style={{
        fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: '0.95rem',
        letterSpacing: '0.06em',
        color: location.pathname === to ? '#F5A623' : '#5B6E8C',
        textTransform: 'uppercase',
      }}
    >
      {label}
      {location.pathname === to && (
        <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
          style={{ background: 'linear-gradient(90deg, #F5A623, #FFD166)' }} />
      )}
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md"
        style={{
          background: 'rgba(4, 7, 14, 0.95)',
          borderBottom: '1px solid rgba(245, 166, 35, 0.12)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        {/* Top gold accent line */}
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #F5A623 30%, #FFD166 50%, #F5A623 70%, transparent)', opacity: 0.6 }} />

        <div className="container mx-auto flex h-16 items-center gap-5 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <WC2026Badge />
            <span className="hidden sm:flex sm:flex-col sm:leading-tight">
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.08em', color: '#E8EDF5', textTransform: 'uppercase' }}>
                minuto90.site
              </span>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.2em', color: '#F5A623', textTransform: 'uppercase' }}>
              🇺🇸 🇨🇦 🇲🇽 Copa del Mundo 2026
              </span>
            </span>
          </Link>

          <nav className="ml-2 flex items-center gap-5 overflow-x-auto">
            {navLink('/', 'Home')}
            {navLink('/matches', 'Partidos')}
            {navLink('/groups', 'Grupos')}
            {navLink('/leaderboard', 'Posiciones')}
            {isAuthenticated && navLink('/bonus', '🏆 Bonus')}
            {isAuthenticated && navLink('/my-predictions', 'Mis Pronós.')}
            {user?.role === 'admin' && navLink('/admin', '⚙ Admin')}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 sm:flex">
                  <Link to="/profile" className="flex items-center gap-2 transition-opacity hover:opacity-80" title="My profile">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="avatar" className="h-8 w-8 rounded-full object-cover"
                        style={{ border: '2px solid rgba(245,166,35,0.5)' }} />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,166,35,0.1))', border: '1px solid rgba(245,166,35,0.4)', color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {user.username[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-wc-text">{user.username}</span>
                  </Link>
                  {user.role === 'admin' && (
                    <span className="rounded px-1.5 py-0.5 text-xs font-bold"
                      style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623' }}>
                      ADMIN
                    </span>
                  )}
                </div>
                <button onClick={onLogout} className="btn-ghost py-1.5 text-sm">Cerrar sesión</button>
              </div>
            ) : (
              <button
                data-auth-trigger
                onClick={() => setShowAuth(true)}
                className="btn-primary py-1.5 text-sm"
              >
                Iniciar sesión / Registrarse
              </button>
            )}
          </div>
        </div>
      </header>

      {showAuth && (
        <AuthModal
          onSuccess={(token, u) => { onLogin(token, u); setShowAuth(false); }}
          onClose={() => setShowAuth(false)}
        />
      )}
    </>
  );
}

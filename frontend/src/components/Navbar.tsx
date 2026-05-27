import { useState, useEffect, useRef } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const linkStyle = (to: string) => ({
    fontFamily: 'Barlow Condensed, sans-serif',
    fontSize: '0.95rem',
    letterSpacing: '0.06em',
    color: location.pathname === to ? '#F5A623' : '#5B6E8C',
    textTransform: 'uppercase' as const,
  });

  const navLink = (to: string, label: string) => (
    <Link to={to} className="relative text-sm font-semibold tracking-wide transition-all duration-200" style={linkStyle(to)}>
      {label}
      {location.pathname === to && (
        <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
          style={{ background: 'linear-gradient(90deg, #F5A623, #FFD166)' }} />
      )}
    </Link>
  );

  const mobileNavLink = (to: string, label: string) => (
    <Link
      key={to}
      to={to}
      className="flex items-center px-4 py-3 text-sm font-semibold transition-colors"
      style={{
        fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: '1.05rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: location.pathname === to ? '#F5A623' : '#A0B0C8',
        background: location.pathname === to ? 'rgba(245,166,35,0.07)' : 'transparent',
        borderLeft: location.pathname === to ? '3px solid #F5A623' : '3px solid transparent',
      }}
    >
      {label}
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

        <div className="container mx-auto flex h-16 items-center gap-5 px-4" ref={menuRef}>
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

          {/* Desktop nav */}
          <nav className="ml-2 hidden md:flex items-center gap-5">
            {navLink('/', 'Home')}
            {navLink('/matches', 'Partidos')}
            {navLink('/groups', 'Grupos')}
            {navLink('/leaderboard', 'Posiciones')}
            {isAuthenticated && navLink('/bonus', '🏆 Bonus')}
            {isAuthenticated && navLink('/my-predictions', 'Mis Pronós.')}
            {user?.role === 'admin' && navLink('/admin', '⚙ Admin')}
          </nav>

          {/* Desktop user area */}
          <div className="ml-auto hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
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
                <button onClick={onLogout} className="btn-ghost py-1.5 text-sm">Cerrar sesión</button>
              </div>
            ) : (
              <button data-auth-trigger onClick={() => setShowAuth(true)} className="btn-primary py-1.5 text-sm">
                Iniciar sesión / Registrarse
              </button>
            )}
          </div>

          {/* Mobile: right side — avatar + hamburger */}
          <div className="ml-auto flex md:hidden items-center gap-2">
            {isAuthenticated && user && (
              <Link to="/profile" className="flex items-center">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar" className="h-8 w-8 rounded-full object-cover"
                    style={{ border: '2px solid rgba(245,166,35,0.5)' }} />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,166,35,0.1))', border: '1px solid rgba(245,166,35,0.4)', color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {user.username[0].toUpperCase()}
                  </div>
                )}
              </Link>
            )}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              className="flex flex-col justify-center items-center gap-1.5 w-9 h-9 rounded-lg transition-colors"
              style={{ background: menuOpen ? 'rgba(245,166,35,0.1)' : 'transparent', border: '1px solid', borderColor: menuOpen ? 'rgba(245,166,35,0.3)' : 'transparent' }}
            >
              <span className="block h-0.5 w-5 transition-all duration-200"
                style={{ background: '#A0B0C8', transform: menuOpen ? 'translateY(8px) rotate(45deg)' : 'none' }} />
              <span className="block h-0.5 w-5 transition-all duration-200"
                style={{ background: '#A0B0C8', opacity: menuOpen ? 0 : 1 }} />
              <span className="block h-0.5 w-5 transition-all duration-200"
                style={{ background: '#A0B0C8', transform: menuOpen ? 'translateY(-8px) rotate(-45deg)' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t" style={{ background: 'rgba(4,7,14,0.98)', borderColor: 'rgba(245,166,35,0.12)' }}>
            <div className="flex flex-col py-2">
              {mobileNavLink('/', 'Home')}
              {mobileNavLink('/matches', 'Partidos')}
              {mobileNavLink('/groups', 'Grupos')}
              {mobileNavLink('/leaderboard', 'Posiciones')}
              {isAuthenticated && mobileNavLink('/bonus', '🏆 Bonus')}
              {isAuthenticated && mobileNavLink('/my-predictions', 'Mis Pronósticos')}
              {user?.role === 'admin' && mobileNavLink('/admin', '⚙ Admin')}

              <div className="mx-4 my-2 h-px" style={{ background: 'rgba(245,166,35,0.12)' }} />

              {isAuthenticated && user ? (
                <div className="px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{user.username}</span>
                    {user.role === 'admin' && (
                      <span className="rounded px-1.5 py-0.5 text-xs font-bold"
                        style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623' }}>ADMIN</span>
                    )}
                  </div>
                  <button onClick={() => { onLogout(); setMenuOpen(false); }} className="btn-ghost py-1.5 text-sm">Cerrar sesión</button>
                </div>
              ) : (
                <div className="px-4 py-2">
                  <button data-auth-trigger onClick={() => { setShowAuth(true); setMenuOpen(false); }} className="btn-primary w-full py-2 text-sm">
                    Iniciar sesión / Registrarse
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
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

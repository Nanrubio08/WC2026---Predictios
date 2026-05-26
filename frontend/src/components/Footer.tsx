import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      className="mt-auto w-full border-t"
      style={{ borderColor: 'rgba(245,166,35,0.1)', background: 'rgba(4,7,14,0.98)' }}
    >
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#5B6E8C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            🇺🇸 🇨🇦 🇲🇽 minuto90.site — Copa del Mundo 2026
          </span>
        </div>
        <nav className="flex items-center gap-5">
          {[
            { to: '/about', label: 'Acerca de' },
            { to: '/terms', label: 'Términos y Condiciones' },
            { to: '/privacy', label: 'Privacidad' },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-xs font-semibold uppercase tracking-wide transition-colors hover:text-wc-gold"
              style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', color: '#3A4A5C' }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className="text-xs" style={{ color: '#2A3A52', fontFamily: 'Barlow Condensed, sans-serif' }}>
          © {year} minuto90.site
        </p>
      </div>
    </footer>
  );
}

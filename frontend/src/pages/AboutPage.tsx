export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl py-10 space-y-6">
      <div className="text-center mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-wc-muted"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.2em' }}>
          minuto90.site
        </p>
        <h1 className="leading-none"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 'clamp(2.5rem, 8vw, 3.5rem)', color: '#E8EDF5', textTransform: 'uppercase' }}>
          ACERCA <span className="text-gold-shimmer">DE</span>
        </h1>
      </div>

      <section className="card space-y-3">
        <h2 className="text-lg font-bold text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>¿Qué es minuto90.site?</h2>
        <p className="text-wc-muted text-sm leading-relaxed">
          minuto90.site es una pagina de entretenimiento online para el Mundial de Fútbol 2026 🇺🇸🇨🇦🇲🇽. Registrate, predice el marcador de cada partido antes del cierre de apuestas (30 minutos antes del partido), y compite en la tabla de posiciones.
        </p>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-bold text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>¿Cómo se puntúa?</h2>
        <ul className="text-wc-muted text-sm space-y-2">
          <li className="flex items-center gap-3">
            <span className="text-wc-gold font-black text-base">5 pts</span>
            <span>Marcador exacto (ej: predijiste 2-1 y terminó 2-1)</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-wc-gold font-black text-base">3 pts</span>
            <span>Resultado correcto (victoria, empate o derrota) pero marcador diferente</span>
          </li>
          <li className="flex items-center gap-3">
            <span style={{ color: '#5B6E8C' }} className="font-black text-base">0 pts</span>
            <span>Resultado incorrecto</span>
          </li>
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-bold text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cierre de pronósticos</h2>
        <p className="text-wc-muted text-sm leading-relaxed">
          Los pronósticos cierran automáticamente <strong className="text-wc-text">30 minutos antes del inicio de cada partido</strong>. Una vez cerrado, no podrás modificar ni agregar predicciones para ese encuentro.
        </p>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-bold text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contacto</h2>
        <p className="text-wc-muted text-sm leading-relaxed">
          ¿Tienes preguntas o sugerencias? Escribenos a <a href="mailto:soporte@minuto90.site" className="text-wc-gold hover:underline">soporte@minuto90.site</a>
        </p>
      </section>
    </div>
  );
}

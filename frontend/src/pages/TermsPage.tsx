function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-3">
      <h2 className="text-lg font-bold text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</h2>
      <div className="text-wc-muted text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl py-10 space-y-6">
      <div className="text-center mb-8">
        <h1 className="leading-none"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 'clamp(2rem, 7vw, 3rem)', color: '#E8EDF5', textTransform: 'uppercase' }}>
          TÉRMINOS Y <span className="text-gold-shimmer">CONDICIONES</span>
        </h1>
        <p className="text-wc-dim text-xs mt-2">Última actualización: Enero 2026</p>
      </div>

      <Section title="1. Aceptación de los términos">
        <p>Al registrarte y usar LaCabala.app aceptás estos Términos y Condiciones en su totalidad. Si no estás de acuerdo, por favor no uses el servicio.</p>
      </Section>

      <Section title="2. Descripción del servicio">
        <p>LaCabala.app es una plataforma de entretenimiento sin fines de lucro para la predicción de resultados del Mundial de Fútbol 2026. No implica apuestas de dinero real ni premios monetarios.</p>
      </Section>

      <Section title="3. Registro">
        <p>Debés proporcionar información veraz al registrarte. Sos responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta.</p>
      </Section>

      <Section title="4. Reglas del juego">
        <p>Los pronósticos deben enviarse antes del cierre (30 minutos antes del inicio de cada partido). Los pronósticos enviados fuera del período permitido no serán aceptados.</p>
        <p>El sistema de puntuación es: 5 puntos por marcador exacto, 3 puntos por resultado correcto (W/D/L), 0 puntos en caso contrario.</p>
      </Section>

      <Section title="5. Conducta del usuario">
        <p>Queda prohibido: crear cuentas múltiples, intentar manipular el sistema, publicar contenido ofensivo o realizar cualquier actividad que perjudique a otros usuarios o al servicio.</p>
      </Section>

      <Section title="6. Limitación de responsabilidad">
        <p>LaCabala.app se proporciona "tal cual". No garantizamos la disponibilidad continua del servicio. No somos responsables por interrupciones, errores en datos de partidos provenientes de fuentes externas, ni por pérdida de puntos por fallas técnicas fuera de nuestro control.</p>
      </Section>

      <Section title="7. Modificaciones">
        <p>Podemos modificar estos términos en cualquier momento. Los cambios serán efectivos al ser publicados en esta página. El uso continuado del servicio implica aceptación de los nuevos términos.</p>
      </Section>

      <Section title="8. Contacto">
        <p>Para consultas sobre estos términos contactanos en <a href="mailto:hola@lacabala.app" className="text-wc-gold hover:underline">hola@lacabala.app</a></p>
      </Section>
    </div>
  );
}

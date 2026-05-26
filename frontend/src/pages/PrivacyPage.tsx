function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-3">
      <h2 className="text-lg font-bold text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</h2>
      <div className="text-wc-muted text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl py-10 space-y-6">
      <div className="text-center mb-8">
        <h1 className="leading-none"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 'clamp(2rem, 7vw, 3rem)', color: '#E8EDF5', textTransform: 'uppercase' }}>
          POLÍTICA DE <span className="text-gold-shimmer">PRIVACIDAD</span>
        </h1>
        <p className="text-wc-dim text-xs mt-2">Última actualización: Enero 2026</p>
      </div>

      <Section title="1. Datos que recopilamos">
        <p>Al registrarte recopilamos: nombre de usuario, dirección de correo electrónico y contraseña (almacenada cifrada). Opcionalmente podés agregar nombre completo, teléfono, equipo favorito y foto de perfil.</p>
        <p>También registramos los pronósticos que enviás y tus interacciones con el servicio.</p>
      </Section>

      <Section title="2. Cómo usamos tus datos">
        <p>Usamos tu información para: operar la plataforma, mostrar tu nombre en la tabla de posiciones, enviarte notificaciones relacionadas con el servicio y mejorar la experiencia de usuario.</p>
        <p>No vendemos ni compartimos tus datos personales con terceros con fines comerciales.</p>
      </Section>

      <Section title="3. Almacenamiento y seguridad">
        <p>Tus datos se almacenan en servidores seguros. Las contraseñas se guardan cifradas con bcrypt. Usamos tokens JWT de corta duración para sesiones seguras.</p>
      </Section>

      <Section title="4. Cookies y almacenamiento local">
        <p>Usamos cookies HTTP-only para el refresh token de sesión y localStorage para el token de acceso. No usamos cookies de seguimiento ni publicidad.</p>
      </Section>

      <Section title="5. Tus derechos">
        <p>Podés actualizar o eliminar tu información de perfil en cualquier momento desde la sección "Mi Perfil". Para solicitar la eliminación completa de tu cuenta y datos, contactanos por correo.</p>
      </Section>

      <Section title="6. Retención de datos">
        <p>Los datos se conservan mientras tu cuenta esté activa. Si solicitás la eliminación de tu cuenta, procederemos a borrar tus datos en un plazo máximo de 30 días.</p>
      </Section>

      <Section title="7. Contacto">
        <p>Para consultas sobre privacidad o para ejercer tus derechos, escribinos a <a href="mailto:privacidad@lacabala.app" className="text-wc-gold hover:underline">privacidad@lacabala.app</a></p>
      </Section>
    </div>
  );
}

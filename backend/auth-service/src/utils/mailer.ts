import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com';

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.startsWith('re_REPLACE')) {
    throw new Error('[mailer] RESEND_API_KEY is not configured');
  }
  return new Resend(key);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Restablece tu contraseña — Minuto90.site',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#04070E;color:#E8EDF5;border-radius:12px;padding:32px;border:1px solid #152136">
        <h2 style="font-size:1.5rem;margin-bottom:8px;color:#F5A623">🔐 Restablecer contraseña</h2>
        <p style="color:#A0B0C8;margin-bottom:24px">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para continuar. El enlace expira en <strong style="color:#E8EDF5">1 hora</strong>.</p>
        <a href="${resetUrl}"
          style="display:inline-block;background:#F5A623;color:#04070E;font-weight:700;text-decoration:none;border-radius:8px;padding:12px 28px;font-size:1rem">
          Restablecer contraseña →
        </a>
        <p style="margin-top:24px;font-size:0.8rem;color:#5B6E8C">Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no cambiará.</p>
        <hr style="border:none;border-top:1px solid #152136;margin:24px 0">
        <p style="font-size:0.75rem;color:#3A4A60">Minuto90.site · Este enlace es válido por 1 hora y de un solo uso.</p>
      </div>
    `,
  });
}

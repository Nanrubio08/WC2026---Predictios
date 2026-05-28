import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, changePassword, uploadAvatar } from '../services/api';
import { useAuthToken } from '../hooks/useAuthToken';
import type { User } from '../types';

// ── helpers ────────────────────────────────────────────────────────────────

function Avatar({ user, size = 20 }: { user: User | null; size?: number }) {
  const s = `h-${size} w-${size}`;
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt="avatar"
        className={`${s} rounded-full object-cover ring-2 ring-emerald-500/40`}
      />
    );
  }
  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : (user?.username?.[0] ?? '?').toUpperCase();
  return (
    <div
      className={`${s} flex items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/20 text-2xl font-bold text-emerald-400`}
    >
      {initials}
    </div>
  );
}

function Field({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="input"
      />
    </div>
  );
}

type AlertKind = 'success' | 'error';
function Alert({ kind, msg }: { kind: AlertKind; msg: string }) {
  return (
    <p
      className={`rounded-lg px-3 py-2 text-sm ${
        kind === 'success'
          ? 'bg-emerald-500/10 text-emerald-400'
          : 'bg-red-500/10 text-red-400'
      }`}
    >
      {msg}
    </p>
  );
}

// ── page ───────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser } = useAuthToken();
  const navigate = useNavigate();

  // redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  // ── profile fields ──
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [profileStatus, setProfileStatus] = useState<{ kind: AlertKind; msg: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // ── password fields ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ kind: AlertKind; msg: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // ── avatar ──
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<{ kind: AlertKind; msg: string } | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // load profile from server
  useEffect(() => {
    if (!isAuthenticated) return;
    getProfile()
      .then((p) => {
        setName(p.name ?? '');
        setEmail(p.email ?? '');
        setPhone(p.phone ?? '');
        setFavoriteTeam(p.favoriteTeam ?? '');
        if (p.avatarUrl) setAvatarPreview(p.avatarUrl);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // ── handlers ──

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileStatus(null);
    try {
      const updated = await updateProfile({ name, email, phone, favoriteTeam });
      updateUser({ name: updated.name, email: updated.email, phone: updated.phone, favoriteTeam: updated.favoriteTeam });
      setProfileStatus({ kind: 'success', msg: 'Perfil actualizado correctamente.' });
    } catch (err: any) {
      setProfileStatus({ kind: 'error', msg: err?.response?.data?.error ?? 'No se pudo actualizar el perfil.' });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ kind: 'error', msg: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    setPasswordLoading(true);
    setPasswordStatus(null);
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordStatus({ kind: 'success', msg: 'Contraseña cambiada correctamente.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordStatus({ kind: 'error', msg: err?.response?.data?.error ?? 'No se pudo cambiar la contraseña.' });
    } finally {
      setPasswordLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8_000_000) {
      setAvatarStatus({ kind: 'error', msg: 'La imagen debe pesar menos de 8 MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl);
      setAvatarLoading(true);
      setAvatarStatus(null);
      try {
        const { avatarUrl } = await uploadAvatar(dataUrl);
        updateUser({ avatarUrl });
        setAvatarStatus({ kind: 'success', msg: 'Foto de perfil actualizada.' });
      } catch (err: any) {
        setAvatarStatus({ kind: 'error', msg: err?.response?.data?.error ?? 'No se pudo subir la foto.' });
      } finally {
        setAvatarLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  const currentUser: User = { ...user!, avatarUrl: avatarPreview ?? user?.avatarUrl };

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <h1 className="text-2xl font-bold text-white">Mi perfil</h1>

      {/* ── Avatar card ── */}
      <section className="card flex items-center gap-5">
        <div className="relative shrink-0">
          <Avatar user={currentUser} size={20} />
          {avatarLoading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-lg font-semibold text-white">{user?.name || user?.username}</p>
          <p className="text-sm text-slate-400">@{user?.username}</p>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={avatarLoading}
            className="btn-ghost border border-slate-600 py-1.5 text-sm"
          >
            Cambiar foto
          </button>
          {avatarStatus && <Alert kind={avatarStatus.kind} msg={avatarStatus.msg} />}
        </div>
      </section>

      {/* ── Personal info ── */}
      <section className="card space-y-5">
        <h2 className="text-lg font-semibold text-white">Información personal</h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <Field
            label="Nombre completo"
            id="name"
            value={name}
            onChange={setName}
            placeholder="Tu nombre completo"
            autoComplete="name"
          />
          <Field
            label="Correo electrónico"
            id="email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="vos@ejemplo.com"
            autoComplete="email"
          />
          <Field
            label="Teléfono / Cel"
            id="phone"
            type="tel"
            value={phone}
            onChange={setPhone}
            placeholder="+54 11 1234 5678"
            autoComplete="tel"
          />
          <Field
            label="Equipo favorito"
            id="favoriteTeam"
            value={favoriteTeam}
            onChange={setFavoriteTeam}
            placeholder="ej. Argentina, México…"
          />

          {profileStatus && <Alert kind={profileStatus.kind} msg={profileStatus.msg} />}

          <div className="flex justify-end">
            <button type="submit" disabled={profileLoading} className="btn-primary">
              {profileLoading ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </section>

      {/* ── Change password ── */}
      <section className="card space-y-5">
        <h2 className="text-lg font-semibold text-white">Cambiar contraseña</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Field
            label="Contraseña actual"
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
          />
          <Field
            label="Nueva contraseña"
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
          />
          <Field
            label="Confirmar nueva contraseña"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />

          {passwordStatus && <Alert kind={passwordStatus.kind} msg={passwordStatus.msg} />}

          <div className="flex justify-end">
            <button type="submit" disabled={passwordLoading} className="btn-primary">
              {passwordLoading ? 'Actualizando…' : 'Actualizar contraseña'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

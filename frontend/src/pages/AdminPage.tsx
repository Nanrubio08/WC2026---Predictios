import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminFetchMatches, adminUpdateScore, adminFetchAuditLogs, adminExportLeaderboardCsv, adminGetBonusConfig, adminDeclareWinner, adminFetchUsers, adminUpdateUser, adminDeleteUser, adminFetchInviteCodes, adminGenerateCodes, adminExportInviteCodesCsv, adminFetchPredictionsByUser, adminRemoveFromLeaderboard, adminFetchBonusAnswers, type InviteCodeRow, type AdminUserPredictionSummary, type AdminBonusAnswer } from '../services/api';
import { useAuthToken } from '../hooks/useAuthToken';
import type { Match, AuditLog } from '../types';

// Day 1 = June 11 2026 (tournament start). Matches group by viewer's local timezone.
function getMatchDay(kickoffTime: string | null): number | null {
  if (!kickoffTime) return null;
  const d = new Date(kickoffTime);
  const matchMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const tournamentMidnight = new Date(2026, 5, 11).getTime();
  const day = Math.floor((matchMidnight - tournamentMidnight) / 86_400_000) + 1;
  return day >= 1 ? day : null;
}

const WC_TEAMS = [
  'Argentina', 'Brasil', 'Francia', 'Inglaterra', 'España', 'Alemania',
  'Portugal', 'Países Bajos', 'Bélgica', 'Uruguay', 'Colombia', 'Mexico',
  'Estados Unidos', 'Canadá', 'Marruecos', 'Senegal', 'Nigeria', 'Ghana',
  'Japón', 'Corea del Sur', 'Australia', 'Arabia Saudita', 'Irán', 'Qatar',
  'Polonia', 'Croacia', 'Serbia', 'Dinamarca', 'Suiza', 'Austria',
  'Ecuador', 'Perú', 'Chile', 'Venezuela', 'Bolivia', 'Paraguay',
  'Costa Rica', 'Honduras', 'Panamá', 'Jamaica', 'Argelia', 'Egipto',
  'Camerún', 'Costa de Marfil', 'Túnez', 'Sudáfrica', 'China', 'Indonesia',
].sort();

function ScoreEditor({ match, onUpdated }: { match: Match; onUpdated: (m: Match) => void }) {
  const [home, setHome] = useState(String(match.homeScoreActual ?? ''));
  const [away, setAway] = useState(String(match.awayScoreActual ?? ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError('Ingresa marcadores válidos (0-99)');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await adminUpdateScore(match.id, h, a);
      onUpdated(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: '#0D1829',
    border: '1px solid #152136',
    color: '#E8EDF5',
    width: 52,
    textAlign: 'center' as const,
    borderRadius: 6,
    padding: '4px 0',
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: '1.1rem',
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input type="number" min={0} max={99} value={home} onChange={(e) => setHome(e.target.value)} style={inputStyle} />
      <span style={{ color: '#2A3A52', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>–</span>
      <input type="number" min={0} max={99} value={away} onChange={(e) => setAway(e.target.value)} style={inputStyle} />
      <button type="submit" disabled={loading}
        className="rounded px-3 py-1 text-xs font-bold uppercase"
        style={{ background: loading ? 'rgba(245,166,35,0.1)' : 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
        {loading ? '...' : success ? '✓' : 'GUARDAR'}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </form>
  );
}

function GoldenBallAdmin() {
  const [currentWinner, setCurrentWinner] = useState<string | null>(null);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Answers view state
  const [answers, setAnswers] = useState<AdminBonusAnswer[]>([]);
  const [answersLoading, setAnswersLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'answered' | 'missing'>('all');
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    adminGetBonusConfig()
      .then((c) => { setCurrentWinner(c.winner); setSelected(c.winner ?? ''); })
      .catch(() => {})
      .finally(() => setLoading(false));

    adminFetchBonusAnswers()
      .then(setAnswers)
      .catch(() => {})
      .finally(() => setAnswersLoading(false));
  }, []);

  async function handleDeclare(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const confirmed = window.confirm(`¿Declarar a "${selected}" como campeón? Esto otorgará 30 pts a todos los usuarios que lo eligieron. Esta acción es permanente.`);
    if (!confirmed) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await adminDeclareWinner(selected);
      setCurrentWinner(res.winner);
      setMessage(res.message);
      // Refresh answers to show updated points
      adminFetchBonusAnswers().then(setAnswers).catch(() => {});
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al declarar ganador.');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(21,33,54,0.8)', border: '1px solid rgba(91,110,140,0.3)',
    borderRadius: 8, color: '#E8EDF5', padding: '6px 12px',
    fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif',
  };

  const totalAnswered = answers.filter((a) => a.answer !== null).length;
  const totalMissing  = answers.filter((a) => a.answer === null).length;

  const filteredAnswers = answers.filter((a) => {
    const statusOk =
      filterStatus === 'all' ||
      (filterStatus === 'answered' && a.answer !== null) ||
      (filterStatus === 'missing' && a.answer === null);
    const text = filterText.toLowerCase();
    const textOk =
      !text ||
      a.username.toLowerCase().includes(text) ||
      (a.name ?? '').toLowerCase().includes(text) ||
      a.email.toLowerCase().includes(text) ||
      (a.answer ?? '').toLowerCase().includes(text);
    return statusOk && textOk;
  });

  if (loading) return <div className="animate-pulse h-24 rounded-xl" style={{ background: 'rgba(21,33,54,0.6)' }} />;

  return (
    <div className="space-y-5">
      {/* ── Declare champion card ── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <h3 className="font-black text-wc-text uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>Gol de Oro — Declarar Campeón</h3>
            <p className="text-xs text-wc-muted">Otorga 30 pts a todos los usuarios que eligieron este equipo. Irreversible.</p>
          </div>
        </div>

        {currentWinner && (
          <div className="rounded-lg px-4 py-2 text-sm font-bold text-center"
            style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}>
            🥇 Campeón declarado: {currentWinner}
          </div>
        )}

        <form onSubmit={handleDeclare} className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-wc-muted mb-1"
              style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Equipo campeón
            </label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-wc-text focus:outline-none"
              style={{ background: '#0D1829', border: '1px solid #152136', fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              <option value="">— Selecciona el campeón —</option>
              {WC_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button type="submit" disabled={!selected || saving}
            className="rounded-lg px-5 py-2 text-sm font-black uppercase"
            style={{ background: saving ? 'rgba(245,166,35,0.1)' : 'linear-gradient(135deg,#F5A623 0%,#E8920F 100%)', color: '#04070E', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', opacity: !selected || saving ? 0.6 : 1 }}>
            {saving ? 'Procesando…' : 'Declarar Campeón'}
          </button>
        </form>

        {message && <p className="text-xs text-center" style={{ color: '#00C87A', fontFamily: 'Barlow Condensed, sans-serif' }}>✓ {message}</p>}
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      </div>

      {/* ── Bonus answers table ── */}
      <div className="card overflow-hidden">
        <div className="px-5 pt-5 pb-3 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-lg">🎯</span>
            <div>
              <h3 className="font-black text-wc-text uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>Predicciones de usuarios</h3>
              <p className="text-xs text-wc-muted">¿Quién ganará el Mundial 2026?</p>
            </div>
            {/* Summary badges */}
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(0,200,122,0.1)', border: '1px solid rgba(0,200,122,0.2)', color: '#00C87A', fontFamily: 'Barlow Condensed, sans-serif' }}>
                ✓ {totalAnswered} respondieron
              </span>
              {totalMissing > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(240,62,62,0.1)', border: '1px solid rgba(240,62,62,0.25)', color: '#F03E3E', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  ✗ {totalMissing} sin respuesta
                </span>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Buscar usuario, email o equipo…"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{ ...inputStyle, flex: '1 1 200px' }}
            />
            {(['all', 'answered', 'missing'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="rounded-full px-3 py-1 text-xs font-bold uppercase transition-all"
                style={filterStatus === s
                  ? { background: 'linear-gradient(135deg,#F5A623,#E8920F)', color: '#04070E', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }
                  : { background: 'rgba(21,33,54,0.8)', border: '1px solid rgba(91,110,140,0.3)', color: '#5B6E8C', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}
              >
                {s === 'all' ? 'Todos' : s === 'answered' ? 'Respondieron' : 'Sin respuesta'}
              </button>
            ))}
            <span className="ml-auto self-center text-xs text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              {filteredAnswers.length} usuario{filteredAnswers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {answersLoading ? (
          <div className="space-y-2 px-5 pb-5">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse h-10 rounded-lg" style={{ background: 'rgba(21,33,54,0.6)' }} />)}
          </div>
        ) : filteredAnswers.length === 0 ? (
          <div className="py-12 text-center text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            No hay usuarios para mostrar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderTop: '1px solid rgba(21,33,54,0.8)', borderBottom: '1px solid rgba(21,33,54,0.8)', background: 'rgba(245,166,35,0.04)' }}>
                  {['USUARIO', 'NOMBRE', 'EMAIL', 'PREDICCIÓN', 'PUNTOS', 'FECHA'].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-bold text-wc-muted"
                      style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAnswers.map((a) => {
                  const hasPrediction = a.answer !== null;
                  return (
                    <tr key={a.userId} style={{ borderBottom: '1px solid rgba(21,33,54,0.5)', background: hasPrediction ? undefined : 'rgba(240,62,62,0.03)' }}>
                      <td className="py-3 px-4 text-xs font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: hasPrediction ? '#E8EDF5' : '#F03E3E' }}>
                        {a.username}
                      </td>
                      <td className="py-3 px-4 text-xs text-wc-muted">{a.name ?? '—'}</td>
                      <td className="py-3 px-4 text-xs text-wc-dim font-mono">{a.email}</td>
                      <td className="py-3 px-4">
                        {hasPrediction ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded"
                            style={{ background: currentWinner && a.answer === currentWinner ? 'rgba(245,166,35,0.15)' : 'rgba(0,200,122,0.08)', border: `1px solid ${currentWinner && a.answer === currentWinner ? 'rgba(245,166,35,0.3)' : 'rgba(0,200,122,0.2)'}`, color: currentWinner && a.answer === currentWinner ? '#F5A623' : '#00C87A', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.04em' }}>
                            {currentWinner && a.answer === currentWinner && '🥇 '}{a.answer}
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-0.5 rounded"
                            style={{ background: 'rgba(240,62,62,0.1)', border: '1px solid rgba(240,62,62,0.2)', color: '#F03E3E', fontFamily: 'Barlow Condensed, sans-serif' }}>
                            Sin respuesta
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs tabular-nums font-bold"
                        style={{ color: a.points > 0 ? '#F5A623' : '#5B6E8C', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {a.points > 0 ? `+${a.points} pts` : '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-wc-muted tabular-nums" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {a.submittedAt
                          ? new Date(a.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function UsersAdmin() {
  type UserRow = { id: string; username: string; name: string | null; email: string; isAdmin: boolean; createdAt: string };
  const [users, setUsers]           = useState<UserRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editUser, setEditUser]     = useState<UserRow | null>(null);
  const [editForm, setEditForm]     = useState({ username: '', name: '', email: '', isAdmin: false });
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [editError, setEditError]   = useState<string | null>(null);

  useEffect(() => {
    adminFetchUsers()
      .then(setUsers)
      .catch(() => setError('Error al cargar usuarios'))
      .finally(() => setLoading(false));
  }, []);

  function openEdit(u: UserRow) {
    setEditUser(u);
    setEditForm({ username: u.username, name: u.name ?? '', email: u.email, isAdmin: u.isAdmin });
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editUser) return;
    setSaving(true); setEditError(null);
    try {
      await adminUpdateUser(editUser.id, {
        username: editForm.username || undefined,
        name:     editForm.name     || null,
        email:    editForm.email    || undefined,
        isAdmin:  editForm.isAdmin,
      });
      setUsers((prev) => prev.map((u) => u.id === editUser.id
        ? { ...u, username: editForm.username, name: editForm.name || null, email: editForm.email, isAdmin: editForm.isAdmin }
        : u));
      setEditUser(null);
    } catch (err: any) {
      setEditError(err?.response?.data?.error ?? 'Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: UserRow) {
    const confirmed = window.confirm(`¿Eliminar al usuario "${user.username}"? Se borrarán todas sus predicciones y su entrada en el ranking. Esta acción es irreversible.`);
    if (!confirmed) return;
    setDeletingId(user.id);
    setError(null);
    try {
      await adminDeleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al eliminar usuario');
    } finally {
      setDeletingId(null);
    }
  }

  const inputStyle: React.CSSProperties = { background: 'rgba(21,33,54,0.8)', border: '1px solid rgba(91,110,140,0.4)', borderRadius: 8, color: '#E8EDF5', padding: '8px 12px', fontSize: 13, width: '100%', fontFamily: 'inherit' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, color: '#5B6E8C', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 };

  if (loading) return <div className="animate-pulse h-24 rounded-xl" style={{ background: 'rgba(21,33,54,0.6)' }} />;

  return (
    <>
      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(4,7,14,0.85)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: 'linear-gradient(160deg,#0D1B2E 0%,#060D18 100%)', border: '1px solid rgba(245,166,35,0.2)' }}>
            <h3 className="text-lg font-bold mb-5" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#F5A623', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              ✏️ Editar usuario
            </h3>
            {editError && <div className="mb-4 text-sm text-red-400">{editError}</div>}
            <div className="space-y-4">
              <div>
                <label style={labelStyle}>Username</label>
                <input style={inputStyle} value={editForm.username} onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Nombre completo</label>
                <input style={inputStyle} value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isAdminCheck" checked={editForm.isAdmin} onChange={(e) => setEditForm((f) => ({ ...f, isAdmin: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#F5A623' }} />
                <label htmlFor="isAdminCheck" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>Es administrador</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit} disabled={saving}
                className="flex-1 rounded-lg py-2 text-sm font-bold uppercase"
                style={{ background: 'linear-gradient(135deg,#F5A623,#E8920F)', color: '#04070E', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                onClick={() => setEditUser(null)}
                className="flex-1 rounded-lg py-2 text-sm font-bold uppercase"
                style={{ background: 'rgba(21,33,54,0.8)', border: '1px solid rgba(91,110,140,0.3)', color: '#5B6E8C', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {error && <div className="px-4 py-3 text-sm text-red-400 border-b" style={{ borderColor: 'rgba(21,33,54,0.8)', fontFamily: 'Barlow Condensed, sans-serif' }}>{error}</div>}
        <div className="px-4 py-3 text-xs text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
          {users.length} usuario{users.length !== 1 ? 's' : ''} registrados
        </div>
        {users.length === 0 ? (
          <div className="py-12 text-center text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>No hay usuarios registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(21,33,54,0.8)', background: 'rgba(245,166,35,0.04)' }}>
                  {['USUARIO', 'NOMBRE', 'EMAIL', 'ROL', 'REGISTRO', 'ACCIONES'].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-bold text-wc-muted"
                      style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(21,33,54,0.5)' }}>
                    <td className="py-3 px-4 text-xs font-bold text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{u.username}</td>
                    <td className="py-3 px-4 text-xs text-wc-muted">{u.name ?? '—'}</td>
                    <td className="py-3 px-4 text-xs text-wc-dim font-mono">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded"
                        style={{ background: u.isAdmin ? 'rgba(245,166,35,0.12)' : 'rgba(91,110,140,0.12)', color: u.isAdmin ? '#F5A623' : '#5B6E8C', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {u.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-wc-muted tabular-nums" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="rounded px-3 py-1 text-xs font-bold uppercase"
                        style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
                        EDITAR
                      </button>
                      {!u.isAdmin && (
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={deletingId === u.id}
                          className="rounded px-3 py-1 text-xs font-bold uppercase"
                          style={{ background: 'rgba(240,62,62,0.12)', border: '1px solid rgba(240,62,62,0.3)', color: '#F03E3E', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', opacity: deletingId === u.id ? 0.5 : 1 }}>
                          {deletingId === u.id ? '...' : 'ELIMINAR'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function PredictionsAdmin() {
  const [data, setData]         = useState<AdminUserPredictionSummary[]>([]);
  const [matches, setMatches]   = useState<Match[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filterUser, setFilterUser]   = useState('');
  const [filterMatch, setFilterMatch] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [nextMatchOpen, setNextMatchOpen] = useState(true);

  useEffect(() => {
    Promise.all([adminFetchPredictionsByUser(), adminFetchMatches()])
      .then(([predictions, m]) => { setData(predictions); setMatches(m); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (userId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  // Next scheduled match (closest kickoff in the future)
  const nextMatch = useMemo(() => {
    const now = Date.now();
    return matches
      .filter((m) => m.status === 'scheduled' && new Date(m.kickoffTime).getTime() > now)
      .sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime())[0] ?? null;
  }, [matches]);

  // Which users have/haven't predicted for the next match
  const { usersWithPrediction, usersWithout } = useMemo(() => {
    if (!nextMatch) return { usersWithPrediction: [], usersWithout: [] };
    const with_: typeof data = [];
    const without: typeof data = [];
    for (const u of data) {
      if (u.predictions.some((p) => p.matchId === nextMatch.id)) {
        with_.push(u);
      } else {
        without.push(u);
      }
    }
    return { usersWithPrediction: with_, usersWithout: without };
  }, [data, nextMatch]);

  const allUsers   = data.map((u) => ({ id: u.userId, label: u.username }));
  const allMatches = Array.from(new Set(data.flatMap((u) => u.predictions.map((p) => p.matchId)))).sort((a, b) => a - b);

  const availableDays = useMemo(() => {
    const days = new Set(
      data.flatMap((u) => u.predictions.map((p) => getMatchDay(p.kickoffTime))).filter((d): d is number => d !== null),
    );
    return Array.from(days).sort((a, b) => a - b);
  }, [data]);

  const filtered = data.filter((u) => {
    const userOk  = !filterUser  || u.userId === filterUser;
    const matchOk = !filterMatch || u.predictions.some((p) => p.matchId === Number(filterMatch));
    const dayOk   = selectedDay === null || u.predictions.some((p) => getMatchDay(p.kickoffTime) === selectedDay);
    return userOk && matchOk && dayOk;
  });

  const inputStyle: React.CSSProperties = {
    background: 'rgba(21,33,54,0.8)', border: '1px solid rgba(91,110,140,0.3)',
    borderRadius: 8, color: '#E8EDF5', padding: '6px 12px',
    fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif',
  };

  if (loading) return <div className="animate-pulse h-24 rounded-xl" style={{ background: 'rgba(21,33,54,0.6)' }} />;

  const totalPredictions = data.reduce((s, u) => s + u.totalPredictions, 0);
  const usersWithZero    = data.filter((u) => u.totalPredictions === 0).length;

  return (
    <div className="space-y-4">

      {/* ── Next match coverage panel ── */}
      {nextMatch && (
        <div className="card overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setNextMatchOpen((o) => !o)}
          >
            <span className="text-lg">⏭</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-wc-text uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
                  Próximo partido
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ background: 'rgba(0,200,122,0.08)', border: '1px solid rgba(0,200,122,0.2)', color: '#00C87A', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  #{nextMatch.id}
                </span>
                <span className="text-sm font-bold text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.04em' }}>
                  {nextMatch.homeTeam} vs {nextMatch.awayTeam}
                </span>
                <span className="text-xs text-wc-muted">
                  {new Date(nextMatch.kickoffTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  {' · '}
                  {new Date(nextMatch.kickoffTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Summary badges */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(0,200,122,0.1)', border: '1px solid rgba(0,200,122,0.2)', color: '#00C87A', fontFamily: 'Barlow Condensed, sans-serif' }}>
                ✓ {usersWithPrediction.length}
              </span>
              {usersWithout.length > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(240,62,62,0.12)', border: '1px solid rgba(240,62,62,0.3)', color: '#F03E3E', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  ✗ {usersWithout.length} sin pronóstico
                </span>
              )}
              <span className="text-wc-dim text-xs ml-1">{nextMatchOpen ? '▲' : '▼'}</span>
            </div>
          </div>

          {nextMatchOpen && (
            <div style={{ borderTop: '1px solid rgba(21,33,54,0.8)' }}>
              {/* Users WITHOUT prediction */}
              {usersWithout.length > 0 && (
                <div>
                  <div className="px-5 py-2" style={{ background: 'rgba(240,62,62,0.04)', borderBottom: '1px solid rgba(240,62,62,0.1)' }}>
                    <span className="text-xs font-bold uppercase text-red-400" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
                      ✗ Sin pronóstico ({usersWithout.length})
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(21,33,54,0.6)', background: 'rgba(240,62,62,0.03)' }}>
                          {['USUARIO', 'NOMBRE', 'EMAIL', 'TOTAL PRONÓS.'].map((h) => (
                            <th key={h} className="py-2 px-5 text-left font-bold text-wc-muted"
                              style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {usersWithout.sort((a, b) => a.username.localeCompare(b.username)).map((u) => (
                          <tr key={u.userId} style={{ borderBottom: '1px solid rgba(21,33,54,0.4)', background: 'rgba(240,62,62,0.02)' }}>
                            <td className="py-2.5 px-5 font-bold" style={{ color: '#F03E3E', fontFamily: 'Barlow Condensed, sans-serif' }}>{u.username}</td>
                            <td className="py-2.5 px-5 text-wc-muted">{u.name ?? '—'}</td>
                            <td className="py-2.5 px-5 text-wc-dim font-mono">{u.email}</td>
                            <td className="py-2.5 px-5">
                              <span className="tabular-nums font-bold px-1.5 py-0.5 rounded"
                                style={{ background: u.totalPredictions === 0 ? 'rgba(240,62,62,0.12)' : 'rgba(91,110,140,0.12)', color: u.totalPredictions === 0 ? '#F03E3E' : '#5B6E8C', fontFamily: 'Barlow Condensed, sans-serif' }}>
                                {u.totalPredictions} pred.
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Users WITH prediction */}
              {usersWithPrediction.length > 0 && (
                <div>
                  <div className="px-5 py-2" style={{ background: 'rgba(0,200,122,0.03)', borderBottom: '1px solid rgba(0,200,122,0.08)', borderTop: usersWithout.length > 0 ? '1px solid rgba(21,33,54,0.8)' : undefined }}>
                    <span className="text-xs font-bold uppercase" style={{ color: '#00C87A', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}>
                      ✓ Con pronóstico ({usersWithPrediction.length})
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(21,33,54,0.6)', background: 'rgba(0,200,122,0.02)' }}>
                          {['USUARIO', 'NOMBRE', 'PREDICCIÓN'].map((h) => (
                            <th key={h} className="py-2 px-5 text-left font-bold text-wc-muted"
                              style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {usersWithPrediction.sort((a, b) => a.username.localeCompare(b.username)).map((u) => {
                          const pred = u.predictions.find((p) => p.matchId === nextMatch.id)!;
                          return (
                            <tr key={u.userId} style={{ borderBottom: '1px solid rgba(21,33,54,0.4)' }}>
                              <td className="py-2.5 px-5 font-bold text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{u.username}</td>
                              <td className="py-2.5 px-5 text-wc-muted">{u.name ?? '—'}</td>
                              <td className="py-2.5 px-5 font-bold tabular-nums" style={{ color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif' }}>
                                {pred.homeScorePredicted} – {pred.awayScorePredicted}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {usersWithout.length === 0 && (
                <div className="px-5 py-4 text-center text-xs font-bold" style={{ color: '#00C87A', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
                  ✓ Todos los usuarios han ingresado su pronóstico para este partido.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Full predictions table ── */}
      <div className="card overflow-hidden">
        {/* Filters + stats bar */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(21,33,54,0.8)' }}>
          <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} style={{ ...inputStyle, flex: '1 1 150px' }}>
            <option value="">Todos los usuarios</option>
            {allUsers.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
          <select value={filterMatch} onChange={(e) => setFilterMatch(e.target.value)} style={{ ...inputStyle, flex: '1 1 150px' }}>
            <option value="">Todos los partidos</option>
            {allMatches.map((id) => {
              const pred = data.flatMap((u) => u.predictions).find((p) => p.matchId === id);
              return <option key={id} value={String(id)}>#{id} {pred ? `${pred.homeTeam} vs ${pred.awayTeam}` : ''}</option>;
            })}
          </select>
          {availableDays.length > 0 && (
            <select
              value={selectedDay ?? ''}
              onChange={(e) => setSelectedDay(e.target.value === '' ? null : Number(e.target.value))}
              style={{ ...inputStyle, flex: '1 1 120px' }}
            >
              <option value="">Todos los días</option>
              {availableDays.map((day) => <option key={day} value={day}>Día {day}</option>)}
            </select>
          )}
          <span className="text-xs text-wc-muted ml-auto" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            {totalPredictions} predicciones · {filtered.length} usuarios
            {usersWithZero > 0 && <span className="text-red-400 ml-2">⚠ {usersWithZero} sin predicciones</span>}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>No hay datos.</div>
        ) : (
          <div>
            {filtered.map((u) => {
              const isOpen = expanded.has(u.userId);
              const visiblePredictions = u.predictions.filter((p) => {
                const matchOk = !filterMatch || p.matchId === Number(filterMatch);
                const dayOk   = selectedDay === null || getMatchDay(p.kickoffTime) === selectedDay;
                return matchOk && dayOk;
              });
              const totalPts = visiblePredictions.reduce((s, p) => s + (p.pointsEarned ?? 0), 0);
              const hasZero  = u.totalPredictions === 0;
              const missingNext = nextMatch && !u.predictions.some((p) => p.matchId === nextMatch.id);

              return (
                <div key={u.userId}>
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
                    style={{ borderBottom: '1px solid rgba(21,33,54,0.6)', background: hasZero ? 'rgba(240,62,62,0.04)' : undefined }}
                    onClick={() => toggleExpand(u.userId)}
                  >
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700, color: hasZero ? '#F03E3E' : '#E8EDF5', letterSpacing: '0.03em' }}>
                      {u.username}
                    </span>
                    {u.name && <span className="text-xs text-wc-dim">{u.name}</span>}
                    {missingNext && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(240,62,62,0.1)', border: '1px solid rgba(240,62,62,0.25)', color: '#F03E3E', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.04em' }}>
                        ⚠ Sin pronóst. próx.
                      </span>
                    )}
                    <span className="ml-auto text-xs font-bold tabular-nums px-2 py-0.5 rounded"
                      style={{ background: hasZero ? 'rgba(240,62,62,0.12)' : 'rgba(91,110,140,0.15)', color: hasZero ? '#F03E3E' : '#5B6E8C', fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {u.totalPredictions} pred.
                    </span>
                    {totalPts > 0 && (
                      <span className="text-xs font-bold tabular-nums px-2 py-0.5 rounded"
                        style={{ background: 'rgba(0,200,122,0.1)', color: '#00C87A', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {totalPts} pts
                      </span>
                    )}
                    <span className="text-wc-dim text-xs ml-1">{isOpen ? '▲' : '▼'}</span>
                  </div>

                  {isOpen && (
                    <div style={{ background: 'rgba(4,7,14,0.4)', borderBottom: '1px solid rgba(21,33,54,0.8)' }}>
                      {visiblePredictions.length === 0 ? (
                        <div className="px-6 py-4 text-xs text-wc-dim" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                          {hasZero ? 'Este usuario no ha ingresado predicciones.' : 'Sin predicciones para el filtro seleccionado.'}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(21,33,54,0.6)' }}>
                                {['PARTIDO', 'EQUIPOS', 'PREDICCIÓN', 'RESULTADO', 'PTS', 'INGRESADO'].map((h) => (
                                  <th key={h} className="py-2 px-4 text-left font-bold text-wc-muted"
                                    style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {visiblePredictions.map((p) => {
                                const pts = p.pointsEarned ?? 0;
                                const ptsColor = pts === 5 ? '#F5A623' : pts === 3 ? '#00C87A' : '#5B6E8C';
                                return (
                                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(21,33,54,0.3)' }}>
                                    <td className="py-2 px-4 tabular-nums text-wc-dim">#{p.matchId}</td>
                                    <td className="py-2 px-4 font-bold text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                                      {p.homeTeam} vs {p.awayTeam}
                                    </td>
                                    <td className="py-2 px-4 tabular-nums font-bold" style={{ color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif' }}>
                                      {p.homeScorePredicted} – {p.awayScorePredicted}
                                    </td>
                                    <td className="py-2 px-4 tabular-nums text-wc-muted">
                                      {p.homeScoreActual !== null && p.awayScoreActual !== null
                                        ? `${p.homeScoreActual} – ${p.awayScoreActual}`
                                        : p.matchStatus === 'finished' ? '? – ?' : '—'}
                                    </td>
                                    <td className="py-2 px-4">
                                      <span className="font-bold tabular-nums px-1.5 py-0.5 rounded"
                                        style={{ background: `${ptsColor}1a`, color: ptsColor, fontFamily: 'Barlow Condensed, sans-serif' }}>
                                        {pts} pts
                                      </span>
                                    </td>
                                    <td className="py-2 px-4 tabular-nums text-wc-dim">
                                      {new Date(p.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      {' '}
                                      {new Date(p.updatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardAdmin() {
  const [entries, setEntries]   = useState<{ rank: number; userId: string; totalPoints: number; username?: string }[]>([]);
  const [userMap, setUserMap]   = useState<Map<string, { name: string | null; email: string; phone: string | null; createdAt: string }>>(new Map());
  const [loading, setLoading]   = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirm, setConfirm]   = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [lb, users] = await Promise.all([
        fetch('/api/leaderboard').then((r) => r.json()) as Promise<{ rank: number; userId: string; totalPoints: number; username: string }[]>,
        adminFetchUsers(),
      ]);
      setEntries(Array.isArray(lb) ? lb : []);
      const map = new Map(users.map((u) => [u.id, { name: u.name, email: u.email, phone: u.phone, createdAt: u.createdAt }]));
      setUserMap(map);
    } catch { setEntries([]); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(userId: string) {
    if (confirm !== userId) { setConfirm(userId); return; }
    setRemoving(userId);
    setError(null);
    try {
      await adminRemoveFromLeaderboard(userId);
      setEntries((prev) => prev.filter((e) => e.userId !== userId));
      setConfirm(null);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al eliminar');
    } finally { setRemoving(null); }
  }

  if (loading) return <div className="animate-pulse h-24 rounded-xl" style={{ background: 'rgba(21,33,54,0.6)' }} />;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(21,33,54,0.8)' }}>
        <span className="text-xs font-bold text-wc-muted uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>
          Gestionar Ranking
        </span>
        <span className="text-xs text-wc-dim ml-auto">{entries.length} participantes</span>
      </div>
      {error && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg text-xs text-red-400" style={{ background: 'rgba(240,62,62,0.1)', border: '1px solid rgba(240,62,62,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>
          {error}
        </div>
      )}
      {entries.length === 0 ? (
        <div className="py-12 text-center text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>El ranking está vacío.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(21,33,54,0.8)', background: 'rgba(245,166,35,0.04)' }}>
                {['#', 'USUARIO', 'NOMBRE', 'EMAIL', 'TELÉFONO', 'REGISTRO', 'PUNTOS', 'ACCIÓN'].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-bold text-wc-muted"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const info = userMap.get(e.userId);
                return (
                  <tr key={e.userId} style={{ borderBottom: '1px solid rgba(21,33,54,0.5)' }}>
                    <td className="py-3 px-4 tabular-nums text-wc-dim text-xs">{e.rank}</td>
                    <td className="py-3 px-4 text-xs font-bold text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {e.username ?? e.userId}
                    </td>
                    <td className="py-3 px-4 text-xs text-wc-muted">{info?.name ?? '—'}</td>
                    <td className="py-3 px-4 text-xs text-wc-dim font-mono">{info?.email ?? '—'}</td>
                    <td className="py-3 px-4 text-xs text-wc-muted">{info?.phone ?? '—'}</td>
                    <td className="py-3 px-4 text-xs text-wc-muted tabular-nums" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {info?.createdAt ? new Date(info.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold tabular-nums px-2 py-0.5 rounded"
                        style={{ background: 'rgba(0,200,122,0.1)', color: '#00C87A', fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {e.totalPoints} pts
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {confirm === e.userId ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-400" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>¿Confirmar?</span>
                          <button
                            onClick={() => handleRemove(e.userId)}
                            disabled={removing === e.userId}
                            className="rounded px-2 py-0.5 text-xs font-bold"
                            style={{ background: 'rgba(240,62,62,0.2)', color: '#F03E3E', border: '1px solid rgba(240,62,62,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                            {removing === e.userId ? '...' : 'Sí, eliminar'}
                          </button>
                          <button
                            onClick={() => setConfirm(null)}
                            className="rounded px-2 py-0.5 text-xs"
                            style={{ background: 'rgba(91,110,140,0.2)', color: '#5B6E8C', border: '1px solid rgba(91,110,140,0.3)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRemove(e.userId)}
                          className="rounded px-3 py-1 text-xs font-bold uppercase transition-colors"
                          style={{ background: 'rgba(240,62,62,0.08)', color: '#F03E3E', border: '1px solid rgba(240,62,62,0.2)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
                          Quitar del ranking
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InviteCodesAdmin() {
  const [codes, setCodes] = useState<InviteCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [count, setCount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    adminFetchInviteCodes()
      .then(setCodes)
      .catch(() => setError('Error al cargar códigos'))
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await adminGenerateCodes(count);
      setSuccessMsg(`✓ ${res.generated} códigos generados`);
      const updated = await adminFetchInviteCodes();
      setCodes(updated);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al generar códigos');
    } finally {
      setGenerating(false);
    }
  }

  const available = codes.filter((c) => c.status === 'available').length;
  const used = codes.filter((c) => c.status === 'used').length;

  if (loading) return <div className="animate-pulse h-24 rounded-xl" style={{ background: 'rgba(21,33,54,0.6)' }} />;

  return (
    <div className="space-y-4">
      {/* Stats + Generate */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-center">
            <div className="text-2xl font-black" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#00C87A' }}>{available}</div>
            <div className="text-xs text-wc-muted uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>Disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black" style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#F5A623' }}>{used}</div>
            <div className="text-xs text-wc-muted uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>Utilizados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-wc-text" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{codes.length}</div>
            <div className="text-xs text-wc-muted uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>Total</div>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-bold text-wc-muted mb-1 uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>Cantidad a generar</label>
            <input
              type="number" min={1} max={500} value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="input w-28 text-center"
              style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1rem' }}
            />
          </div>
          <button type="submit" disabled={generating}
            className="rounded-lg px-5 py-2 text-sm font-black uppercase"
            style={{ background: generating ? 'rgba(0,200,122,0.1)' : 'linear-gradient(135deg,#00C87A,#00A864)', color: '#04070E', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em', opacity: generating ? 0.6 : 1 }}>
            {generating ? 'Generando…' : '+ Generar códigos'}
          </button>
          <button type="button" onClick={() => adminExportInviteCodesCsv().catch(() => {})}
            className="rounded-lg px-5 py-2 text-sm font-black uppercase"
            style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>
            ↓ Exportar CSV
          </button>
        </form>

        {successMsg && <p className="text-xs" style={{ color: '#00C87A', fontFamily: 'Barlow Condensed, sans-serif' }}>{successMsg}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(21,33,54,0.8)', background: 'rgba(245,166,35,0.04)' }}>
                {['CÓDIGO', 'ESTADO', 'USUARIO', 'EMAIL', 'USADO EL'].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-bold text-wc-muted"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.code} style={{ borderBottom: '1px solid rgba(21,33,54,0.5)' }}>
                  <td className="py-3 px-4 font-mono text-sm font-bold tracking-widest text-wc-text">{c.code}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-bold uppercase" style={{
                      fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em',
                      color: c.status === 'available' ? '#00C87A' : '#5B6E8C',
                    }}>{c.status === 'available' ? 'Disponible' : 'Usado'}</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{c.username ?? '—'}</td>
                  <td className="py-3 px-4 text-xs text-wc-dim font-mono">{c.email ?? '—'}</td>
                  <td className="py-3 px-4 text-xs text-wc-muted tabular-nums" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {c.usedAt ? new Date(c.usedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, isAuthenticated } = useAuthToken();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'matches' | 'audit' | 'bonus' | 'users' | 'codes' | 'predictions' | 'ranking'>('matches');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') { navigate('/'); return; }
    Promise.all([adminFetchMatches(), adminFetchAuditLogs()])
      .then(([m, a]) => { setMatches(m); setAuditLogs(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, navigate]);

  const handleMatchUpdated = (updated: Match) => {
    setMatches((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
    adminFetchAuditLogs().then(setAuditLogs).catch(() => {});
  };

  const pillBase = 'rounded-full px-4 py-1.5 text-sm font-bold transition-all cursor-pointer';
  const activeStyle = { background: 'linear-gradient(135deg, #F5A623 0%, #E8920F 100%)', color: '#04070E', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' as const };
  const inactiveStyle = { background: 'rgba(21,33,54,0.6)', border: '1px solid #152136', color: '#5B6E8C', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' as const };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 py-8 text-center">
        <h1 className="leading-none"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 'clamp(2rem, 7vw, 3.5rem)', color: '#E8EDF5', textTransform: 'uppercase' }}>
          ⚙️ PANEL <span className="text-gold-shimmer">ADMIN</span>
        </h1>
      </div>

      <div className="mb-5 flex items-center gap-3 flex-wrap">
        <button className={pillBase} style={tab === 'matches' ? activeStyle : inactiveStyle} onClick={() => setTab('matches')}>Partidos</button>
        <button className={pillBase} style={tab === 'audit' ? activeStyle : inactiveStyle} onClick={() => setTab('audit')}>Audit Log</button>
        <button className={pillBase} style={tab === 'predictions' ? activeStyle : inactiveStyle} onClick={() => setTab('predictions')}>📋 Predicciones</button>
        <button className={pillBase} style={tab === 'ranking' ? activeStyle : inactiveStyle} onClick={() => setTab('ranking')}>🏅 Ranking</button>
        <button className={pillBase} style={tab === 'bonus' ? activeStyle : inactiveStyle} onClick={() => setTab('bonus')}>🏆 Gol de Oro</button>
        <button className={pillBase} style={tab === 'users' ? activeStyle : inactiveStyle} onClick={() => setTab('users')}>👥 Usuarios</button>
        <button className={pillBase} style={tab === 'codes' ? activeStyle : inactiveStyle} onClick={() => setTab('codes')}>🎟 Códigos</button>
        <button
          className={pillBase}
          style={{ background: 'rgba(0,200,122,0.1)', border: '1px solid rgba(0,200,122,0.25)', color: '#00C87A', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}
          onClick={() => adminExportLeaderboardCsv().catch(() => {})}
        >
          ↓ Exportar CSV
        </button>
      </div>

      {loading && <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="card animate-pulse h-16" />)}</div>}

      {!loading && tab === 'bonus' && <GoldenBallAdmin />}

      {!loading && tab === 'users' && <UsersAdmin />}

      {!loading && tab === 'codes' && <InviteCodesAdmin />}

      {!loading && tab === 'predictions' && <PredictionsAdmin />}

      {!loading && tab === 'ranking' && <LeaderboardAdmin />}

      {!loading && tab === 'matches' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(21,33,54,0.8)', background: 'rgba(245,166,35,0.04)' }}>
                  {['ID', 'PARTIDO', 'ESTADO', 'FECHA', 'MARCADOR'].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-bold text-wc-muted"
                      style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  const kickoff = new Date(m.kickoffTime);
                  const statusColor = m.status === 'live' ? '#F03E3E' : m.status === 'finished' ? '#5B6E8C' : '#00C87A';
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(21,33,54,0.5)' }}>
                      <td className="py-3 px-4 text-xs text-wc-dim tabular-nums">{m.id}</td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-bold text-wc-text uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}>
                          {m.homeTeam} vs {m.awayTeam}
                        </div>
                        {m.group && <div className="text-xs text-wc-dim">{m.group.replace('GROUP_', 'Gr. ')} · MD{m.matchday}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold uppercase" style={{ color: statusColor, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em' }}>{m.status}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {kickoff.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} {kickoff.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <ScoreEditor match={m} onUpdated={handleMatchUpdated} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tab === 'audit' && (
        <div className="card overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-wc-muted" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>No hay entradas en el audit log todavía.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(21,33,54,0.8)', background: 'rgba(245,166,35,0.04)' }}>
                    {['FECHA', 'SERVICIO', 'ACCIÓN', 'DETALLE', 'ADMIN'].map((h) => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-bold text-wc-muted"
                        style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => {
                    const detail = log.detail ? (() => { try { return JSON.parse(log.detail); } catch { return {}; } })() : {};
                    const actionLabel: Record<string, string> = {
                      UPDATE_SCORE:          '⚽ Marcador actualizado',
                      SYNC_FIXTURES:         '🔄 Sync de partidos',
                      UPDATE_USER:           '✏️ Usuario editado',
                      DELETE_USER:           '🗑️ Usuario eliminado',
                      GENERATE_INVITE_CODES: '🎟 Códigos generados',
                      DECLARE_BONUS_winner:  '🏆 Ganador Gol de Oro',
                      DECLARE_BONUS_WINNER:  '🏆 Ganador Gol de Oro',
                    };
                    const svcColor: Record<string, string> = { matches: '#F5A623', auth: '#7B6FF0', predictions: '#00C87A' };
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(21,33,54,0.5)' }}>
                        <td className="py-3 px-4 text-xs text-wc-muted tabular-nums whitespace-nowrap" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                          {new Date(log.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-bold uppercase px-2 py-0.5 rounded" style={{ color: svcColor[log.service] ?? '#5B6E8C', background: `${svcColor[log.service] ?? '#5B6E8C'}18`, fontFamily: 'Barlow Condensed, sans-serif' }}>
                            {log.service}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-wc-text whitespace-nowrap" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                          {actionLabel[log.action] ?? log.action}
                        </td>
                        <td className="py-3 px-4 text-xs text-wc-dim max-w-[220px] truncate">
                          {log.action === 'UPDATE_SCORE' && log.matchId !== null && (
                            <span>Partido #{log.matchId}: {log.previousHome !== null ? `${log.previousHome}–${log.previousAway}` : '—'} → <strong style={{ color: '#F5A623' }}>{log.newHome}–{log.newAway}</strong></span>
                          )}
                          {log.action === 'SYNC_FIXTURES' && <span>{detail.upserted ?? 0} partidos sincronizados</span>}
                          {log.action === 'UPDATE_USER' && <span>@{detail.changes?.username ?? ''} {detail.targetUserId?.slice(0, 8)}</span>}
                          {log.action === 'DELETE_USER' && <span>@{detail.username} ({detail.email})</span>}
                          {log.action === 'GENERATE_INVITE_CODES' && <span>{detail.count} códigos nuevos</span>}
                          {(log.action === 'DECLARE_BONUS_WINNER' || log.action === 'DECLARE_BONUS_winner') && <span>🏆 {detail.winner} · {detail.usersScored} usuarios</span>}
                        </td>
                        <td className="py-3 px-4 text-xs text-wc-dim font-mono truncate max-w-[90px]">{log.adminUserId.slice(0, 8)}…</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


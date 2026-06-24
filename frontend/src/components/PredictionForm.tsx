import React, { useState } from 'react';
import { submitPrediction } from '../services/api';
import { useToast } from './Toast';

export interface SavedPrediction {
  homeScorePredicted: number;
  awayScorePredicted: number;
  pointsEarned: number;
}

interface Props {
  matchId: number;
  initialHome?: number;
  initialAway?: number;
  onSaved?: (data: SavedPrediction) => void;
}

export default function PredictionForm({ matchId, initialHome, initialAway, onSaved }: Props) {
  const [home, setHome] = useState(initialHome ?? 0);
  const [away, setAway] = useState(initialAway ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(initialHome !== undefined && initialAway !== undefined);
  const { showToast } = useToast();

  function clamp(val: number) {
    return Math.max(0, Math.min(99, val));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await submitPrediction({ matchId, homeScorePredicted: home, awayScorePredicted: away });
      setSaved(true);
      showToast('Guardado exitosamente');
      onSaved?.({ homeScorePredicted: result.homeScorePredicted ?? home, awayScorePredicted: result.awayScorePredicted ?? away, pointsEarned: result.pointsEarned ?? 0 });
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function handleModify() {
    setSaved(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-2">
      {saved ? (
        <button
          type="button"
          onClick={handleModify}
          className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20"
        >
          Modificar pronóstico
        </button>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setHome(clamp(home - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-700 font-bold text-slate-300 transition-colors hover:bg-slate-600"
              >
                –
              </button>
              <input
                type="number"
                min={0}
                max={99}
                value={home}
                onChange={(e) => setHome(clamp(parseInt(e.target.value, 10) || 0))}
                className="w-12 rounded-md border border-slate-600 bg-slate-900 py-1 text-center text-lg font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setHome(clamp(home + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-700 font-bold text-slate-300 transition-colors hover:bg-slate-600"
              >
                +
              </button>
            </div>

            <span className="font-bold text-slate-500">–</span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAway(clamp(away - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-700 font-bold text-slate-300 transition-colors hover:bg-slate-600"
              >
                –
              </button>
              <input
                type="number"
                min={0}
                max={99}
                value={away}
                onChange={(e) => setAway(clamp(parseInt(e.target.value, 10) || 0))}
                className="w-12 rounded-md border border-slate-600 bg-slate-900 py-1 text-center text-lg font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setAway(clamp(away + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-700 font-bold text-slate-300 transition-colors hover:bg-slate-600"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg py-2 text-sm font-semibold transition-all btn-primary"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Guardando…
              </span>
            ) : 'Guardar pronóstico'}
          </button>
        </>
      )}

      {error && <p className="text-center text-xs text-red-400">{error}</p>}
    </form>
  );
}

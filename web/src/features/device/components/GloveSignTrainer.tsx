import React, { useState, useEffect } from 'react';
import { useGloveStore } from '../../../stores/gloveStore';
import { PlusCircle, Save, Trash2, Hand, Sparkles } from 'lucide-react';

export interface CustomGloveSign {
  id: string;
  name: string;
  flex: [number, number, number, number, number];
  flexTol: number;
  roll: number;
  pitch: number;
  useImu: boolean;
  createdAt: number;
}

const STORAGE_KEY = 'kinex_custom_glove_signs';

export const GloveSignTrainer: React.FC = () => {
  const { telemetry } = useGloveStore();
  const [signName, setSignName] = useState('');
  const [tolerance, setTolerance] = useState(25);
  const [useImu, setUseImu] = useState(true);
  const [savedSigns, setSavedSigns] = useState<CustomGloveSign[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Load custom signs from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSavedSigns(JSON.parse(raw));
      }
    } catch (err) {
      console.warn('[GloveSignTrainer] Error loading saved signs:', err);
    }
  }, []);

  const currentFlex = telemetry.flex || [0, 0, 0, 0, 0];
  const currentRoll = telemetry.roll || 0;
  const currentPitch = telemetry.pitch || 0;

  const handleSaveSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signName.trim()) return;

    const newSign: CustomGloveSign = {
      id: `sign_${Date.now()}`,
      name: signName.trim().toUpperCase(),
      flex: [...currentFlex] as [number, number, number, number, number],
      flexTol: tolerance,
      roll: Number(currentRoll.toFixed(1)),
      pitch: Number(currentPitch.toFixed(1)),
      useImu,
      createdAt: Date.now(),
    };

    const updated = [newSign, ...savedSigns];
    setSavedSigns(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSignName('');
    setFeedbackMsg(`Successfully added sign "${newSign.name}"!`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleDeleteSign = (id: string) => {
    const updated = savedSigns.filter((s) => s.id !== id);
    setSavedSigns(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-semibold text-white">Record & Create Custom Glove Signs</h3>
        </div>
        {feedbackMsg && (
          <span className="text-xs text-emerald-400 font-medium animate-pulse">{feedbackMsg}</span>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Hold your hand in the target pose and record the flex sensor snapshot + IMU angles to train new gestures for the glove.
      </p>

      {/* Sign Creation Form */}
      <form onSubmit={handleSaveSign} className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Sign Label / Word Name
            </label>
            <input
              type="text"
              value={signName}
              onChange={(e) => setSignName(e.target.value)}
              placeholder="e.g. HELLO, PEACE, OK, HELP"
              required
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
              <span>Tolerance Margin</span>
              <span className="text-indigo-400 font-mono">±{tolerance}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="40"
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
            />
          </div>
        </div>

        {/* Captured Telemetry Preview */}
        <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Hand className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-400">Pose Snapshot:</span>
            <span className="font-mono text-indigo-300">
              [{currentFlex.join(', ')}]
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-400">Roll: <strong className="text-slate-200">{currentRoll.toFixed(1)}°</strong></span>
            <span className="text-slate-400">Pitch: <strong className="text-slate-200">{currentPitch.toFixed(1)}°</strong></span>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={useImu}
                onChange={(e) => setUseImu(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              Include Orientation
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={!signName.trim()}
          className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> Save Custom Glove Sign
        </button>
      </form>

      {/* Saved Custom Signs List */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Saved Custom Signs ({savedSigns.length})
          </span>
        </div>

        {savedSigns.length === 0 ? (
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center text-xs text-slate-500 italic">
            No custom glove signs created yet. Record a gesture above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
            {savedSigns.map((sign) => (
              <div
                key={sign.id}
                className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-indigo-300">{sign.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                      ±{sign.flexTol}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    Flex: [{sign.flex.join(', ')}] | R:{sign.roll}° P:{sign.pitch}°
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteSign(sign.id)}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Delete sign"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

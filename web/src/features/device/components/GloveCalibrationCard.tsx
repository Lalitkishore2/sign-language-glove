import React, { useState } from 'react';
import { useGloveStore } from '../../../stores/gloveStore';
import { Sliders, Hand, Check, AlertCircle } from 'lucide-react';

export const GloveCalibrationCard: React.FC = () => {
  const { calibrateFlat, calibrateFist } = useGloveStore();
  const [flatDone, setFlatDone] = useState(false);
  const [fistDone, setFistDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleCalibrateFlat = () => {
    const ok = calibrateFlat();
    setFlatDone(true);
    setMsg(ok ? 'Flat hand baseline updated!' : 'Sent flat calibration signal');
    setTimeout(() => setMsg(null), 3000);
  };

  const handleCalibrateFist = () => {
    const ok = calibrateFist();
    setFistDone(true);
    setMsg(ok ? 'Fist bend max updated!' : 'Sent fist calibration signal');
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-semibold text-white">Smart Calibration Routine</h3>
        </div>
        {msg && <span className="text-xs text-emerald-400 animate-pulse">{msg}</span>}
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Calibrate your custom finger dimensions for maximum gesture classification precision.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Step 1: Open Hand</span>
              {flatDone && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Extend your hand completely flat and straight in front of you.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCalibrateFlat}
            className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <Hand className="w-3.5 h-3.5" /> Save Flat Baseline
          </button>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Step 2: Full Fist</span>
              {fistDone && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Bend all 5 fingers tightly into a fist to record maximum bend ADC.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCalibrateFist}
            className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5" /> Save Fist Threshold
          </button>
        </div>
      </div>
    </div>
  );
};

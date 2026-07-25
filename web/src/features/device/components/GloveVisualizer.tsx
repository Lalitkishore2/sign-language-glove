import React from 'react';
import { useGloveStore } from '../../../stores/gloveStore';
import { Activity, Compass, Flame } from 'lucide-react';

const FINGER_LABELS = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

export const GloveVisualizer: React.FC = () => {
  const { telemetry } = useGloveStore();
  const flexValues = telemetry.flex || [0, 0, 0, 0, 0];
  const roll = telemetry.roll || 0;
  const pitch = telemetry.pitch || 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all shadow-xl flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-semibold text-white">Live Telemetry & Sensor Flex</h3>
        </div>
        <span className="text-xs text-slate-500 font-mono">5x ADC + MPU6050</span>
      </div>

      {/* Flex Sensor Bars */}
      <div className="grid grid-cols-5 gap-3 mb-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
        {flexValues.map((val, idx) => {
          const isBent = val > 50;
          return (
            <div key={idx} className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">{val}%</span>
              
              <div className="w-full h-36 bg-slate-900 rounded-lg relative overflow-hidden border border-slate-800/80 flex items-end">
                <div
                  className={`w-full transition-all duration-150 rounded-b-md ${
                    isBent
                      ? 'bg-gradient-to-t from-indigo-600 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/20'
                      : 'bg-gradient-to-t from-emerald-600 to-cyan-400'
                  }`}
                  style={{ height: `${Math.min(100, Math.max(0, val))}%` }}
                />
              </div>

              <div className="text-center">
                <p className="text-xs font-medium text-slate-300">{FINGER_LABELS[idx]}</p>
                <p className="text-[10px] text-slate-500 font-mono">Pin {32 + idx}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* IMU Roll & Pitch Gauges */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Compass className="w-5 h-5" style={{ transform: `rotate(${roll}deg)` }} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Wrist Roll</p>
            <p className="text-lg font-mono font-bold text-indigo-400">{roll.toFixed(1)}°</p>
          </div>
        </div>

        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Wrist Pitch</p>
            <p className="text-lg font-mono font-bold text-purple-400">{pitch.toFixed(1)}°</p>
          </div>
        </div>
      </div>
    </div>
  );
};

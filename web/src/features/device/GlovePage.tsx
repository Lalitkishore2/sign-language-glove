import React from 'react';
import { WorkspaceLayout } from '@/layouts/WorkspaceLayout';
import { GloveConnectionCard } from './components/GloveConnectionCard';
import { GloveVisualizer } from './components/GloveVisualizer';
import { GloveGestureDisplay } from './components/GloveGestureDisplay';
import { GloveCalibrationCard } from './components/GloveCalibrationCard';
import { GloveSignTrainer } from './components/GloveSignTrainer';
import { useGloveStore } from '../../stores/gloveStore';
import { Radio, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GlovePage: React.FC = () => {
  const navigate = useNavigate();
  const { setInputMode } = useGloveStore();

  const handleLaunchTranslator = () => {
    setInputMode('glove');
    navigate('/translate');
  };

  return (
    <WorkspaceLayout headerTitle="Smart Glove Hardware Portal">
      <div className="p-6 space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">
              <Radio className="w-4 h-4 animate-pulse" /> Hardware Telemetry Portal
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Smart Glove Station</h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time ESP32 sensor telemetry, flex sensor visualizer, MPU6050 wrist orientation, custom sign recording, and instant classification.
            </p>
          </div>

          <button
            onClick={handleLaunchTranslator}
            className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
          >
            <span>Use Glove in Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Grid Row 1: Connection & Calibration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GloveConnectionCard />
          <GloveCalibrationCard />
        </div>

        {/* Grid Row 2: Visualizer & Live AI Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <GloveVisualizer />
          <GloveGestureDisplay />
        </div>

        {/* Grid Row 3: Custom Glove Sign Creator & Trainer */}
        <GloveSignTrainer />

        {/* System Features Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-3">
            <Zap className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-200">Sub-10ms Latency</p>
              <p className="text-[11px] text-slate-500">Direct WiFi WebSocket streaming from ESP32</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-200">Hybrid Hardware & Vision</p>
              <p className="text-[11px] text-slate-500">Seamless fallback to camera hand tracking</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-3">
            <Radio className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-200">5-Finger ADC + MPU6050</p>
              <p className="text-[11px] text-slate-500">Full 6-DOF wrist orientation tracking</p>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
};

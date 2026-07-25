import React, { useEffect, useState } from 'react';
import { useGloveStore } from '../../../stores/gloveStore';
import { Volume2, VolumeX, Sparkles, History, CheckCircle2 } from 'lucide-react';

export const GloveGestureDisplay: React.FC = () => {
  const { telemetry, history } = useGloveStore();
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [lastSpoken, setLastSpoken] = useState('');

  const gesture = telemetry.gesture || 'WAITING';
  const confidence = telemetry.confidence || 0;

  // Speak gesture when new valid gesture is detected
  useEffect(() => {
    if (ttsEnabled && gesture && gesture !== 'WAITING' && gesture !== lastSpoken && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(gesture.toLowerCase());
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
      setLastSpoken(gesture);
    }
  }, [gesture, ttsEnabled, lastSpoken]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all shadow-xl flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-semibold text-white">Live AI Gesture Recognition</h3>
        </div>

        <button
          type="button"
          onClick={() => setTtsEnabled(!ttsEnabled)}
          className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
            ttsEnabled
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
          }`}
          title="Toggle Text-to-Speech"
        >
          {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>{ttsEnabled ? 'TTS On' : 'Muted'}</span>
        </button>
      </div>

      {/* Main Recognized Word Display */}
      <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800/80 flex flex-col items-center justify-center text-center my-2 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <p className="text-xs uppercase tracking-widest font-mono text-slate-400 mb-2">Detected Hand Pose</p>
        <div className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 mb-3">
          {gesture}
        </div>

        {/* Confidence score */}
        <div className="w-full max-w-xs bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800 mb-2">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${confidence}%` }}
          />
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{confidence}% Confidence Match</span>
        </div>
      </div>

      {/* History Log */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-2 mb-2">
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-400">Recent Stream Timeline</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {history.length === 0 ? (
            <span className="text-xs text-slate-500 italic">No gestures recorded yet</span>
          ) : (
            history.slice(0, 5).map((item, idx) => (
              <div
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-300 shrink-0"
              >
                {item.gesture} <span className="text-slate-500">({item.confidence}%)</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

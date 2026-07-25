import React, { useState } from 'react';
import { useGloveStore } from '../../../stores/gloveStore';
import { Wifi, WifiOff, Cpu, RefreshCw, Play, Square, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

type DiagStatus = 'idle' | 'testing' | 'success' | 'failed';

export const GloveConnectionCard: React.FC = () => {
  const { ip, setIP, connect, disconnect, connected, isConnecting, isSimulating, toggleSimulation } = useGloveStore();
  const [inputIp, setInputIp] = useState(ip);
  const [error, setError] = useState('');
  const [diagStatus, setDiagStatus] = useState<DiagStatus>('idle');
  const [diagLog, setDiagLog] = useState<string[]>([]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIP(inputIp);
    const success = await connect(inputIp);
    if (!success) {
      setError(`Connection to ws://${inputIp}:81/ failed. Check: (1) ESP32 is powered on, (2) both devices are on the SAME WiFi network, (3) your network allows device-to-device communication.`);
    }
  };

  const runDiagnostic = async () => {
    const targetIp = inputIp.trim();
    if (!targetIp) return;
    
    setDiagStatus('testing');
    setDiagLog([]);
    const log = (msg: string) => setDiagLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    log(`Testing connectivity to ${targetIp}...`);

    // Test 1: HTTP fetch to port 81 (will fail but tells us if host is reachable)
    log('Test 1: HTTP reachability check (port 81)...');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      await fetch(`http://${targetIp}:81/`, { signal: controller.signal, mode: 'no-cors' });
      clearTimeout(timeout);
      log('✅ HTTP request did not error — host may be reachable');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('abort')) {
        log('⚠️ HTTP request timed out after 5s — host likely unreachable');
      } else {
        log(`⚠️ HTTP fetch error: ${errMsg}`);
      }
    }

    // Test 2: WebSocket connection with extended 10s timeout
    log('Test 2: WebSocket connection (ws://' + targetIp + ':81/) with 10s timeout...');
    const wsResult = await new Promise<boolean>((resolve) => {
      try {
        const ws = new WebSocket(`ws://${targetIp}:81/`);
        const timeout = setTimeout(() => {
          log('❌ WebSocket timed out after 10 seconds');
          ws.close();
          resolve(false);
        }, 10000);

        ws.onopen = () => {
          clearTimeout(timeout);
          log('✅ WebSocket CONNECTED successfully!');
          ws.close();
          resolve(true);
        };
        ws.onerror = () => {
          clearTimeout(timeout);
          log('❌ WebSocket connection error — host refused or unreachable');
          resolve(false);
        };
        ws.onclose = (e) => {
          log(`WebSocket closed (code: ${e.code}, reason: ${e.reason || 'none'})`);
        };
      } catch (e) {
        log(`❌ Exception creating WebSocket: ${e}`);
        resolve(false);
      }
    });

    if (wsResult) {
      setDiagStatus('success');
      log('🟢 All tests passed — connection should work!');
    } else {
      setDiagStatus('failed');
      log('🔴 Diagnosis: Your laptop CANNOT reach the ESP32.');
      log('   → Ensure both devices are on the SAME WiFi network');
      log('   → Android hotspots often block device-to-device traffic (AP isolation)');
      log('   → Try: Phone Settings → Hotspot → Disable "AP Isolation"');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${connected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              Hardware Glove Gateway
              {connected && (
                <span className="flex h-2 h-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">ESP32 DevKit V1 over Local WiFi WebSockets (Port 81)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
            connected
              ? isSimulating
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            {connected ? (isSimulating ? 'Simulation Mode' : 'Connected (Live)') : 'Disconnected'}
          </span>
        </div>
      </div>

      <form onSubmit={handleConnect} className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
            {connected ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4" />}
          </span>
          <input
            type="text"
            value={inputIp}
            onChange={(e) => { setInputIp(e.target.value); setError(''); }}
            placeholder="ESP32 IP (e.g. 192.168.1.100)"
            disabled={connected || isConnecting}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-all"
          />
        </div>

        {connected ? (
          <button
            type="button"
            onClick={() => { disconnect(); setError(''); }}
            className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-sm font-medium transition-all"
          >
            Disconnect
          </button>
        ) : (
          <button
            type="submit"
            disabled={isConnecting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Glove'
            )}
          </button>
        )}
      </form>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Network Diagnostic Tool */}
      {!connected && (
        <div className="mb-4 p-3 rounded-xl bg-slate-950/50 border border-slate-800/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Network Diagnostics</span>
            <button
              type="button"
              onClick={runDiagnostic}
              disabled={diagStatus === 'testing' || !inputIp.trim()}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {diagStatus === 'testing' ? (
                <><RefreshCw className="w-3 h-3 animate-spin" /> Running...</>
              ) : diagStatus === 'success' ? (
                <><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Passed</>
              ) : diagStatus === 'failed' ? (
                <><XCircle className="w-3 h-3 text-rose-400" /> Failed — Retest</>
              ) : (
                'Run Diagnostics'
              )}
            </button>
          </div>
          {diagLog.length > 0 && (
            <div className="mt-2 p-2 bg-slate-950/80 rounded-lg max-h-32 overflow-y-auto font-mono text-[10px] text-slate-400 space-y-0.5">
              {diagLog.map((line, i) => (
                <div key={i} className={
                  line.includes('✅') ? 'text-emerald-400' :
                  line.includes('❌') ? 'text-rose-400' :
                  line.includes('🔴') ? 'text-rose-400' :
                  line.includes('🟢') ? 'text-emerald-400' :
                  line.includes('⚠️') ? 'text-amber-400' :
                  line.includes('→') ? 'text-amber-300' :
                  ''
                }>{line}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {isSimulating ? 'Demo simulation currently active' : 'No physical glove available?'}
        </span>
        <button
          type="button"
          onClick={toggleSimulation}
          className={`text-xs font-semibold flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all shadow-md ${
            isSimulating
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20'
          }`}
        >
          {isSimulating ? (
            <>
              <Square className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Stop Demo Simulation
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" /> Launch Demo Simulator
            </>
          )}
        </button>
      </div>
    </div>
  );
};

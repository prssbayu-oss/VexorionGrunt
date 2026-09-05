import React from 'react';
import { Activity, Play, Pause, Trash2, Zap, Gauge, Radio } from 'lucide-react';
import { DaemonStatus } from '../../hooks/useRealtimeStream';

interface RealtimeStreamBarProps {
  isAutoStream: boolean;
  setIsAutoStream: (val: boolean) => void;
  isStreaming: boolean;
  toggleStream: () => void;
  speedMs: number;
  changeSpeed: (ms: number) => void;
  daemonStatus: DaemonStatus | null;
  connectionState: 'connected' | 'reconnecting' | 'disconnected';
  onClearLogs: () => void;
  logCount: number;
}

export const RealtimeStreamBar: React.FC<RealtimeStreamBarProps> = ({
  isAutoStream,
  setIsAutoStream,
  isStreaming,
  toggleStream,
  speedMs,
  changeSpeed,
  daemonStatus,
  connectionState,
  onClearLogs,
  logCount
}) => {
  return (
    <div className="w-full max-w-full bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Mode Switcher & Live Pulse */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex bg-stone-950 p-1 rounded-lg border border-stone-800 text-xs font-mono">
            <button
              onClick={() => setIsAutoStream(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
                isAutoStream
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Auto Real-Time (Live)</span>
            </button>
            <button
              onClick={() => setIsAutoStream(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
                !isAutoStream
                  ? 'bg-stone-800 text-stone-100 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>📋 Preset Simulator</span>
            </button>
          </div>

          {/* Status Badge when in Auto Stream */}
          {isAutoStream && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-xs font-mono">
              <span className="relative flex h-2 w-2">
                {isStreaming && connectionState === 'connected' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    !isStreaming
                      ? 'bg-stone-500'
                      : connectionState === 'connected'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                ></span>
              </span>
              <span className="text-stone-300 font-medium">
                {isStreaming
                  ? connectionState === 'connected'
                    ? 'Always Running'
                    : 'Reconnecting...'
                  : 'Stream Paused'}
              </span>
              {daemonStatus && (
                <span className="hidden sm:inline text-stone-500 border-l border-stone-800 pl-2">
                  Task: <span className="text-cyan-400 font-semibold">{daemonStatus.currentTask}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Realtime Controls when in Auto Stream */}
        {isAutoStream ? (
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800 text-xs font-mono">
              <span className="text-stone-500 px-1 text-[11px] hidden sm:inline flex items-center gap-1">
                <Gauge className="w-3 h-3" /> Speed:
              </span>
              {[
                { label: '300ms', val: 300 },
                { label: '600ms', val: 600 },
                { label: '1200ms', val: 1200 }
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => changeSpeed(s.val)}
                  className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                    speedMs === s.val
                      ? 'bg-stone-800 text-emerald-400 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Pause / Resume Button */}
            <button
              onClick={toggleStream}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                isStreaming
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
              }`}
            >
              {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isStreaming ? 'Pause Stream' : 'Resume Stream'}</span>
            </button>

            {/* Clear Logs */}
            <button
              onClick={onClearLogs}
              title="Clear live stream buffer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-stone-400 hover:text-stone-200 bg-stone-950 hover:bg-stone-800 border border-stone-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear ({logCount})</span>
            </button>
          </div>
        ) : (
          <div className="text-xs font-mono text-stone-500 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-stone-400" />
            <span>Preset execution mode active. Switch to &quot;Auto Real-Time&quot; for continuous live daemon streaming.</span>
          </div>
        )}
      </div>
    </div>
  );
};

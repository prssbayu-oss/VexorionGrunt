import React from 'react';
import { CacheStats } from '../../types';

interface TelemetryBarProps {
  isHooked: boolean;
  onToggleHook: () => void;
  suppressedCount: number;
  visibleCount: number;
  cleanCount: number;
  cacheStats: CacheStats;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  isHooked,
  onToggleHook,
  suppressedCount,
  visibleCount,
  cleanCount,
  cacheStats
}) => {
  const reductionPercent =
    visibleCount > 0 ? Math.round((suppressedCount / visibleCount) * 100) : 0;

  return (
    <div className="w-full max-w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Metric 1: Hook State */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 flex items-center justify-between min-w-0">
        <div className="min-w-0">
          <div className="text-[11px] font-mono text-stone-400">VEXORION HOOK</div>
          <div className="text-sm font-bold font-mono text-stone-100 flex items-center gap-1.5 mt-0.5 truncate">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isHooked ? 'bg-emerald-400' : 'bg-rose-500'}`} />
            <span className="truncate">{isHooked ? 'Active (Muting)' : 'Inactive (Raw)'}</span>
          </div>
        </div>
        <button
          id="toggle-hook-telemetry-btn"
          onClick={onToggleHook}
          className="text-xs font-mono px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors shrink-0 ml-2"
        >
          {isHooked ? 'Unhook' : 'Hook'}
        </button>
      </div>

      {/* Metric 2: Noise Muted */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 min-w-0">
        <div className="text-[11px] font-mono text-stone-400">NOISE ELIMINATED</div>
        <div className="text-sm font-bold font-mono text-emerald-400 flex items-baseline gap-1.5 mt-0.5 truncate">
          <span>{suppressedCount} lines</span>
          <span className="text-xs text-stone-400 font-normal">
            ({reductionPercent}% saved)
          </span>
        </div>
      </div>

      {/* Metric 3: Critical Logs */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 min-w-0">
        <div className="text-[11px] font-mono text-stone-400">CRITICAL PRESERVED</div>
        <div className="text-sm font-bold font-mono text-stone-200 mt-0.5 truncate">
          {cleanCount} signal lines passed
        </div>
      </div>

      {/* Metric 4: LRU Cache Hit Rate */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 min-w-0">
        <div className="text-[11px] font-mono text-stone-400">DECISION CACHE SPEED</div>
        <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5 truncate">
          {cacheStats.hits}h / {cacheStats.misses}m ({cacheStats.hitRate})
        </div>
      </div>
    </div>
  );
};

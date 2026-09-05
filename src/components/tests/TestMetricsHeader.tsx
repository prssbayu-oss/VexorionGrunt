import React from 'react';
import { Clock } from 'lucide-react';

interface TestMetricsHeaderProps {
  total: number;
  passed: number;
  failed: number;
  totalDuration: number;
}

export const TestMetricsHeader: React.FC<TestMetricsHeaderProps> = ({
  total,
  passed,
  failed,
  totalDuration
}) => {
  return (
    <div className="w-full max-w-full grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 min-w-0">
        <div className="text-[11px] font-mono text-stone-400">TOTAL ASSERTIONS</div>
        <div className="text-base sm:text-lg font-bold font-mono text-stone-100 mt-0.5 truncate">
          {total} specs
        </div>
      </div>
      <div className="bg-stone-900/90 border border-emerald-900/40 rounded-xl p-3 min-w-0">
        <div className="text-[11px] font-mono text-emerald-400">PASSING</div>
        <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-0.5 truncate">
          {passed} passed
        </div>
      </div>
      <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 min-w-0">
        <div className="text-[11px] font-mono text-stone-400">FAILING</div>
        <div
          className={`text-base sm:text-lg font-bold font-mono mt-0.5 truncate ${
            failed > 0 ? 'text-rose-400' : 'text-stone-400'
          }`}
        >
          {failed} failed
        </div>
      </div>
      <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 min-w-0">
        <div className="text-[11px] font-mono text-stone-400">TOTAL DURATION</div>
        <div className="text-base sm:text-lg font-bold font-mono text-cyan-400 mt-0.5 flex items-center gap-1 truncate">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{totalDuration.toFixed(2)} ms</span>
        </div>
      </div>
    </div>
  );
};

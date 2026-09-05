import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { TestCaseResult } from '../../types';

interface TestItemRowProps {
  item: TestCaseResult;
}

export const TestItemRow: React.FC<TestItemRowProps> = ({ item }) => {
  return (
    <div className="p-3.5 hover:bg-stone-800/30 transition-colors flex items-start justify-between gap-3 max-w-full">
      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
        <div className="pt-0.5 shrink-0">
          {item.passed ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800 shrink-0">
              {item.suite}
            </span>
            <span className="text-xs font-mono font-medium text-stone-200 break-all">
              {item.name}
            </span>
          </div>

          {item.error && (
            <div className="mt-2 p-2 rounded bg-rose-950/40 border border-rose-800/50 text-xs font-mono text-rose-300 flex items-start gap-2 break-all">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-rose-400 shrink-0" />
              <span>{item.error}</span>
            </div>
          )}
        </div>
      </div>

      <div className="text-[11px] font-mono text-stone-500 whitespace-nowrap pt-0.5 shrink-0 ml-2">
        {item.durationMs} ms
      </div>
    </div>
  );
};

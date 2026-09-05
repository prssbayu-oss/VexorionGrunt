import React from 'react';

interface TestFilterBarProps {
  filter: 'all' | 'passed' | 'failed';
  setFilter: (filter: 'all' | 'passed' | 'failed') => void;
  total: number;
  passed: number;
  failed: number;
}

export const TestFilterBar: React.FC<TestFilterBarProps> = ({
  filter,
  setFilter,
  total,
  passed,
  failed
}) => {
  return (
    <div className="bg-stone-950 px-3 sm:px-4 py-3 border-b border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-stone-400">Filter specs:</span>
        <button
          onClick={() => setFilter('all')}
          className={`px-2 py-0.5 rounded transition-colors ${
            filter === 'all'
              ? 'bg-stone-800 text-stone-200 font-bold'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          All ({total})
        </button>
        <button
          onClick={() => setFilter('passed')}
          className={`px-2 py-0.5 rounded transition-colors ${
            filter === 'passed'
              ? 'bg-emerald-950/60 text-emerald-300 font-bold'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          Passed ({passed})
        </button>
        {failed > 0 && (
          <button
            onClick={() => setFilter('failed')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filter === 'failed'
                ? 'bg-rose-950/60 text-rose-300 font-bold'
                : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            Failed ({failed})
          </button>
        )}
      </div>

      <span className="text-stone-500 text-[11px] hidden sm:inline">
        Harness: Mocha/Sinon V8 Compatibility
      </span>
    </div>
  );
};

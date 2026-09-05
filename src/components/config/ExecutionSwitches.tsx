import React from 'react';

interface ExecutionSwitchesProps {
  verbose: boolean;
  suppressAll: boolean;
  onToggleVerbose: (val: boolean) => void;
  onToggleSuppressAll: (val: boolean) => void;
}

export const ExecutionSwitches: React.FC<ExecutionSwitchesProps> = ({
  verbose,
  suppressAll,
  onToggleVerbose,
  onToggleSuppressAll
}) => {
  return (
    <div className="w-full max-w-full bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-semibold font-mono text-stone-200">Execution Mode Switches</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Verbose Switch */}
        <label className="flex items-start gap-3 p-2.5 rounded-lg bg-stone-950/60 border border-stone-800/80 cursor-pointer hover:bg-stone-950 transition-colors">
          <input
            id="switch-verbose"
            type="checkbox"
            checked={verbose}
            onChange={(e) => onToggleVerbose(e.target.checked)}
            className="mt-0.5 accent-emerald-500 shrink-0"
          />
          <div className="min-w-0">
            <div className="text-xs font-mono font-medium text-stone-200">Verbose Notifications</div>
            <div className="text-[11px] text-stone-400">
              Prints &quot;🔇 Suppressed: [type]&quot; telemetry for every muted log line.
            </div>
          </div>
        </label>

        {/* Suppress All Switch */}
        <label className="flex items-start gap-3 p-2.5 rounded-lg bg-stone-950/60 border border-stone-800/80 cursor-pointer hover:bg-stone-950 transition-colors">
          <input
            id="switch-suppress-all"
            type="checkbox"
            checked={suppressAll}
            onChange={(e) => onToggleSuppressAll(e.target.checked)}
            className="mt-0.5 accent-rose-500 shrink-0"
          />
          <div className="min-w-0">
            <div className="text-xs font-mono font-medium text-stone-200">Suppress All (Quiet)</div>
            <div className="text-[11px] text-stone-400">
              Immediately silences everything unless explicitly marked as an exception.
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};

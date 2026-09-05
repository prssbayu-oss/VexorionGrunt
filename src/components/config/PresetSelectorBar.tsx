import React from 'react';
import { Sparkles } from 'lucide-react';

interface PresetSelectorBarProps {
  onApplyPreset: (name: string) => void;
}

export const PresetSelectorBar: React.FC<PresetSelectorBarProps> = ({ onApplyPreset }) => {
  return (
    <div className="w-full max-w-full bg-stone-900 border border-stone-800 rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
              Live Configuration Engine
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-100 truncate">Rule & Filter Studio</h2>
          <p className="text-xs text-stone-400 mt-1 line-clamp-2">
            Configure which log types, exceptions, and tasks Vexorion allows or silences in real time.
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-stone-400">Presets:</span>
          <button
            id="preset-standard-ci"
            onClick={() => onApplyPreset('standard_ci')}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
          >
            Standard CI
          </button>
          <button
            id="preset-strict-quiet"
            onClick={() => onApplyPreset('strict_quiet')}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
          >
            Strict / Errors Only
          </button>
          <button
            id="preset-dev-verbose"
            onClick={() => onApplyPreset('dev_verbose')}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
          >
            Verbose Debug
          </button>
          <button
            id="preset-mute-all"
            onClick={() => onApplyPreset('mute_all')}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 transition-colors"
          >
            Mute All
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { GruntTaskPreset } from '../../types';
import { SAMPLE_TASKS } from '../../data/sample-tasks';

interface PipelineSelectorProps {
  selectedPresetId: string;
  onSelectPreset: (id: string) => void;
  activePreset: GruntTaskPreset;
}

export const PipelineSelector: React.FC<PipelineSelectorProps> = ({
  selectedPresetId,
  onSelectPreset,
  activePreset
}) => {
  return (
    <div className="w-full max-w-full bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
              Pipeline Selection
            </span>
            <span className="text-stone-500">•</span>
            <code className="text-xs font-mono text-stone-300 bg-stone-950 px-2 py-0.5 rounded border border-stone-800 break-all">
              {activePreset.command}
            </code>
          </div>
          <h2 className="text-lg font-bold text-stone-100 truncate">{activePreset.name}</h2>
          <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">{activePreset.description}</p>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {SAMPLE_TASKS.map((preset) => (
            <button
              key={preset.id}
              id={`preset-btn-${preset.id}`}
              onClick={() => onSelectPreset(preset.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all border ${
                selectedPresetId === preset.id
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-stone-950/60 text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              {preset.id.replace('_', ':')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

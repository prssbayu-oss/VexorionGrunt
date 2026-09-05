import React from 'react';
import { Play, Pause, RotateCcw, FastForward, SplitSquareVertical, Eye, Terminal as TerminalIcon, Plus } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepNext: () => void;
  onCompleteAll: () => void;
  onReset: () => void;
  isComplete: boolean;
  canStep: boolean;
  speed: number;
  setSpeed: (speed: number) => void;
  viewMode: 'split' | 'clean' | 'raw';
  setViewMode: (mode: 'split' | 'clean' | 'raw') => void;
  showInjector: boolean;
  setShowInjector: (show: boolean) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onStepNext,
  onCompleteAll,
  onReset,
  isComplete,
  canStep,
  speed,
  setSpeed,
  viewMode,
  setViewMode,
  showInjector,
  setShowInjector
}) => {
  return (
    <div className="w-full max-w-full bg-stone-950 border border-stone-800/90 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-inner">
      {/* Left: Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Play / Pause */}
        <button
          id="play-pause-btn"
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all shrink-0 ${
            isPlaying
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPlaying ? 'Pause' : isComplete ? 'Replay' : 'Run Pipeline'}</span>
        </button>

        {/* Step Next */}
        <button
          id="step-next-btn"
          disabled={!canStep}
          onClick={onStepNext}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 disabled:opacity-40 transition-colors shrink-0"
        >
          <span>Step Next</span>
        </button>

        {/* Instant Complete */}
        <button
          id="complete-all-btn"
          onClick={onCompleteAll}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono text-stone-400 hover:text-stone-200 hover:bg-stone-900 transition-colors shrink-0"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Finish Instant</span>
        </button>

        {/* Reset */}
        <button
          id="reset-terminal-btn"
          onClick={onReset}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono text-stone-400 hover:text-stone-200 hover:bg-stone-900 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Right: Speed & View Mode */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Speed */}
        <div className="flex items-center gap-1 text-xs font-mono text-stone-400">
          <span className="hidden sm:inline">Speed:</span>
          {[
            { label: '1x', val: 200 },
            { label: '2x', val: 90 },
            { label: '5x', val: 30 }
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => setSpeed(s.val)}
              className={`px-1.5 sm:px-2 py-0.5 rounded text-[11px] font-mono ${
                speed === s.val ? 'bg-stone-800 text-emerald-400 font-bold' : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="hidden sm:block h-4 w-[1px] bg-stone-800" />

        {/* View Mode */}
        <div className="flex items-center gap-1 bg-stone-900 p-0.5 rounded-lg border border-stone-800">
          <button
            id="view-split-btn"
            onClick={() => setViewMode('split')}
            title="Side-by-side comparison"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono ${
              viewMode === 'split' ? 'bg-stone-800 text-emerald-400' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <SplitSquareVertical className="w-3 h-3" />
            <span className="hidden md:inline">Split</span>
          </button>
          <button
            id="view-clean-btn"
            onClick={() => setViewMode('clean')}
            title="Vexorion Clean Output only"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono ${
              viewMode === 'clean' ? 'bg-stone-800 text-emerald-400' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span className="hidden md:inline">Clean</span>
          </button>
          <button
            id="view-raw-btn"
            onClick={() => setViewMode('raw')}
            title="Raw Grunt Output only"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono ${
              viewMode === 'raw' ? 'bg-stone-800 text-emerald-400' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <TerminalIcon className="w-3 h-3" />
            <span className="hidden md:inline">Raw</span>
          </button>
        </div>

        {/* Toggle Custom Injector */}
        <button
          id="toggle-injector-btn"
          onClick={() => setShowInjector(!showInjector)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors shrink-0 ${
            showInjector
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50'
              : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
          }`}
        >
          <Plus className="w-3 h-3" />
          <span className="hidden sm:inline">Inject Log</span>
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Zap, Play, RotateCcw, Server, Laptop } from 'lucide-react';

interface BenchmarkControlsProps {
  iterations: number;
  setIterations: (num: number) => void;
  isRunning: boolean;
  runnerTarget: 'backend' | 'browser';
  setRunnerTarget: (target: 'backend' | 'browser') => void;
  onRunBenchmark: () => void;
}

export const BenchmarkControls: React.FC<BenchmarkControlsProps> = ({
  iterations,
  setIterations,
  isRunning,
  runnerTarget,
  setRunnerTarget,
  onRunBenchmark
}) => {
  return (
    <div className="w-full max-w-full bg-stone-900 border border-stone-800 rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
              Engine Performance Stress Test
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-100 truncate">
            {runnerTarget === 'backend' ? 'Node.js Backend Benchmark' : 'In-Browser Latency Benchmark'}
          </h2>
          <p className="text-xs text-stone-400 mt-1 line-clamp-2">
            {runnerTarget === 'backend'
              ? 'Measures raw microsecond throughput, memory delta, and LRU cache hit rate on the Node.js Express server (/api/vexorion/benchmark).'
              : 'Measures execution throughput and simulated LRU cache hit efficiency in the browser VM.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {/* Target Toggle */}
          <div className="flex bg-stone-950 p-1 rounded-lg border border-stone-800 text-xs font-mono">
            <button
              onClick={() => setRunnerTarget('backend')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                runnerTarget === 'backend'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Backend Server</span>
            </button>
            <button
              onClick={() => setRunnerTarget('browser')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                runnerTarget === 'browser'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Browser VM</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800 text-xs font-mono">
            {[500, 1000, 5000, 10000].map((num) => (
              <button
                key={num}
                onClick={() => setIterations(num)}
                className={`px-2 sm:px-2.5 py-1 rounded transition-colors ${
                  iterations === num
                    ? 'bg-stone-800 text-cyan-400 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {num.toLocaleString()}
              </button>
            ))}
          </div>

          <button
            id="run-benchmark-btn"
            disabled={isRunning}
            onClick={onRunBenchmark}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-mono text-xs font-semibold shadow-sm transition-all"
          >
            {isRunning ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? 'Benchmarking...' : 'Start Test'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

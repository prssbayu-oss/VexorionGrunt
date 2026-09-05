/**
 * @file src/components/benchmark/BenchmarkPanel.tsx
 * Pure UI/UX component for benchmark performance testing.
 * Execution logic and API calls are handled cleanly by useBenchmarkRunner.
 */

import React from 'react';
import { Gauge } from 'lucide-react';
import { BenchmarkControls } from './BenchmarkControls';
import { BenchmarkResultsHud } from './BenchmarkResultsHud';
import { useBenchmarkRunner } from '../../hooks/useBenchmarkRunner';

export const BenchmarkPanel: React.FC = () => {
  const {
    iterations,
    setIterations,
    isRunning,
    runnerTarget,
    setRunnerTarget,
    results,
    runBenchmark
  } = useBenchmarkRunner();

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      {/* 1. Benchmark Controls UI Component */}
      <BenchmarkControls
        iterations={iterations}
        setIterations={setIterations}
        isRunning={isRunning}
        runnerTarget={runnerTarget}
        setRunnerTarget={setRunnerTarget}
        onRunBenchmark={runBenchmark}
      />

      {/* 2. Benchmark Results HUD UI Component */}
      {results ? (
        <BenchmarkResultsHud results={results} />
      ) : (
        <div className="w-full max-w-full bg-stone-900/40 border border-dashed border-stone-800 rounded-xl p-10 sm:p-12 text-center">
          <Gauge className="w-8 h-8 text-stone-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-400">Benchmark Ready</p>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Select the number of log events (500 to 10,000) and click &quot;Start Test&quot; to benchmark Vexorion&apos;s evaluation throughput.
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * @file src/hooks/useBenchmarkRunner.ts
 * Custom hook encapsulating benchmark state and execution logic.
 * Keeps BenchmarkPanel as a 100% pure UI/UX component.
 */

import { useState, useCallback } from 'react';
import { benchmarkService, BenchmarkResultData } from '../services/benchmarkService';

export function useBenchmarkRunner() {
  const [iterations, setIterations] = useState<number>(1000);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runnerTarget, setRunnerTarget] = useState<'backend' | 'browser'>('backend');
  const [results, setResults] = useState<BenchmarkResultData | null>(null);

  const runBenchmark = useCallback(async () => {
    setIsRunning(true);
    try {
      if (runnerTarget === 'backend') {
        try {
          const res = await benchmarkService.runBackendBenchmark(iterations);
          setResults(res);
        } catch {
          // Fallback to browser execution if backend is unavailable
          const browserRes = await benchmarkService.runBrowserBenchmark(iterations);
          setResults(browserRes);
        }
      } else {
        const browserRes = await benchmarkService.runBrowserBenchmark(iterations);
        setResults(browserRes);
      }
    } finally {
      setIsRunning(false);
    }
  }, [iterations, runnerTarget]);

  return {
    iterations,
    setIterations,
    isRunning,
    runnerTarget,
    setRunnerTarget,
    results,
    runBenchmark
  };
}

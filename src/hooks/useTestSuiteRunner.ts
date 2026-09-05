/**
 * @file src/hooks/useTestSuiteRunner.ts
 * Custom hook encapsulating test runner state and execution.
 * Keeps TestSuiteRunner as a 100% pure UI/UX component.
 */

import { useState, useCallback, useMemo } from 'react';
import { TestCaseResult } from '../types';
import { testRunnerService } from '../services/testRunnerService';

export function useTestSuiteRunner() {
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [target, setTarget] = useState<'backend' | 'browser'>('backend');
  const [backendMeta, setBackendMeta] = useState<{ passRate?: string; total?: number } | null>(null);

  const handleRunTests = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    setBackendMeta(null);

    try {
      if (target === 'backend') {
        try {
          const run = await testRunnerService.runBackendTests();
          setResults(run.results);
          setBackendMeta(run.backendMeta);
        } catch {
          const fallback = await testRunnerService.runBrowserTests();
          setResults(fallback.results);
        }
      } else {
        const run = await testRunnerService.runBrowserTests();
        setResults(run.results);
      }
    } finally {
      setIsRunning(false);
    }
  }, [target]);

  const total = results.length;
  const passed = useMemo(() => results.filter((r) => r.passed).length, [results]);
  const failed = useMemo(() => results.filter((r) => !r.passed).length, [results]);
  const totalDuration = useMemo(
    () => results.reduce((acc, curr) => acc + curr.durationMs, 0),
    [results]
  );

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (filter === 'passed') return r.passed;
      if (filter === 'failed') return !r.passed;
      return true;
    });
  }, [results, filter]);

  return {
    results,
    filteredResults,
    isRunning,
    filter,
    setFilter,
    target,
    setTarget,
    backendMeta,
    total,
    passed,
    failed,
    totalDuration,
    handleRunTests
  };
}

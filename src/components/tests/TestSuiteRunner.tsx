import React, { useState } from 'react';
import { Play, RotateCcw, ShieldCheck, Server, Laptop, Terminal } from 'lucide-react';
import { TestCaseResult } from '../../types';
import { runVexorionTests } from '../../lib/test-runner';
import { TestMetricsHeader } from './TestMetricsHeader';
import { TestFilterBar } from './TestFilterBar';
import { TestItemRow } from './TestItemRow';

export const TestSuiteRunner: React.FC = () => {
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [target, setTarget] = useState<'backend' | 'browser'>('backend');
  const [backendMeta, setBackendMeta] = useState<{ passRate?: string; total?: number } | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    setResults([]);
    setBackendMeta(null);

    if (target === 'backend') {
      try {
        const start = performance.now();
        const res = await fetch('/api/vexorion/tests');
        const data = await res.json();
        const duration = Math.round(performance.now() - start);

        if (Array.isArray(data.specs)) {
          const mapped: TestCaseResult[] = data.specs.map((spec: any) => ({
            id: spec.id,
            name: `${spec.suite}: ${spec.name}`,
            file: 'server/vexorion/test-suite.js',
            passed: spec.passed,
            durationMs: Math.max(1, Math.round(duration / data.specs.length)),
            error: spec.passed ? undefined : spec.details?.message || 'Assertion failed'
          }));
          setResults(mapped);
          setBackendMeta({ passRate: data.passRate, total: data.total });
        }
      } catch (err: any) {
        // Fallback to browser if server error
        const executed = runVexorionTests();
        setResults(executed);
      } finally {
        setIsRunning(false);
      }
    } else {
      setTimeout(() => {
        const executed = runVexorionTests();
        setResults(executed);
        setIsRunning(false);
      }, 250);
    }
  };

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const totalDuration = results.reduce((acc, curr) => acc + curr.durationMs, 0);

  const filteredResults = results.filter((r) => {
    if (filter === 'passed') return r.passed;
    if (filter === 'failed') return !r.passed;
    return true;
  });

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      {/* Header Banner */}
      <div className="w-full max-w-full bg-stone-900 border border-stone-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
                Unit & Integration Test Suite
              </span>
            </div>
            <h2 className="text-xl font-bold text-stone-100 truncate">
              {target === 'backend' ? 'Node.js Backend Test Runner' : 'In-Browser Test Verification'}
            </h2>
            <p className="text-xs text-stone-400 mt-1 line-clamp-2">
              {target === 'backend'
                ? 'Executes automated assertions on the live Node.js Express backend and private method engine (/api/vexorion/tests).'
                : 'Runs the unit test suite from test/vexorion.test.js directly against the client-side engine.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Target Selector */}
            <div className="flex bg-stone-950 p-1 rounded-lg border border-stone-800 text-xs font-mono">
              <button
                onClick={() => setTarget('backend')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors ${
                  target === 'backend'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>Backend Server</span>
              </button>
              <button
                onClick={() => setTarget('browser')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors ${
                  target === 'browser'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Browser VM</span>
              </button>
            </div>

            <button
              id="run-tests-btn"
              disabled={isRunning}
              onClick={handleRunTests}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono text-xs font-semibold shadow-sm transition-all"
            >
              {isRunning ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Running Harness...' : 'Run Test Suite'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Test Metrics Header */}
      {results.length > 0 && (
        <TestMetricsHeader
          total={total}
          passed={passed}
          failed={failed}
          totalDuration={totalDuration}
        />
      )}

      {/* Test Results Container */}
      <div className="w-full max-w-full bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-lg">
        <TestFilterBar
          filter={filter}
          setFilter={setFilter}
          total={total}
          passed={passed}
          failed={failed}
        />

        <div className="divide-y divide-stone-800/60 max-w-full">
          {results.length === 0 ? (
            <div className="p-10 sm:p-12 text-center">
              <Terminal className="w-8 h-8 text-stone-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-stone-400">No test results yet.</p>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Click &quot;Run Test Suite&quot; above to execute unit tests verifying Config, Logger, and Hook lifecycle.
              </p>
            </div>
          ) : (
            filteredResults.map((item, index) => (
              <TestItemRow
                key={`${item.suite}-${item.name}-${index}`}
                item={item}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * @file src/services/testRunnerService.ts
 * Dedicated test runner service separating test execution and API fetching from UI components.
 */

import { TestCaseResult } from '../types';
import { apiClient, TestSuiteResponse } from './apiClient';
import { runVexorionTests } from '../lib/test-runner';

export interface TestRunResultData {
  results: TestCaseResult[];
  backendMeta: { passRate?: string; total?: number } | null;
}

export const testRunnerService = {
  /**
   * Run test suite on backend Express server
   */
  async runBackendTests(): Promise<TestRunResultData> {
    const start = performance.now();
    const data: TestSuiteResponse = await apiClient.runTests();
    const duration = Math.round(performance.now() - start);

    if (Array.isArray(data.specs)) {
      const mapped: TestCaseResult[] = data.specs.map((spec) => ({
        suite: spec.suite || 'Backend Test Suite',
        name: spec.name,
        passed: spec.passed,
        durationMs: Math.max(1, Math.round(duration / data.specs.length)),
        error: spec.passed ? undefined : spec.details?.message || 'Assertion failed'
      }));
      return {
        results: mapped,
        backendMeta: { passRate: data.passRate, total: data.total }
      };
    }

    // Fallback if empty specs
    return {
      results: runVexorionTests(),
      backendMeta: null
    };
  },

  /**
   * Run test suite locally in browser
   */
  async runBrowserTests(): Promise<TestRunResultData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const results = runVexorionTests();
        resolve({
          results,
          backendMeta: null
        });
      }, 200);
    });
  }
};

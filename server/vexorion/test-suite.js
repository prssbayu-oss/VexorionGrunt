/**
 * @file server/vexorion/test-suite.js
 * Vexorion Automated Internal Test Suite.
 * Deeply validates LRUCacheEngine, HookerInterceptionCore, VexorionConfigManager,
 * VexorionLoggerEngine, and VexorionPipelineRunner.
 * Uses private methods for assertion primitives and domain test suites.
 */

import { LRUCacheEngine } from './cache.js';
import { HookerInterceptionCore } from './hooker.js';
import { VexorionConfigManager } from './config.js';
import { VexorionLoggerEngine } from './logger.js';
import { VexorionPipelineRunner } from './pipeline.js';

export class VexorionBackendTestSuite {
  #results;
  #currentSuite;

  constructor() {
    this.#results = [];
    this.#currentSuite = 'General';
  }

  // ===================== PRIVATE METHODS =====================

  /**
   * Records test step assertion
   * @private
   */
  #recordAssertion(passed, testName, details = {}) {
    const safeExpected =
      typeof details.expected === 'object' && details.expected !== null
        ? String(details.expected.constructor?.name || 'Object')
        : details.expected;
    const safeActual =
      typeof details.actual === 'object' && details.actual !== null
        ? String(details.actual.constructor?.name || 'Object')
        : details.actual;

    this.#results.push({
      id: `spec-${this.#results.length + 1}`,
      suite: this.#currentSuite,
      name: testName,
      passed,
      timestamp: Date.now(),
      details: {
        expected: safeExpected,
        actual: safeActual,
        message: details.message || (passed ? 'Passed assertion' : 'Assertion failed')
      }
    });
  }

  /**
   * Verifies boolean condition
   * @private
   */
  #assert(condition, testName, message = '') {
    const passed = Boolean(condition);
    this.#recordAssertion(passed, testName, {
      expected: true,
      actual: passed,
      message: message || (passed ? 'Passed assertion' : 'Assertion failed')
    });
    return passed;
  }

  /**
   * Verifies strict value equality
   * @private
   */
  #assertEqual(actual, expected, testName) {
    const passed = actual === expected;
    this.#recordAssertion(passed, testName, {
      expected,
      actual,
      message: passed ? `Matched expected: ${expected}` : `Expected ${expected} but received ${actual}`
    });
    return passed;
  }

  /**
   * Tests LRUCacheEngine private evictions and API
   * @private
   */
  #runCacheTests() {
    this.#currentSuite = 'LRU Cache Engine';

    const cache = new LRUCacheEngine(10);
    this.#assert(cache.getStats().capacity === 10, 'Initializes cache capacity to 10');

    cache.set('a', 1);
    cache.set('b', 2);
    this.#assertEqual(cache.get('a'), 1, 'Retrieves inserted key "a"');
    this.#assertEqual(cache.get('b'), 2, 'Retrieves inserted key "b"');

    // Test LRU eviction by filling past capacity 10
    for (let i = 1; i <= 10; i++) {
      cache.set(`key_${i}`, i * 10);
    }
    this.#assert(cache.getStats().evictions > 0, 'Triggers private evictions when capacity is exceeded');
    this.#assertEqual(cache.get('a'), undefined, 'Evicts oldest key "a" after capacity overflow');
  }

  /**
   * Tests HookerInterceptionCore method interception and restoration
   * @private
   */
  #runHookerTests() {
    this.#currentSuite = 'Hooker Interception Core';

    const hooker = new HookerInterceptionCore();
    let originalCalled = false;
    let preCalled = false;
    let postCalled = false;

    const dummyTarget = {
      compute: (val) => {
        originalCalled = true;
        return val * 2;
      }
    };

    hooker.hook(dummyTarget, 'compute', {
      pre: (val) => {
        preCalled = true;
      },
      post: (res, val) => {
        postCalled = true;
      }
    });

    this.#assert(hooker.isHooked(dummyTarget, 'compute'), 'Detects method is hooked');

    const result = dummyTarget.compute(5);
    this.#assertEqual(result, 10, 'Preserves original calculation result');
    this.#assert(preCalled, 'Invokes pre-hook callback');
    this.#assert(postCalled, 'Invokes post-hook callback');
    this.#assert(originalCalled, 'Executes underlying target function');

    hooker.unhook(dummyTarget, 'compute');
    this.#assert(!hooker.isHooked(dummyTarget, 'compute'), 'Restores pristine unhooked state');
  }

  /**
   * Tests VexorionConfigManager rules, exceptions, and whitelist/blacklists
   * @private
   */
  #runConfigTests() {
    this.#currentSuite = 'Config Rule Engine';

    const config = new VexorionConfigManager({
      allowedTypes: ['ok', 'warn', 'error'],
      exceptions: ['security'],
      taskWhitelist: ['build', 'test']
    });

    this.#assert(config.isAllowed('ok', 'build'), 'Permits "ok" log in allowed "build" task');
    this.#assert(!config.isAllowed('verbose', 'build'), 'Suppresses "verbose" log in "build" task');
    this.#assert(!config.isAllowed('ok', 'deploy'), 'Suppresses non-whitelisted "deploy" task');
    this.#assert(config.isAllowed('security', 'deploy'), 'Allows critical "security" exception even in non-whitelisted task');

    // Test suppressAll mode
    config.update({ suppressAll: true });
    this.#assert(!config.isAllowed('ok', 'build'), 'Suppresses "ok" log when suppressAll is active');
    this.#assert(config.isAllowed('security', 'build'), 'Critical exception bypasses suppressAll mode');
  }

  /**
   * Tests VexorionLoggerEngine muting coordination
   * @private
   */
  #runLoggerTests() {
    this.#currentSuite = 'Logger Interception Engine';

    const config = new VexorionConfigManager({
      allowedTypes: ['ok', 'error']
    });
    const logger = new VexorionLoggerEngine(config);

    const checkOk = logger.preHook('ok', 'build');
    this.#assert(checkOk.allowed, 'Logger permits "ok" emission');

    const checkWriteln = logger.preHook('writeln', 'build');
    this.#assert(!checkWriteln.allowed, 'Logger blocks noisy "writeln" emission');

    const metrics = logger.getMetrics();
    this.#assertEqual(metrics.total, 2, 'Records 2 total telemetry events');
    this.#assertEqual(metrics.suppressed, 1, 'Records 1 suppressed event');
    this.#assertEqual(metrics.allowed, 1, 'Records 1 allowed event');
  }

  /**
   * Tests VexorionPipelineRunner execution and log reductions
   * @private
   */
  #runPipelineTests() {
    this.#currentSuite = 'Pipeline Runner Suite';

    const config = new VexorionConfigManager({
      allowedTypes: ['ok', 'warn', 'error', 'subhead'],
      exceptions: ['security']
    });
    const logger = new VexorionLoggerEngine(config);
    const runner = new VexorionPipelineRunner(logger, config);

    const pipelines = runner.getPipelines();
    this.#assert(pipelines.length >= 3, 'Initializes standard Grunt pipelines (build:prod, test:ci, deploy:staging)');

    const result = runner.execute('build:prod', { hooked: true });
    this.#assert(result.logs.length > 0, 'Generates log steps for build:prod');
    this.#assert(result.metrics.suppressed > 0, 'Successfully suppresses noisy logs in build:prod');
    this.#assert(result.metrics.reductionPercent > 0, 'Calculates non-zero reduction percentage');
  }

  // ===================== PUBLIC API =====================

  /**
   * Executes full suite of unit and integration tests across all modules
   */
  runAll() {
    this.#results = [];

    this.#runCacheTests();
    this.#runHookerTests();
    this.#runConfigTests();
    this.#runLoggerTests();
    this.#runPipelineTests();

    const passed = this.#results.filter((r) => r.passed).length;
    const failed = this.#results.filter((r) => !r.passed).length;
    const total = this.#results.length;

    return {
      total,
      passed,
      failed,
      passRate: total === 0 ? '0%' : `${Math.round((passed / total) * 100)}%`,
      suites: ['LRU Cache Engine', 'Hooker Interception Core', 'Config Rule Engine', 'Logger Interception Engine', 'Pipeline Runner Suite'],
      specs: this.#results
    };
  }
}

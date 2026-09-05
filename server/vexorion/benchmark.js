/**
 * @file server/vexorion/benchmark.js
 * Vexorion Performance & Stress Test Suite.
 * Exercises LRUCacheEngine, VexorionConfigManager, and VexorionLoggerEngine under load.
 * Uses private methods to calculate latency percentiles, memory deltas, and throughput.
 */

import { VexorionConfigManager } from './config.js';
import { VexorionLoggerEngine } from './logger.js';
import { LRUCacheEngine } from './cache.js';

export class VexorionBenchmarkSuite {
  #configManager;
  #loggerEngine;
  #cacheEngine;
  #sampleTypes;
  #sampleTasks;

  /**
   * @param {VexorionConfigManager} configManager
   * @param {VexorionLoggerEngine} loggerEngine
   */
  constructor(configManager, loggerEngine) {
    if (!(configManager instanceof VexorionConfigManager)) {
      throw new TypeError('[VexorionBenchmarkSuite] configManager must be instance of VexorionConfigManager');
    }
    if (!(loggerEngine instanceof VexorionLoggerEngine)) {
      throw new TypeError('[VexorionBenchmarkSuite] loggerEngine must be instance of VexorionLoggerEngine');
    }

    this.#configManager = configManager;
    this.#loggerEngine = loggerEngine;
    this.#cacheEngine = configManager.getInternalCache();

    this.#sampleTypes = ['write', 'writeln', 'subhead', 'ok', 'warn', 'error', 'verbose', 'debug', 'security'];
    this.#sampleTasks = ['build', 'test', 'clean', 'uglify', 'sass', 'deploy', 'watch', 'lint'];
  }

  // ===================== PRIVATE METHODS =====================

  /**
   * Generates synthetic randomized log events for high-throughput testing
   * @private
   */
  #generateSyntheticBatch(count) {
    const batch = new Array(count);
    for (let i = 0; i < count; i++) {
      const type = this.#sampleTypes[i % this.#sampleTypes.length];
      const task = this.#sampleTasks[(i * 3) % this.#sampleTasks.length];
      batch[i] = {
        type,
        task,
        message: `Synthetic Grunt emission [${i}] from task "${task}" with type "${type}"`
      };
    }
    return batch;
  }

  /**
   * Calculates p50, p95, p99 percentiles from sorted latency array
   * @private
   */
  #calculatePercentiles(samples) {
    if (samples.length === 0) return { p50: 0, p95: 0, p99: 0 };
    samples.sort((a, b) => a - b);

    const getP = (p) => {
      const idx = Math.min(samples.length - 1, Math.floor((p / 100) * samples.length));
      return Math.round(samples[idx] * 1000) / 1000; // microsecond precision
    };

    return {
      p50: getP(50),
      p95: getP(95),
      p99: getP(99),
      min: Math.round(samples[0] * 1000) / 1000,
      max: Math.round(samples[samples.length - 1] * 1000) / 1000
    };
  }

  /**
   * Measures delta in heap memory usage
   * @private
   */
  #measureMemoryDelta(startMem) {
    const endMem = typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    const diffBytes = Math.max(0, endMem - startMem);
    return {
      bytes: diffBytes,
      formatted: `${(diffBytes / 1024).toFixed(2)} KB`
    };
  }

  /**
   * Executes high-frequency loop measuring per-call latency
   * @private
   */
  #runEvaluationLoop(batch) {
    const latencies = [];
    let suppressedCount = 0;

    const startTotal = performance.now();

    for (let i = 0; i < batch.length; i++) {
      const item = batch[i];
      const t0 = performance.now();

      // Invoke internal rule check through ConfigManager and LRUCache
      const result = this.#configManager.checkAllowanceDetailed(item.type, item.task);
      if (!result.allowed) {
        suppressedCount++;
      }

      const t1 = performance.now();
      latencies.push(t1 - t0);
    }

    const totalDurationMs = performance.now() - startTotal;

    return {
      latencies,
      suppressedCount,
      totalDurationMs
    };
  }

  // ===================== PUBLIC API =====================

  /**
   * Runs the benchmark suite with specified iterations
   * @param {number} [iterations=50000]
   */
  run(iterations = 50000) {
    const count = Math.min(200000, Math.max(1000, iterations));
    const batch = this.#generateSyntheticBatch(count);

    // Warm-up cache with 500 items
    for (let i = 0; i < 500; i++) {
      this.#configManager.checkAllowanceDetailed(batch[i].type, batch[i].task);
    }

    const startHeap = typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    const { latencies, suppressedCount, totalDurationMs } = this.#runEvaluationLoop(batch);
    const memDelta = this.#measureMemoryDelta(startHeap);
    const percentiles = this.#calculatePercentiles(latencies);

    const opsPerSec = Math.round((count / (totalDurationMs / 1000)));
    const avgLatencyMs = Math.round((totalDurationMs / count) * 10000) / 10000;
    const cacheStats = this.#cacheEngine.getStats();

    return {
      iterations: count,
      totalDurationMs: Math.round(totalDurationMs * 100) / 100,
      opsPerSec,
      avgLatencyMs,
      percentiles,
      suppressedCount,
      passedCount: count - suppressedCount,
      reductionRate: `${((suppressedCount / count) * 100).toFixed(1)}%`,
      memoryDelta: memDelta,
      cacheStats
    };
  }
}

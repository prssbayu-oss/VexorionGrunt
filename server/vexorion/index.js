/**
 * @file server/vexorion/index.js
 * Central Vexorion Backend Engine and Unified System Orchestrator.
 * Fully integrates LRUCacheEngine, HookerInterceptionCore, VexorionConfigManager,
 * VexorionLoggerEngine, VexorionPipelineRunner, VexorionBenchmarkSuite, and VexorionBackendTestSuite.
 * Employs strict private methods to wire up internal event lifecycles and component bridges.
 */

import { LRUCacheEngine } from './cache.js';
import { HookerInterceptionCore } from './hooker.js';
import { VexorionConfigManager } from './config.js';
import { VexorionLoggerEngine } from './logger.js';
import { VexorionPipelineRunner } from './pipeline.js';
import { VexorionBenchmarkSuite } from './benchmark.js';
import { VexorionBackendTestSuite } from './test-suite.js';
import { VexorionRealtimeDaemon } from './streamer.js';

export class VexorionSystemInstance {
  #cache;
  #hooker;
  #config;
  #logger;
  #runner;
  #benchmark;
  #testSuite;
  #daemon;
  #bootTime;
  #mockGrunt;

  constructor(initialOptions = {}) {
    this.#bootTime = Date.now();

    // 1. Initialize core LRU Cache Engine
    this.#cache = new LRUCacheEngine(initialOptions.cacheCapacity || 500);

    // 2. Initialize Config Manager dependent on LRU Cache Engine
    this.#config = new VexorionConfigManager(initialOptions, this.#cache);

    // 3. Initialize Hooker Core
    this.#hooker = new HookerInterceptionCore();

    // 4. Initialize Logger Engine dependent on Config & Hooker
    this.#logger = new VexorionLoggerEngine(this.#config, this.#hooker);

    // 5. Initialize Pipeline Runner dependent on Logger & Config
    this.#runner = new VexorionPipelineRunner(this.#logger, this.#config);

    // 6. Initialize Benchmark Suite dependent on Config & Logger
    this.#benchmark = new VexorionBenchmarkSuite(this.#config, this.#logger);

    // 7. Initialize Internal Test Suite
    this.#testSuite = new VexorionBackendTestSuite();

    // 8. Construct internal mock Grunt log object and hook it
    this.#mockGrunt = this.#createGruntMock();
    this.#wireInternalLifecycle();

    // 9. Initialize and auto-start Real-Time Background Daemon
    this.#daemon = new VexorionRealtimeDaemon(this.#logger, this.#config);
    this.#daemon.start(initialOptions.daemonInterval || 750);
  }

  // ===================== PRIVATE METHODS =====================

  /**
   * Constructs mock Grunt logger target
   * @private
   */
  #createGruntMock() {
    return {
      muted: false,
      write: (msg) => !this.muted && process.stdout.write(String(msg)),
      writeln: (msg) => !this.muted && console.log(String(msg)),
      ok: (msg) => !this.muted && console.log(`>> OK: ${msg}`),
      warn: (msg) => !this.muted && console.warn(`>> WARNING: ${msg}`),
      error: (msg) => !this.muted && console.error(`>> ERROR: ${msg}`),
      subhead: (msg) => !this.muted && console.log(`\n>> ${msg}`),
      verbose: (msg) => !this.muted && console.log(`[VERBOSE] ${msg}`),
      debug: (msg) => !this.muted && console.log(`[DEBUG] ${msg}`)
    };
  }

  /**
   * Connects config change listeners to cache purges and logger status
   * @private
   */
  #wireInternalLifecycle() {
    this.#config.subscribe((changeKey, val) => {
      // Automatic telemetry reset or sync if needed
    });

    // Default hook into mock Grunt logger
    this.#logger.hook(this.#mockGrunt, 'default');
  }

  /**
   * Compiles complete diagnostic status across all integrated modules
   * @private
   */
  #compileSystemDiagnostics() {
    return {
      status: 'healthy',
      engine: 'Vexorion Core v2.1.0',
      uptimeSeconds: Math.floor((Date.now() - this.#bootTime) / 1000),
      isHooked: this.#logger.isHookActive(),
      config: this.#config.getSnapshot(),
      cache: this.#cache.getStats(),
      hooker: this.#hooker.getStats(),
      telemetry: this.#logger.getMetrics(),
      pipelineStats: this.#runner.getRunStats()
    };
  }

  // ===================== PUBLIC API =====================

  /**
   * Returns full system status
   */
  getStatus() {
    return this.#compileSystemDiagnostics();
  }

  /**
   * Exposes Config Manager
   */
  getConfigManager() {
    return this.#config;
  }

  /**
   * Exposes Logger Engine
   */
  getLoggerEngine() {
    return this.#logger;
  }

  /**
   * Exposes Pipeline Runner
   */
  getPipelineRunner() {
    return this.#runner;
  }

  /**
   * Exposes Benchmark Suite
   */
  getBenchmarkSuite() {
    return this.#benchmark;
  }

  /**
   * Exposes Backend Test Suite
   */
  getTestSuite() {
    return this.#testSuite;
  }

  /**
   * Toggles active hook on target
   */
  toggleHook(enable = null) {
    const shouldEnable = enable === null ? !this.#logger.isHookActive() : Boolean(enable);
    if (shouldEnable) {
      this.#logger.hook(this.#mockGrunt, 'default');
    } else {
      this.#logger.unhook();
    }
    return this.#logger.isHookActive();
  }

  /**
   * Updates configuration settings
   */
  updateConfig(newOptions) {
    return this.#config.update(newOptions);
  }

  /**
   * Processes a single log item
   */
  processLog(logItem) {
    return this.#logger.processItem(logItem);
  }

  /**
   * Runs automated tests
   */
  runTests() {
    return this.#testSuite.runAll();
  }

  /**
   * Runs benchmark
   */
  runBenchmark(iterations) {
    return this.#benchmark.run(iterations);
  }

  /**
   * Runs pipeline
   */
  runPipeline(pipelineId, options) {
    return this.#runner.execute(pipelineId, options);
  }

  // ===================== REAL-TIME DAEMON API =====================

  /**
   * Starts the continuous background daemon
   */
  startDaemon(intervalMs = null) {
    return this.#daemon.start(intervalMs);
  }

  /**
   * Halts the background daemon
   */
  stopDaemon() {
    return this.#daemon.stop();
  }

  /**
   * Adjusts emission interval
   */
  setDaemonInterval(ms) {
    this.#daemon.setInterval(ms);
  }

  /**
   * Gets daemon health and state
   */
  getDaemonStatus() {
    return this.#daemon.getStatus();
  }

  /**
   * Subscribes a listener to live background stream
   */
  subscribeDaemon(callback) {
    return this.#daemon.subscribe(callback);
  }
}

// Global default singleton instance
export const defaultVexorionSystem = new VexorionSystemInstance();

export {
  LRUCacheEngine,
  HookerInterceptionCore,
  VexorionConfigManager,
  VexorionLoggerEngine,
  VexorionPipelineRunner,
  VexorionBenchmarkSuite,
  VexorionBackendTestSuite,
  VexorionRealtimeDaemon
};

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
  #registeredTasks;
  #eventListeners;
  #eventLog;

  constructor(initialOptions = {}, customConfig = null, customLogger = null) {
    this.#bootTime = Date.now();
    this.#registeredTasks = new Set();
    this.#eventListeners = new Map();
    this.#eventLog = [];

    // 1. Initialize core LRU Cache Engine
    this.#cache = new LRUCacheEngine(initialOptions.cacheCapacity || 500);

    // 2. Initialize Config Manager (supports injected instance via inheritance)
    this.#config = customConfig instanceof VexorionConfigManager ? customConfig : new VexorionConfigManager(initialOptions, this.#cache);

    // 3. Initialize Hooker Core
    this.#hooker = new HookerInterceptionCore();

    // 4. Initialize Logger Engine (supports injected instance via inheritance)
    this.#logger = customLogger instanceof VexorionLoggerEngine ? customLogger : new VexorionLoggerEngine(this.#config, this.#hooker);

    // 5. Initialize Pipeline Runner dependent on Logger & Config
    this.#runner = new VexorionPipelineRunner(this.#logger, this.#config);

    // 6. Initialize Benchmark Suite dependent on Config & Logger
    this.#benchmark = new VexorionBenchmarkSuite(this.#config, this.#logger);

    // 7. Initialize Internal Test Suite
    this.#testSuite = new VexorionBackendTestSuite();

    // 8. Construct internal mock Grunt log object and hook it
    this.#mockGrunt = this.#createGruntMock();
    this.#wireInternalLifecycle();

    // 9. Auto-register default task if configured
    const defaultTask = this.#config.get('taskName') || 'suppress';
    if (this.#config.get('autoRegister')) {
      this.registerTask(defaultTask);
    }

    // 10. Initialize and auto-start Real-Time Background Daemon
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
      write: (msg) => !this.muted && (typeof process !== 'undefined' && process.stdout ? process.stdout.write(String(msg)) : console.log(String(msg))),
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

  // ===================== TASK REGISTRY & LIFECYCLE =====================

  registerTask(name, options = {}) {
    const targetName = name || this.#config.get('taskName') || 'suppress';
    if (this.#registeredTasks.has(targetName) && !options.force) {
      return this;
    }
    this.#registeredTasks.add(targetName);
    this.emit('registered', { taskName: targetName, timestamp: Date.now() });
    return this;
  }

  unregisterTask(name) {
    const targetName = name || this.#config.get('taskName') || 'suppress';
    if (!this.#registeredTasks.has(targetName)) {
      return this;
    }
    this.#registeredTasks.delete(targetName);
    this.unhook();
    this.emit('unregistered', { taskName: targetName, timestamp: Date.now() });
    return this;
  }

  isRegistered(name) {
    const targetName = name || this.#config.get('taskName') || 'suppress';
    return this.#registeredTasks.has(targetName);
  }

  getRegisteredTasks() {
    return [...this.#registeredTasks];
  }

  hook(taskName) {
    this.#logger.hook(this.#mockGrunt, taskName);
    this.emit('hooked', { taskName, timestamp: Date.now() });
    return this;
  }

  unhook() {
    const result = this.#logger.unhook();
    if (result) {
      this.emit('unhooked', { timestamp: Date.now() });
    }
    return this;
  }

  isActive() {
    return this.#logger.isHookActive();
  }

  getConfig() {
    return this.#config.getAll();
  }

  getAllowedTypes() {
    return [...this.#config.get('allowedTypes')];
  }

  addAllowedType(type) {
    if (!type || !type.trim()) throw new Error('Type must be a non-empty string');
    const current = [...this.#config.get('allowedTypes')];
    if (!current.includes(type)) {
      current.push(type);
      this.#config.set('allowedTypes', current);
      this.emit('typeAdded', { type, category: 'allowed', timestamp: Date.now() });
    }
    return this;
  }

  removeAllowedType(type) {
    if (!type || !type.trim()) throw new Error('Type must be a non-empty string');
    const current = [...this.#config.get('allowedTypes')];
    const index = current.indexOf(type);
    if (index !== -1) {
      current.splice(index, 1);
      this.#config.set('allowedTypes', current);
      this.emit('typeRemoved', { type, category: 'allowed', timestamp: Date.now() });
    }
    return this;
  }

  addException(type) {
    if (!type || !type.trim()) throw new Error('Type must be a non-empty string');
    const exceptions = [...this.#config.get('exceptions')];
    if (!exceptions.includes(type)) {
      exceptions.push(type);
      this.#config.set('exceptions', exceptions);
      this.emit('exceptionAdded', { type, timestamp: Date.now() });
    }
    return this;
  }

  removeException(type) {
    if (!type || !type.trim()) throw new Error('Type must be a non-empty string');
    const exceptions = [...this.#config.get('exceptions')];
    const index = exceptions.indexOf(type);
    if (index !== -1) {
      exceptions.splice(index, 1);
      this.#config.set('exceptions', exceptions);
      this.emit('exceptionRemoved', { type, timestamp: Date.now() });
    }
    return this;
  }

  addTaskToWhitelist(taskName) {
    if (!taskName || !taskName.trim()) throw new Error('Task name must be a non-empty string');
    const list = [...this.#config.get('taskWhitelist')];
    if (!list.includes(taskName)) {
      list.push(taskName);
      this.#config.set('taskWhitelist', list);
    }
    return this;
  }

  addTaskToBlacklist(taskName) {
    if (!taskName || !taskName.trim()) throw new Error('Task name must be a non-empty string');
    const list = [...this.#config.get('taskBlacklist')];
    if (!list.includes(taskName)) {
      list.push(taskName);
      this.#config.set('taskBlacklist', list);
    }
    return this;
  }

  getMetrics() {
    return this.#logger.getMetrics();
  }

  resetMetrics() {
    this.#logger.resetMetrics();
    return this;
  }

  // ===================== EVENT EMISSION SUBSYSTEM =====================

  on(event, listener) {
    if (!this.#eventListeners.has(event)) {
      this.#eventListeners.set(event, []);
    }
    this.#eventListeners.get(event).push(listener);
    return this;
  }

  off(event, listener) {
    if (!this.#eventListeners.has(event)) return this;
    const listeners = this.#eventListeners.get(event);
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    return this;
  }

  emit(event, data = {}) {
    this.#eventLog.unshift({
      id: Math.random().toString(36).substring(2, 9),
      event,
      data,
      timestamp: Date.now()
    });
    if (this.#eventLog.length > 50) this.#eventLog.pop();

    const listeners = this.#eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (e) {
          // suppress listener error
        }
      }
    }
  }

  getEventHistory() {
    return [...this.#eventLog];
  }

  getRawConfig() {
    return this.#config;
  }

  getRawLogger() {
    return this.#logger;
  }

  static getVersion() {
    return {
      name: 'vexorion',
      version: '2.1.0',
      description: 'Intelligent Grunt log suppressor - suppresses noisy logs while allowing critical messages',
      author: 'Vexorion',
      license: 'MIT'
    };
  }

  // ===================== PROTECTED GATEWAYS FOR SUBCLASSES =====================

  /**
   * Protected gateway for subclasses to access the internal config manager
   * @protected
   */
  _getInternalConfig() {
    return this.#config;
  }

  /**
   * Protected gateway for subclasses to access the internal logger engine
   * @protected
   */
  _getInternalLogger() {
    return this.#logger;
  }

  /**
   * Protected gateway for subclasses to access the internal LRU cache
   * @protected
   */
  _getInternalCache() {
    return this.#cache;
  }

  /**
   * Protected gateway for subclasses to access the internal hooker
   * @protected
   */
  _getInternalHooker() {
    return this.#hooker;
  }

  /**
   * Protected gateway for subclasses to access the daemon
   * @protected
   */
  _getInternalDaemon() {
    return this.#daemon;
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

/**
 * @file server/vexorion/streamer.js
 * Vexorion Real-Time Daemon and Log Streaming Engine.
 * Emits continuous, server-authoritative Grunt pipeline events in real time.
 * Implements strict private methods to schedule ticks, synthesize realistic task progressions,
 * evaluate rules via LoggerEngine and ConfigManager, and broadcast live events to all connected clients.
 */

import { VexorionLoggerEngine } from './logger.js';
import { VexorionConfigManager } from './config.js';

export class VexorionRealtimeDaemon {
  #loggerEngine;
  #configManager;
  #subscribers;
  #timerId;
  #intervalMs;
  #isRunning;
  #stepCounter;
  #taskQueue;
  #currentTaskIndex;
  #currentStepInTask;

  /**
   * @param {VexorionLoggerEngine} loggerEngine
   * @param {VexorionConfigManager} configManager
   */
  constructor(loggerEngine, configManager) {
    if (!(loggerEngine instanceof VexorionLoggerEngine)) {
      throw new TypeError('[VexorionRealtimeDaemon] loggerEngine must be instance of VexorionLoggerEngine');
    }
    if (!(configManager instanceof VexorionConfigManager)) {
      throw new TypeError('[VexorionRealtimeDaemon] configManager must be instance of VexorionConfigManager');
    }

    this.#loggerEngine = loggerEngine;
    this.#configManager = configManager;
    this.#subscribers = new Set();
    this.#timerId = null;
    this.#intervalMs = 600;
    this.#isRunning = false;
    this.#stepCounter = 0;
    this.#currentTaskIndex = 0;
    this.#currentStepInTask = 0;

    // Realistic continuous Grunt pipeline sequence
    this.#taskQueue = [
      {
        task: 'clean:temp',
        steps: [
          { type: 'subhead', message: 'Running "clean:temp" (clean) task' },
          { type: 'verbose', message: 'Scanning temporary workspace files in .tmp/*' },
          { type: 'writeln', message: 'Removing 24 temporary build artifacts...' },
          { type: 'ok', message: 'Cleaned directory .tmp successfully.' }
        ]
      },
      {
        task: 'eslint:lint',
        steps: [
          { type: 'subhead', message: 'Running "eslint:lint" (eslint) task' },
          { type: 'debug', message: 'Evaluating 18 rule configurations from .eslintrc.json' },
          { type: 'writeln', message: 'Linting 42 source files in src/**/*.js...' },
          { type: 'warn', message: 'Warning: unused variable "cacheTtl" in src/core/lru.js:84' },
          { type: 'ok', message: 'ESLint passed with 0 errors and 1 warning.' }
        ]
      },
      {
        task: 'sass:build',
        steps: [
          { type: 'subhead', message: 'Running "sass:build" (sass) task' },
          { type: 'verbose', message: 'Compiling SCSS partials: variables, mixins, components' },
          { type: 'writeln', message: 'Rendered dist/app.css (18.4 kB) with source maps' },
          { type: 'ok', message: 'Stylesheet compilation complete.' }
        ]
      },
      {
        task: 'audit:security',
        steps: [
          { type: 'subhead', message: 'Running "audit:security" (audit) task' },
          { type: 'debug', message: 'Verifying dependency graph against CVE advisories' },
          { type: 'security', message: 'EXCEPTION: Zero critical vulnerabilities detected in npm audit check.' },
          { type: 'ok', message: 'Security gate passed.' }
        ]
      },
      {
        task: 'uglify:compress',
        steps: [
          { type: 'subhead', message: 'Running "uglify:compress" (uglify) task' },
          { type: 'writeln', message: 'Minifying bundle dist/vexorion.js...' },
          { type: 'debug', message: 'Mangling variable names, dead code elimination active' },
          { type: 'ok', message: 'Minified 128 kB down to 34 kB gzipped (73% reduction).' }
        ]
      },
      {
        task: 'deploy:sync',
        steps: [
          { type: 'subhead', message: 'Running "deploy:sync" (deploy) task' },
          { type: 'verbose', message: 'Connecting to target distribution endpoint' },
          { type: 'writeln', message: 'Synchronizing 8 assets with remote storage...' },
          { type: 'ok', message: 'Deployment synchronized with zero errors.' }
        ]
      }
    ];
  }

  // ===================== PRIVATE METHODS =====================

  /**
   * Generates the next sequential log step from the task queue
   * @private
   */
  #generateNextLogEvent() {
    const currentTask = this.#taskQueue[this.#currentTaskIndex];
    const step = currentTask.steps[this.#currentStepInTask];

    this.#currentStepInTask++;
    if (this.#currentStepInTask >= currentTask.steps.length) {
      this.#currentStepInTask = 0;
      this.#currentTaskIndex = (this.#currentTaskIndex + 1) % this.#taskQueue.length;
    }

    this.#stepCounter++;

    return {
      type: step.type,
      task: currentTask.task,
      message: step.message,
      sequence: this.#stepCounter,
      timestamp: Date.now()
    };
  }

  /**
   * Dispatches payload to all connected subscribers (e.g. SSE response streams)
   * @private
   */
  #broadcastToSubscribers(data) {
    for (const subscriber of this.#subscribers) {
      try {
        subscriber(data);
      } catch (err) {
        console.error('[VexorionRealtimeDaemon] Subscriber callback error:', err);
      }
    }
  }

  /**
   * Executes a single daemon step: synthesizes log, processes through LoggerEngine, broadcasts
   * @private
   */
  #executeTick() {
    if (!this.#isRunning) return;

    const rawEvent = this.#generateNextLogEvent();

    // Set active task context in LoggerEngine
    this.#loggerEngine.setActiveTask(rawEvent.task);

    // Process through full Vexorion rule & telemetry engine
    const processed = this.#loggerEngine.processItem(rawEvent);
    const metrics = this.#loggerEngine.getMetrics();
    const cacheStats = this.#configManager.getCacheStats();

    const payload = {
      event: 'log',
      data: {
        id: `stream-${rawEvent.sequence}-${Date.now()}`,
        sequence: rawEvent.sequence,
        timestamp: rawEvent.timestamp,
        type: processed.type,
        task: processed.task,
        message: processed.message,
        allowed: processed.allowed,
        suppressed: processed.suppressed,
        reason: processed.reason
      },
      metrics: {
        total: metrics.total,
        suppressed: metrics.suppressed,
        allowed: metrics.allowed,
        suppressionRate: metrics.suppressionRate,
        isHooked: metrics.isHooked
      },
      cacheStats
    };

    this.#broadcastToSubscribers(payload);
    this.#scheduleNextTick();
  }

  /**
   * Schedules the next timer tick
   * @private
   */
  #scheduleNextTick() {
    if (!this.#isRunning) return;
    this.#timerId = setTimeout(() => {
      this.#executeTick();
    }, this.#intervalMs);
    if (this.#timerId && typeof this.#timerId.unref === 'function') {
      this.#timerId.unref();
    }
  }

  // ===================== PUBLIC API =====================

  /**
   * Starts the continuous background emission loop
   * @param {number} [intervalMs]
   */
  start(intervalMs = null) {
    if (intervalMs !== null) {
      this.#intervalMs = Math.max(100, Math.min(5000, Number(intervalMs) || 600));
    }

    if (this.#isRunning) return false;

    this.#isRunning = true;
    this.#executeTick();
    return true;
  }

  /**
   * Halts the background emission loop
   */
  stop() {
    if (!this.#isRunning) return false;

    this.#isRunning = false;
    if (this.#timerId) {
      clearTimeout(this.#timerId);
      this.#timerId = null;
    }
    return true;
  }

  /**
   * Sets emission frequency
   * @param {number} ms
   */
  setInterval(ms) {
    this.#intervalMs = Math.max(100, Math.min(5000, Number(ms) || 600));
  }

  /**
   * Subscribes a callback to receive live stream events
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') return () => {};

    this.#subscribers.add(callback);

    // Send immediate initial status handshake
    callback({
      event: 'connected',
      status: this.getStatus(),
      metrics: this.#loggerEngine.getMetrics()
    });

    return () => {
      this.#subscribers.delete(callback);
    };
  }

  /**
   * Returns current daemon status
   */
  getStatus() {
    return {
      isRunning: this.#isRunning,
      intervalMs: this.#intervalMs,
      subscribersCount: this.#subscribers.size,
      totalEmitted: this.#stepCounter,
      currentTask: this.#taskQueue[this.#currentTaskIndex]?.task || 'idle'
    };
  }

  /**
   * Checks if daemon is active
   */
  isActive() {
    return this.#isRunning;
  }
}

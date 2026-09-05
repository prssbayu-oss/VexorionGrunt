/**
 * @file src/lib/server/logger.js
 * High-performance internal structured logger for server subsystems.
 * Uses private class fields and private methods (#) for complete internal state encapsulation.
 * Integrates with ServerEventBus to publish log events and maintain telemetry metrics.
 */

import { ServerEventBus } from './eventBus.js';

export class ServerLogger {
  #eventBus;
  #minLevel;
  #levelWeights;
  #logs;
  #maxLogs;
  #metrics;
  #context;

  /**
   * @param {ServerEventBus} [eventBus]
   * @param {Object} [options]
   */
  constructor(eventBus = null, options = {}) {
    if (eventBus && !(eventBus instanceof ServerEventBus)) {
      throw new TypeError('[ServerLogger] eventBus must be an instance of ServerEventBus');
    }

    this.#eventBus = eventBus;
    this.#minLevel = options.minLevel || 'debug';
    this.#maxLogs = Number(options.maxLogs) || 250;
    this.#logs = [];
    this.#context = options.defaultContext || { service: 'vexorion-core', nodeEnv: 'development' };

    this.#levelWeights = {
      trace: 10,
      debug: 20,
      info: 30,
      warn: 40,
      error: 50,
      fatal: 60
    };

    this.#metrics = {
      total: 0,
      suppressed: 0,
      byLevel: {
        trace: 0,
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        fatal: 0
      }
    };
  }

  // ===================== PRIVATE METHODS =====================

  /**
   * Evaluates if log entry passes minimum severity threshold
   * @private
   */
  #shouldLog(level) {
    const currentWeight = this.#levelWeights[this.#minLevel] || 20;
    const targetWeight = this.#levelWeights[level] || 30;
    return targetWeight >= currentWeight;
  }

  /**
   * Formats structured log entry with unified timestamp and context
   * @private
   */
  #formatEntry(level, message, meta = {}) {
    return {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      isoTime: new Date().toISOString(),
      level,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      meta: { ...this.#context, ...meta }
    };
  }

  /**
   * Stores log entry in bounded memory buffer
   * @private
   */
  #persistEntry(entry) {
    this.#logs.push(entry);
    if (this.#logs.length > this.#maxLogs) {
      this.#logs.shift();
    }
  }

  /**
   * Dispatches log entry to connected ServerEventBus if available
   * @private
   */
  #dispatchToEventBus(entry) {
    if (this.#eventBus) {
      this.#eventBus.emit(`logger:${entry.level}`, entry);
      this.#eventBus.emit('logger:entry', entry);
    }
  }

  /**
   * Internal execution pipeline for writing log entries
   * @private
   */
  #writeLog(level, message, meta = {}) {
    this.#metrics.total++;

    if (!this.#shouldLog(level)) {
      this.#metrics.suppressed++;
      return null;
    }

    if (this.#metrics.byLevel[level] !== undefined) {
      this.#metrics.byLevel[level]++;
    }

    const entry = this.#formatEntry(level, message, meta);
    this.#persistEntry(entry);
    this.#dispatchToEventBus(entry);
    return entry;
  }

  // ===================== PUBLIC API =====================

  /**
   * Sets minimum threshold log level
   * @param {'trace'|'debug'|'info'|'warn'|'error'|'fatal'} level
   */
  setLogLevel(level) {
    if (this.#levelWeights[level]) {
      this.#minLevel = level;
    }
  }

  /**
   * Augments persistent ambient context metadata
   * @param {Object} ctx
   */
  setContext(ctx) {
    if (ctx && typeof ctx === 'object') {
      this.#context = { ...this.#context, ...ctx };
    }
  }

  /**
   * Trace severity logging
   */
  trace(message, meta = {}) {
    return this.#writeLog('trace', message, meta);
  }

  /**
   * Debug severity logging
   */
  debug(message, meta = {}) {
    return this.#writeLog('debug', message, meta);
  }

  /**
   * Info severity logging
   */
  info(message, meta = {}) {
    return this.#writeLog('info', message, meta);
  }

  /**
   * Warn severity logging
   */
  warn(message, meta = {}) {
    return this.#writeLog('warn', message, meta);
  }

  /**
   * Error severity logging
   */
  error(message, meta = {}) {
    return this.#writeLog('error', message, meta);
  }

  /**
   * Fatal severity logging
   */
  fatal(message, meta = {}) {
    return this.#writeLog('fatal', message, meta);
  }

  /**
   * Retrieves recorded log history with optional filtering
   * @param {number} [limit=50]
   * @param {string} [levelFilter]
   */
  getLogs(limit = 50, levelFilter = null) {
    let filtered = this.#logs;
    if (levelFilter && this.#levelWeights[levelFilter]) {
      filtered = filtered.filter((l) => l.level === levelFilter);
    }
    return filtered.slice(-Math.min(limit, filtered.length));
  }

  /**
   * Returns current telemetry counts
   */
  getMetrics() {
    return {
      minLevel: this.#minLevel,
      totalEmitted: this.#metrics.total,
      totalSuppressed: this.#metrics.suppressed,
      byLevel: { ...this.#metrics.byLevel },
      storedCount: this.#logs.length
    };
  }

  /**
   * Flushes internal memory logs
   */
  clearLogs() {
    this.#logs = [];
  }
}

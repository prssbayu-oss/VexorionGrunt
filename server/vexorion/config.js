/**
 * @file server/vexorion/config.js
 * Vexorion Configuration Manager and Rule Evaluation Engine.
 * Integrates directly with LRUCacheEngine using private methods for rule checking and caching.
 */

import { LRUCacheEngine } from './cache.js';

export class VexorionConfigManager {
  #cacheEngine;
  #options;
  #defaults;
  #subscribers;

  /**
   * @param {Object} initialOptions
   * @param {LRUCacheEngine} [customCache]
   */
  constructor(initialOptions = {}, customCache = null) {
    this.#cacheEngine = customCache instanceof LRUCacheEngine ? customCache : new LRUCacheEngine(500);
    this.#subscribers = new Set();

    this.#defaults = {
      allowedTypes: ['ok', 'warn', 'error', 'subhead'],
      exceptions: ['security'],
      taskWhitelist: [],
      taskBlacklist: [],
      verbose: false,
      suppressAll: false,
      cacheCapacity: 500
    };

    this.#options = this.#validateAndNormalizeSchema({
      ...this.#defaults,
      ...initialOptions
    });
  }

  // ===================== PRIVATE METHODS =====================

  /**
   * Normalizes and validates configuration schema
   * @private
   */
  #validateAndNormalizeSchema(opts) {
    const clean = { ...this.#defaults };

    if (Array.isArray(opts.allowedTypes)) {
      clean.allowedTypes = opts.allowedTypes.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
    }
    if (Array.isArray(opts.exceptions)) {
      clean.exceptions = opts.exceptions.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
    }
    if (Array.isArray(opts.taskWhitelist)) {
      clean.taskWhitelist = opts.taskWhitelist.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
    }
    if (Array.isArray(opts.taskBlacklist)) {
      clean.taskBlacklist = opts.taskBlacklist.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
    }

    clean.verbose = Boolean(opts.verbose);
    clean.suppressAll = Boolean(opts.suppressAll);
    clean.cacheCapacity = typeof opts.cacheCapacity === 'number' && opts.cacheCapacity > 0 ? opts.cacheCapacity : 500;

    return clean;
  }

  /**
   * Generates compound cache key from log type and task name
   * @private
   */
  #buildCacheKey(type, taskName) {
    const t = String(type || '').toLowerCase();
    const task = String(taskName || '__default__').toLowerCase();
    return `${t}::${task}`;
  }

  /**
   * Checks whether log type is registered in critical exceptions list
   * @private
   */
  #isExceptionType(normalizedType) {
    return this.#options.exceptions.includes(normalizedType);
  }

  /**
   * Matches string against task blacklist or whitelist
   * @private
   */
  #evaluateTaskFilters(taskName) {
    if (!taskName) {
      // If no task context is provided, blacklist cannot match, but whitelist might require explicit task
      if (this.#options.taskWhitelist.length > 0) {
        return { allowed: false, reason: 'task_not_in_whitelist' };
      }
      return { allowed: true, reason: 'no_task_filter_applied' };
    }

    const t = taskName.toLowerCase();

    // Check blacklist first
    if (this.#options.taskBlacklist.includes(t)) {
      return { allowed: false, reason: 'task_blacklisted' };
    }

    // Check whitelist if configured
    if (this.#options.taskWhitelist.length > 0 && !this.#options.taskWhitelist.includes(t)) {
      return { allowed: false, reason: 'task_not_in_whitelist' };
    }

    return { allowed: true, reason: 'task_passed' };
  }

  /**
   * Core rule evaluation algorithm
   * @private
   */
  #internalEvaluateAllowance(type, taskName) {
    const normType = String(type || '').trim().toLowerCase();
    const normTask = taskName ? String(taskName).trim().toLowerCase() : '';

    // 1. Critical exceptions ALWAYS pass regardless of suppressAll or filters
    if (this.#isExceptionType(normType)) {
      return { allowed: true, reason: 'critical_exception' };
    }

    // 2. Suppress all mode silences everything non-exception
    if (this.#options.suppressAll) {
      return { allowed: false, reason: 'suppress_all_active' };
    }

    // 3. Task filter verification
    const taskCheck = this.#evaluateTaskFilters(normTask);
    if (!taskCheck.allowed) {
      return taskCheck;
    }

    // 4. Allowed types check
    if (this.#options.allowedTypes.includes(normType)) {
      return { allowed: true, reason: 'allowed_type' };
    }

    return { allowed: false, reason: 'type_not_allowed' };
  }

  /**
   * Notifies registered listener callbacks of configuration mutation
   * @private
   */
  #notifySubscribers(changeKey, newValue) {
    for (const callback of this.#subscribers) {
      try {
        callback(changeKey, newValue, this.getSnapshot());
      } catch (err) {
        console.error('[VexorionConfigManager] Subscriber error:', err);
      }
    }
  }

  // ===================== PUBLIC API =====================

  /**
   * Queries whether a log event is allowed, using the private LRUCacheEngine
   * @param {string} type
   * @param {string} [taskName]
   * @returns {boolean}
   */
  isAllowed(type, taskName = '') {
    return this.checkAllowanceDetailed(type, taskName).allowed;
  }

  /**
   * Detailed check with reason code and LRU cache backing
   * @param {string} type
   * @param {string} [taskName]
   * @returns {{ allowed: boolean, reason: string }}
   */
  checkAllowanceDetailed(type, taskName = '') {
    const cacheKey = this.#buildCacheKey(type, taskName);

    // Query private LRU cache
    const cached = this.#cacheEngine.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // Evaluate via private evaluation pipeline
    const result = this.#internalEvaluateAllowance(type, taskName);

    // Store in private LRU cache
    this.#cacheEngine.set(cacheKey, result);

    return result;
  }

  /**
   * Gets a specific option value
   */
  get(key) {
    return this.#options[key];
  }

  /**
   * Sets an option and purges cache
   */
  set(key, value) {
    this.update({ [key]: value });
  }

  /**
   * Batch updates configuration options
   */
  update(newOptions = {}) {
    const updated = this.#validateAndNormalizeSchema({
      ...this.#options,
      ...newOptions
    });

    this.#options = updated;
    this.#cacheEngine.clear(); // Purge cache on rule mutation
    this.#notifySubscribers('update', newOptions);
    return this.getSnapshot();
  }

  /**
   * Returns immutable snapshot of current configuration
   */
  getSnapshot() {
    return {
      allowedTypes: [...this.#options.allowedTypes],
      exceptions: [...this.#options.exceptions],
      taskWhitelist: [...this.#options.taskWhitelist],
      taskBlacklist: [...this.#options.taskBlacklist],
      verbose: this.#options.verbose,
      suppressAll: this.#options.suppressAll,
      cacheCapacity: this.#options.cacheCapacity
    };
  }

  /**
   * Subscribes to configuration changes
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.#subscribers.add(callback);
      return () => this.#subscribers.delete(callback);
    }
    return () => {};
  }

  /**
   * Accesses LRU cache metrics directly
   */
  getCacheStats() {
    return this.#cacheEngine.getStats();
  }

  /**
   * Clears internal cache
   */
  clearCache() {
    this.#cacheEngine.clear();
  }

  /**
   * Exposes raw cache engine for interconnected components
   */
  getInternalCache() {
    return this.#cacheEngine;
  }
}

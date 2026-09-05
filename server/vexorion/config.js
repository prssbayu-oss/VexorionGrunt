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
      allowedTypes: ['ok', 'warn', 'error', 'subhead', 'success', 'fail'],
      exceptions: ['security'],
      taskWhitelist: [],
      taskBlacklist: [],
      verbose: false,
      suppressAll: false,
      autoRegister: true,
      taskName: 'suppress',
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
    const validations = [
      { key: 'allowedTypes', type: 'array', message: 'must be an array of strings' },
      { key: 'exceptions', type: 'array', message: 'must be an array of strings' },
      { key: 'taskWhitelist', type: 'array', message: 'must be an array of strings' },
      { key: 'taskBlacklist', type: 'array', message: 'must be an array of strings' },
      { key: 'verbose', type: 'boolean', message: 'must be a boolean' },
      { key: 'suppressAll', type: 'boolean', message: 'must be a boolean' },
      { key: 'autoRegister', type: 'boolean', message: 'must be a boolean' },
      { key: 'taskName', type: 'string', message: 'must be a string' }
    ];

    for (const validation of validations) {
      if (opts[validation.key] !== undefined) {
        const value = opts[validation.key];
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== validation.type) {
          throw new Error(`Invalid config: ${validation.key} ${validation.message}. Got ${actualType}`);
        }

        if (validation.type === 'array' && Array.isArray(value)) {
          for (const item of value) {
            if (typeof item !== 'string') {
              throw new Error(`Invalid config: ${validation.key} must contain only strings. Found ${typeof item}`);
            }
          }
        }
      }
    }

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
    clean.autoRegister = opts.autoRegister !== undefined ? Boolean(opts.autoRegister) : true;
    clean.taskName = opts.taskName ? String(opts.taskName).trim() : 'suppress';
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
      return { allowed: true, reason: 'exception' };
    }

    // 2. Suppress all mode silences everything non-exception
    if (this.#options.suppressAll) {
      return { allowed: false, reason: 'suppress_all' };
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
      autoRegister: this.#options.autoRegister,
      taskName: this.#options.taskName,
      cacheCapacity: this.#options.cacheCapacity
    };
  }

  /**
   * Alias for getSnapshot() to support consumer contracts
   */
  getAll() {
    return this.getSnapshot();
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

  // ===================== PROTECTED GATEWAYS FOR SUBCLASSES =====================

  /**
   * Protected gateway allowing subclasses (via inheritance) to read internal options
   * @protected
   */
  _getInternalOptions() {
    return { ...this.#options };
  }

  /**
   * Protected gateway allowing subclasses to access the private cache engine
   * @protected
   */
  _getInternalCacheEngine() {
    return this.#cacheEngine;
  }

  /**
   * Protected gateway to invoke private rule evaluation
   * @protected
   */
  _evaluateAllowance(type, taskName) {
    return this.#internalEvaluateAllowance(type, taskName);
  }

  /**
   * Protected gateway to construct compound cache keys
   * @protected
   */
  _buildCacheKey(type, taskName) {
    return this.#buildCacheKey(type, taskName);
  }
}

/**
 * @file server/vexorion/logger.js
 * Vexorion Logger Interception and State Management Engine.
 * Integrates directly with VexorionConfigManager and HookerInterceptionCore.
 * Uses private methods to enforce muting logic, record telemetry, and format stream logs.
 */

import { HookerInterceptionCore } from './hooker.js';
import { VexorionConfigManager } from './config.js';

export class VexorionLoggerEngine {
  #configManager;
  #hookerCore;
  #gruntLogTarget;
  #metrics;
  #history;
  #activeTask;
  #isHooked;

  /**
   * @param {VexorionConfigManager} configManager
   * @param {HookerInterceptionCore} [hookerCore]
   */
  constructor(configManager, hookerCore = null) {
    if (!(configManager instanceof VexorionConfigManager)) {
      throw new TypeError('[VexorionLoggerEngine] configManager must be an instance of VexorionConfigManager');
    }

    this.#configManager = configManager;
    this.#hookerCore = hookerCore instanceof HookerInterceptionCore ? hookerCore : new HookerInterceptionCore();
    this.#gruntLogTarget = null;
    this.#activeTask = 'default';
    this.#isHooked = false;
    this.#history = [];

    this.#metrics = {
      total: 0,
      suppressed: 0,
      allowed: 0,
      errors: 0,
      byType: {},
      byTask: {},
      lastSuppressed: null,
      lastAllowed: null,
      startTime: Date.now()
    };
  }

  // ===================== PRIVATE METHODS =====================

  /**
   * Applies or lifts suppression state on target Grunt logger
   * @private
   */
  #applyMutingState(shouldMute) {
    if (this.#gruntLogTarget) {
      this.#gruntLogTarget.muted = Boolean(shouldMute);
    }
  }

  /**
   * Formats telemetry record and appends to in-memory history
   * @private
   */
  #recordTelemetry(type, taskName, allowed, reason) {
    this.#metrics.total++;

    const t = String(type || 'writeln').toLowerCase();
    const task = String(taskName || 'default').toLowerCase();

    if (allowed) {
      this.#metrics.allowed++;
      this.#metrics.lastAllowed = { type: t, task, time: Date.now() };
    } else {
      this.#metrics.suppressed++;
      this.#metrics.lastSuppressed = { type: t, task, time: Date.now() };
    }

    this.#metrics.byType[t] = (this.#metrics.byType[t] || 0) + 1;
    this.#metrics.byTask[task] = (this.#metrics.byTask[task] || 0) + 1;

    const entry = {
      id: `tel-${Date.now()}-${this.#metrics.total}`,
      timestamp: Date.now(),
      type: t,
      task,
      allowed,
      reason
    };

    this.#history.push(entry);
    if (this.#history.length > 500) {
      this.#history.shift();
    }

    return entry;
  }

  /**
   * Generates verbose notification message when a noisy log is muted
   * @private
   */
  #formatVerboseSuppressedLine(type, taskName) {
    return `[vexorion:suppressed] Muted '${type}' log in task '${taskName}'`;
  }

  /**
   * Creates hooked wrappers for grunt log methods
   * @private
   */
  #wrapMethodBindings(target) {
    const methodsToHook = ['write', 'writeln', 'subhead', 'ok', 'warn', 'error', 'verbose', 'debug'];

    for (const method of methodsToHook) {
      if (typeof target[method] === 'function') {
        this.#hookerCore.hook(target, method, {
          pre: (...args) => {
            return this.#handlePreHook(method, args);
          },
          post: (result, ...args) => {
            return this.#handlePostHook(method, result, args);
          }
        });
      }
    }
  }

  /**
   * Internal preHook logic
   * @private
   */
  #handlePreHook(methodName, args) {
    const check = this.#configManager.checkAllowanceDetailed(methodName, this.#activeTask);

    if (!check.allowed) {
      this.#applyMutingState(true);
      this.#recordTelemetry(methodName, this.#activeTask, false, check.reason);

      if (this.#configManager.get('verbose')) {
        console.info(this.#formatVerboseSuppressedLine(methodName, this.#activeTask));
      }
    } else {
      this.#applyMutingState(false);
      this.#recordTelemetry(methodName, this.#activeTask, true, check.reason);
    }
  }

  /**
   * Internal postHook cleanup
   * @private
   */
  #handlePostHook(methodName, result, args) {
    // Reset muting state after method returns
    this.#applyMutingState(false);
  }

  // ===================== PUBLIC API =====================

  /**
   * Hooks into Grunt log instance
   * @param {Object} gruntLog - The grunt.log instance or simulation target
   * @param {string} [taskName]
   */
  hook(gruntLog, taskName = 'default') {
    this.#gruntLogTarget = gruntLog || { muted: false };
    this.#activeTask = taskName;
    this.#wrapMethodBindings(this.#gruntLogTarget);
    this.#isHooked = true;
    return true;
  }

  /**
   * Unhooks all intercepted methods
   */
  unhook() {
    if (this.#gruntLogTarget) {
      this.#hookerCore.unhookAll();
      this.#applyMutingState(false);
      this.#gruntLogTarget = null;
    }
    this.#isHooked = false;
    return true;
  }

  /**
   * Direct invocation of preHook logic for simulation / pipelines
   * @param {string} type
   * @param {string} [taskName]
   * @param {Array} [args]
   */
  preHook(type, taskName = '', args = []) {
    const effectiveTask = taskName || this.#activeTask;
    const check = this.#configManager.checkAllowanceDetailed(type, effectiveTask);

    if (!check.allowed) {
      this.#applyMutingState(true);
      this.#recordTelemetry(type, effectiveTask, false, check.reason);
      return { allowed: false, reason: check.reason };
    } else {
      this.#applyMutingState(false);
      this.#recordTelemetry(type, effectiveTask, true, check.reason);
      return { allowed: true, reason: check.reason };
    }
  }

  /**
   * Direct invocation of postHook logic
   */
  postHook(type) {
    this.#applyMutingState(false);
  }

  /**
   * Processes an item through the evaluation pipeline
   */
  processItem(logItem) {
    const { type = 'writeln', task = this.#activeTask, message = '' } = logItem;
    const check = this.#configManager.checkAllowanceDetailed(type, task);
    const telemetry = this.#recordTelemetry(type, task, check.allowed, check.reason);

    return {
      ...logItem,
      allowed: check.allowed,
      suppressed: !check.allowed,
      reason: check.reason,
      telemetryId: telemetry.id
    };
  }

  /**
   * Sets the currently executing task context
   */
  setActiveTask(taskName) {
    this.#activeTask = String(taskName || 'default').trim();
  }

  /**
   * Gets current active task
   */
  getActiveTask() {
    return this.#activeTask;
  }

  /**
   * Returns current telemetry metrics
   */
  getMetrics() {
    const total = this.#metrics.total;
    const suppressionRate = total === 0 ? '0.00%' : `${((this.#metrics.suppressed / total) * 100).toFixed(2)}%`;

    return {
      ...this.#metrics,
      suppressionRate,
      isHooked: this.#isHooked,
      activeTask: this.#activeTask,
      historyCount: this.#history.length
    };
  }

  /**
   * Returns recent telemetry history
   */
  getHistory(limit = 100) {
    return this.#history.slice(-limit);
  }

  /**
   * Resets metrics and telemetry log history
   */
  resetMetrics() {
    this.#metrics = {
      total: 0,
      suppressed: 0,
      allowed: 0,
      errors: 0,
      byType: {},
      byTask: {},
      lastSuppressed: null,
      lastAllowed: null,
      startTime: Date.now()
    };
    this.#history = [];
  }

  /**
   * Alias for isHookActive() for contract compatibility
   */
  isHooked() {
    return this.#isHooked;
  }

  /**
   * Exposes internal hooker core for test integration
   */
  getInternalHooker() {
    return this.#hookerCore;
  }

  /**
   * Exposes internal config manager
   */
  getConfigManager() {
    return this.#configManager;
  }

  /**
   * Checks if hook is active
   */
  isHookActive() {
    return this.#isHooked;
  }

  // ===================== PROTECTED GATEWAYS FOR SUBCLASSES =====================

  /**
   * Protected gateway for subclasses to append telemetry
   * @protected
   */
  _recordTelemetry(type, taskName, allowed, reason) {
    return this.#recordTelemetry(type, taskName, allowed, reason);
  }

  /**
   * Protected gateway for subclasses to toggle muting
   * @protected
   */
  _applyMutingState(shouldMute) {
    this.#applyMutingState(shouldMute);
  }

  /**
   * Protected gateway for subclasses to access metrics
   * @protected
   */
  _getInternalMetrics() {
    return { ...this.#metrics };
  }

  /**
   * Protected gateway for subclasses to access history
   * @protected
   */
  _getInternalHistory() {
    return [...this.#history];
  }
}

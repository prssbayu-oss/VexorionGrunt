/**
 * @file server/vexorion/hooker.js
 * Transparent method interception engine for Grunt logger functions.
 * Implements strict private methods to wrap, mutate, and restore target function descriptors.
 */

export class HookerInterceptionCore {
  #registry;
  #activeHooks;
  #callStats;

  constructor() {
    this.#registry = new Map(); // target -> Map(methodName -> originalFn)
    this.#activeHooks = new Set();
    this.#callStats = { interceptedCalls: 0, preHookErrors: 0, postHookErrors: 0 };
  }

  // ===================== PRIVATE METHODS =====================

  /**
   * Validates target object and method existence
   * @private
   */
  #validateTarget(target, methodName) {
    if (!target || (typeof target !== 'object' && typeof target !== 'function')) {
      throw new TypeError(`[HookerInterceptionCore] Target must be an object or function.`);
    }
    if (typeof methodName !== 'string' || typeof target[methodName] !== 'function') {
      throw new TypeError(`[HookerInterceptionCore] Target does not contain executable method '${methodName}'.`);
    }
  }

  /**
   * Generates unique key for target + methodName pair
   * @private
   */
  #getHookKey(target, methodName) {
    let targetMap = this.#registry.get(target);
    if (!targetMap) {
      targetMap = new Map();
      this.#registry.set(target, targetMap);
    }
    return targetMap;
  }

  /**
   * Safely executes user pre-hook
   * @private
   */
  #executePreHook(preHook, context, args) {
    if (typeof preHook !== 'function') return null;
    try {
      return preHook.apply(context, args);
    } catch (err) {
      this.#callStats.preHookErrors++;
      console.error(`[HookerInterceptionCore] Error in preHook:`, err);
      return null;
    }
  }

  /**
   * Safely executes user post-hook
   * @private
   */
  #executePostHook(postHook, context, result, args) {
    if (typeof postHook !== 'function') return;
    try {
      postHook.call(context, result, ...args);
    } catch (err) {
      this.#callStats.postHookErrors++;
      console.error(`[HookerInterceptionCore] Error in postHook:`, err);
    }
  }

  /**
   * Creates a wrapped proxy function using closure over the original function
   * @private
   */
  #wrapOriginalMethod(target, methodName, originalFn, options = {}) {
    const self = this;
    const { pre, post } = options;

    return function wrappedHookMethod(...args) {
      self.#callStats.interceptedCalls++;

      // Execute private preHook
      const preResult = self.#executePreHook(pre, this, args);

      // If preHook signals override or suppression, handle appropriately
      let result;
      if (preResult && preResult.override) {
        result = preResult.value;
      } else {
        result = originalFn.apply(this, args);
      }

      // Execute private postHook
      self.#executePostHook(post, this, result, args);

      return result;
    };
  }

  // ===================== PUBLIC API =====================

  /**
   * Hooks into target method
   * @param {Object} target
   * @param {string} methodName
   * @param {Object} options - { pre: Function, post: Function }
   */
  hook(target, methodName, options = {}) {
    this.#validateTarget(target, methodName);
    const targetMap = this.#getHookKey(target, methodName);

    if (targetMap.has(methodName)) {
      // Already hooked; update handlers if requested
      return false;
    }

    const originalFn = target[methodName];
    targetMap.set(methodName, originalFn);

    const wrappedFn = this.#wrapOriginalMethod(target, methodName, originalFn, options);
    target[methodName] = wrappedFn;
    this.#activeHooks.add(`${methodName}`);

    return true;
  }

  /**
   * Unhooks target method, restoring pristine original implementation
   * @param {Object} target
   * @param {string} methodName
   */
  unhook(target, methodName) {
    this.#validateTarget(target, methodName);
    const targetMap = this.#registry.get(target);

    if (!targetMap || !targetMap.has(methodName)) {
      return false;
    }

    const originalFn = targetMap.get(methodName);
    target[methodName] = originalFn;
    targetMap.delete(methodName);
    this.#activeHooks.delete(`${methodName}`);

    if (targetMap.size === 0) {
      this.#registry.delete(target);
    }

    return true;
  }

  /**
   * Checks if specific target method is currently intercepted
   */
  isHooked(target, methodName) {
    const targetMap = this.#registry.get(target);
    return Boolean(targetMap && targetMap.has(methodName));
  }

  /**
   * Unhooks all registered methods across all targets
   */
  unhookAll() {
    let count = 0;
    for (const [target, methodMap] of this.#registry.entries()) {
      for (const [methodName, originalFn] of methodMap.entries()) {
        target[methodName] = originalFn;
        count++;
      }
    }
    this.#registry.clear();
    this.#activeHooks.clear();
    return count;
  }

  /**
   * Gets hook status and stats
   */
  getStats() {
    return {
      activeHookCount: this.#activeHooks.size,
      activeHooks: Array.from(this.#activeHooks),
      stats: { ...this.#callStats }
    };
  }
}

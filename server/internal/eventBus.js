/**
 * @file server/internal/eventBus.js
 * High-performance internal event bus with priority queues, wildcard listeners, and history tracking.
 * Strictly uses private class fields and private methods (#) for complete internal state encapsulation.
 */

export class ServerEventBus {
  #listeners;
  #wildcardListeners;
  #history;
  #maxHistory;
  #isDispatching;
  #eventCounter;

  constructor(options = {}) {
    this.#listeners = new Map();
    this.#wildcardListeners = new Set();
    this.#history = [];
    this.#maxHistory = Number(options.maxHistory) || 150;
    this.#isDispatching = false;
    this.#eventCounter = 0;
  }

  // ===================== PRIVATE METHODS =====================

  /**
   * Validates event name string format
   * @private
   */
  #validateEventName(name) {
    if (typeof name !== 'string' || !name.trim()) {
      throw new TypeError('[ServerEventBus] Event name must be a non-empty string');
    }
    return name.trim();
  }

  /**
   * Validates subscriber callback function
   * @private
   */
  #validateHandler(handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('[ServerEventBus] Event handler must be an executable function');
    }
    return handler;
  }

  /**
   * Records event execution into bounded internal telemetry history
   * @private
   */
  #recordHistory(record) {
    this.#history.push(record);
    if (this.#history.length > this.#maxHistory) {
      this.#history.shift();
    }
  }

  /**
   * Safely dispatches event payload to a collection of subscriber descriptors
   * @private
   */
  #dispatchToCollection(subscribers, eventName, payload) {
    const sortedSubscribers = Array.from(subscribers).sort((a, b) => b.priority - a.priority);
    for (const sub of sortedSubscribers) {
      try {
        sub.handler(payload, eventName);
      } catch (err) {
        console.error(`[ServerEventBus] Error executing listener for "${eventName}":`, err);
      }
    }
  }

  // ===================== PUBLIC API =====================

  /**
   * Subscribes a listener to a specific event name with priority weighting
   * @param {string} eventName
   * @param {Function} handler
   * @param {number} [priority=10]
   * @returns {Function} Unsubscribe hook
   */
  subscribe(eventName, handler, priority = 10) {
    const validName = this.#validateEventName(eventName);
    const validFn = this.#validateHandler(handler);

    if (!this.#listeners.has(validName)) {
      this.#listeners.set(validName, new Set());
    }

    const subscriberDescriptor = {
      handler: validFn,
      priority: Number(priority) || 10,
      timestamp: Date.now()
    };

    const listenersSet = this.#listeners.get(validName);
    listenersSet.add(subscriberDescriptor);

    return () => {
      listenersSet.delete(subscriberDescriptor);
      if (listenersSet.size === 0) {
        this.#listeners.delete(validName);
      }
    };
  }

  /**
   * Subscribes a wildcard listener that intercepts all emitted events
   * @param {Function} handler
   * @returns {Function} Unsubscribe hook
   */
  subscribeAll(handler) {
    const validFn = this.#validateHandler(handler);
    this.#wildcardListeners.add(validFn);
    return () => {
      this.#wildcardListeners.delete(validFn);
    };
  }

  /**
   * Emits an event with structured payload to direct and wildcard subscribers
   * @param {string} eventName
   * @param {*} payload
   */
  emit(eventName, payload = {}) {
    const validName = this.#validateEventName(eventName);
    this.#eventCounter++;

    const eventRecord = {
      id: `ev-${this.#eventCounter}-${Date.now()}`,
      name: validName,
      payload,
      timestamp: Date.now()
    };

    this.#recordHistory(eventRecord);

    // 1. Dispatch to direct subscribers
    const directSubscribers = this.#listeners.get(validName);
    if (directSubscribers && directSubscribers.size > 0) {
      this.#dispatchToCollection(directSubscribers, validName, payload);
    }

    // 2. Dispatch to wildcard subscribers
    for (const wildcardHandler of this.#wildcardListeners) {
      try {
        wildcardHandler(payload, validName);
      } catch (err) {
        console.error(`[ServerEventBus] Wildcard listener error on "${validName}":`, err);
      }
    }

    return eventRecord;
  }

  /**
   * Retrieves bounded history logs
   * @param {number} [limit=50]
   */
  getHistory(limit = 50) {
    return this.#history.slice(-Math.min(limit, this.#history.length));
  }

  /**
   * Clears internal event history
   */
  clearHistory() {
    this.#history = [];
  }

  /**
   * Returns diagnostic stats
   */
  getStats() {
    let totalDirectSubscribers = 0;
    for (const set of this.#listeners.values()) {
      totalDirectSubscribers += set.size;
    }

    return {
      activeChannels: this.#listeners.size,
      totalDirectSubscribers,
      wildcardSubscribers: this.#wildcardListeners.size,
      totalEmitted: this.#eventCounter,
      historyCount: this.#history.length
    };
  }
}

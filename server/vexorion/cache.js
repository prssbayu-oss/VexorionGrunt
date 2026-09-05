/**
 * @file server/vexorion/cache.js
 * High-performance LRU Cache Engine for Vexorion rule evaluations.
 * Implements strict private methods and private state for internal cache topology.
 */

export class LRUCacheEngine {
  #capacity;
  #cache;
  #hits;
  #misses;
  #head;
  #tail;
  #evictionCount;

  /**
   * @param {number} capacity - Maximum entries before eviction (default: 500)
   */
  constructor(capacity = 500) {
    this.#capacity = Math.max(10, capacity);
    this.#cache = new Map();
    this.#hits = 0;
    this.#misses = 0;
    this.#evictionCount = 0;

    // Sentinel nodes for doubly linked list
    this.#head = { key: null, value: null, prev: null, next: null };
    this.#tail = { key: null, value: null, prev: null, next: null };
    this.#head.next = this.#tail;
    this.#tail.prev = this.#head;
  }

  // ===================== PRIVATE METHODS =====================

  /**
   * Validates key structure
   * @private
   */
  #validateKey(key) {
    if (key === undefined || key === null || typeof key !== 'string') {
      throw new TypeError(`[LRUCacheEngine] Cache key must be a non-empty string. Received: ${typeof key}`);
    }
    return key.trim();
  }

  /**
   * Inserts a node immediately after the sentinel head
   * @private
   */
  #attachToHead(node) {
    node.prev = this.#head;
    node.next = this.#head.next;
    this.#head.next.prev = node;
    this.#head.next = node;
  }

  /**
   * Detaches a node from its current position in doubly-linked list
   * @private
   */
  #detachNode(node) {
    if (!node.prev || !node.next) return;
    node.prev.next = node.next;
    node.next.prev = node.prev;
    node.prev = null;
    node.next = null;
  }

  /**
   * Moves accessed node to MRU (head)
   * @private
   */
  #promoteEntry(node) {
    this.#detachNode(node);
    this.#attachToHead(node);
  }

  /**
   * Evicts the least recently used entry (before tail sentinel)
   * @private
   */
  #evictLeastRecentlyUsed() {
    const lruNode = this.#tail.prev;
    if (!lruNode || lruNode === this.#head) return null;

    this.#detachNode(lruNode);
    this.#cache.delete(lruNode.key);
    this.#evictionCount++;
    return lruNode.key;
  }

  /**
   * Calculates approximate memory consumption of cached metadata
   * @private
   */
  #computeMemoryFootprint() {
    let bytes = 0;
    for (const [k, node] of this.#cache.entries()) {
      bytes += k.length * 2;
      if (typeof node.value === 'string') {
        bytes += node.value.length * 2;
      } else if (node.value && typeof node.value === 'object') {
        bytes += 128;
      } else {
        bytes += 16;
      }
    }
    return bytes;
  }

  // ===================== PUBLIC API =====================

  /**
   * Retrieves an entry, calling private promotion
   * @param {string} key
   * @returns {*|undefined}
   */
  get(key) {
    const validKey = this.#validateKey(key);
    const node = this.#cache.get(validKey);

    if (!node) {
      this.#misses++;
      return undefined;
    }

    this.#hits++;
    this.#promoteEntry(node);
    return node.value;
  }

  /**
   * Sets or updates entry, triggering private evictions if at capacity
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    const validKey = this.#validateKey(key);

    if (this.#cache.has(validKey)) {
      const existingNode = this.#cache.get(validKey);
      existingNode.value = value;
      this.#promoteEntry(existingNode);
      return;
    }

    if (this.#cache.size >= this.#capacity) {
      this.#evictLeastRecentlyUsed();
    }

    const newNode = { key: validKey, value, prev: null, next: null };
    this.#attachToHead(newNode);
    this.#cache.set(validKey, newNode);
  }

  /**
   * Checks if key exists without mutating LRU order
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    const validKey = this.#validateKey(key);
    return this.#cache.has(validKey);
  }

  /**
   * Clears entire cache and resets sentinels
   */
  clear() {
    this.#cache.clear();
    this.#head.next = this.#tail;
    this.#tail.prev = this.#head;
  }

  /**
   * Returns operational statistics
   */
  getStats() {
    const total = this.#hits + this.#misses;
    const hitRate = total === 0 ? '0.0%' : `${((this.#hits / total) * 100).toFixed(1)}%`;
    return {
      size: this.#cache.size,
      capacity: this.#capacity,
      hits: this.#hits,
      misses: this.#misses,
      evictions: this.#evictionCount,
      hitRate,
      estimatedBytes: this.#computeMemoryFootprint()
    };
  }

  /**
   * Resets hit/miss metrics
   */
  resetMetrics() {
    this.#hits = 0;
    this.#misses = 0;
    this.#evictionCount = 0;
  }
}

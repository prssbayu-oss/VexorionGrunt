import { VexorionOptions, SuppressionMetrics, CacheStats, VexorionEventRecord } from '../types';

/**
 * Port of Vexorion's Config Class
 */
export class SimulatedConfig {
  private defaults: VexorionOptions = {
    allowedTypes: ['success', 'fail', 'warn', 'error'],
    autoRegister: true,
    taskName: 'suppress',
    verbose: false,
    suppressAll: false,
    exceptions: [],
    taskWhitelist: [],
    taskBlacklist: []
  };

  private options: VexorionOptions;
  private allowedCache = new Map<string, boolean>();
  private maxCacheSize = 1000;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(options: Partial<VexorionOptions> = {}) {
    this.validateOptions(options);
    this.options = this.mergeOptions(options);
    this.initializeCache();
  }

  private validateOptions(options: Partial<VexorionOptions>) {
    const validations: { key: keyof VexorionOptions; type: string; message: string }[] = [
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
      if (options[validation.key] !== undefined) {
        const value = options[validation.key];
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
  }

  private initializeCache() {
    this.allowedCache.clear();
    for (const type of this.defaults.allowedTypes) {
      this.allowedCache.set(`${type}:default`, true);
    }
  }

  private mergeOptions(options: Partial<VexorionOptions>): VexorionOptions {
    const merged = { ...this.defaults };
    for (const [key, value] of Object.entries(options)) {
      if (key in merged) {
        (merged as unknown as Record<string, unknown>)[key] = this.deepMerge(
          (merged as unknown as Record<string, unknown>)[key],
          value
        );
      }
    }
    return merged;
  }

  private deepMerge(target: unknown, source: unknown, depth = 0): unknown {
    if (depth > 10) return source;
    if (source === undefined || source === null) return target;

    if (Array.isArray(target) && Array.isArray(source)) {
      if (source.length === 0) return [...target];
      const result = [...target];
      for (let i = 0; i < source.length; i++) {
        const sourceItem = source[i];
        const targetItem = i < target.length ? target[i] : undefined;
        if (typeof sourceItem === 'object' && sourceItem !== null && !Array.isArray(sourceItem)) {
          if (typeof targetItem === 'object' && targetItem !== null && !Array.isArray(targetItem)) {
            result[i] = this.deepMerge(targetItem, sourceItem, depth + 1);
          } else {
            result[i] = { ...sourceItem };
          }
        } else if (Array.isArray(sourceItem)) {
          if (Array.isArray(targetItem)) {
            result[i] = this.deepMerge(targetItem, sourceItem, depth + 1);
          } else {
            result[i] = [...sourceItem];
          }
        } else {
          if (i < target.length) {
            result[i] = sourceItem;
          } else {
            result.push(sourceItem);
          }
        }
      }
      return result;
    }

    if (typeof target === 'object' && target !== null && typeof source === 'object' && source !== null) {
      const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };
      for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
        if (key in result && typeof result[key] === 'object' && result[key] !== null) {
          result[key] = this.deepMerge(result[key], value, depth + 1);
        } else {
          result[key] = value;
        }
      }
      return result;
    }

    return source !== undefined ? source : target;
  }

  private computeIsAllowed(type: string, task: string | null = null): { allowed: boolean; reason: 'allowed_type' | 'exception' | 'task_whitelisted' | 'suppress_all' | 'task_blacklisted' | 'type_not_allowed' } {
    if (this.options.suppressAll) {
      return { allowed: false, reason: 'suppress_all' };
    }

    if (task) {
      if (this.options.taskWhitelist.length > 0 && !this.options.taskWhitelist.includes(task)) {
        return { allowed: false, reason: 'task_blacklisted' };
      }
      if (this.options.taskBlacklist.includes(task)) {
        return { allowed: false, reason: 'task_blacklisted' };
      }
    }

    if (this.options.exceptions.includes(type)) {
      return { allowed: true, reason: 'exception' };
    }

    if (this.options.allowedTypes.includes(type)) {
      return { allowed: true, reason: 'allowed_type' };
    }

    return { allowed: false, reason: 'type_not_allowed' };
  }

  public get<K extends keyof VexorionOptions>(key: K): VexorionOptions[K] {
    if (!(key in this.options)) {
      throw new Error(`Unknown configuration key: ${String(key)}`);
    }
    return this.options[key];
  }

  public set<K extends keyof VexorionOptions>(key: K, value: VexorionOptions[K]): this {
    if (!(key in this.options)) {
      throw new Error(`Unknown configuration key: ${String(key)}`);
    }
    this.options[key] = value;
    this.allowedCache.clear();
    return this;
  }

  public getAll(): VexorionOptions {
    return { ...this.options };
  }

  public isAllowed(type: string, task: string | null = null): boolean {
    const key = `${type}:${task || 'default'}`;
    if (this.allowedCache.has(key)) {
      this.cacheHits++;
      return this.allowedCache.get(key)!;
    }

    this.cacheMisses++;
    const result = this.computeIsAllowed(type, task).allowed;

    if (this.allowedCache.size >= this.maxCacheSize) {
      const keys = [...this.allowedCache.keys()];
      const toRemove = Math.floor(keys.length * 0.25);
      for (let i = 0; i < toRemove; i++) {
        this.allowedCache.delete(keys[i]);
      }
    }

    this.allowedCache.set(key, result);
    return result;
  }

  public checkAllowanceDetailed(type: string, task: string | null = null): { allowed: boolean; reason: 'allowed_type' | 'exception' | 'task_whitelisted' | 'suppress_all' | 'task_blacklisted' | 'type_not_allowed' } {
    return this.computeIsAllowed(type, task);
  }

  public getCacheStats(): CacheStats {
    const total = this.cacheHits + this.cacheMisses;
    return {
      size: this.allowedCache.size,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? `${((this.cacheHits / total) * 100).toFixed(2)}%` : 'N/A'
    };
  }

  public clearCache() {
    this.allowedCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  public static merge(...configs: Partial<VexorionOptions>[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const config of configs) {
      if (config && typeof config === 'object') {
        for (const [key, value] of Object.entries(config)) {
          if (Array.isArray(result[key]) && Array.isArray(value)) {
            result[key] = [...new Set([...(result[key] as unknown[]), ...value])];
          } else if (typeof result[key] === 'object' && result[key] !== null && typeof value === 'object' && value !== null) {
            result[key] = { ...(result[key] as Record<string, unknown>), ...value };
          } else {
            result[key] = value;
          }
        }
      }
    }
    return result;
  }
}

/**
 * Simulated Logger
 */
export class SimulatedLogger {
  private config: SimulatedConfig;
  private isHookedState = false;
  private metrics: SuppressionMetrics = {
    suppressed: 0,
    allowed: 0,
    errors: 0,
    total: 0,
    suppressionRate: '0%',
    lastSuppressed: null,
    lastAllowed: null
  };
  private hookId: string | null = null;
  public muted = false;

  constructor(config: SimulatedConfig) {
    this.config = config;
  }

  public hook(options: { taskName?: string } = {}) {
    if (this.isHookedState) return;
    this.hookId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    this.isHookedState = true;
  }

  public unhook(): boolean {
    if (!this.isHookedState) return false;
    this.isHookedState = false;
    this.hookId = null;
    this.muted = false;
    return true;
  }

  public isHooked(): boolean {
    return this.isHookedState;
  }

  public getHookId(): string | null {
    return this.hookId;
  }

  public preHook(type: string, taskName: string): { allowed: boolean; suppressed: boolean; reason: string } {
    try {
      const detailed = this.config.checkAllowanceDetailed(type, taskName);
      if (!detailed.allowed) {
        this.metrics.suppressed++;
        this.metrics.lastSuppressed = { type, task: taskName, time: Date.now() };
        this.muted = true;
        this.updateTotalAndRate();
        return { allowed: false, suppressed: true, reason: detailed.reason };
      } else {
        this.metrics.allowed++;
        this.metrics.lastAllowed = { type, task: taskName, time: Date.now() };
        this.muted = false;
        this.updateTotalAndRate();
        return { allowed: true, suppressed: false, reason: detailed.reason };
      }
    } catch (err: unknown) {
      this.metrics.errors++;
      this.muted = false;
      this.updateTotalAndRate();
      return { allowed: true, suppressed: false, reason: 'error_fallback' };
    }
  }

  public postHook() {
    this.muted = false;
  }

  private updateTotalAndRate() {
    const total = this.metrics.suppressed + this.metrics.allowed;
    this.metrics.total = total;
    this.metrics.suppressionRate = total > 0 ? `${((this.metrics.suppressed / total) * 100).toFixed(2)}%` : '0%';
  }

  public getMetrics(): SuppressionMetrics {
    return { ...this.metrics };
  }

  public resetMetrics() {
    this.metrics = {
      suppressed: 0,
      allowed: 0,
      errors: 0,
      total: 0,
      suppressionRate: '0%',
      lastSuppressed: null,
      lastAllowed: null
    };
  }
}

/**
 * Main Simulated Vexorion Class
 */
export class SimulatedVexorion {
  private config: SimulatedConfig;
  private logger: SimulatedLogger;
  private taskName = 'suppress';
  private registeredTaskNames = new Set<string>();
  private eventListeners = new Map<string, ((data: Record<string, unknown>) => void)[]>();
  private eventLog: VexorionEventRecord[] = [];

  constructor(config: SimulatedConfig, logger: SimulatedLogger) {
    this.config = config;
    this.logger = logger;
    this.taskName = config.get('taskName');
    if (config.get('autoRegister')) {
      this.registerTask();
    }
  }

  public registerTask(name?: string, options: { force?: boolean } = {}): this {
    const targetName = name || this.taskName;
    if (this.registeredTaskNames.has(targetName) && !options.force) {
      return this;
    }
    this.registeredTaskNames.add(targetName);
    this.emit('registered', { taskName: targetName, timestamp: Date.now() });
    return this;
  }

  public unregisterTask(name?: string): this {
    const targetName = name || this.taskName;
    if (!this.registeredTaskNames.has(targetName)) {
      return this;
    }
    this.registeredTaskNames.delete(targetName);
    this.unhook();
    this.emit('unregistered', { taskName: targetName, timestamp: Date.now() });
    return this;
  }

  public hook(taskName: string): this {
    this.logger.hook({ taskName });
    this.emit('hooked', { taskName, timestamp: Date.now() });
    return this;
  }

  public unhook(): this {
    const result = this.logger.unhook();
    if (result) {
      this.emit('unhooked', { timestamp: Date.now() });
    }
    return this;
  }

  public isActive(): boolean {
    return this.logger.isHooked();
  }

  public isRegistered(name?: string): boolean {
    return this.registeredTaskNames.has(name || this.taskName);
  }

  public getConfig(): VexorionOptions {
    return this.config.getAll();
  }

  public getAllowedTypes(): string[] {
    return [...this.config.get('allowedTypes')];
  }

  public addAllowedType(type: string): this {
    if (!type || !type.trim()) throw new Error('Type must be a non-empty string');
    const current = [...this.config.get('allowedTypes')];
    if (!current.includes(type)) {
      current.push(type);
      this.config.set('allowedTypes', current);
      this.emit('typeAdded', { type, category: 'allowed', timestamp: Date.now() });
    }
    return this;
  }

  public removeAllowedType(type: string): this {
    if (!type || !type.trim()) throw new Error('Type must be a non-empty string');
    const current = [...this.config.get('allowedTypes')];
    const index = current.indexOf(type);
    if (index !== -1) {
      current.splice(index, 1);
      this.config.set('allowedTypes', current);
      this.emit('typeRemoved', { type, category: 'allowed', timestamp: Date.now() });
    }
    return this;
  }

  public addException(type: string): this {
    if (!type || !type.trim()) throw new Error('Type must be a non-empty string');
    const exceptions = [...this.config.get('exceptions')];
    if (!exceptions.includes(type)) {
      exceptions.push(type);
      this.config.set('exceptions', exceptions);
      this.emit('exceptionAdded', { type, timestamp: Date.now() });
    }
    return this;
  }

  public removeException(type: string): this {
    if (!type || !type.trim()) throw new Error('Type must be a non-empty string');
    const exceptions = [...this.config.get('exceptions')];
    const index = exceptions.indexOf(type);
    if (index !== -1) {
      exceptions.splice(index, 1);
      this.config.set('exceptions', exceptions);
      this.emit('exceptionRemoved', { type, timestamp: Date.now() });
    }
    return this;
  }

  public addTaskToWhitelist(taskName: string): this {
    if (!taskName || !taskName.trim()) throw new Error('Task name must be a non-empty string');
    const list = [...this.config.get('taskWhitelist')];
    if (!list.includes(taskName)) {
      list.push(taskName);
      this.config.set('taskWhitelist', list);
    }
    return this;
  }

  public addTaskToBlacklist(taskName: string): this {
    if (!taskName || !taskName.trim()) throw new Error('Task name must be a non-empty string');
    const list = [...this.config.get('taskBlacklist')];
    if (!list.includes(taskName)) {
      list.push(taskName);
      this.config.set('taskBlacklist', list);
    }
    return this;
  }

  public getMetrics(): SuppressionMetrics {
    return this.logger.getMetrics();
  }

  public resetMetrics(): this {
    this.logger.resetMetrics();
    return this;
  }

  public on(event: string, listener: (data: Record<string, unknown>) => void): this {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
    return this;
  }

  public off(event: string, listener: (data: Record<string, unknown>) => void): this {
    if (!this.eventListeners.has(event)) return this;
    const listeners = this.eventListeners.get(event)!;
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    return this;
  }

  private emit(event: string, data: Record<string, unknown>) {
    this.eventLog.unshift({
      id: Math.random().toString(36).substring(2, 9),
      event: event as VexorionEventRecord['event'],
      data,
      timestamp: Date.now()
    });
    if (this.eventLog.length > 50) this.eventLog.pop();

    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (e) {
          // ignore error
        }
      }
    }
  }

  public getEventHistory(): VexorionEventRecord[] {
    return [...this.eventLog];
  }

  public getRegisteredTasks(): string[] {
    return [...this.registeredTaskNames];
  }

  public getRawConfig(): SimulatedConfig {
    return this.config;
  }

  public getRawLogger(): SimulatedLogger {
    return this.logger;
  }

  public static getVersion() {
    return {
      name: 'vexorion',
      version: '2.1.0',
      description: 'Intelligent Grunt log suppressor - suppresses noisy logs while allowing critical messages',
      author: 'Vexorion',
      license: 'MIT'
    };
  }
}

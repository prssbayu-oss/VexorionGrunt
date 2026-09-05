/**
 * @file src/services/simulationEngine.ts
 * Pure client-side simulation engine for Vexorion browser environment.
 * Evaluates suppression rules, calculates metrics, and simulates LRU caching
 * completely independent of backend Node.js files.
 */

import { VexorionOptions, SuppressionMetrics, CacheStats } from '../types';

export class ClientSimulationConfig {
  private options: VexorionOptions;
  private cache: Map<string, { allowed: boolean; reason: string }>;
  private cacheCapacity: number = 500;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  constructor(initialOptions: Partial<VexorionOptions> = {}) {
    this.options = {
      allowedTypes: initialOptions.allowedTypes || ['success', 'fail', 'warn', 'error', 'ok'],
      exceptions: initialOptions.exceptions || ['security'],
      taskWhitelist: initialOptions.taskWhitelist || [],
      taskBlacklist: initialOptions.taskBlacklist || [],
      verbose: initialOptions.verbose ?? false,
      suppressAll: initialOptions.suppressAll ?? false,
      taskName: initialOptions.taskName || 'build',
      autoRegister: initialOptions.autoRegister ?? true
    };
    this.cache = new Map();
  }

  public getSnapshot(): VexorionOptions {
    return {
      ...this.options,
      allowedTypes: [...this.options.allowedTypes],
      exceptions: [...this.options.exceptions],
      taskWhitelist: [...this.options.taskWhitelist],
      taskBlacklist: [...this.options.taskBlacklist]
    };
  }

  public get<K extends keyof VexorionOptions>(key: K): VexorionOptions[K] {
    return this.options[key];
  }

  public getAll(): VexorionOptions {
    return this.getSnapshot();
  }

  public set<K extends keyof VexorionOptions>(key: K, value: VexorionOptions[K]): void {
    this.options[key] = value;
    this.clearCache();
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheStats(): CacheStats {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? `${((this.cacheHits / total) * 100).toFixed(1)}%` : '100%';
    return {
      size: this.cache.size,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate
    };
  }

  public checkAllowanceDetailed(type: string, task: string = ''): { allowed: boolean; reason: string } {
    const cacheKey = `${type}:${task}`;
    if (this.cache.has(cacheKey)) {
      this.cacheHits++;
      return this.cache.get(cacheKey)!;
    }

    this.cacheMisses++;

    let result: { allowed: boolean; reason: string };

    if (this.options.suppressAll) {
      result = { allowed: false, reason: 'suppress_all' };
    } else if (this.options.exceptions.includes(type)) {
      result = { allowed: true, reason: 'exception_override' };
    } else if (this.options.taskBlacklist.includes(task)) {
      result = { allowed: false, reason: 'task_blacklisted' };
    } else if (this.options.taskWhitelist.length > 0 && !this.options.taskWhitelist.includes(task)) {
      result = { allowed: false, reason: 'task_not_whitelisted' };
    } else if (this.options.allowedTypes.includes(type)) {
      result = { allowed: true, reason: 'allowed_type' };
    } else {
      result = { allowed: false, reason: 'type_not_allowed' };
    }

    if (this.cache.size >= this.cacheCapacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(cacheKey, result);

    return result;
  }
}

export class ClientSimulationLogger {
  private config: ClientSimulationConfig;
  private hooked: boolean = false;
  private suppressedCount: number = 0;
  private allowedCount: number = 0;
  private errorCount: number = 0;
  private lastSuppressedItem: { type: string; task: string; time: number } | null = null;
  private lastAllowedItem: { type: string; task: string; time: number } | null = null;

  constructor(config: ClientSimulationConfig) {
    this.config = config;
  }

  public hook(): void {
    this.hooked = true;
  }

  public unhook(): void {
    this.hooked = false;
  }

  public isHookActive(): boolean {
    return this.hooked;
  }

  public preHook(type: string, task: string = ''): { allowed: boolean; suppressed: boolean; reason: string } {
    if (!this.hooked) {
      this.allowedCount++;
      this.lastAllowedItem = { type, task, time: Date.now() };
      return { allowed: true, suppressed: false, reason: 'unhooked' };
    }

    const check = this.config.checkAllowanceDetailed(type, task);
    if (check.allowed) {
      this.allowedCount++;
      this.lastAllowedItem = { type, task, time: Date.now() };
      return { allowed: true, suppressed: false, reason: check.reason };
    } else {
      this.suppressedCount++;
      this.lastSuppressedItem = { type, task, time: Date.now() };
      return { allowed: false, suppressed: true, reason: check.reason };
    }
  }

  public getMetrics(): SuppressionMetrics {
    const total = this.suppressedCount + this.allowedCount;
    const rate = total > 0 ? `${((this.suppressedCount / total) * 100).toFixed(1)}%` : '0.0%';
    return {
      suppressed: this.suppressedCount,
      allowed: this.allowedCount,
      errors: this.errorCount,
      total,
      suppressionRate: rate,
      lastSuppressed: this.lastSuppressedItem,
      lastAllowed: this.lastAllowedItem
    };
  }

  public resetMetrics(): void {
    this.suppressedCount = 0;
    this.allowedCount = 0;
    this.errorCount = 0;
    this.lastSuppressedItem = null;
    this.lastAllowedItem = null;
  }
}

export class ClientSimulationEngine {
  private config: ClientSimulationConfig;
  private logger: ClientSimulationLogger;

  constructor(initialOptions: Partial<VexorionOptions> = {}) {
    this.config = new ClientSimulationConfig(initialOptions);
    this.logger = new ClientSimulationLogger(this.config);
    this.logger.hook();
  }

  public getConfig(): VexorionOptions {
    return this.config.getSnapshot();
  }

  public getRawConfig(): ClientSimulationConfig {
    return this.config;
  }

  public getRawLogger(): ClientSimulationLogger {
    return this.logger;
  }

  public getMetrics(): SuppressionMetrics {
    return this.logger.getMetrics();
  }

  public resetMetrics(): void {
    this.logger.resetMetrics();
  }

  public isHooked(): boolean {
    return this.logger.isHookActive();
  }

  public hook(_task: string = 'build'): void {
    this.logger.hook();
  }

  public unhook(): void {
    this.logger.unhook();
  }

  public addAllowedType(type: string): void {
    const current = this.config.get('allowedTypes');
    if (!current.includes(type)) {
      this.config.set('allowedTypes', [...current, type]);
    }
  }

  public removeAllowedType(type: string): void {
    const current = this.config.get('allowedTypes');
    this.config.set('allowedTypes', current.filter((t) => t !== type));
  }

  public addException(type: string): void {
    const current = this.config.get('exceptions');
    if (!current.includes(type)) {
      this.config.set('exceptions', [...current, type]);
    }
  }

  public removeException(type: string): void {
    const current = this.config.get('exceptions');
    this.config.set('exceptions', current.filter((e) => e !== type));
  }

  public addTaskToWhitelist(task: string): void {
    const current = this.config.get('taskWhitelist');
    if (!current.includes(task)) {
      this.config.set('taskWhitelist', [...current, task]);
    }
  }

  public addTaskToBlacklist(task: string): void {
    const current = this.config.get('taskBlacklist');
    if (!current.includes(task)) {
      this.config.set('taskBlacklist', [...current, task]);
    }
  }

  public toggleSuppressAll(): boolean {
    const next = !this.config.get('suppressAll');
    this.config.set('suppressAll', next);
    return next;
  }

  public toggleVerbose(): boolean {
    const next = !this.config.get('verbose');
    this.config.set('verbose', next);
    return next;
  }
}

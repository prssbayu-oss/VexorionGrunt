/**
 * @file src/lib/vexorion-core.ts
 * Frontend Vexorion Integration Module using INHERITANCE and PRIVATE INTEGRATION.
 *
 * Rather than duplicating the backend engine classes, this module directly extends
 * VexorionConfigManager, VexorionLoggerEngine, and VexorionSystemInstance via
 * JavaScript class inheritance. Subclasses leverage protected gateways to interact
 * seamlessly with private state while eliminating duplicated code.
 */

import { VexorionConfigManager } from '../../server/vexorion/config.js';
import { VexorionLoggerEngine } from '../../server/vexorion/logger.js';
import { VexorionSystemInstance } from '../../server/vexorion/index.js';
import { LRUCacheEngine } from '../../server/vexorion/cache.js';
import { HookerInterceptionCore } from '../../server/vexorion/hooker.js';
import { VexorionOptions, SuppressionMetrics, CacheStats, VexorionEventRecord } from '../types';

/**
 * SimulatedConfig inherits directly from VexorionConfigManager.
 * Zero duplication: rule evaluation, validation, defaults, and LRU cache are inherited.
 */
export class SimulatedConfig extends VexorionConfigManager {
  constructor(options: Partial<VexorionOptions> = {}) {
    super(options);
  }

  /**
   * Utility method to merge partial configuration objects
   */
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
 * SimulatedLogger inherits directly from VexorionLoggerEngine.
 * Zero duplication: metrics tracking, suppression evaluation, muting state, and history are inherited.
 */
export class SimulatedLogger extends VexorionLoggerEngine {
  private hookId: string | null = null;
  public muted: boolean = false;

  constructor(config: SimulatedConfig) {
    super(config);
  }

  public hook(options: { taskName?: string } = {}): boolean {
    const task = options.taskName || 'default';
    this.hookId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    super.hook({ muted: false }, task);
    return true;
  }

  public unhook(): boolean {
    this.hookId = null;
    this.muted = false;
    return super.unhook();
  }

  public isHooked(): boolean {
    return super.isHookActive();
  }

  public getHookId(): string | null {
    return this.hookId;
  }

  public preHook(type: string, taskName: string): { allowed: boolean; suppressed: boolean; reason: string } {
    try {
      const result = super.preHook(type, taskName);
      this.muted = !result.allowed;
      return {
        allowed: result.allowed,
        suppressed: !result.allowed,
        reason: result.reason
      };
    } catch {
      this.muted = false;
      return { allowed: true, suppressed: false, reason: 'error_fallback' };
    }
  }

  public postHook(): void {
    super.postHook();
    this.muted = false;
  }
}

/**
 * SimulatedVexorion inherits directly from VexorionSystemInstance.
 * Zero duplication: task registration, event emissions, rule modifications, and lifecycle are inherited.
 */
export class SimulatedVexorion extends VexorionSystemInstance {
  constructor(config?: SimulatedConfig, logger?: SimulatedLogger) {
    super({}, config, logger);
  }
}

export {
  LRUCacheEngine,
  HookerInterceptionCore,
  VexorionConfigManager,
  VexorionLoggerEngine,
  VexorionSystemInstance
};

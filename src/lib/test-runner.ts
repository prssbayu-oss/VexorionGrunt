import { TestCaseResult } from '../types';
import {
  SimulatedConfig,
  SimulatedLogger,
  SimulatedVexorion,
  VexorionConfigManager,
  VexorionLoggerEngine,
  VexorionSystemInstance,
  LRUCacheEngine,
  HookerInterceptionCore
} from './vexorion-core';

export function runVexorionTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  function test(suite: string, name: string, fn: () => void) {
    const start = performance.now();
    try {
      fn();
      results.push({
        suite,
        name,
        passed: true,
        durationMs: Math.round((performance.now() - start) * 100) / 100
      });
    } catch (err: unknown) {
      results.push({
        suite,
        name,
        passed: false,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  // --- Suite 1: Config ---
  test('Config Class', 'should initialize with default options', () => {
    const config = new SimulatedConfig();
    const defaults = config.getAll();
    if (!defaults.allowedTypes.includes('warn')) throw new Error('Default allowedTypes missing "warn"');
    if (defaults.taskName !== 'suppress') throw new Error(`Expected taskName 'suppress', got '${defaults.taskName}'`);
    if (defaults.verbose !== false) throw new Error('Default verbose should be false');
    if (defaults.suppressAll !== false) throw new Error('Default suppressAll should be false');
  });

  test('Config Class', 'should allow custom options overriding defaults', () => {
    const config = new SimulatedConfig({
      taskName: 'custom_suppress',
      allowedTypes: ['error', 'custom_audit'],
      verbose: true
    });
    if (config.get('taskName') !== 'custom_suppress') throw new Error('Failed to override taskName');
    if (!config.get('allowedTypes').includes('custom_audit')) throw new Error('Failed to set custom allowedTypes');
    if (!config.get('verbose')) throw new Error('Verbose should be true');
  });

  test('Config Class', 'should reject invalid option types with descriptive error', () => {
    let threw = false;
    try {
      // @ts-expect-error testing invalid type
      new SimulatedConfig({ allowedTypes: 'not-an-array' });
    } catch (e: unknown) {
      threw = true;
      if (!String(e).includes('must be an array of strings')) {
        throw new Error('Unexpected validation error message: ' + String(e));
      }
    }
    if (!threw) throw new Error('Expected validation error for non-array allowedTypes');
  });

  test('Config Class', 'should calculate allowance with whitelist and blacklist', () => {
    const config = new SimulatedConfig({
      allowedTypes: ['warn', 'error'],
      taskWhitelist: ['critical_task']
    });
    // Task not in whitelist should be blocked even if type is allowed
    const res1 = config.isAllowed('warn', 'other_task');
    if (res1 !== false) throw new Error('Non-whitelisted task should be disallowed');

    // Task in whitelist should be allowed
    const res2 = config.isAllowed('warn', 'critical_task');
    if (res2 !== true) throw new Error('Whitelisted task with allowed type should be allowed');
  });

  test('Config Class', 'should prioritize exceptions over blocked types', () => {
    const config = new SimulatedConfig({
      allowedTypes: ['error'],
      exceptions: ['security_audit']
    });
    // 'security_audit' is an exception
    if (!config.isAllowed('security_audit', 'any_task')) {
      throw new Error('Exception type should always be allowed');
    }
    // 'writeln' is not allowed and not an exception
    if (config.isAllowed('writeln', 'any_task')) {
      throw new Error('Unlisted type should be suppressed');
    }
  });

  test('Config Class', 'should cache allowance results and record cache hits', () => {
    const config = new SimulatedConfig();
    config.isAllowed('warn', 'taskA');
    config.isAllowed('warn', 'taskA');
    config.isAllowed('warn', 'taskA');
    const stats = config.getCacheStats();
    if (stats.hits < 2) {
      throw new Error(`Expected at least 2 cache hits, got ${stats.hits}`);
    }
  });

  // --- Suite 2: Logger & Hooking ---
  test('Logger Component', 'should initialize in unhooked state', () => {
    const config = new SimulatedConfig();
    const logger = new SimulatedLogger(config);
    if (logger.isHooked()) throw new Error('Logger should start unhooked');
    if (logger.getMetrics().total !== 0) throw new Error('Metrics total should start at 0');
  });

  test('Logger Component', 'should track allowed and suppressed metrics accurately', () => {
    const config = new SimulatedConfig({
      allowedTypes: ['ok', 'error']
    });
    const logger = new SimulatedLogger(config);
    logger.hook({ taskName: 'build' });

    // Simulate writeln -> should be suppressed
    const r1 = logger.preHook('writeln', 'build');
    if (!r1.suppressed) throw new Error('writeln should be suppressed');

    // Simulate ok -> should be allowed
    const r2 = logger.preHook('ok', 'build');
    if (!r2.allowed) throw new Error('ok should be allowed');

    const metrics = logger.getMetrics();
    if (metrics.suppressed !== 1) throw new Error(`Expected 1 suppressed, got ${metrics.suppressed}`);
    if (metrics.allowed !== 1) throw new Error(`Expected 1 allowed, got ${metrics.allowed}`);
    if (metrics.total !== 2) throw new Error(`Expected 2 total, got ${metrics.total}`);
    if (metrics.suppressionRate !== '50.00%') throw new Error(`Expected 50.00%, got ${metrics.suppressionRate}`);
  });

  // --- Suite 3: Vexorion Orchestration ---
  test('Vexorion Orchestration', 'should manage lifecycle and event emission', () => {
    const config = new SimulatedConfig({ autoRegister: true, taskName: 'suppress' });
    const logger = new SimulatedLogger(config);
    const vexorion = new SimulatedVexorion(config, logger);

    let hookedCalled = false;
    let typeAddedCalled = false;

    vexorion.on('hooked', () => { hookedCalled = true; });
    vexorion.on('typeAdded', () => { typeAddedCalled = true; });

    vexorion.hook('test_task');
    if (!hookedCalled) throw new Error('Expected "hooked" event to be emitted');
    if (!vexorion.isActive()) throw new Error('Vexorion should report active after hook');

    vexorion.addAllowedType('custom_metric');
    if (!typeAddedCalled) throw new Error('Expected "typeAdded" event to be emitted');
    if (!vexorion.getAllowedTypes().includes('custom_metric')) {
      throw new Error('Allowed types should contain custom_metric');
    }

    vexorion.unhook();
    if (vexorion.isActive()) throw new Error('Vexorion should be inactive after unhook');
  });

  test('Vexorion Orchestration', 'should support dynamic exception toggles', () => {
    const config = new SimulatedConfig();
    const logger = new SimulatedLogger(config);
    const vexorion = new SimulatedVexorion(config, logger);

    vexorion.addException('telemetry');
    const exceptions = config.get('exceptions');
    if (!exceptions.includes('telemetry')) throw new Error('Expected telemetry in exceptions');

    vexorion.removeException('telemetry');
    const exceptionsAfter = config.get('exceptions');
    if (exceptionsAfter.includes('telemetry')) throw new Error('Expected telemetry to be removed');
  });

  test('Vexorion Compatibility', 'should match package version and export metadata', () => {
    const meta = SimulatedVexorion.getVersion();
    if (meta.name !== 'vexorion') throw new Error('Package name mismatch');
    if (meta.version !== '2.1.0') throw new Error('Package version mismatch');
    if (meta.license !== 'MIT') throw new Error('License mismatch');
  });

  // --- Suite 4: Architecture & Inheritance Integrity ---
  test('Inheritance Architecture', 'SimulatedConfig must strictly inherit from VexorionConfigManager', () => {
    const config = new SimulatedConfig();
    if (!(config instanceof VexorionConfigManager)) {
      throw new Error('SimulatedConfig must be an instance of VexorionConfigManager via inheritance');
    }
    if (!(config.getInternalCache() instanceof LRUCacheEngine)) {
      throw new Error('Inherited config should provide LRUCacheEngine instance');
    }
  });

  test('Inheritance Architecture', 'SimulatedLogger must strictly inherit from VexorionLoggerEngine', () => {
    const config = new SimulatedConfig();
    const logger = new SimulatedLogger(config);
    if (!(logger instanceof VexorionLoggerEngine)) {
      throw new Error('SimulatedLogger must be an instance of VexorionLoggerEngine via inheritance');
    }
    if (!(logger.getInternalHooker() instanceof HookerInterceptionCore)) {
      throw new Error('Inherited logger should provide HookerInterceptionCore instance');
    }
  });

  test('Inheritance Architecture', 'SimulatedVexorion must strictly inherit from VexorionSystemInstance', () => {
    const config = new SimulatedConfig();
    const logger = new SimulatedLogger(config);
    const vexorion = new SimulatedVexorion(config, logger);
    if (!(vexorion instanceof VexorionSystemInstance)) {
      throw new Error('SimulatedVexorion must be an instance of VexorionSystemInstance via inheritance');
    }
  });

  return results;
}

/**
 * @file server/vexorion/pipeline.js
 * Vexorion Pipeline Orchestrator and Simulation Engine.
 * Integrates directly with VexorionLoggerEngine and VexorionConfigManager.
 * Uses private methods to step through build tasks, execute filter logic, and compile analytics.
 */

import { VexorionLoggerEngine } from './logger.js';
import { VexorionConfigManager } from './config.js';

export class VexorionPipelineRunner {
  #loggerEngine;
  #configManager;
  #registeredPipelines;
  #runStats;

  /**
   * @param {VexorionLoggerEngine} loggerEngine
   * @param {VexorionConfigManager} configManager
   */
  constructor(loggerEngine, configManager) {
    if (!(loggerEngine instanceof VexorionLoggerEngine)) {
      throw new TypeError('[VexorionPipelineRunner] loggerEngine must be instance of VexorionLoggerEngine');
    }
    if (!(configManager instanceof VexorionConfigManager)) {
      throw new TypeError('[VexorionPipelineRunner] configManager must be instance of VexorionConfigManager');
    }

    this.#loggerEngine = loggerEngine;
    this.#configManager = configManager;
    this.#registeredPipelines = new Map();
    this.#runStats = { totalRuns: 0, totalLogsProcessed: 0, totalSuppressed: 0 };

    this.#initializeStandardPipelines();
  }

  // ===================== PRIVATE METHODS =====================

  /**
   * Initializes built-in realistic Grunt pipelines
   * @private
   */
  #initializeStandardPipelines() {
    this.registerPipeline('build:prod', {
      name: 'Production Build Pipeline',
      command: 'grunt build:prod',
      description: 'Standard multi-stage production pipeline with asset hashing and linting.',
      tasks: [
        { type: 'subhead', task: 'clean:dist', message: 'Running "clean:dist" (clean) task' },
        { type: 'writeln', task: 'clean:dist', message: 'Cleaning directory .tmp...' },
        { type: 'ok', task: 'clean:dist', message: 'Cleaning directory .tmp...OK' },
        { type: 'subhead', task: 'eslint:src', message: 'Running "eslint:src" (eslint) task' },
        { type: 'verbose', task: 'eslint:src', message: 'Loaded rule "no-unused-vars" from rules engine' },
        { type: 'warn', task: 'eslint:src', message: 'Line 42: Variable "cacheTtl" is defined but never used' },
        { type: 'ok', task: 'eslint:src', message: '1 file linted. 1 warning found.' },
        { type: 'subhead', task: 'sass:compile', message: 'Running "sass:compile" (sass) task' },
        { type: 'debug', task: 'sass:compile', message: 'Parsed 14 partials in 12ms' },
        { type: 'writeln', task: 'sass:compile', message: 'File dist/app.css created.' },
        { type: 'subhead', task: 'audit:security', message: 'Running "audit:security" (audit) task' },
        { type: 'security', task: 'audit:security', message: 'EXCEPTION: Zero high-severity vulnerabilities found in dependencies.' },
        { type: 'subhead', task: 'uglify:bundle', message: 'Running "uglify:bundle" (uglify) task' },
        { type: 'writeln', task: 'uglify:bundle', message: 'Minifying 12 source files...' },
        { type: 'ok', task: 'uglify:bundle', message: 'Bundle dist/bundle.min.js created (14.2 kB).' },
        { type: 'subhead', task: 'build:complete', message: 'Done, without errors.' }
      ]
    });

    this.registerPipeline('test:ci', {
      name: 'CI Integration Test Suite',
      command: 'grunt test:ci',
      description: 'Continuous Integration unit test run with mocha, coverage checks, and exit codes.',
      tasks: [
        { type: 'subhead', task: 'mochaTest:unit', message: 'Running "mochaTest:unit" (mochaTest) task' },
        { type: 'writeln', task: 'mochaTest:unit', message: '>> Vexorion Config Suite: 18 specs' },
        { type: 'ok', task: 'mochaTest:unit', message: '✓ passes all 18 unit assertions' },
        { type: 'subhead', task: 'mochaTest:integration', message: 'Running "mochaTest:integration" task' },
        { type: 'verbose', task: 'mochaTest:integration', message: 'Spawned child process PID 9021 for Grunt fixture' },
        { type: 'ok', task: 'mochaTest:integration', message: '✓ gruntfile.fixture.js passed' },
        { type: 'subhead', task: 'coverage:threshold', message: 'Checking code coverage thresholds...' },
        { type: 'writeln', task: 'coverage:threshold', message: 'Statements: 98.4% (312/317)' },
        { type: 'ok', task: 'coverage:threshold', message: 'Coverage threshold met (>95%).' }
      ]
    });

    this.registerPipeline('deploy:staging', {
      name: 'Staging Deployment Pipeline',
      command: 'grunt deploy:staging',
      description: 'Pre-flight check, asset sync, container verification, and health ping.',
      tasks: [
        { type: 'subhead', task: 'preflight:check', message: 'Running "preflight:check" task' },
        { type: 'debug', task: 'preflight:check', message: 'Checking AWS_ACCESS_KEY_ID environment variable' },
        { type: 'ok', task: 'preflight:check', message: 'All environment secrets verified.' },
        { type: 'subhead', task: 's3:sync', message: 'Running "s3:sync" (s3) task' },
        { type: 'writeln', task: 's3:sync', message: 'Uploading 184 assets to staging bucket...' },
        { type: 'verbose', task: 's3:sync', message: 'Uploaded dist/assets/index-b472e.js (210ms)' },
        { type: 'ok', task: 's3:sync', message: 'Bucket synchronized in 1.4s.' },
        { type: 'subhead', task: 'healthcheck:ping', message: 'Pinging staging endpoint https://staging.example.com/health' },
        { type: 'ok', task: 'healthcheck:ping', message: 'HTTP 200 OK received in 45ms.' }
      ]
    });
  }

  /**
   * Processes a single log step within a pipeline
   * @private
   */
  #processStep(step, isHooked, index) {
    const { type, task, message } = step;

    let allowed = true;
    let reason = 'hook_disabled';

    if (isHooked) {
      const evaluation = this.#configManager.checkAllowanceDetailed(type, task);
      allowed = evaluation.allowed;
      reason = evaluation.reason;
      this.#loggerEngine.preHook(type, task);
    }

    return {
      id: `step-${index}-${task}-${type}`,
      index,
      timestamp: Date.now(),
      type,
      task,
      message,
      allowed,
      suppressed: !allowed,
      reason
    };
  }

  /**
   * Computes reduction metrics for a pipeline run
   * @private
   */
  #computePipelineMetrics(steps, durationMs) {
    const total = steps.length;
    const suppressed = steps.filter((s) => s.suppressed).length;
    const passed = total - suppressed;
    const reductionPercent = total === 0 ? 0 : Math.round((suppressed / total) * 100);

    return {
      total,
      suppressed,
      passed,
      reductionPercent,
      durationMs: Math.round(durationMs * 100) / 100
    };
  }

  // ===================== PUBLIC API =====================

  /**
   * Registers a new custom pipeline
   * @param {string} id
   * @param {Object} pipelineDef
   */
  registerPipeline(id, pipelineDef) {
    if (!id || typeof id !== 'string') {
      throw new TypeError('[VexorionPipelineRunner] Pipeline ID must be a non-empty string');
    }
    this.#registeredPipelines.set(id, {
      id,
      name: pipelineDef.name || id,
      command: pipelineDef.command || `grunt ${id}`,
      description: pipelineDef.description || '',
      tasks: Array.isArray(pipelineDef.tasks) ? pipelineDef.tasks : []
    });
  }

  /**
   * Returns metadata list of all registered pipelines
   */
  getPipelines() {
    return Array.from(this.#registeredPipelines.values()).map((p) => ({
      id: p.id,
      name: p.name,
      command: p.command,
      description: p.description,
      stepCount: p.tasks.length
    }));
  }

  /**
   * Executes a pipeline end-to-end and returns evaluated log records
   * @param {string} pipelineId
   * @param {Object} [options]
   */
  execute(pipelineId, options = {}) {
    const pipeline = this.#registeredPipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`[VexorionPipelineRunner] Pipeline '${pipelineId}' not found.`);
    }

    const isHooked = options.hooked !== undefined ? Boolean(options.hooked) : true;
    const start = performance.now();

    const evaluatedSteps = pipeline.tasks.map((task, index) => {
      return this.#processStep(task, isHooked, index);
    });

    const durationMs = performance.now() - start;
    const metrics = this.#computePipelineMetrics(evaluatedSteps, durationMs);

    this.#runStats.totalRuns++;
    this.#runStats.totalLogsProcessed += metrics.total;
    this.#runStats.totalSuppressed += metrics.suppressed;

    return {
      pipelineId: pipeline.id,
      name: pipeline.name,
      command: pipeline.command,
      isHooked,
      metrics,
      logs: evaluatedSteps,
      cacheStats: this.#configManager.getCacheStats()
    };
  }

  /**
   * Returns global execution statistics
   */
  getRunStats() {
    return {
      ...this.#runStats,
      pipelinesRegistered: this.#registeredPipelines.size
    };
  }
}

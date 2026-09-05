/**
 * @file server/internal/controller.js
 * Central Entry Point and Subsystem Orchestrator for Server Architecture.
 * Integrates ServerEventBus, ServerLogger, and ServerAuthManager.
 * Strictly uses private class fields and private methods (#) to enforce rigorous internal state encapsulation.
 */

import { ServerEventBus } from './eventBus.js';
import { ServerLogger } from './logger.js';
import { ServerAuthManager } from './auth.js';

export class ServerCentralController {
  #eventBus;
  #logger;
  #auth;
  #serviceRegistry;
  #requestCounter;
  #auditLog;
  #isBooted;
  #bootTime;

  constructor(options = {}) {
    this.#bootTime = Date.now();
    this.#requestCounter = 0;
    this.#auditLog = [];
    this.#serviceRegistry = new Map();
    this.#isBooted = false;

    // 1. Instantiate foundational Event Bus
    this.#eventBus = new ServerEventBus(options.eventBusOptions || {});

    // 2. Instantiate Structured Logger wired to Event Bus
    this.#logger = new ServerLogger(this.#eventBus, options.loggerOptions || { minLevel: 'debug' });

    // 3. Instantiate Auth & RBAC Manager wired to Event Bus & Logger
    this.#auth = new ServerAuthManager(this.#eventBus, this.#logger, options.authOptions || {});

    // 4. Wire internal event interceptors and register core services
    this.#wireInternalEventInterceptors();
    this.#registerDefaultServices();
    this.#isBooted = true;
  }

  // ===================== PRIVATE METHODS =====================

  /**
   * Subscribes internal audit and logging interceptors to the event bus
   * @private
   */
  #wireInternalEventInterceptors() {
    // Intercept all system events for unified audit trail
    this.#eventBus.subscribeAll((payload, eventName) => {
      this.#recordAudit({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        event: eventName,
        timestamp: Date.now(),
        payload: this.#sanitizeAuditPayload(payload)
      });
    });

    // Special lifecycle logging for authentication events
    this.#eventBus.subscribe('auth:login_success', (data) => {
      this.#logger.info(`[Audit] Authentication success for: ${data.username}`, { username: data.username, role: data.role });
    }, 100);

    this.#eventBus.subscribe('auth:login_failed', (data) => {
      this.#logger.warn(`[Audit] Security alert: Authentication failure for: ${data.username}`, { username: data.username });
    }, 100);
  }

  /**
   * Registers default internal core service handlers
   * @private
   */
  #registerDefaultServices() {
    // 1. Config management service
    this.#serviceRegistry.set('config', {
      requiredPermission: 'config:read',
      execute: (action, payload) => {
        if (action === 'get') {
          return { status: 'ok', service: 'config', timestamp: Date.now() };
        }
        throw new Error(`Unsupported config action: ${action}`);
      }
    });

    // 2. Diagnostics service
    this.#serviceRegistry.set('diagnostics', {
      requiredPermission: 'system:manage',
      execute: (action) => {
        if (action === 'health') {
          return this.getSystemHealth();
        }
        throw new Error(`Unsupported diagnostics action: ${action}`);
      }
    });
  }

  /**
   * Records sanitized events into bounded circular audit log
   * @private
   */
  #recordAudit(auditEntry) {
    this.#auditLog.push(auditEntry);
    if (this.#auditLog.length > 200) {
      this.#auditLog.shift();
    }
  }

  /**
   * Strips sensitive fields (passwords, full tokens) from audit records
   * @private
   */
  #sanitizeAuditPayload(payload) {
    if (!payload || typeof payload !== 'object') return payload;

    const sanitized = { ...payload };
    if (sanitized.password) sanitized.password = '***REDACTED***';
    if (sanitized.token && typeof sanitized.token === 'string') {
      sanitized.token = `${sanitized.token.substring(0, 10)}...`;
    }
    return sanitized;
  }

  /**
   * Validates service execution inputs
   * @private
   */
  #validateServiceCall(serviceName, action) {
    if (!this.#serviceRegistry.has(serviceName)) {
      throw new Error(`Service "${serviceName}" is not registered in central controller.`);
    }
    if (!action || typeof action !== 'string') {
      throw new Error(`Action parameter must be a non-empty string.`);
    }
  }

  // ===================== PUBLIC API =====================

  /**
   * Returns internal EventBus instance
   * @returns {ServerEventBus}
   */
  getEventBus() {
    return this.#eventBus;
  }

  /**
   * Returns internal ServerLogger instance
   * @returns {ServerLogger}
   */
  getLogger() {
    return this.#logger;
  }

  /**
   * Returns internal ServerAuthManager instance
   * @returns {ServerAuthManager}
   */
  getAuthManager() {
    return this.#auth;
  }

  /**
   * Registers a new custom domain service
   * @param {string} serviceName
   * @param {Object} serviceDescriptor
   * @param {string} [serviceDescriptor.requiredPermission]
   * @param {Function} serviceDescriptor.execute
   */
  registerService(serviceName, serviceDescriptor) {
    if (typeof serviceDescriptor.execute !== 'function') {
      throw new TypeError(`Service "${serviceName}" must implement an executable function.`);
    }
    this.#serviceRegistry.set(serviceName, serviceDescriptor);
    this.#logger.info(`Service registered: ${serviceName}`, { serviceName });
    this.#eventBus.emit('system:service_registered', { serviceName });
  }

  /**
   * Executes a protected internal action with token and permission verification
   * @param {string} token
   * @param {string} serviceName
   * @param {string} action
   * @param {Object} [payload]
   */
  executeProtectedAction(token, serviceName, action, payload = {}) {
    this.#requestCounter++;
    this.#validateServiceCall(serviceName, action);

    const service = this.#serviceRegistry.get(serviceName);

    // Validate permission if required by service
    if (service.requiredPermission) {
      const isAllowed = this.#auth.hasPermission(token, service.requiredPermission);
      if (!isAllowed) {
        this.#logger.warn(`Unauthorized action attempt on "${serviceName}:${action}"`, { serviceName, action });
        this.#eventBus.emit('auth:unauthorized_action', { serviceName, action });
        throw new Error(`Access Denied: missing permission "${service.requiredPermission}".`);
      }
    }

    const session = this.#auth.validateToken(token);
    this.#logger.debug(`Executing action "${serviceName}:${action}" for user "${session?.username || 'anonymous'}"`);

    const result = service.execute(action, payload, session);

    this.#eventBus.emit('system:action_executed', {
      serviceName,
      action,
      username: session?.username || 'anonymous',
      timestamp: Date.now()
    });

    return result;
  }

  /**
   * Authenticates user and returns session metadata
   */
  login(username, password, meta = {}) {
    return this.#auth.login(username, password, meta);
  }

  /**
   * Retrieves full health and diagnostics across all internal modules
   */
  getSystemHealth() {
    return {
      status: this.#isBooted ? 'healthy' : 'booting',
      uptimeSeconds: Math.floor((Date.now() - this.#bootTime) / 1000),
      totalRequestsHandled: this.#requestCounter,
      eventBus: this.#eventBus.getStats(),
      logger: this.#logger.getMetrics(),
      auth: this.#auth.getAuthStats(),
      registeredServices: Array.from(this.#serviceRegistry.keys())
    };
  }

  /**
   * Retrieves audit logs recorded by central controller
   * @param {number} [limit=50]
   */
  getAuditTrail(limit = 50) {
    return this.#auditLog.slice(-Math.min(limit, this.#auditLog.length));
  }
}

// Global default singleton instance
export const serverController = new ServerCentralController();

export {
  ServerEventBus,
  ServerLogger,
  ServerAuthManager
};

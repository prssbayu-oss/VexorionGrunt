(() => {
  // server/internal/eventBus.js
  var ServerEventBus = class {
    #listeners;
    #wildcardListeners;
    #history;
    #maxHistory;
    #isDispatching;
    #eventCounter;
    constructor(options = {}) {
      this.#listeners = /* @__PURE__ */ new Map();
      this.#wildcardListeners = /* @__PURE__ */ new Set();
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
      if (typeof name !== "string" || !name.trim()) {
        throw new TypeError("[ServerEventBus] Event name must be a non-empty string");
      }
      return name.trim();
    }
    /**
     * Validates subscriber callback function
     * @private
     */
    #validateHandler(handler) {
      if (typeof handler !== "function") {
        throw new TypeError("[ServerEventBus] Event handler must be an executable function");
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
        this.#listeners.set(validName, /* @__PURE__ */ new Set());
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
      const directSubscribers = this.#listeners.get(validName);
      if (directSubscribers && directSubscribers.size > 0) {
        this.#dispatchToCollection(directSubscribers, validName, payload);
      }
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
  };

  // server/internal/logger.js
  var ServerLogger = class {
    #eventBus;
    #minLevel;
    #levelWeights;
    #logs;
    #maxLogs;
    #metrics;
    #context;
    /**
     * @param {ServerEventBus} [eventBus]
     * @param {Object} [options]
     */
    constructor(eventBus = null, options = {}) {
      if (eventBus && !(eventBus instanceof ServerEventBus)) {
        throw new TypeError("[ServerLogger] eventBus must be an instance of ServerEventBus");
      }
      this.#eventBus = eventBus;
      this.#minLevel = options.minLevel || "debug";
      this.#maxLogs = Number(options.maxLogs) || 250;
      this.#logs = [];
      this.#context = options.defaultContext || { service: "vexorion-core", nodeEnv: "development" };
      this.#levelWeights = {
        trace: 10,
        debug: 20,
        info: 30,
        warn: 40,
        error: 50,
        fatal: 60
      };
      this.#metrics = {
        total: 0,
        suppressed: 0,
        byLevel: {
          trace: 0,
          debug: 0,
          info: 0,
          warn: 0,
          error: 0,
          fatal: 0
        }
      };
    }
    // ===================== PRIVATE METHODS =====================
    /**
     * Evaluates if log entry passes minimum severity threshold
     * @private
     */
    #shouldLog(level) {
      const currentWeight = this.#levelWeights[this.#minLevel] || 20;
      const targetWeight = this.#levelWeights[level] || 30;
      return targetWeight >= currentWeight;
    }
    /**
     * Formats structured log entry with unified timestamp and context
     * @private
     */
    #formatEntry(level, message, meta = {}) {
      return {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        isoTime: (/* @__PURE__ */ new Date()).toISOString(),
        level,
        message: typeof message === "string" ? message : JSON.stringify(message),
        meta: { ...this.#context, ...meta }
      };
    }
    /**
     * Stores log entry in bounded memory buffer
     * @private
     */
    #persistEntry(entry) {
      this.#logs.push(entry);
      if (this.#logs.length > this.#maxLogs) {
        this.#logs.shift();
      }
    }
    /**
     * Dispatches log entry to connected ServerEventBus if available
     * @private
     */
    #dispatchToEventBus(entry) {
      if (this.#eventBus) {
        this.#eventBus.emit(`logger:${entry.level}`, entry);
        this.#eventBus.emit("logger:entry", entry);
      }
    }
    /**
     * Internal execution pipeline for writing log entries
     * @private
     */
    #writeLog(level, message, meta = {}) {
      this.#metrics.total++;
      if (!this.#shouldLog(level)) {
        this.#metrics.suppressed++;
        return null;
      }
      if (this.#metrics.byLevel[level] !== void 0) {
        this.#metrics.byLevel[level]++;
      }
      const entry = this.#formatEntry(level, message, meta);
      this.#persistEntry(entry);
      this.#dispatchToEventBus(entry);
      return entry;
    }
    // ===================== PUBLIC API =====================
    /**
     * Sets minimum threshold log level
     * @param {'trace'|'debug'|'info'|'warn'|'error'|'fatal'} level
     */
    setLogLevel(level) {
      if (this.#levelWeights[level]) {
        this.#minLevel = level;
      }
    }
    /**
     * Augments persistent ambient context metadata
     * @param {Object} ctx
     */
    setContext(ctx) {
      if (ctx && typeof ctx === "object") {
        this.#context = { ...this.#context, ...ctx };
      }
    }
    /**
     * Trace severity logging
     */
    trace(message, meta = {}) {
      return this.#writeLog("trace", message, meta);
    }
    /**
     * Debug severity logging
     */
    debug(message, meta = {}) {
      return this.#writeLog("debug", message, meta);
    }
    /**
     * Info severity logging
     */
    info(message, meta = {}) {
      return this.#writeLog("info", message, meta);
    }
    /**
     * Warn severity logging
     */
    warn(message, meta = {}) {
      return this.#writeLog("warn", message, meta);
    }
    /**
     * Error severity logging
     */
    error(message, meta = {}) {
      return this.#writeLog("error", message, meta);
    }
    /**
     * Fatal severity logging
     */
    fatal(message, meta = {}) {
      return this.#writeLog("fatal", message, meta);
    }
    /**
     * Retrieves recorded log history with optional filtering
     * @param {number} [limit=50]
     * @param {string} [levelFilter]
     */
    getLogs(limit = 50, levelFilter = null) {
      let filtered = this.#logs;
      if (levelFilter && this.#levelWeights[levelFilter]) {
        filtered = filtered.filter((l) => l.level === levelFilter);
      }
      return filtered.slice(-Math.min(limit, filtered.length));
    }
    /**
     * Returns current telemetry counts
     */
    getMetrics() {
      return {
        minLevel: this.#minLevel,
        totalEmitted: this.#metrics.total,
        totalSuppressed: this.#metrics.suppressed,
        byLevel: { ...this.#metrics.byLevel },
        storedCount: this.#logs.length
      };
    }
    /**
     * Flushes internal memory logs
     */
    clearLogs() {
      this.#logs = [];
    }
  };

  // server/internal/auth.js
  var ServerAuthManager = class {
    #eventBus;
    #logger;
    #sessions;
    #roles;
    #userStore;
    #failedAttempts;
    #sessionTtlMs;
    #maxFailedAttempts;
    /**
     * @param {ServerEventBus} [eventBus]
     * @param {ServerLogger} [logger]
     * @param {Object} [options]
     */
    constructor(eventBus = null, logger = null, options = {}) {
      this.#eventBus = eventBus;
      this.#logger = logger;
      this.#sessions = /* @__PURE__ */ new Map();
      this.#roles = /* @__PURE__ */ new Map();
      this.#userStore = /* @__PURE__ */ new Map();
      this.#failedAttempts = /* @__PURE__ */ new Map();
      this.#sessionTtlMs = Number(options.sessionTtlMs) || 36e5;
      this.#maxFailedAttempts = Number(options.maxFailedAttempts) || 5;
      this.#initializeDefaultRoles();
      this.#initializeDefaultUsers();
    }
    // ===================== PRIVATE METHODS =====================
    /**
     * Seeds standard RBAC hierarchy
     * @private
     */
    #initializeDefaultRoles() {
      this.#roles.set("admin", /* @__PURE__ */ new Set([
        "config:read",
        "config:write",
        "pipeline:execute",
        "cache:clear",
        "benchmark:run",
        "system:manage"
      ]));
      this.#roles.set("operator", /* @__PURE__ */ new Set([
        "config:read",
        "pipeline:execute",
        "benchmark:run"
      ]));
      this.#roles.set("viewer", /* @__PURE__ */ new Set([
        "config:read"
      ]));
    }
    /**
     * Seeds standard initial users
     * @private
     */
    #initializeDefaultUsers() {
      this.#userStore.set("admin", {
        username: "admin",
        role: "admin",
        passwordHash: this.#hashPassword("vexorion-admin-2026"),
        createdAt: Date.now()
      });
      this.#userStore.set("operator", {
        username: "operator",
        role: "operator",
        passwordHash: this.#hashPassword("operator-pass"),
        createdAt: Date.now()
      });
    }
    /**
     * Simulates secure cryptographic string hashing
     * @private
     */
    #hashPassword(plain) {
      let hash = 5381;
      for (let i = 0; i < plain.length; i++) {
        hash = hash * 33 ^ plain.charCodeAt(i);
      }
      return `vx_hash_${(hash >>> 0).toString(16)}`;
    }
    /**
     * Verifies plain text password against internal hashed value
     * @private
     */
    #verifyPassword(plain, hashed) {
      return this.#hashPassword(plain) === hashed;
    }
    /**
     * Generates secure session token
     * @private
     */
    #generateSessionToken(username, role) {
      const randomHex = Array.from(
        { length: 16 },
        () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")
      ).join("");
      return `vx_tok_${username}_${Date.now().toString(36)}_${randomHex}`;
    }
    /**
     * Evaluates if an entity is rate limited due to repeated failures
     * @private
     */
    #isRateLimited(identifier) {
      const record = this.#failedAttempts.get(identifier);
      if (!record) return false;
      if (Date.now() - record.lastAttempt > 3e5) {
        this.#failedAttempts.delete(identifier);
        return false;
      }
      return record.count >= this.#maxFailedAttempts;
    }
    /**
     * Records a failed login attempt
     * @private
     */
    #recordFailedAttempt(identifier) {
      const existing = this.#failedAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
      existing.count++;
      existing.lastAttempt = Date.now();
      this.#failedAttempts.set(identifier, existing);
    }
    /**
     * Removes failed attempt counter upon successful login
     * @private
     */
    #resetFailedAttempts(identifier) {
      this.#failedAttempts.delete(identifier);
    }
    /**
     * Purges expired sessions from internal memory
     * @private
     */
    #pruneExpiredSessions() {
      const now = Date.now();
      for (const [token, session] of this.#sessions.entries()) {
        if (now - session.createdAt > this.#sessionTtlMs) {
          this.#sessions.delete(token);
        }
      }
    }
    // ===================== PUBLIC API =====================
    /**
     * Authenticates user credentials and generates a session token
     * @param {string} username
     * @param {string} password
     * @param {Object} [meta]
     */
    login(username, password, meta = {}) {
      this.#pruneExpiredSessions();
      if (this.#isRateLimited(username)) {
        if (this.#logger) this.#logger.warn(`Rate limit exceeded for user: ${username}`, { username });
        if (this.#eventBus) this.#eventBus.emit("auth:rate_limited", { username, timestamp: Date.now() });
        throw new Error(`Account temporarily locked due to excessive failed attempts. Please retry later.`);
      }
      const user = this.#userStore.get(username);
      if (!user || !this.#verifyPassword(password, user.passwordHash)) {
        this.#recordFailedAttempt(username);
        if (this.#logger) this.#logger.warn(`Failed login attempt for user: ${username}`, { username });
        if (this.#eventBus) this.#eventBus.emit("auth:login_failed", { username, timestamp: Date.now() });
        throw new Error(`Invalid username or credentials provided.`);
      }
      this.#resetFailedAttempts(username);
      const token = this.#generateSessionToken(user.username, user.role);
      const session = {
        token,
        username: user.username,
        role: user.role,
        createdAt: Date.now(),
        lastActive: Date.now(),
        meta
      };
      this.#sessions.set(token, session);
      if (this.#logger) this.#logger.info(`User logged in successfully: ${username}`, { username, role: user.role });
      if (this.#eventBus) this.#eventBus.emit("auth:login_success", { username, role: user.role, token });
      return {
        token,
        user: {
          username: user.username,
          role: user.role
        },
        expiresIn: this.#sessionTtlMs
      };
    }
    /**
     * Validates an active session token
     * @param {string} token
     * @returns {Object|null}
     */
    validateToken(token) {
      if (!token || typeof token !== "string") return null;
      this.#pruneExpiredSessions();
      const session = this.#sessions.get(token);
      if (!session) return null;
      session.lastActive = Date.now();
      return {
        username: session.username,
        role: session.role,
        createdAt: session.createdAt,
        lastActive: session.lastActive
      };
    }
    /**
     * Revokes an existing session token
     * @param {string} token
     */
    revokeToken(token) {
      const exists = this.#sessions.delete(token);
      if (exists) {
        if (this.#logger) this.#logger.info(`Token revoked`, { token: token.substring(0, 16) });
        if (this.#eventBus) this.#eventBus.emit("auth:token_revoked", { token });
      }
      return exists;
    }
    /**
     * Checks whether the token holder has the required permission
     * @param {string} token
     * @param {string} permission
     */
    hasPermission(token, permission) {
      const session = this.validateToken(token);
      if (!session) return false;
      const permissions = this.#roles.get(session.role);
      if (!permissions) return false;
      return permissions.has(permission);
    }
    /**
     * Registers a new user account with specified role
     * @param {string} username
     * @param {string} password
     * @param {'admin'|'operator'|'viewer'} role
     */
    registerUser(username, password, role = "viewer") {
      if (!username || !password) {
        throw new Error("Username and password are required.");
      }
      if (this.#userStore.has(username)) {
        throw new Error(`User "${username}" already exists.`);
      }
      if (!this.#roles.has(role)) {
        throw new Error(`Role "${role}" does not exist.`);
      }
      const newUser = {
        username,
        role,
        passwordHash: this.#hashPassword(password),
        createdAt: Date.now()
      };
      this.#userStore.set(username, newUser);
      if (this.#logger) this.#logger.info(`New user registered: ${username}`, { username, role });
      if (this.#eventBus) this.#eventBus.emit("auth:user_registered", { username, role });
      return { username, role, createdAt: newUser.createdAt };
    }
    /**
     * Returns current authentication diagnostic statistics
     */
    getAuthStats() {
      this.#pruneExpiredSessions();
      return {
        activeSessions: this.#sessions.size,
        registeredUsers: this.#userStore.size,
        availableRoles: Array.from(this.#roles.keys()),
        failedAttemptTrackers: this.#failedAttempts.size
      };
    }
  };

  // server/internal/controller.js
  var ServerCentralController = class {
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
      this.#serviceRegistry = /* @__PURE__ */ new Map();
      this.#isBooted = false;
      this.#eventBus = new ServerEventBus(options.eventBusOptions || {});
      this.#logger = new ServerLogger(this.#eventBus, options.loggerOptions || { minLevel: "debug" });
      this.#auth = new ServerAuthManager(this.#eventBus, this.#logger, options.authOptions || {});
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
      this.#eventBus.subscribeAll((payload, eventName) => {
        this.#recordAudit({
          id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          event: eventName,
          timestamp: Date.now(),
          payload: this.#sanitizeAuditPayload(payload)
        });
      });
      this.#eventBus.subscribe("auth:login_success", (data) => {
        this.#logger.info(`[Audit] Authentication success for: ${data.username}`, { username: data.username, role: data.role });
      }, 100);
      this.#eventBus.subscribe("auth:login_failed", (data) => {
        this.#logger.warn(`[Audit] Security alert: Authentication failure for: ${data.username}`, { username: data.username });
      }, 100);
    }
    /**
     * Registers default internal core service handlers
     * @private
     */
    #registerDefaultServices() {
      this.#serviceRegistry.set("config", {
        requiredPermission: "config:read",
        execute: (action, payload) => {
          if (action === "get") {
            return { status: "ok", service: "config", timestamp: Date.now() };
          }
          throw new Error(`Unsupported config action: ${action}`);
        }
      });
      this.#serviceRegistry.set("diagnostics", {
        requiredPermission: "system:manage",
        execute: (action) => {
          if (action === "health") {
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
      if (!payload || typeof payload !== "object") return payload;
      const sanitized = { ...payload };
      if (sanitized.password) sanitized.password = "***REDACTED***";
      if (sanitized.token && typeof sanitized.token === "string") {
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
      if (!action || typeof action !== "string") {
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
      if (typeof serviceDescriptor.execute !== "function") {
        throw new TypeError(`Service "${serviceName}" must implement an executable function.`);
      }
      this.#serviceRegistry.set(serviceName, serviceDescriptor);
      this.#logger.info(`Service registered: ${serviceName}`, { serviceName });
      this.#eventBus.emit("system:service_registered", { serviceName });
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
      if (service.requiredPermission) {
        const isAllowed = this.#auth.hasPermission(token, service.requiredPermission);
        if (!isAllowed) {
          this.#logger.warn(`Unauthorized action attempt on "${serviceName}:${action}"`, { serviceName, action });
          this.#eventBus.emit("auth:unauthorized_action", { serviceName, action });
          throw new Error(`Access Denied: missing permission "${service.requiredPermission}".`);
        }
      }
      const session = this.#auth.validateToken(token);
      this.#logger.debug(`Executing action "${serviceName}:${action}" for user "${session?.username || "anonymous"}"`);
      const result = service.execute(action, payload, session);
      this.#eventBus.emit("system:action_executed", {
        serviceName,
        action,
        username: session?.username || "anonymous",
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
        status: this.#isBooted ? "healthy" : "booting",
        uptimeSeconds: Math.floor((Date.now() - this.#bootTime) / 1e3),
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
  };
  var serverController = new ServerCentralController();

  // src/cdn-entry.js
  var Vexorion = {
    version: "1.0.1",
    ServerCentralController,
    serverController,
    ServerEventBus,
    ServerLogger,
    ServerAuthManager,
    createController: (options) => new ServerCentralController(options),
    createEventBus: (options) => new ServerEventBus(options),
    createLogger: (bus, options) => new ServerLogger(bus, options),
    createAuthManager: (bus, logger, options) => new ServerAuthManager(bus, logger, options)
  };
  if (typeof globalThis !== "undefined") {
    globalThis.Vexorion = Vexorion;
  }
  var cdn_entry_default = Vexorion;
})();

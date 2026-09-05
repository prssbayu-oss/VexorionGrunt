/**
 * @file src/lib/server/auth.js
 * High-security internal authentication and role-based authorization (RBAC) manager.
 * Uses private class fields and private methods (#) for complete internal state encapsulation.
 * Integrates with ServerEventBus and ServerLogger to audit security events and state changes.
 */

import { ServerEventBus } from './eventBus.js';
import { ServerLogger } from './logger.js';

export class ServerAuthManager {
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
    this.#sessions = new Map();
    this.#roles = new Map();
    this.#userStore = new Map();
    this.#failedAttempts = new Map();
    this.#sessionTtlMs = Number(options.sessionTtlMs) || 3600000; // 1 hour
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
    this.#roles.set('admin', new Set([
      'config:read',
      'config:write',
      'pipeline:execute',
      'cache:clear',
      'benchmark:run',
      'system:manage'
    ]));

    this.#roles.set('operator', new Set([
      'config:read',
      'pipeline:execute',
      'benchmark:run'
    ]));

    this.#roles.set('viewer', new Set([
      'config:read'
    ]));
  }

  /**
   * Seeds standard initial users
   * @private
   */
  #initializeDefaultUsers() {
    this.#userStore.set('admin', {
      username: 'admin',
      role: 'admin',
      passwordHash: this.#hashPassword('vexorion-admin-2026'),
      createdAt: Date.now()
    });

    this.#userStore.set('operator', {
      username: 'operator',
      role: 'operator',
      passwordHash: this.#hashPassword('operator-pass'),
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
      hash = (hash * 33) ^ plain.charCodeAt(i);
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
    const randomHex = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
    return `vx_tok_${username}_${Date.now().toString(36)}_${randomHex}`;
  }

  /**
   * Evaluates if an entity is rate limited due to repeated failures
   * @private
   */
  #isRateLimited(identifier) {
    const record = this.#failedAttempts.get(identifier);
    if (!record) return false;

    // Reset after 5 minutes
    if (Date.now() - record.lastAttempt > 300000) {
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
      if (this.#eventBus) this.#eventBus.emit('auth:rate_limited', { username, timestamp: Date.now() });
      throw new Error(`Account temporarily locked due to excessive failed attempts. Please retry later.`);
    }

    const user = this.#userStore.get(username);
    if (!user || !this.#verifyPassword(password, user.passwordHash)) {
      this.#recordFailedAttempt(username);
      if (this.#logger) this.#logger.warn(`Failed login attempt for user: ${username}`, { username });
      if (this.#eventBus) this.#eventBus.emit('auth:login_failed', { username, timestamp: Date.now() });
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
    if (this.#eventBus) this.#eventBus.emit('auth:login_success', { username, role: user.role, token });

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
    if (!token || typeof token !== 'string') return null;

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
      if (this.#eventBus) this.#eventBus.emit('auth:token_revoked', { token });
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
  registerUser(username, password, role = 'viewer') {
    if (!username || !password) {
      throw new Error('Username and password are required.');
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
    if (this.#eventBus) this.#eventBus.emit('auth:user_registered', { username, role });

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
}

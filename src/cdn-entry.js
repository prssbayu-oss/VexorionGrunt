/**
 * @file src/cdn-entry.js
 * Universal entry point for jsDelivr and browser CDN distribution.
 * Exposes Vexorion subsystem classes and singleton instance.
 */

import { ServerCentralController, serverController } from './lib/server/controller.js';
import { ServerEventBus } from './lib/server/eventBus.js';
import { ServerLogger } from './lib/server/logger.js';
import { ServerAuthManager } from './lib/server/auth.js';

export {
  ServerCentralController,
  serverController,
  ServerEventBus,
  ServerLogger,
  ServerAuthManager,
};

const Vexorion = {
  version: '1.0.1',
  ServerCentralController,
  serverController,
  ServerEventBus,
  ServerLogger,
  ServerAuthManager,
  createController: (options) => new ServerCentralController(options),
  createEventBus: (options) => new ServerEventBus(options),
  createLogger: (bus, options) => new ServerLogger(bus, options),
  createAuthManager: (bus, logger, options) => new ServerAuthManager(bus, logger, options),
};

// Expose on globalThis (window in browser, global in Node.js)
if (typeof globalThis !== 'undefined') {
  globalThis.Vexorion = Vexorion;
}

export default Vexorion;

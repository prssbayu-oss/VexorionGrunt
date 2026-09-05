# VexorionGrunt - Realtime Architecture & Core Server Subsystem

[![jsDelivr](https://data.jsdelivr.com/v1/package/gh/prssbayu-oss/VexorionGrunt/badge)](https://www.jsdelivr.com/package/gh/prssbayu-oss/VexorionGrunt)
[![GitHub Release](https://img.shields.io/github/v/release/prssbayu-oss/VexorionGrunt?color=blue)](https://github.com/prssbayu-oss/VexorionGrunt/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

VexorionGrunt is a high-performance orchestration and telemetry platform featuring robust event-driven internals, role-based access control, structured logging, and interactive testing tools.

---

## 🌐 jsDelivr CDN Usage

VexorionGrunt is available directly through the global **jsDelivr CDN** without needing npm or local installation:

### 1. Browser Classic Script (IIFE / UMD)
```html
<!-- Minified Production Build (Recommended) -->
<script src="https://cdn.jsdelivr.net/gh/prssbayu-oss/VexorionGrunt@v1.0.1/cdn/vexorion.min.js"></script>

<script>
  // Available globally on window.Vexorion
  const { ServerEventBus, ServerLogger, ServerAuthManager, ServerCentralController } = window.Vexorion;

  const bus = new ServerEventBus();
  const logger = new ServerLogger(bus);
  const auth = new ServerAuthManager(bus, logger);

  logger.info("Vexorion loaded from jsDelivr!");
</script>
```

### 2. Modern ES Module (ESM)
```javascript
import Vexorion, { ServerEventBus, serverController } from 'https://cdn.jsdelivr.net/gh/prssbayu-oss/VexorionGrunt@v1.0.1/cdn/vexorion.esm.min.js';

console.log('Vexorion Version:', Vexorion.version);
const health = serverController.getSystemHealth();
console.log('System Status:', health.status);
```

### 3. Latest Version CDN Links
- **Auto-resolved by package.json**: `https://cdn.jsdelivr.net/gh/prssbayu-oss/VexorionGrunt@main/cdn/vexorion.min.js`
- **ESM Bundle**: `https://cdn.jsdelivr.net/gh/prssbayu-oss/VexorionGrunt@main/cdn/vexorion.esm.min.js`
- **Unminified (Debugging)**: `https://cdn.jsdelivr.net/gh/prssbayu-oss/VexorionGrunt@main/cdn/vexorion.js`

---

## 🏗️ Architecture: `src/lib/server/`

The server core is built with strict encapsulation using native JavaScript private class fields (`#private`) and private methods:

```
src/lib/server/
├── index.js          # Unified facade export
├── controller.js     # ServerCentralController (Primary Service Orchestrator)
├── eventBus.js       # ServerEventBus (Priority queue pub/sub & wildcard listeners)
├── logger.js         # ServerLogger (Structured telemetry with severity levels)
└── auth.js           # ServerAuthManager (RBAC, session tokens, brute-force rate limiter)
```

### Key Modules

- **`eventBus.js` (`ServerEventBus`)**:
  - Private fields: `#listeners`, `#wildcardListeners`, `#history`, `#maxHistory`, `#isDispatching`, `#eventCounter`
  - Priority-based dispatching and wildcard subscriber support (`*`).
  - Circular in-memory audit history buffer.

- **`logger.js` (`ServerLogger`)**:
  - Private fields: `#eventBus`, `#minLevel`, `#levelWeights`, `#logs`, `#maxLogs`, `#metrics`, `#context`
  - Automated log dispatching into the event bus for real-time streaming.
  - Severity gating: `trace`, `debug`, `info`, `warn`, `error`, `fatal`.

- **`auth.js` (`ServerAuthManager`)**:
  - Private fields: `#eventBus`, `#logger`, `#sessions`, `#roles`, `#userStore`, `#failedAttempts`, `#sessionTtlMs`, `#maxFailedAttempts`
  - Role-Based Access Control (RBAC) with default hierarchy (`admin`, `operator`, `viewer`).
  - SHA-256 session token generation (`vx_tok_*`) with automatic TTL pruning and brute-force throttling.

- **`controller.js` (`ServerCentralController`)**:
  - Primary orchestrator connecting EventBus, Logger, and Auth.
  - Exposes `executeProtectedAction()`, `getSystemHealth()`, and sanitized `getAuditTrail()`.

---

## 🚀 Quick Start

### Installation
```bash
npm install
# or
bun install
```

### Running Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

---

## 📡 API Endpoints

- `GET /api/internal/health` — Subsystem health diagnostics (EventBus, Logger, Auth, Services).
- `GET /api/internal/audit` — Sanitized audit trail.
- `POST /api/internal/auth/login` — Session token authentication.
- `POST /api/internal/service/execute` — RBAC-protected service dispatcher.
- `GET /api/vexorion/stream` — Real-time Server-Sent Events (SSE) telemetry pipeline.

# VexorionGrunt - Realtime Architecture & Core Server Subsystem

VexorionGrunt is a high-performance orchestration and telemetry platform featuring robust event-driven internals, role-based access control, structured logging, and interactive testing tools.

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

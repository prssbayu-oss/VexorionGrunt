/**
 * @file src/services/apiClient.ts
 * Clean frontend API client for Vexorion backend REST endpoints.
 * Completely decouples frontend presentation from backend implementation.
 */

export interface VexorionStatusResponse {
  status: string;
  uptime: number;
  config: {
    allowedTypes: string[];
    exceptions: string[];
    taskWhitelist: string[];
    taskBlacklist: string[];
    verbose: boolean;
    suppressAll: boolean;
  };
  metrics: {
    total: number;
    suppressed: number;
    passed: number;
    byType: Record<string, number>;
  };
  hooker: {
    active: boolean;
    activeHooksCount: number;
  };
  cache: {
    size: number;
    hits: number;
    misses: number;
    hitRate: string;
  };
}

export interface BenchmarkResponse {
  iterations: number;
  totalDurationMs: number;
  opsPerSec: number;
  avgLatencyMs: number;
  suppressedCount: number;
  passedCount: number;
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: string;
  };
}

export interface TestSuiteResponse {
  total: number;
  passed: number;
  failed: number;
  passRate: string;
  specs: Array<{
    id: string;
    suite: string;
    name: string;
    passed: boolean;
    durationMs?: number;
    details?: { message?: string };
  }>;
}

export const apiClient = {
  async getStatus(): Promise<VexorionStatusResponse> {
    const res = await fetch('/api/vexorion/status');
    if (!res.ok) throw new Error(`Status check failed: ${res.statusText}`);
    return res.json();
  },

  async getConfig() {
    const res = await fetch('/api/vexorion/config');
    if (!res.ok) throw new Error(`Failed to fetch config: ${res.statusText}`);
    return res.json();
  },

  async updateConfig(config: Record<string, unknown>) {
    const res = await fetch('/api/vexorion/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error(`Failed to update config: ${res.statusText}`);
    return res.json();
  },

  async toggleHook(enabled?: boolean) {
    const res = await fetch('/api/vexorion/hook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    if (!res.ok) throw new Error(`Failed to toggle hook: ${res.statusText}`);
    return res.json();
  },

  async runBenchmark(iterations: number): Promise<BenchmarkResponse> {
    const res = await fetch('/api/vexorion/benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ iterations })
    });
    if (!res.ok) throw new Error(`Benchmark failed: ${res.statusText}`);
    return res.json();
  },

  async runTests(): Promise<TestSuiteResponse> {
    const res = await fetch('/api/vexorion/tests');
    if (!res.ok) throw new Error(`Test suite execution failed: ${res.statusText}`);
    return res.json();
  },

  async getRepoAudit() {
    const res = await fetch('/api/repo/audit');
    if (!res.ok) throw new Error(`Repo audit failed: ${res.statusText}`);
    return res.json();
  },

  async getGitStatus() {
    const res = await fetch('/api/repo/git-status');
    if (!res.ok) throw new Error(`Git status query failed: ${res.statusText}`);
    return res.json();
  },

  async getDaemonStatus() {
    const res = await fetch('/api/vexorion/daemon/status');
    if (!res.ok) throw new Error(`Daemon status failed: ${res.statusText}`);
    return res.json();
  },

  async startDaemon(intervalMs?: number) {
    const res = await fetch('/api/vexorion/daemon/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intervalMs })
    });
    if (!res.ok) throw new Error(`Daemon start failed: ${res.statusText}`);
    return res.json();
  },

  async stopDaemon() {
    const res = await fetch('/api/vexorion/daemon/stop', {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`Daemon stop failed: ${res.statusText}`);
    return res.json();
  }
};

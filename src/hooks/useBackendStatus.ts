import { useState, useEffect, useCallback } from 'react';

export interface BackendSystemStatus {
  status: string;
  engine: string;
  uptimeSeconds: number;
  isHooked: boolean;
  config: {
    allowedTypes: string[];
    exceptions: string[];
    taskWhitelist: string[];
    taskBlacklist: string[];
    verbose: boolean;
    suppressAll: boolean;
    cacheCapacity: number;
  };
  cache: {
    size: number;
    capacity: number;
    hits: number;
    misses: number;
    evictions: number;
    hitRate: string;
    estimatedBytes: number;
  };
  hooker: {
    activeHookCount: number;
    activeHooks: string[];
    stats: {
      interceptedCalls: number;
      preHookErrors: number;
      postHookErrors: number;
    };
  };
  telemetry: {
    total: number;
    suppressed: number;
    allowed: number;
    suppressionRate: string;
    isHooked: boolean;
  };
  pipelineStats: {
    totalRuns: number;
    totalLogsProcessed: number;
    totalSuppressed: number;
    pipelinesRegistered: number;
  };
}

export function useBackendStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<BackendSystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/vexorion/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setIsOnline(true);
      setError(null);
    } catch (err: any) {
      setIsOnline(false);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return { isOnline, loading, data, error, refresh: checkStatus };
}

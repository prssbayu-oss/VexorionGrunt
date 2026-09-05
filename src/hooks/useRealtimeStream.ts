import { useState, useEffect, useRef, useCallback } from 'react';
import { ProcessedLogItem } from '../types';

export interface DaemonStatus {
  isRunning: boolean;
  intervalMs: number;
  subscribersCount: number;
  totalEmitted: number;
  currentTask: string;
}

export function useRealtimeStream(autoConnect: boolean = true) {
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [speedMs, setSpeedMs] = useState<number>(600);
  const [daemonStatus, setDaemonStatus] = useState<DaemonStatus | null>(null);
  const [liveLogs, setLiveLogs] = useState<ProcessedLogItem[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<any>(null);
  const [connectionState, setConnectionState] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');

  const eventSourceRef = useRef<EventSource | null>(null);

  // Connect to SSE stream
  useEffect(() => {
    if (!isStreaming) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setConnectionState('disconnected');
      return;
    }

    const connectSSE = () => {
      try {
        const es = new EventSource('/api/vexorion/stream');
        eventSourceRef.current = es;

        es.addEventListener('connected', (e: MessageEvent) => {
          setConnectionState('connected');
          try {
            const data = JSON.parse(e.data);
            if (data.daemon) setDaemonStatus(data.daemon);
            if (data.metrics) setLatestMetrics(data.metrics);
          } catch {}
        });

        es.addEventListener('log', (e: MessageEvent) => {
          setConnectionState('connected');
          try {
            const payload = JSON.parse(e.data);
            if (payload.data) {
              setLiveLogs((prev) => {
                const next = [...prev, payload.data];
                // Keep the most recent 120 logs
                return next.length > 120 ? next.slice(-120) : next;
              });
            }
            if (payload.metrics) {
              setLatestMetrics(payload.metrics);
            }
          } catch {}
        });

        es.onerror = () => {
          setConnectionState('reconnecting');
        };
      } catch {
        setConnectionState('disconnected');
      }
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isStreaming]);

  // Fetch initial daemon status and trigger daemon start if needed
  useEffect(() => {
    const checkDaemon = async () => {
      try {
        const res = await fetch('/api/vexorion/daemon/status');
        if (res.ok) {
          const status = await res.json();
          setDaemonStatus(status);
          if (!status.isRunning) {
            await fetch('/api/vexorion/daemon/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ intervalMs: speedMs })
            });
          }
        }
      } catch {}
    };

    checkDaemon();
  }, [speedMs]);

  const toggleStream = useCallback(async () => {
    const nextState = !isStreaming;
    setIsStreaming(nextState);

    try {
      await fetch(nextState ? '/api/vexorion/daemon/start' : '/api/vexorion/daemon/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalMs: speedMs })
      });
    } catch {}
  }, [isStreaming, speedMs]);

  const changeSpeed = useCallback(async (ms: number) => {
    setSpeedMs(ms);
    try {
      await fetch('/api/vexorion/daemon/interval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ms })
      });
    } catch {}
  }, []);

  const clearLogs = useCallback(() => {
    setLiveLogs([]);
  }, []);

  return {
    isStreaming,
    connectionState,
    speedMs,
    daemonStatus,
    liveLogs,
    latestMetrics,
    toggleStream,
    changeSpeed,
    clearLogs
  };
}

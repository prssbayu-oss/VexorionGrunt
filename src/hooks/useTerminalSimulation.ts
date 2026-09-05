/**
 * @file src/hooks/useTerminalSimulation.ts
 * Custom hook encapsulating all terminal simulation state, log processing, and timers.
 * Leaves TerminalSimulator and child components as 100% pure UI/UX.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SAMPLE_TASKS } from '../data/sample-tasks';
import { ProcessedLogItem } from '../types';
import { ClientSimulationEngine } from '../services/simulationEngine';
import { useRealtimeStream } from './useRealtimeStream';

interface UseTerminalSimulationOptions {
  engine: ClientSimulationEngine;
  isHooked: boolean;
  onRefreshMetrics?: () => void;
}

export function useTerminalSimulation({
  engine,
  isHooked,
  onRefreshMetrics
}: UseTerminalSimulationOptions) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(SAMPLE_TASKS[0].id);
  const [processedLogs, setProcessedLogs] = useState<ProcessedLogItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(300);
  const [viewMode, setViewMode] = useState<'split' | 'clean' | 'raw'>('split');
  const [showInjector, setShowInjector] = useState<boolean>(false);
  const [isAutoStream, setIsAutoStream] = useState<boolean>(false);

  // Real-time SSE Live Daemon Hook
  const {
    isStreaming,
    connectionState,
    speedMs,
    daemonStatus,
    liveLogs,
    latestMetrics,
    toggleStream,
    changeSpeed,
    clearLogs
  } = useRealtimeStream(isAutoStream);

  const activePreset = useMemo(
    () => SAMPLE_TASKS.find((p) => p.id === selectedPresetId) || SAMPLE_TASKS[0],
    [selectedPresetId]
  );

  // Evaluate preset logs according to engine rules
  const evaluateLogs = useCallback(() => {
    const rawConfig = engine.getRawConfig();
    const evaluated: ProcessedLogItem[] = activePreset.logs.map((log, index) => {
      let suppressed = false;
      let reason: ProcessedLogItem['reason'] = 'allowed_type';

      if (isHooked) {
        const check = rawConfig.checkAllowanceDetailed(log.type, log.task);
        suppressed = !check.allowed;
        reason = check.reason as ProcessedLogItem['reason'];
      }

      return {
        ...log,
        id: `log-${index}-${log.task}-${log.type}`,
        timestamp: Date.now() + index * 100,
        originalIndex: index,
        suppressed,
        reason
      };
    });

    setProcessedLogs(evaluated);
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [activePreset, engine, isHooked]);

  useEffect(() => {
    evaluateLogs();
  }, [evaluateLogs]);

  // Step-by-step playback timer
  useEffect(() => {
    if (!isPlaying) return;

    if (currentIndex >= processedLogs.length) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      const currentLog = processedLogs[currentIndex];
      if (currentLog && isHooked) {
        engine.getRawLogger().preHook(currentLog.type, currentLog.task);
        onRefreshMetrics?.();
      }
      setCurrentIndex((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, processedLogs, speed, isHooked, engine, onRefreshMetrics]);

  const handlePlay = useCallback(() => {
    if (currentIndex >= processedLogs.length) {
      setCurrentIndex(0);
    }
    setIsPlaying(true);
  }, [currentIndex, processedLogs.length]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleStepForward = useCallback(() => {
    if (currentIndex < processedLogs.length) {
      const currentLog = processedLogs[currentIndex];
      if (currentLog && isHooked) {
        engine.getRawLogger().preHook(currentLog.type, currentLog.task);
        onRefreshMetrics?.();
      }
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, processedLogs, isHooked, engine, onRefreshMetrics]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
  }, []);

  const handleInjectCustomLog = useCallback((type: string, task: string, message: string) => {
    let suppressed = false;
    let reason: ProcessedLogItem['reason'] = 'allowed_type';

    if (isHooked) {
      const check = engine.getRawConfig().checkAllowanceDetailed(type, task);
      suppressed = !check.allowed;
      reason = check.reason as ProcessedLogItem['reason'];
      engine.getRawLogger().preHook(type, task);
    }

    const newLog: ProcessedLogItem = {
      id: `custom-${Date.now()}`,
      task,
      type,
      message,
      timestamp: Date.now(),
      suppressed,
      reason,
      originalIndex: processedLogs.length
    };

    setProcessedLogs((prev) => [...prev, newLog]);
    setCurrentIndex((prev) => prev + 1);
    onRefreshMetrics?.();
  }, [engine, isHooked, processedLogs.length, onRefreshMetrics]);

  // Derived logs based on mode
  const visibleLogs = useMemo(() => {
    if (isAutoStream) {
      return liveLogs;
    }
    return processedLogs.slice(0, currentIndex);
  }, [isAutoStream, liveLogs, processedLogs, currentIndex]);

  const cleanLogs = useMemo(
    () => (isHooked ? visibleLogs.filter((l) => !l.suppressed) : visibleLogs),
    [isHooked, visibleLogs]
  );

  const suppressedCount = useMemo(
    () => (isHooked ? visibleLogs.filter((l) => l.suppressed).length : 0),
    [isHooked, visibleLogs]
  );

  const cleanCount = visibleLogs.length - suppressedCount;
  const isComplete = !isAutoStream && currentIndex >= processedLogs.length && processedLogs.length > 0;
  const cacheStats = engine.getRawConfig().getCacheStats();

  const latestSuppressedLog = useMemo(() => {
    if (!isHooked) return null;
    return [...visibleLogs].reverse().find((l) => l.suppressed) || null;
  }, [isHooked, visibleLogs]);

  return {
    selectedPresetId,
    setSelectedPresetId,
    activePreset,
    processedLogs,
    visibleLogs,
    cleanLogs,
    currentIndex,
    isPlaying,
    speed,
    setSpeed,
    viewMode,
    setViewMode,
    showInjector,
    setShowInjector,
    isAutoStream,
    setIsAutoStream,
    suppressedCount,
    cleanCount,
    isComplete,
    cacheStats,
    latestSuppressedLog,
    // Actions
    handlePlay,
    handlePause,
    handleStepForward,
    handleReset,
    handleInjectCustomLog,
    // Real-time daemon states
    isStreaming,
    connectionState,
    speedMs,
    daemonStatus,
    latestMetrics,
    toggleStream,
    changeSpeed,
    clearLogs
  };
}

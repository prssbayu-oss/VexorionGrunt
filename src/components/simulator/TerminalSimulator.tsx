import React, { useState, useEffect } from 'react';
import { GruntTaskPreset, ProcessedLogItem } from '../../types';
import { SAMPLE_TASKS } from '../../data/sample-tasks';
import { SimulatedVexorion } from '../../lib/vexorion-core';
import { PipelineSelector } from './PipelineSelector';
import { TelemetryBar } from './TelemetryBar';
import { PlaybackControls } from './PlaybackControls';
import { CustomLogInjector } from './CustomLogInjector';
import { TerminalWindow } from './TerminalWindow';
import { RealtimeStreamBar } from './RealtimeStreamBar';
import { RealtimeSuppressionRadar } from './RealtimeSuppressionRadar';
import { useRealtimeStream } from '../../hooks/useRealtimeStream';

interface TerminalSimulatorProps {
  vexorion: SimulatedVexorion;
  isHooked: boolean;
  onToggleHook: () => void;
  onRefreshMetrics: () => void;
}

export const TerminalSimulator: React.FC<TerminalSimulatorProps> = ({
  vexorion,
  isHooked,
  onToggleHook,
  onRefreshMetrics
}) => {
  const [isAutoStream, setIsAutoStream] = useState<boolean>(true);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(SAMPLE_TASKS[0].id);
  const [processedLogs, setProcessedLogs] = useState<ProcessedLogItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(150);
  const [viewMode, setViewMode] = useState<'split' | 'clean' | 'raw'>('split');
  const [showInjector, setShowInjector] = useState<boolean>(false);

  // Real-Time Server-Sent Events (SSE) live stream hook (Always running)
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

  const activePreset: GruntTaskPreset =
    SAMPLE_TASKS.find((p) => p.id === selectedPresetId) || SAMPLE_TASKS[0];

  const evaluateLogs = () => {
    const evaluated: ProcessedLogItem[] = activePreset.logs.map((log, index) => {
      let suppressed = false;
      let reason: ProcessedLogItem['reason'] = 'allowed_type';

      if (isHooked) {
        const check = vexorion.getRawConfig().checkAllowanceDetailed(log.type, log.task);
        suppressed = !check.allowed;
        reason = check.reason;
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
  };

  useEffect(() => {
    evaluateLogs();
  }, [selectedPresetId, isHooked]);

  useEffect(() => {
    if (!isPlaying) return;

    if (currentIndex >= processedLogs.length) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      const currentLog = processedLogs[currentIndex];
      if (currentLog && isHooked) {
        vexorion.getRawLogger().preHook(currentLog.type, currentLog.task);
        onRefreshMetrics();
      }
      setCurrentIndex((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, processedLogs, speed, isHooked]);

  const handleInjectCustomLog = (type: string, task: string, message: string) => {
    let suppressed = false;
    let reason: ProcessedLogItem['reason'] = 'allowed_type';

    if (isHooked) {
      const check = vexorion.getRawConfig().checkAllowanceDetailed(type, task);
      suppressed = !check.allowed;
      reason = check.reason;
      vexorion.getRawLogger().preHook(type, task);
      onRefreshMetrics();
    }

    const newLog: ProcessedLogItem = {
      id: `custom-${Date.now()}`,
      type,
      message,
      task,
      timestamp: Date.now(),
      originalIndex: processedLogs.length,
      suppressed,
      reason
    };

    setProcessedLogs((prev) => [...prev, newLog]);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleStepNext = () => {
    if (currentIndex < processedLogs.length) {
      const log = processedLogs[currentIndex];
      if (log && isHooked) {
        vexorion.getRawLogger().preHook(log.type, log.task);
        onRefreshMetrics();
      }
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleCompleteAll = () => {
    for (let i = currentIndex; i < processedLogs.length; i++) {
      const log = processedLogs[i];
      if (log && isHooked) {
        vexorion.getRawLogger().preHook(log.type, log.task);
      }
    }
    setCurrentIndex(processedLogs.length);
    setIsPlaying(false);
    onRefreshMetrics();
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
    vexorion.resetMetrics();
    vexorion.getRawConfig().clearCache();
    onRefreshMetrics();
  };

  // Convert live logs from realtime daemon into ProcessedLogItem format
  const formattedLiveLogs: ProcessedLogItem[] = liveLogs.map((l, index) => ({
    id: l.id || `live-${index}-${Date.now()}`,
    type: l.type,
    task: l.task,
    message: l.message,
    timestamp: l.timestamp || Date.now(),
    originalIndex: index,
    suppressed: Boolean(l.suppressed),
    reason: (l.reason as ProcessedLogItem['reason']) || (l.suppressed ? 'type_not_allowed' : 'allowed_type')
  }));

  const visibleLogs = isAutoStream ? formattedLiveLogs : processedLogs.slice(0, currentIndex);
  const cleanLogs = visibleLogs.filter((l) => !l.suppressed);
  const suppressedCount = isAutoStream && latestMetrics ? latestMetrics.suppressed : visibleLogs.filter((l) => l.suppressed).length;
  const totalCount = isAutoStream && latestMetrics ? latestMetrics.total : visibleLogs.length;
  const cleanCount = isAutoStream && latestMetrics ? latestMetrics.allowed : cleanLogs.length;
  const cacheStats = vexorion.getRawConfig().getCacheStats();
  const isComplete = !isAutoStream && currentIndex >= processedLogs.length && processedLogs.length > 0;

  // Real-time identification of the latest intercepted and suppressed log
  const latestSuppressedLog = isHooked
    ? [...visibleLogs].reverse().find((l) => l.suppressed) || null
    : null;

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      {/* 1. Real-Time Daemon Mode Switcher & Stream Bar */}
      <RealtimeStreamBar
        isAutoStream={isAutoStream}
        setIsAutoStream={setIsAutoStream}
        isStreaming={isStreaming}
        toggleStream={toggleStream}
        speedMs={speedMs}
        changeSpeed={changeSpeed}
        daemonStatus={daemonStatus}
        connectionState={connectionState}
        onClearLogs={clearLogs}
        logCount={liveLogs.length}
      />

      {/* 2. Pipeline Selector Component (Available in manual preset mode) */}
      {!isAutoStream && (
        <PipelineSelector
          selectedPresetId={selectedPresetId}
          onSelectPreset={setSelectedPresetId}
          activePreset={activePreset}
        />
      )}

      {/* 3. Telemetry Cards Component */}
      <TelemetryBar
        isHooked={isHooked}
        onToggleHook={onToggleHook}
        suppressedCount={suppressedCount}
        visibleCount={totalCount}
        cleanCount={cleanCount}
        cacheStats={cacheStats}
      />

      {/* 4. Real-Time Visual Suppression Stream Radar & Activity Waveform */}
      <RealtimeSuppressionRadar
        latestSuppressedLog={latestSuppressedLog}
        totalSuppressed={suppressedCount}
        totalAllowed={cleanCount}
        isHooked={isHooked}
        isAutoStream={isAutoStream}
      />

      {/* 5. Playback Controls Component (Manual mode only) */}
      {!isAutoStream && (
        <PlaybackControls
          isPlaying={isPlaying}
          onTogglePlay={() => {
            if (currentIndex >= processedLogs.length) {
              setCurrentIndex(0);
            }
            setIsPlaying(!isPlaying);
          }}
          onStepNext={handleStepNext}
          onCompleteAll={handleCompleteAll}
          onReset={handleReset}
          isComplete={isComplete}
          canStep={currentIndex < processedLogs.length}
          speed={speed}
          setSpeed={setSpeed}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showInjector={showInjector}
          setShowInjector={setShowInjector}
        />
      )}

      {/* 6. Custom Log Injector Component */}
      {!isAutoStream && showInjector && (
        <CustomLogInjector onInject={handleInjectCustomLog} />
      )}

      {/* 7. Terminal Display Windows Component */}
      <div
        className={`w-full max-w-full grid gap-4 ${
          viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {(viewMode === 'split' || viewMode === 'raw') && (
          <TerminalWindow
            title={isAutoStream ? 'Live Grunt Stream (Unfiltered Raw Stream)' : 'Standard Grunt Output (Unfiltered)'}
            variant="raw"
            logs={visibleLogs}
            allEmittedLogs={visibleLogs}
            command={isAutoStream ? `grunt ${daemonStatus?.currentTask || 'live'} --watch` : activePreset.command}
            isHooked={isHooked}
            isComplete={isComplete}
            totalPresetLength={isAutoStream ? visibleLogs.length : processedLogs.length}
            latestSuppressedLog={latestSuppressedLog}
          />
        )}

        {(viewMode === 'split' || viewMode === 'clean') && (
          <TerminalWindow
            title={isAutoStream ? 'Vexorion Clean Output (Real-Time Muting Active)' : 'Vexorion Clean Output (Muting Active)'}
            variant="clean"
            logs={cleanLogs}
            allEmittedLogs={visibleLogs}
            command={isAutoStream ? `grunt ${daemonStatus?.currentTask || 'live'} --vexorion` : activePreset.command}
            isHooked={isHooked}
            isComplete={isComplete}
            totalPresetLength={isAutoStream ? visibleLogs.length : processedLogs.length}
            latestSuppressedLog={latestSuppressedLog}
          />
        )}
      </div>

      {/* 7. Educational Note */}
      <div className="w-full max-w-full bg-stone-900/70 border border-stone-800 rounded-xl p-4">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
          Vexorion Muting Interception Mechanics
        </h3>
        <p className="text-xs text-stone-400 leading-relaxed break-words">
          Vexorion wraps Grunt&apos;s <code className="text-emerald-400 font-mono">grunt.log</code> methods using{' '}
          <code className="text-stone-300 font-mono">hooker</code>. Before each log message is printed, Vexorion&apos;s preHook queries{' '}
          <code className="text-emerald-400 font-mono">Config.isAllowed(type, task)</code> against an LRU cache. If the type is not allowed, it sets{' '}
          <code className="text-rose-400 font-mono">grunt.log.muted = true</code>, silently absorbing the noise without crashing your build.
        </p>
      </div>
    </div>
  );
};

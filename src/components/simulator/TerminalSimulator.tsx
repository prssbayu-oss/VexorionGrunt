/**
 * @file src/components/simulator/TerminalSimulator.tsx
 * Pure UI/UX component for terminal log simulation and real-time suppression display.
 * All simulation state, event timers, and log filtering are delegated to useTerminalSimulation.
 */

import React from 'react';
import { SAMPLE_TASKS } from '../../data/sample-tasks';
import { ClientSimulationEngine } from '../../services/simulationEngine';
import { PipelineSelector } from './PipelineSelector';
import { TelemetryBar } from './TelemetryBar';
import { PlaybackControls } from './PlaybackControls';
import { CustomLogInjector } from './CustomLogInjector';
import { TerminalWindow } from './TerminalWindow';
import { RealtimeStreamBar } from './RealtimeStreamBar';
import { RealtimeSuppressionRadar } from './RealtimeSuppressionRadar';
import { useTerminalSimulation } from '../../hooks/useTerminalSimulation';

interface TerminalSimulatorProps {
  engine: ClientSimulationEngine;
  isHooked: boolean;
  onToggleHook: () => void;
  onRefreshMetrics: () => void;
}

export const TerminalSimulator: React.FC<TerminalSimulatorProps> = ({
  engine,
  isHooked,
  onToggleHook,
  onRefreshMetrics
}) => {
  const {
    selectedPresetId,
    setSelectedPresetId,
    activePreset,
    processedLogs,
    visibleLogs,
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
    handlePlay,
    handlePause,
    handleStepForward,
    handleReset,
    handleInjectCustomLog,
    isStreaming,
    connectionState,
    speedMs,
    daemonStatus,
    toggleStream,
    changeSpeed,
    clearLogs
  } = useTerminalSimulation({ engine, isHooked, onRefreshMetrics });

  const totalCount = visibleLogs.length;

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      {/* 1. Real-Time Daemon Mode Switcher & Stream Bar */}
      <RealtimeStreamBar
        isAutoStream={isAutoStream}
        onToggleAutoStream={() => setIsAutoStream(!isAutoStream)}
        isStreaming={isStreaming}
        onToggleStream={toggleStream}
        connectionState={connectionState}
        speedMs={speedMs}
        onChangeSpeed={changeSpeed}
        daemonStatus={daemonStatus}
        onClearLogs={clearLogs}
        isHooked={isHooked}
      />

      {/* 2. Pipeline / Task Preset Selector (Manual Mode) */}
      {!isAutoStream && (
        <PipelineSelector
          presets={SAMPLE_TASKS}
          selectedPresetId={selectedPresetId}
          onSelectPreset={(id) => setSelectedPresetId(id)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}

      {/* 3. Telemetry & Metric Bar HUD */}
      <TelemetryBar
        isHooked={isHooked}
        onToggleHook={onToggleHook}
        suppressedCount={suppressedCount}
        cleanCount={cleanCount}
        totalCount={totalCount}
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
          currentIndex={currentIndex}
          totalLogs={processedLogs.length}
          speed={speed}
          isHooked={isHooked}
          showInjector={showInjector}
          onPlay={handlePlay}
          onPause={handlePause}
          onStepNext={handleStepForward}
          onCompleteAll={() => {
            // Step to end
            while (currentIndex < processedLogs.length) {
              handleStepForward();
            }
          }}
          onReset={handleReset}
          onChangeSpeed={setSpeed}
          onToggleInjector={() => setShowInjector(!showInjector)}
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
        {/* RAW Stream Terminal Window */}
        {(viewMode === 'split' || viewMode === 'raw') && (
          <TerminalWindow
            title={isAutoStream ? 'Raw Node.js Live Stream (Background Daemon)' : 'Raw Grunt Output (PID: 82941)'}
            variant="raw"
            logs={visibleLogs}
            allEmittedLogs={visibleLogs}
            command={isAutoStream ? 'node daemon.js --stream' : activePreset.command}
            isHooked={isHooked}
            isComplete={isComplete}
            totalPresetLength={isAutoStream ? visibleLogs.length : processedLogs.length}
            latestSuppressedLog={latestSuppressedLog}
          />
        )}

        {/* CLEAN Stream Terminal Window */}
        {(viewMode === 'split' || viewMode === 'clean') && (
          <TerminalWindow
            title={isAutoStream ? 'Vexorion Protected Live Stream (Clean)' : 'Vexorion Clean Terminal (Muted Output)'}
            variant="clean"
            logs={visibleLogs.filter((l) => !l.suppressed)}
            allEmittedLogs={visibleLogs}
            command={isAutoStream ? 'node daemon.js --stream --hook' : activePreset.command}
            isHooked={isHooked}
            isComplete={isComplete}
            totalPresetLength={isAutoStream ? visibleLogs.length : processedLogs.length}
            latestSuppressedLog={latestSuppressedLog}
          />
        )}
      </div>
    </div>
  );
};

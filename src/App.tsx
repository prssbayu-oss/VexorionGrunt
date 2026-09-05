import React, { useState, useMemo, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { TerminalSimulator } from './components/simulator/TerminalSimulator';
import { ConfigStudio } from './components/config/ConfigStudio';
import { TestSuiteRunner } from './components/tests/TestSuiteRunner';
import { RepoExplorer } from './components/repo/RepoExplorer';
import { BenchmarkPanel } from './components/benchmark/BenchmarkPanel';
import { RepoAuditPanel } from './components/audit/RepoAuditPanel';
import { SimulatedConfig, SimulatedLogger, SimulatedVexorion } from './lib/vexorion-core';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');
  const [isHooked, setIsHooked] = useState<boolean>(true);
  const [, setVersionTick] = useState<number>(0);

  // Initialize simulated Vexorion instance
  const vexorion = useMemo(() => {
    const config = new SimulatedConfig({
      allowedTypes: ['success', 'fail', 'warn', 'error'],
      exceptions: ['security'],
      taskWhitelist: [],
      taskBlacklist: [],
      verbose: false,
      suppressAll: false
    });
    const logger = new SimulatedLogger(config);
    logger.hook({ taskName: 'build' });
    return new SimulatedVexorion(config, logger);
  }, []);

  const refreshState = useCallback(() => {
    setVersionTick((v) => v + 1);
  }, []);

  const handleToggleHook = () => {
    if (isHooked) {
      vexorion.unhook();
      setIsHooked(false);
    } else {
      vexorion.hook('build');
      setIsHooked(true);
    }
    refreshState();
  };

  const metrics = vexorion.getMetrics();

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. Navbar Component */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isHooked={isHooked}
        onToggleHook={handleToggleHook}
        suppressedCount={metrics.suppressed}
        totalLogs={metrics.total}
      />

      {/* 2. Main View Container (Strictly constrained against horizontal overflow) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        {activeTab === 'simulator' && (
          <TerminalSimulator
            vexorion={vexorion}
            isHooked={isHooked}
            onToggleHook={handleToggleHook}
            onRefreshMetrics={refreshState}
          />
        )}

        {activeTab === 'config' && (
          <ConfigStudio
            vexorion={vexorion}
            onOptionsChange={refreshState}
          />
        )}

        {activeTab === 'tests' && (
          <TestSuiteRunner />
        )}

        {activeTab === 'code' && (
          <RepoExplorer />
        )}

        {activeTab === 'benchmark' && (
          <BenchmarkPanel />
        )}

        {activeTab === 'audit' && (
          <RepoAuditPanel />
        )}
      </main>

      {/* 3. Footer Component */}
      <Footer />
    </div>
  );
}

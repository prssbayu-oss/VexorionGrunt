import React, { useState, useMemo, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { TerminalSimulator } from './components/simulator/TerminalSimulator';
import { ConfigStudio } from './components/config/ConfigStudio';
import { TestSuiteRunner } from './components/tests/TestSuiteRunner';
import { RepoExplorer } from './components/repo/RepoExplorer';
import { BenchmarkPanel } from './components/benchmark/BenchmarkPanel';
import { RepoAuditPanel } from './components/audit/RepoAuditPanel';
import { ClientSimulationEngine } from './services/simulationEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');
  const [isHooked, setIsHooked] = useState<boolean>(true);
  const [, setVersionTick] = useState<number>(0);

  // Pure client-side simulation engine (Frontend-only service layer)
  const engine = useMemo(() => {
    return new ClientSimulationEngine({
      allowedTypes: ['success', 'fail', 'warn', 'error'],
      exceptions: ['security'],
      taskWhitelist: [],
      taskBlacklist: [],
      verbose: false,
      suppressAll: false
    });
  }, []);

  const refreshState = useCallback(() => {
    setVersionTick((v) => v + 1);
  }, []);

  const handleToggleHook = () => {
    if (isHooked) {
      engine.unhook();
      setIsHooked(false);
    } else {
      engine.hook('build');
      setIsHooked(true);
    }
    refreshState();
  };

  const metrics = engine.getMetrics();

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. Navbar UI Component */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isHooked={isHooked}
        onToggleHook={handleToggleHook}
        suppressedCount={metrics.suppressed}
        totalLogs={metrics.total}
      />

      {/* 2. Main View Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        {activeTab === 'simulator' && (
          <TerminalSimulator
            engine={engine}
            isHooked={isHooked}
            onToggleHook={handleToggleHook}
            onRefreshMetrics={refreshState}
          />
        )}

        {activeTab === 'config' && (
          <ConfigStudio
            engine={engine}
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

      {/* 3. Footer UI Component */}
      <Footer />
    </div>
  );
}

import React from 'react';
import { Terminal, Settings2, CheckCircle2, Code2, Gauge, VolumeX, Sparkles, Server } from 'lucide-react';
import { useBackendStatus } from '../../hooks/useBackendStatus';

export type ActiveTab = 'simulator' | 'config' | 'tests' | 'code' | 'benchmark';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isHooked: boolean;
  onToggleHook: () => void;
  suppressedCount: number;
  totalLogs: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isHooked,
  onToggleHook,
  suppressedCount,
  totalLogs
}) => {
  const { isOnline } = useBackendStatus();
  const tabs: { id: ActiveTab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: 'simulator', label: 'Terminal Simulator', shortLabel: 'Simulator', icon: <Terminal className="w-4 h-4 shrink-0" /> },
    { id: 'config', label: 'Configuration Studio', shortLabel: 'Config', icon: <Settings2 className="w-4 h-4 shrink-0" /> },
    { id: 'tests', label: 'Test Suite', shortLabel: 'Tests', icon: <CheckCircle2 className="w-4 h-4 shrink-0" /> },
    { id: 'code', label: 'Source & Architecture', shortLabel: 'Architecture', icon: <Code2 className="w-4 h-4 shrink-0" /> },
    { id: 'benchmark', label: 'Benchmark & Cache', shortLabel: 'Benchmark', icon: <Gauge className="w-4 h-4 shrink-0" /> }
  ];

  const suppressionRate = totalLogs > 0 ? Math.round((suppressedCount / totalLogs) * 100) : 0;

  return (
    <header className="sticky top-0 z-50 w-full max-w-full bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Version */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-base sm:text-lg shadow-sm">
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-stone-100 tracking-tight text-sm sm:text-base font-mono">
                  vexorion
                </span>
                <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-medium">
                  v2.1.0
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-stone-400 hidden md:block">
                Intelligent Grunt Log Suppressor
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Scrollable on small screens with no page blowout) */}
          <nav className="flex items-center gap-1 bg-stone-950/70 p-1 rounded-xl border border-stone-800/80 overflow-x-auto max-w-[50vw] sm:max-w-none scrollbar-none">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-stone-800 text-emerald-400 shadow-sm border border-stone-700/60'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Real-time Status / Hook Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Server Status Badge */}
            <div
              id="backend-status-badge"
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono shrink-0 transition-colors ${
                isOnline
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-800/60 text-amber-300'
              }`}
              title={isOnline ? 'Connected to Express Node.js Server' : 'Connecting to Node.js backend...'}
            >
              <Server className="w-3.5 h-3.5 shrink-0" />
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="hidden xl:inline">{isOnline ? 'Node.js Backend Online' : 'Connecting Server...'}</span>
            </div>

            <button
              id="toggle-hook-btn"
              onClick={onToggleHook}
              title={isHooked ? 'Click to unhook' : 'Click to hook'}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border shrink-0 ${
                isHooked
                  ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-stone-800/80 border-stone-700 text-stone-400 hover:bg-stone-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isHooked ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
              <span className="hidden md:inline">{isHooked ? 'Hook Active' : 'Unhooked'}</span>
              <span className="md:hidden">{isHooked ? 'Active' : 'Off'}</span>
            </button>

            {totalLogs > 0 && (
              <div
                id="suppression-stats-badge"
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-xs font-mono text-stone-300 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{suppressionRate}% Muted</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Layers, Terminal, Cpu, Database, ArrowRight, Shield } from 'lucide-react';

export const ArchitecturePipeline: React.FC = () => {
  return (
    <div className="w-full max-w-full bg-stone-900 border border-stone-800 rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
          Internal Mechanism & Architecture
        </span>
      </div>
      <h2 className="text-xl font-bold text-stone-100 truncate">Interception Pipeline Flow</h2>
      <p className="text-xs text-stone-400 mt-1 max-w-2xl">
        How Vexorion transparently intercepts Grunt logging without modifying task plugins or breaking child processes:
      </p>

      {/* Responsive Visual Pipeline */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        {/* Step 1 */}
        <div className="bg-stone-950 border border-stone-800 rounded-lg p-3 text-center min-w-0">
          <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center mx-auto mb-2 text-stone-300">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold font-mono text-stone-200 truncate">1. Grunt Task</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Calls grunt.log.write() / warn()</div>
        </div>

        {/* Step 2 */}
        <div className="bg-stone-950 border border-emerald-900/40 rounded-lg p-3 text-center min-w-0">
          <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2 text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold font-mono text-emerald-300 truncate">2. Hooker Pre-Hook</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Vexorion intercepts method invocation</div>
        </div>

        {/* Step 3 */}
        <div className="bg-stone-950 border border-cyan-900/40 rounded-lg p-3 text-center min-w-0">
          <div className="w-8 h-8 rounded-full bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center mx-auto mb-2 text-cyan-400">
            <Database className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold font-mono text-cyan-300 truncate">3. LRU Cache Check</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Evaluates allowedTypes & exceptions</div>
        </div>
      </div>

      {/* Outcome Cards */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-rose-950/20 border border-rose-900/30 rounded-lg p-2.5 flex items-start gap-2.5 min-w-0">
          <Shield className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <div className="text-xs min-w-0">
            <span className="font-mono font-semibold text-rose-300">If Not Allowed: </span>
            <span className="text-stone-300">
              Sets <code className="text-rose-400 font-mono">grunt.log.muted = true</code>. Log line is silently absorbed, metrics counter increments.
            </span>
          </div>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-2.5 flex items-start gap-2.5 min-w-0">
          <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <div className="text-xs min-w-0">
            <span className="font-mono font-semibold text-emerald-300">If Allowed / Exception: </span>
            <span className="text-stone-300">
              Sets <code className="text-emerald-400 font-mono">grunt.log.muted = false</code>. Clean message prints to stdout, postHook restores state.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

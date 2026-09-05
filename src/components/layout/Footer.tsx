import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full max-w-full border-t border-stone-800/80 bg-stone-900/60 py-6 text-xs text-stone-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span className="font-semibold text-stone-300">vexorion v2.1.0</span>
          <span>•</span>
          <span>Intelligent Grunt Log Suppressor</span>
          <span>•</span>
          <span className="text-emerald-400">MIT Licensed</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-stone-500">
          <span>Hooker Interception</span>
          <span>•</span>
          <span>LRU Cache Engine</span>
          <span>•</span>
          <span>Multi-Task Target Aware</span>
        </div>
      </div>
    </footer>
  );
};

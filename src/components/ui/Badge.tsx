import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, ShieldAlert } from 'lucide-react';

interface LogTypeBadgeProps {
  type: string;
}

export const LogTypeBadge: React.FC<LogTypeBadgeProps> = ({ type }) => {
  switch (type) {
    case 'ok':
    case 'success':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
          <CheckCircle className="w-3 h-3" /> ok
        </span>
      );
    case 'warn':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
          <AlertTriangle className="w-3 h-3" /> warn
        </span>
      );
    case 'error':
    case 'fail':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
          <XCircle className="w-3 h-3" /> error
        </span>
      );
    case 'subhead':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shrink-0">
          <Info className="w-3 h-3" /> subhead
        </span>
      );
    case 'security':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold shrink-0">
          <ShieldAlert className="w-3 h-3" /> exception
        </span>
      );
    case 'verbose':
    case 'debug':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700 shrink-0">
          {type}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-stone-800/80 text-stone-300 border border-stone-700/60 shrink-0">
          {type}
        </span>
      );
  }
};

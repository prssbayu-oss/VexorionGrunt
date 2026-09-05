import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VolumeX, ShieldCheck, Zap, Eye, EyeOff, Sparkles, Filter } from 'lucide-react';
import { ProcessedLogItem } from '../../types';
import { LogTypeBadge } from '../ui/Badge';

interface TerminalWindowProps {
  title: string;
  variant: 'raw' | 'clean';
  logs: ProcessedLogItem[];
  allEmittedLogs: ProcessedLogItem[];
  command: string;
  isHooked: boolean;
  isComplete: boolean;
  totalPresetLength: number;
  latestSuppressedLog?: ProcessedLogItem | null;
}

export const TerminalWindow: React.FC<TerminalWindowProps> = ({
  title,
  variant,
  logs,
  allEmittedLogs,
  command,
  isHooked,
  isComplete,
  totalPresetLength,
  latestSuppressedLog
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showMutedGhostsInClean, setShowMutedGhostsInClean] = useState<boolean>(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length, allEmittedLogs.length]);

  const isClean = variant === 'clean';
  const suppressedCount = allEmittedLogs.filter((l) => l.suppressed).length;
  const cleanLogs = allEmittedLogs.filter((l) => !l.suppressed);

  // If clean window has "show ghost lines" enabled, combine them with ghost indicator
  const displayLogs = isClean && showMutedGhostsInClean ? allEmittedLogs : logs;

  return (
    <div
      className={`w-full max-w-full rounded-xl overflow-hidden shadow-2xl flex flex-col h-[530px] border transition-colors ${
        isClean ? 'border-emerald-900/40 bg-stone-950' : 'border-stone-800 bg-stone-950'
      }`}
    >
      {/* Terminal Window Header */}
      <div
        className={`px-3 sm:px-4 py-2.5 border-b flex items-center justify-between text-xs font-mono shrink-0 ${
          isClean
            ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-300'
            : 'bg-stone-900/90 border-stone-800 text-stone-300'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex gap-1.5 shrink-0">
            <div className={`w-3 h-3 rounded-full ${isClean ? 'bg-emerald-500' : 'bg-rose-500/80'}`} />
            <div className={`w-3 h-3 rounded-full ${isClean ? 'bg-emerald-500/50' : 'bg-amber-500/80'}`} />
            <div className={`w-3 h-3 rounded-full ${isClean ? 'bg-emerald-500/20' : 'bg-emerald-500/80'}`} />
          </div>
          <span className="font-semibold truncate">{title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isClean ? (
            <>
              {/* Ghost Toggle in Clean Terminal */}
              <button
                onClick={() => setShowMutedGhostsInClean(!showMutedGhostsInClean)}
                title={showMutedGhostsInClean ? 'Hide intercepted noise ghost lines' : 'Show shadow ghost of intercepted noise lines'}
                className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                  showMutedGhostsInClean
                    ? 'bg-stone-800 text-amber-300 border-amber-500/40'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-300'
                }`}
              >
                {showMutedGhostsInClean ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                <span>{showMutedGhostsInClean ? 'Hide Ghosts' : 'Show Ghosts'}</span>
              </button>

              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-mono border border-emerald-500/30">
                {cleanLogs.length} passed
              </span>
              <motion.span
                key={suppressedCount}
                initial={{ scale: 1.2, backgroundColor: 'rgba(244,63,94,0.3)' }}
                animate={{ scale: 1, backgroundColor: 'rgba(244,63,94,0.15)' }}
                transition={{ duration: 0.3 }}
                className="px-2 py-0.5 rounded text-rose-300 text-[11px] font-mono border border-rose-500/30 flex items-center gap-1"
              >
                <VolumeX className="w-3 h-3 text-rose-400" />
                {suppressedCount} muted
              </motion.span>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              {isHooked && (
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[11px] font-mono border border-rose-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-rose-400" />
                  Real-Time Highlighting
                </span>
              )}
              <span className="text-stone-500 text-[11px] hidden sm:inline">
                {logs.length} emitted
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={scrollRef}
        className="p-3 sm:p-4 flex-1 overflow-y-auto overflow-x-hidden font-mono text-xs text-stone-300 space-y-2 leading-relaxed selection:bg-stone-800 break-words relative"
      >
        {/* Command banner */}
        <div
          className={`pb-2 border-b flex items-center justify-between ${
            isClean ? 'text-emerald-500/80 border-emerald-950' : 'text-stone-500 border-stone-900'
          }`}
        >
          <span className="truncate pr-2">
            $ {command} {isClean ? '[vexorion:hooked]' : '--stack'}
          </span>
          <span className="shrink-0 text-[11px] flex items-center gap-1">
            {isClean ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Clean Stream
              </span>
            ) : (
              'PID 82941'
            )}
          </span>
        </div>

        {displayLogs.length === 0 ? (
          <div className="text-stone-600 italic pt-12 text-center px-4">
            {isClean
              ? 'Vexorion suppressor standing by. Click "Resume Stream" or "Run Pipeline" to observe clean execution.'
              : 'Terminal ready. Click "Resume Stream" or "Run Pipeline" to begin streaming logs.'}
          </div>
        ) : (
          displayLogs.map((log, index) => {
            const isSuppressed = Boolean(log.suppressed && isHooked);
            const isLatestSuppression = isSuppressed && latestSuppressedLog?.id === log.id;
            const isGhost = isClean && isSuppressed;

            return (
              <motion.div
                key={`${variant}-${log.id}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
                className={`flex items-start gap-2 p-1.5 rounded transition-all max-w-full relative ${
                  isGhost
                    ? 'bg-stone-900/30 border border-dashed border-stone-800 text-stone-500 opacity-60'
                    : isClean
                    ? 'bg-stone-900/40 border border-stone-800/40 text-stone-100'
                    : isLatestSuppression
                    ? 'bg-rose-950/40 border-l-4 border-l-rose-500 border-rose-500/60 shadow-[0_0_14px_rgba(244,63,94,0.3)] text-stone-300'
                    : isSuppressed
                    ? 'bg-rose-950/20 border-l-2 border-l-rose-500/50 border-stone-900 text-stone-400'
                    : 'bg-stone-900/10 border-l-2 border-emerald-500/30 text-stone-200'
                }`}
              >
                {/* Line number */}
                <span className="text-stone-600 select-none text-[10px] w-6 text-right pt-0.5 shrink-0">
                  {log.originalIndex !== undefined ? log.originalIndex + 1 : index + 1}
                </span>

                {/* Log Type Badge */}
                <div className="shrink-0 pt-0.5">
                  <LogTypeBadge type={log.type} />
                </div>

                {/* Real-time Suppression Highlight Badge */}
                {isSuppressed && !isClean && (
                  <div className="shrink-0 pt-0.5 flex items-center gap-1">
                    {isLatestSuppression ? (
                      <motion.span
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 0.3 }}
                        className="px-1.5 py-0.5 rounded bg-rose-500/25 text-rose-300 text-[10px] font-bold border border-rose-500/50 flex items-center gap-1 shadow-sm"
                      >
                        <VolumeX className="w-2.5 h-2.5 text-rose-400 animate-pulse" />
                        <span>MUTED BY VEXORION</span>
                      </motion.span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 text-[10px] border border-rose-500/30 flex items-center gap-1">
                        <VolumeX className="w-2.5 h-2.5" />
                        <span>MUTED</span>
                      </span>
                    )}

                    {/* Reason Tag */}
                    <span className="hidden sm:inline-block text-[9px] px-1 py-0.5 rounded bg-stone-950 text-rose-400/80 border border-stone-800">
                      {log.reason || 'type_not_allowed'}
                    </span>
                  </div>
                )}

                {/* Ghost Indicator in Clean terminal */}
                {isGhost && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] border border-amber-500/20 shrink-0">
                    [SHADOW: MUTED]
                  </span>
                )}

                {/* Log message body */}
                <span
                  className={`flex-1 min-w-0 break-all whitespace-pre-wrap transition-colors ${
                    isGhost
                      ? 'line-through text-stone-500 italic'
                      : isSuppressed && !isClean
                      ? 'line-through decoration-rose-500/70 text-stone-400 opacity-80'
                      : log.type === 'subhead'
                      ? 'text-cyan-300 font-bold border-t border-stone-800/80 pt-1 mt-0.5 block'
                      : log.type === 'error' || log.type === 'fail'
                      ? 'text-rose-400 font-semibold'
                      : log.type === 'warn'
                      ? 'text-amber-300 font-medium'
                      : log.type === 'ok' || log.type === 'success'
                      ? 'text-emerald-300 font-medium'
                      : log.type === 'security'
                      ? 'text-purple-300 font-semibold'
                      : 'text-stone-300'
                  }`}
                >
                  {log.message}
                </span>
              </motion.div>
            );
          })
        )}

        {/* Real-Time Suppression Protection Banner inside Clean Terminal */}
        {isClean && latestSuppressedLog && isHooked && (
          <motion.div
            key={latestSuppressedLog.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="sticky bottom-0 left-0 right-0 p-2.5 rounded-lg bg-emerald-950/90 border border-emerald-800/50 backdrop-blur-sm text-emerald-300 text-[11px] flex items-center justify-between gap-2 shadow-lg"
          >
            <div className="flex items-center gap-2 min-w-0 truncate">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">
                Vexorion intercepted noise: <strong className="text-emerald-200">[{latestSuppressedLog.type}]</strong> on <strong className="text-emerald-200">{latestSuppressedLog.task}</strong> &quot;{latestSuppressedLog.message}&quot;
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 shrink-0">
              Filtered Out Cleanly
            </span>
          </motion.div>
        )}

        {/* Completion Footer */}
        {isComplete && displayLogs.length > 0 && (
          <div
            className={`mt-4 pt-3 border-t text-[11px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 p-2.5 rounded-lg border ${
              isClean
                ? 'border-emerald-900/40 text-emerald-400 bg-emerald-950/20'
                : 'border-stone-800/80 text-stone-500 bg-stone-900/40'
            }`}
          >
            <span>
              {isClean
                ? `✓ Task completed cleanly. Preserved ${cleanLogs.length} signal lines.`
                : `Execution completed. Total emitted lines: ${totalPresetLength}`}
            </span>
            <span className={isClean ? 'text-emerald-300 font-bold' : 'text-rose-400 font-semibold'}>
              {isClean
                ? `🔇 Suppressed ${suppressedCount} lines (${Math.round(
                    (suppressedCount / (totalPresetLength || 1)) * 100
                  )}% noise eliminated)`
                : `Suppressed overhead: ${suppressedCount} lines muted`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

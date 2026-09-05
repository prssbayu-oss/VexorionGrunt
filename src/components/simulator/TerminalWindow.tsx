import React, { useRef, useEffect } from 'react';
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
}

export const TerminalWindow: React.FC<TerminalWindowProps> = ({
  title,
  variant,
  logs,
  allEmittedLogs,
  command,
  isHooked,
  isComplete,
  totalPresetLength
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  const isClean = variant === 'clean';
  const suppressedCount = allEmittedLogs.filter((l) => l.suppressed).length;
  const cleanLogs = allEmittedLogs.filter((l) => !l.suppressed);

  return (
    <div
      className={`w-full max-w-full rounded-xl overflow-hidden shadow-2xl flex flex-col h-[520px] border ${
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

        <div className="flex items-center gap-1.5 shrink-0">
          {isClean ? (
            <>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-mono border border-emerald-500/30">
                {cleanLogs.length} passed
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 text-[11px] font-mono border border-rose-500/30">
                {suppressedCount} muted
              </span>
            </>
          ) : (
            <span className="text-stone-500 text-[11px]">
              {logs.length} lines emitted
            </span>
          )}
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={scrollRef}
        className="p-3 sm:p-4 flex-1 overflow-y-auto overflow-x-hidden font-mono text-xs text-stone-300 space-y-2 leading-relaxed selection:bg-stone-800 break-words"
      >
        <div
          className={`pb-2 border-b flex items-center justify-between ${
            isClean ? 'text-emerald-500/80 border-emerald-950' : 'text-stone-500 border-stone-900'
          }`}
        >
          <span className="truncate pr-2">
            $ {command} {isClean ? '[vexorion:hooked]' : '--stack'}
          </span>
          <span className="shrink-0 text-[11px]">
            {isClean ? 'Clean Stream' : 'PID 82941'}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="text-stone-600 italic pt-8 text-center px-4">
            {isClean
              ? 'Vexorion suppressor standing by. Click "Run Pipeline" to observe quiet execution.'
              : 'Terminal ready. Click "Run Pipeline" or "Step Next" to begin streaming.'}
          </div>
        ) : (
          logs.map((log) => {
            const isSuppressedInRaw = !isClean && log.suppressed && isHooked;
            return (
              <div
                key={`${variant}-${log.id}`}
                className={`flex items-start gap-2 p-1 rounded transition-colors max-w-full ${
                  isClean
                    ? 'bg-stone-900/40 border border-stone-800/40 text-stone-100'
                    : isSuppressedInRaw
                    ? 'bg-rose-950/20 text-stone-400'
                    : 'text-stone-200'
                }`}
              >
                <span className="text-stone-600 select-none text-[10px] w-5 text-right pt-0.5 shrink-0">
                  {log.originalIndex + 1}
                </span>
                <div className="shrink-0 pt-0.5">
                  <LogTypeBadge type={log.type} />
                </div>
                <span
                  className={`flex-1 min-w-0 break-all whitespace-pre-wrap ${
                    log.type === 'subhead'
                      ? 'text-cyan-300 font-bold border-t border-stone-800/80 pt-1 mt-1 block'
                      : log.type === 'error' || log.type === 'fail'
                      ? 'text-rose-400 font-semibold'
                      : log.type === 'warn'
                      ? 'text-amber-300 font-medium'
                      : log.type === 'ok'
                      ? 'text-emerald-300 font-medium'
                      : log.type === 'security'
                      ? 'text-purple-300 font-semibold'
                      : 'text-stone-300'
                  }`}
                >
                  {log.message}
                </span>
              </div>
            );
          })
        )}

        {/* Completion Footer */}
        {isComplete && logs.length > 0 && (
          <div
            className={`mt-4 pt-3 border-t text-[11px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 p-2 rounded-lg border ${
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
            <span className={isClean ? 'text-emerald-300 font-bold' : 'text-rose-400'}>
              {isClean
                ? `🔇 Suppressed ${suppressedCount} lines (${Math.round(
                    (suppressedCount / totalPresetLength) * 100
                  )}% noise eliminated)`
                : 'Raw uncluttered log overhead'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

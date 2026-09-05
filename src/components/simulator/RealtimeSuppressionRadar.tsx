import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, VolumeX, Zap, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { ProcessedLogItem } from '../../types';

interface RealtimeSuppressionRadarProps {
  latestSuppressedLog: ProcessedLogItem | null;
  totalSuppressed: number;
  totalAllowed: number;
  isHooked: boolean;
  isAutoStream: boolean;
}

export const RealtimeSuppressionRadar: React.FC<RealtimeSuppressionRadarProps> = ({
  latestSuppressedLog,
  totalSuppressed,
  totalAllowed,
  isHooked,
  isAutoStream
}) => {
  const totalProcessed = totalSuppressed + totalAllowed;
  const suppressionRate = totalProcessed > 0 ? ((totalSuppressed / totalProcessed) * 100).toFixed(1) : '0.0';

  return (
    <div className="w-full bg-stone-900/90 border border-stone-800 rounded-xl p-3 sm:p-4 shadow-md overflow-hidden relative">
      {/* Background ambient pulse when a suppression happens */}
      <AnimatePresence>
        {latestSuppressedLog && (
          <motion.div
            key={latestSuppressedLog.id}
            initial={{ opacity: 0.6, scale: 0.98 }}
            animate={{ opacity: 0, scale: 1.02 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute inset-0 bg-rose-500/10 pointer-events-none rounded-xl"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
        {/* Left side: Live Interception Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-stone-950 border border-stone-800 shrink-0">
            {isHooked ? (
              <motion.div
                animate={latestSuppressedLog ? { scale: [1, 1.25, 1], rotate: [0, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <VolumeX className="w-4 h-4 text-rose-400" />
              </motion.div>
            ) : (
              <ShieldCheck className="w-4 h-4 text-stone-500" />
            )}

            {isHooked && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-stone-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Real-Time Vexorion Interceptor
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isHooked
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-stone-800 text-stone-400 border-stone-700'
                }`}
              >
                {isHooked ? 'MUTING ACTIVE' : 'UNHOOKED'}
              </span>
              {isAutoStream && (
                <span className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  LIVE SSE
                </span>
              )}
            </div>

            {/* Latest intercepted log preview with animation */}
            <div className="text-xs font-mono mt-1 text-stone-400 truncate flex items-center gap-2">
              <span className="text-stone-500">Last Action:</span>
              <AnimatePresence mode="wait">
                {latestSuppressedLog ? (
                  <motion.div
                    key={latestSuppressedLog.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="inline-flex items-center gap-1.5 min-w-0 truncate"
                  >
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/40 text-[11px]">
                      ⚡ MUTED [{latestSuppressedLog.type}]
                    </span>
                    <span className="text-stone-400 text-[11px] truncate">
                      on task <strong className="text-stone-300">{latestSuppressedLog.task}</strong>: &quot;{latestSuppressedLog.message}&quot;
                    </span>
                    <span className="text-[10px] text-rose-400/80 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800 shrink-0">
                      ({latestSuppressedLog.reason || 'type_not_allowed'})
                    </span>
                  </motion.div>
                ) : (
                  <span className="text-stone-500 italic text-[11px]">
                    Waiting for log stream events...
                  </span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right side: Real-time visual metrics & suppression waveform */}
        <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
          {/* Animated Noise Suppression Ratio */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-stone-500 uppercase tracking-wider">Filtered Ratio</span>
            <div className="flex items-center gap-1.5">
              <motion.span
                key={totalSuppressed}
                initial={{ scale: 1.15, color: '#f43f5e' }}
                animate={{ scale: 1, color: '#10b981' }}
                transition={{ duration: 0.3 }}
                className="text-sm font-bold font-mono"
              >
                {suppressionRate}%
              </motion.span>
              <span className="text-[11px] text-stone-400">
                ({totalSuppressed} muted / {totalProcessed} total)
              </span>
            </div>
          </div>

          {/* Mini Real-Time Activity Waveform */}
          <div className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 bg-stone-950 rounded-lg border border-stone-800">
            <Filter className="w-3 h-3 text-stone-500 mr-1" />
            {[...Array(6)].map((_, i) => (
              <motion.span
                key={i}
                className={`w-1 rounded-full ${
                  isHooked && latestSuppressedLog ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                animate={{
                  height: isHooked
                    ? [8 + (i % 3) * 6, 4 + ((i * 3) % 10), 16 - (i % 2) * 6, 8 + (i % 3) * 6]
                    : [6, 10, 6]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.8 + i * 0.15,
                  ease: 'easeInOut'
                }}
              />
            ))}
            <span className="text-[10px] text-stone-500 ml-1.5">Mute Radar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

interface ExceptionsSectionProps {
  exceptions: string[];
  onAddException: (type: string) => void;
  onRemoveException: (type: string) => void;
}

export const ExceptionsSection: React.FC<ExceptionsSectionProps> = ({
  exceptions,
  onAddException,
  onRemoveException
}) => {
  const [newException, setNewException] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newException.trim()) return;
    onAddException(newException.trim());
    setNewException('');
  };

  return (
    <div className="w-full max-w-full bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold font-mono text-stone-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" /> Exceptions (exceptions)
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Critical types that always bypass all suppression rules, whitelist, and blacklists.
          </p>
        </div>
      </div>

      {/* Exceptions Pills */}
      <div className="flex flex-wrap gap-1.5">
        {exceptions.length === 0 ? (
          <span className="text-xs text-stone-500 italic font-mono">No exceptions defined.</span>
        ) : (
          exceptions.map((type) => (
            <span
              key={type}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-mono shadow-sm"
            >
              <span>{type}</span>
              <button
                onClick={() => onRemoveException(type)}
                title={`Remove exception ${type}`}
                className="hover:text-rose-400 text-purple-400/60"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Add Exception Input */}
      <form onSubmit={handleAdd} className="flex gap-2 pt-1">
        <input
          id="add-exception-input"
          type="text"
          value={newException}
          onChange={(e) => setNewException(e.target.value)}
          placeholder="Add exception (e.g. security, critical, telemetry)..."
          className="flex-1 min-w-0 px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-lg text-xs font-mono text-stone-200 focus:outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          id="submit-exception-btn"
          className="px-3 py-1.5 bg-purple-900/40 hover:bg-purple-800/50 text-purple-300 text-xs font-mono rounded-lg border border-purple-700/50 transition-colors shrink-0"
        >
          Add Exception
        </button>
      </form>
    </div>
  );
};

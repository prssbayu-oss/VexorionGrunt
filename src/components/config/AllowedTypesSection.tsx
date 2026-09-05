import React, { useState } from 'react';
import { Tag, X } from 'lucide-react';

interface AllowedTypesSectionProps {
  allowedTypes: string[];
  onAddType: (type: string) => void;
  onRemoveType: (type: string) => void;
}

export const AllowedTypesSection: React.FC<AllowedTypesSectionProps> = ({
  allowedTypes,
  onAddType,
  onRemoveType
}) => {
  const [newAllowedType, setNewAllowedType] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllowedType.trim()) return;
    onAddType(newAllowedType.trim());
    setNewAllowedType('');
  };

  return (
    <div className="w-full max-w-full bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold font-mono text-stone-200 flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400 shrink-0" /> Allowed Log Types (allowedTypes)
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Only messages matching these log types pass through to the terminal.
          </p>
        </div>
      </div>

      {/* Current Allowed Types Pills */}
      <div className="flex flex-wrap gap-1.5">
        {allowedTypes.map((type) => (
          <span
            key={type}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-950 border border-emerald-500/30 text-emerald-300 text-xs font-mono shadow-sm"
          >
            <span>{type}</span>
            <button
              onClick={() => onRemoveType(type)}
              title={`Remove ${type}`}
              className="hover:text-rose-400 text-stone-500"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Quick Add Common Types */}
      <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-mono text-stone-500">Quick add:</span>
        {['ok', 'warn', 'error', 'subhead', 'writeln', 'debug', 'verbose']
          .filter((t) => !allowedTypes.includes(t))
          .map((t) => (
            <button
              key={t}
              onClick={() => onAddType(t)}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-950 hover:bg-stone-800 text-stone-400 border border-stone-800 hover:text-stone-200 transition-colors"
            >
              + {t}
            </button>
          ))}
      </div>

      {/* Add Custom Type Input */}
      <form onSubmit={handleAdd} className="flex gap-2 pt-1">
        <input
          id="add-allowed-type-input"
          type="text"
          value={newAllowedType}
          onChange={(e) => setNewAllowedType(e.target.value)}
          placeholder="Add custom allowed type (e.g. audit)..."
          className="flex-1 min-w-0 px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-lg text-xs font-mono text-stone-200 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          id="submit-allowed-type-btn"
          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono rounded-lg border border-stone-700 transition-colors shrink-0"
        >
          Add
        </button>
      </form>
    </div>
  );
};

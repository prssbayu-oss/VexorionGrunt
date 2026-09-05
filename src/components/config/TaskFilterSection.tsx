import React, { useState } from 'react';
import { X } from 'lucide-react';

interface TaskFilterSectionProps {
  taskWhitelist?: string[];
  whitelist?: string[];
  taskBlacklist?: string[];
  blacklist?: string[];
  onAddWhitelist: (task: string) => void;
  onRemoveWhitelist: (task: string) => void;
  onAddBlacklist: (task: string) => void;
  onRemoveBlacklist: (task: string) => void;
}

export const TaskFilterSection: React.FC<TaskFilterSectionProps> = ({
  taskWhitelist: propTaskWhitelist,
  whitelist: propWhitelist,
  taskBlacklist: propTaskBlacklist,
  blacklist: propBlacklist,
  onAddWhitelist,
  onRemoveWhitelist,
  onAddBlacklist,
  onRemoveBlacklist
}) => {
  const taskWhitelist = propTaskWhitelist || propWhitelist || [];
  const taskBlacklist = propTaskBlacklist || propBlacklist || [];
  const [newWhitelistTask, setNewWhitelistTask] = useState('');
  const [newBlacklistTask, setNewBlacklistTask] = useState('');

  const handleAddWhite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhitelistTask.trim()) return;
    onAddWhitelist(newWhitelistTask.trim());
    setNewWhitelistTask('');
  };

  const handleAddBlack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlacklistTask.trim()) return;
    onAddBlacklist(newBlacklistTask.trim());
    setNewBlacklistTask('');
  };

  return (
    <div className="w-full max-w-full grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Whitelist */}
      <div className="w-full max-w-full bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold font-mono text-stone-200">
          Task Whitelist (taskWhitelist)
        </h3>
        <p className="text-[11px] text-stone-400">
          If non-empty, only tasks in this list can output allowed logs.
        </p>

        <div className="flex flex-wrap gap-1">
          {taskWhitelist.length === 0 ? (
            <span className="text-[11px] text-stone-500 italic">None (All tasks evaluated)</span>
          ) : (
            taskWhitelist.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-950 border border-stone-700 text-stone-300 text-[11px] font-mono"
              >
                <span>{t}</span>
                <button onClick={() => onRemoveWhitelist(t)} className="text-stone-500 hover:text-rose-400">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))
          )}
        </div>

        <form onSubmit={handleAddWhite} className="flex gap-2">
          <input
            id="add-whitelist-input"
            type="text"
            value={newWhitelistTask}
            onChange={(e) => setNewWhitelistTask(e.target.value)}
            placeholder="Task (e.g. build)..."
            className="flex-1 min-w-0 px-2.5 py-1 bg-stone-950 border border-stone-800 rounded-lg text-xs font-mono text-stone-200"
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono rounded-lg shrink-0"
          >
            Add
          </button>
        </form>
      </div>

      {/* Blacklist */}
      <div className="w-full max-w-full bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold font-mono text-stone-200">
          Task Blacklist (taskBlacklist)
        </h3>
        <p className="text-[11px] text-stone-400">
          Tasks in this list have their normal logs silenced completely.
        </p>

        <div className="flex flex-wrap gap-1">
          {taskBlacklist.length === 0 ? (
            <span className="text-[11px] text-stone-500 italic">None</span>
          ) : (
            taskBlacklist.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/30 border border-rose-800/40 text-rose-300 text-[11px] font-mono"
              >
                <span>{t}</span>
                <button onClick={() => onRemoveBlacklist(t)} className="text-stone-500 hover:text-rose-400">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))
          )}
        </div>

        <form onSubmit={handleAddBlack} className="flex gap-2">
          <input
            id="add-blacklist-input"
            type="text"
            value={newBlacklistTask}
            onChange={(e) => setNewBlacklistTask(e.target.value)}
            placeholder="Task (e.g. clean)..."
            className="flex-1 min-w-0 px-2.5 py-1 bg-stone-950 border border-stone-800 rounded-lg text-xs font-mono text-stone-200"
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono rounded-lg shrink-0"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface CustomLogInjectorProps {
  onInject: (type: string, task: string, message: string) => void;
}

export const CustomLogInjector: React.FC<CustomLogInjectorProps> = ({ onInject }) => {
  const [customMsg, setCustomMsg] = useState('>> Finished asset hash verification.');
  const [customType, setCustomType] = useState('writeln');
  const [customTask, setCustomTask] = useState('assets:hash');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;
    onInject(customType, customTask, customMsg);
    setCustomMsg('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-full bg-stone-900 border border-emerald-800/40 rounded-xl p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Inject Custom Grunt Log to Test Interception Rules
        </span>
        <span className="text-[11px] text-stone-400">
          Evaluates immediately against current allowedTypes & exceptions
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-3">
          <label className="block text-[11px] font-mono text-stone-400 mb-1">Log Type / Method</label>
          <select
            id="custom-log-type-select"
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-800 rounded-lg text-xs font-mono text-stone-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="writeln">writeln (default noisy)</option>
            <option value="verbose">verbose (compiler chatter)</option>
            <option value="debug">debug (internal state)</option>
            <option value="ok">ok (success badge)</option>
            <option value="warn">warn (warning)</option>
            <option value="error">error (critical error)</option>
            <option value="subhead">subhead (task header)</option>
            <option value="security">security (exception test)</option>
            <option value="audit">audit (custom metric)</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <label className="block text-[11px] font-mono text-stone-400 mb-1">Task Name</label>
          <input
            id="custom-log-task-input"
            type="text"
            value={customTask}
            onChange={(e) => setCustomTask(e.target.value)}
            placeholder="e.g. clean:dist, compile"
            className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-800 rounded-lg text-xs font-mono text-stone-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="sm:col-span-4">
          <label className="block text-[11px] font-mono text-stone-400 mb-1">Log Message</label>
          <input
            id="custom-log-msg-input"
            type="text"
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            placeholder="Message string..."
            className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-800 rounded-lg text-xs font-mono text-stone-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="sm:col-span-2 flex items-end">
          <button
            type="submit"
            id="send-custom-log-btn"
            className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-medium transition-colors"
          >
            Send Log
          </button>
        </div>
      </div>
    </form>
  );
};

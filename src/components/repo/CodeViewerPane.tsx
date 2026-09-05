import React, { useState } from 'react';
import { FileCode, Copy, Check } from 'lucide-react';
import { RepoFile } from '../../data/repo-files';

interface CodeViewerPaneProps {
  selectedFile: RepoFile;
}

export const CodeViewerPane: React.FC<CodeViewerPaneProps> = ({ selectedFile }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const copyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = selectedFile.content.split('\n').length;

  return (
    <div className="w-full max-w-full bg-stone-900 border border-stone-800 rounded-xl overflow-hidden flex flex-col h-[560px] shadow-xl">
      {/* Viewer Header */}
      <div className="bg-stone-950 px-3 sm:px-4 py-2.5 border-b border-stone-800 flex items-center justify-between text-xs font-mono shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold text-stone-200 truncate">{selectedFile.path}</span>
          <span className="text-stone-500 shrink-0">({lineCount} lines)</span>
        </div>

        <button
          onClick={copyCode}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 text-xs font-mono transition-colors shrink-0 ml-2"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Code Content Body */}
      <div className="p-3 sm:p-4 flex-1 overflow-y-auto overflow-x-hidden font-mono text-xs text-stone-300 bg-stone-950/80 leading-relaxed">
        <pre className="selection:bg-emerald-900/60 whitespace-pre-wrap break-all max-w-full">
          {selectedFile.content}
        </pre>
      </div>
    </div>
  );
};

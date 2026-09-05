import React from 'react';
import { Search, FileCode } from 'lucide-react';
import { RepoFile } from '../../data/repo-files';

interface FileSearchSidebarProps {
  files: RepoFile[];
  selectedPath: string;
  onSelectPath: (path: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export const FileSearchSidebar: React.FC<FileSearchSidebarProps> = ({
  files,
  selectedPath,
  onSelectPath,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory
}) => {
  return (
    <div className="w-full max-w-full space-y-3">
      {/* Search Input */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search repository files..."
          className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs font-mono text-stone-200 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-1">
        {['all', 'backend', 'core', 'task', 'cli', 'docs', 'config'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
              activeCategory === cat
                ? 'bg-stone-800 text-emerald-400 font-bold border border-stone-700'
                : 'text-stone-500 hover:text-stone-300 bg-stone-950'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* File List */}
      <div className="w-full max-w-full bg-stone-900 border border-stone-800 rounded-xl overflow-hidden divide-y divide-stone-800/60 max-h-[480px] overflow-y-auto">
        {files.length === 0 ? (
          <div className="p-4 text-center text-stone-500 text-xs font-mono">
            No files match your search.
          </div>
        ) : (
          files.map((file) => {
            const isSelected = selectedPath === file.path;
            return (
              <button
                key={file.path}
                onClick={() => onSelectPath(file.path)}
                className={`w-full text-left p-2.5 sm:p-3 transition-colors flex items-start justify-between gap-2 max-w-full ${
                  isSelected
                    ? 'bg-stone-800/90 text-emerald-400 border-l-2 border-emerald-500'
                    : 'text-stone-300 hover:bg-stone-850 hover:text-stone-100'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold truncate">
                    <FileCode className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                    <span className="truncate">{file.path}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 truncate mt-0.5">{file.description}</p>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800 shrink-0">
                  {file.category}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

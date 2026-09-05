import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { VexorionOptions } from '../../types';

interface CodeExportPanelProps {
  currentConfig: VexorionOptions;
}

export const CodeExportPanel: React.FC<CodeExportPanelProps> = ({ currentConfig }) => {
  const [exportFormat, setExportFormat] = useState<'gruntfile' | 'json' | 'cli'>('gruntfile');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const generateGruntfileSnippet = () => {
    const optsObj: Record<string, unknown> = {
      allowedTypes: currentConfig.allowedTypes,
      exceptions: currentConfig.exceptions,
      verbose: currentConfig.verbose,
      suppressAll: currentConfig.suppressAll
    };
    if (currentConfig.taskWhitelist.length > 0) optsObj.taskWhitelist = currentConfig.taskWhitelist;
    if (currentConfig.taskBlacklist.length > 0) optsObj.taskBlacklist = currentConfig.taskBlacklist;

    return `// Gruntfile.js
module.exports = function(grunt) {
  grunt.loadNpmTasks('vexorion');

  grunt.initConfig({
    vexorion: {
      options: ${JSON.stringify(optsObj, null, 8).replace(/\n\s{6}\}/, '\n      }')},
      build: {
        // Multi-task target options
      }
    }
  });

  grunt.registerTask('default', ['vexorion', 'clean', 'eslint', 'sass']);
};`;
  };

  const generateCliSnippet = () => {
    let cmd = 'npx vexorion';
    if (currentConfig.verbose) cmd += ' -v';
    if (currentConfig.suppressAll) cmd += ' -q';
    if (currentConfig.allowedTypes.length > 0) {
      cmd += ` -t ${currentConfig.allowedTypes.join(',')}`;
    }
    if (currentConfig.exceptions.length > 0) {
      cmd += ` -e ${currentConfig.exceptions.join(',')}`;
    }
    cmd += ' build:prod';
    return cmd;
  };

  const getContent = () => {
    if (exportFormat === 'gruntfile') return generateGruntfileSnippet();
    if (exportFormat === 'json') return JSON.stringify(currentConfig, null, 2);
    return generateCliSnippet();
  };

  return (
    <div className="w-full max-w-full bg-stone-900 border border-stone-800 rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
      {/* Tab Header */}
      <div className="bg-stone-950 px-3 sm:px-4 py-2.5 border-b border-stone-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            id="export-tab-gruntfile"
            onClick={() => setExportFormat('gruntfile')}
            className={`px-2.5 sm:px-3 py-1 rounded text-xs font-mono transition-colors ${
              exportFormat === 'gruntfile'
                ? 'bg-stone-800 text-emerald-400 font-medium'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Gruntfile.js
          </button>
          <button
            id="export-tab-json"
            onClick={() => setExportFormat('json')}
            className={`px-2.5 sm:px-3 py-1 rounded text-xs font-mono transition-colors ${
              exportFormat === 'json'
                ? 'bg-stone-800 text-emerald-400 font-medium'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            vexorion.json
          </button>
          <button
            id="export-tab-cli"
            onClick={() => setExportFormat('cli')}
            className={`px-2.5 sm:px-3 py-1 rounded text-xs font-mono transition-colors ${
              exportFormat === 'cli'
                ? 'bg-stone-800 text-emerald-400 font-medium'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            CLI Syntax
          </button>
        </div>

        {/* Copy Code */}
        <button
          id="copy-export-code-btn"
          onClick={() => copyToClipboard(getContent(), 'export')}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-xs font-mono transition-colors shrink-0"
        >
          {copiedTab === 'export' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedTab === 'export' ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Code Body */}
      <div className="p-3 sm:p-4 flex-1 bg-stone-950/80 overflow-y-auto overflow-x-hidden font-mono text-xs text-stone-300 leading-relaxed max-h-[480px]">
        <pre className="selection:bg-emerald-900/60 whitespace-pre-wrap break-all max-w-full">
          {getContent()}
        </pre>
      </div>

      {/* Quick Install Banner */}
      <div className="p-3 bg-stone-950 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <span className="text-stone-400">Install in your project:</span>
        <button
          id="copy-npm-install-btn"
          onClick={() => copyToClipboard('npm install --save-dev vexorion', 'npm')}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 transition-colors"
        >
          <span>npm i -D vexorion</span>
          {copiedTab === 'npm' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
};

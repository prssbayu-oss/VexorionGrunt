import React from 'react';
import { SimulatedVexorion } from '../../lib/vexorion-core';
import { PresetSelectorBar } from './PresetSelectorBar';
import { AllowedTypesSection } from './AllowedTypesSection';
import { ExceptionsSection } from './ExceptionsSection';
import { TaskFilterSection } from './TaskFilterSection';
import { ExecutionSwitches } from './ExecutionSwitches';
import { CodeExportPanel } from './CodeExportPanel';

interface ConfigStudioProps {
  vexorion: SimulatedVexorion;
  onOptionsChange: () => void;
}

export const ConfigStudio: React.FC<ConfigStudioProps> = ({ vexorion, onOptionsChange }) => {
  const currentConfig = vexorion.getConfig();

  const handleApplyPreset = (presetName: string) => {
    const rawConfig = vexorion.getRawConfig();
    switch (presetName) {
      case 'standard_ci':
        rawConfig.set('allowedTypes', ['success', 'fail', 'warn', 'error']);
        rawConfig.set('exceptions', ['security']);
        rawConfig.set('suppressAll', false);
        rawConfig.set('verbose', false);
        rawConfig.set('taskWhitelist', []);
        rawConfig.set('taskBlacklist', []);
        break;
      case 'strict_quiet':
        rawConfig.set('allowedTypes', ['error', 'fail']);
        rawConfig.set('exceptions', ['security', 'critical']);
        rawConfig.set('suppressAll', false);
        rawConfig.set('verbose', false);
        rawConfig.set('taskWhitelist', []);
        rawConfig.set('taskBlacklist', []);
        break;
      case 'dev_verbose':
        rawConfig.set('allowedTypes', ['success', 'fail', 'warn', 'error', 'subhead', 'debug']);
        rawConfig.set('exceptions', []);
        rawConfig.set('suppressAll', false);
        rawConfig.set('verbose', true);
        rawConfig.set('taskWhitelist', []);
        rawConfig.set('taskBlacklist', []);
        break;
      case 'mute_all':
        rawConfig.set('suppressAll', true);
        break;
    }
    onOptionsChange();
  };

  const handleAddAllowedType = (type: string) => {
    vexorion.addAllowedType(type);
    onOptionsChange();
  };

  const handleRemoveAllowedType = (type: string) => {
    vexorion.removeAllowedType(type);
    onOptionsChange();
  };

  const handleAddException = (type: string) => {
    vexorion.addException(type);
    onOptionsChange();
  };

  const handleRemoveException = (type: string) => {
    vexorion.removeException(type);
    onOptionsChange();
  };

  const handleAddWhitelist = (task: string) => {
    vexorion.addTaskToWhitelist(task);
    onOptionsChange();
  };

  const handleRemoveWhitelist = (task: string) => {
    const list = currentConfig.taskWhitelist.filter((t) => t !== task);
    vexorion.getRawConfig().set('taskWhitelist', list);
    onOptionsChange();
  };

  const handleAddBlacklist = (task: string) => {
    vexorion.addTaskToBlacklist(task);
    onOptionsChange();
  };

  const handleRemoveBlacklist = (task: string) => {
    const list = currentConfig.taskBlacklist.filter((t) => t !== task);
    vexorion.getRawConfig().set('taskBlacklist', list);
    onOptionsChange();
  };

  const handleToggleVerbose = (val: boolean) => {
    vexorion.getRawConfig().set('verbose', val);
    onOptionsChange();
  };

  const handleToggleSuppressAll = (val: boolean) => {
    vexorion.getRawConfig().set('suppressAll', val);
    onOptionsChange();
  };

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      {/* 1. Preset Selector Banner */}
      <PresetSelectorBar onApplyPreset={handleApplyPreset} />

      {/* 2. Main Grid: Controls & Code Export */}
      <div className="w-full max-w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-5 min-w-0">
          <AllowedTypesSection
            allowedTypes={currentConfig.allowedTypes}
            onAddType={handleAddAllowedType}
            onRemoveType={handleRemoveAllowedType}
          />

          <ExceptionsSection
            exceptions={currentConfig.exceptions}
            onAddException={handleAddException}
            onRemoveException={handleRemoveException}
          />

          <TaskFilterSection
            taskWhitelist={currentConfig.taskWhitelist}
            taskBlacklist={currentConfig.taskBlacklist}
            onAddWhitelist={handleAddWhitelist}
            onRemoveWhitelist={handleRemoveWhitelist}
            onAddBlacklist={handleAddBlacklist}
            onRemoveBlacklist={handleRemoveBlacklist}
          />

          <ExecutionSwitches
            verbose={currentConfig.verbose}
            suppressAll={currentConfig.suppressAll}
            onToggleVerbose={handleToggleVerbose}
            onToggleSuppressAll={handleToggleSuppressAll}
          />
        </div>

        {/* Right Column: Code Export Studio */}
        <div className="lg:col-span-5 space-y-4 min-w-0">
          <CodeExportPanel currentConfig={currentConfig} />
        </div>
      </div>
    </div>
  );
};

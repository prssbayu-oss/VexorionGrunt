/**
 * @file src/components/config/ConfigStudio.tsx
 * Pure UI/UX component for interactive configuration tuning and rule customization.
 * All state mutations and preset logic are handled cleanly by useConfigStudio.
 */

import React from 'react';
import { ClientSimulationEngine } from '../../services/simulationEngine';
import { PresetSelectorBar } from './PresetSelectorBar';
import { AllowedTypesSection } from './AllowedTypesSection';
import { ExceptionsSection } from './ExceptionsSection';
import { TaskFilterSection } from './TaskFilterSection';
import { ExecutionSwitches } from './ExecutionSwitches';
import { CodeExportPanel } from './CodeExportPanel';
import { useConfigStudio } from '../../hooks/useConfigStudio';

interface ConfigStudioProps {
  engine: ClientSimulationEngine;
  onOptionsChange: () => void;
}

export const ConfigStudio: React.FC<ConfigStudioProps> = ({ engine, onOptionsChange }) => {
  const {
    currentConfig,
    handleApplyPreset,
    handleAddAllowedType,
    handleRemoveAllowedType,
    handleAddException,
    handleRemoveException,
    handleAddWhitelist,
    handleRemoveWhitelist,
    handleAddBlacklist,
    handleRemoveBlacklist,
    handleToggleVerbose,
    handleToggleSuppressAll
  } = useConfigStudio(engine, onOptionsChange);

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      {/* Preset Rules Selector */}
      <PresetSelectorBar onSelectPreset={handleApplyPreset} />

      {/* Main Form Sections Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Log Types & Exceptions */}
        <div className="space-y-6">
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
        </div>

        {/* Right Column: Task Filters & Switches */}
        <div className="space-y-6">
          <TaskFilterSection
            taskWhitelist={currentConfig.taskWhitelist || []}
            taskBlacklist={currentConfig.taskBlacklist || []}
            whitelist={currentConfig.taskWhitelist || []}
            blacklist={currentConfig.taskBlacklist || []}
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
      </div>

      {/* Code Export & Real-Time JSON Panel */}
      <CodeExportPanel currentConfig={currentConfig} config={currentConfig} />
    </div>
  );
};

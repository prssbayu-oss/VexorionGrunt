/**
 * @file src/hooks/useConfigStudio.ts
 * Custom hook managing configuration options, preset rules, and mutation callbacks.
 * Keeps ConfigStudio as a 100% pure UI/UX component.
 */

import { useCallback } from 'react';
import { ClientSimulationEngine } from '../services/simulationEngine';
import { VexorionOptions } from '../types';

export function useConfigStudio(engine: ClientSimulationEngine, onOptionsChange?: () => void) {
  const currentConfig: VexorionOptions = engine.getConfig();

  const handleApplyPreset = useCallback((presetName: string) => {
    const rawConfig = engine.getRawConfig();
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
    onOptionsChange?.();
  }, [engine, onOptionsChange]);

  const handleAddAllowedType = useCallback((type: string) => {
    engine.addAllowedType(type);
    onOptionsChange?.();
  }, [engine, onOptionsChange]);

  const handleRemoveAllowedType = useCallback((type: string) => {
    engine.removeAllowedType(type);
    onOptionsChange?.();
  }, [engine, onOptionsChange]);

  const handleAddException = useCallback((type: string) => {
    engine.addException(type);
    onOptionsChange?.();
  }, [engine, onOptionsChange]);

  const handleRemoveException = useCallback((type: string) => {
    engine.removeException(type);
    onOptionsChange?.();
  }, [engine, onOptionsChange]);

  const handleAddWhitelist = useCallback((task: string) => {
    engine.addTaskToWhitelist(task);
    onOptionsChange?.();
  }, [engine, onOptionsChange]);

  const handleRemoveWhitelist = useCallback((task: string) => {
    const list = currentConfig.taskWhitelist.filter((t) => t !== task);
    engine.getRawConfig().set('taskWhitelist', list);
    onOptionsChange?.();
  }, [engine, currentConfig.taskWhitelist, onOptionsChange]);

  const handleAddBlacklist = useCallback((task: string) => {
    engine.addTaskToBlacklist(task);
    onOptionsChange?.();
  }, [engine, onOptionsChange]);

  const handleRemoveBlacklist = useCallback((task: string) => {
    const list = currentConfig.taskBlacklist.filter((t) => t !== task);
    engine.getRawConfig().set('taskBlacklist', list);
    onOptionsChange?.();
  }, [engine, currentConfig.taskBlacklist, onOptionsChange]);

  const handleToggleVerbose = useCallback(() => {
    engine.toggleVerbose();
    onOptionsChange?.();
  }, [engine, onOptionsChange]);

  const handleToggleSuppressAll = useCallback(() => {
    engine.toggleSuppressAll();
    onOptionsChange?.();
  }, [engine, onOptionsChange]);

  return {
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
  };
}

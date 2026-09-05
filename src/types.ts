export interface VexorionOptions {
  allowedTypes: string[];
  exceptions: string[];
  taskWhitelist: string[];
  taskBlacklist: string[];
  verbose: boolean;
  suppressAll: boolean;
  taskName: string;
  autoRegister: boolean;
  timeout?: number;
  autoUnhook?: boolean;
  singleton?: boolean;
}

export type LogLevel = 'writeln' | 'ok' | 'warn' | 'error' | 'subhead' | 'debug' | 'verbose' | 'custom';

export interface LogItem {
  id: string;
  type: LogLevel | string;
  message: string;
  timestamp: number;
  task: string;
  details?: Record<string, unknown>;
  originalIndex: number;
}

export interface ProcessedLogItem extends LogItem {
  suppressed: boolean;
  reason: 'allowed_type' | 'exception' | 'task_whitelisted' | 'suppress_all' | 'task_blacklisted' | 'type_not_allowed';
  suppressionDetails?: string;
}

export interface SuppressionMetrics {
  suppressed: number;
  allowed: number;
  errors: number;
  total: number;
  suppressionRate: string;
  lastSuppressed: { type: string; task: string; time: number } | null;
  lastAllowed: { type: string; task: string; time: number } | null;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: string;
}

export interface GruntTaskPreset {
  id: string;
  name: string;
  description: string;
  command: string;
  logs: Omit<LogItem, 'id' | 'timestamp' | 'originalIndex'>[];
}

export interface VexorionEventRecord {
  id: string;
  event: 'hooked' | 'unhooked' | 'registered' | 'unregistered' | 'typeAdded' | 'typeRemoved' | 'exceptionAdded' | 'exceptionRemoved';
  data: Record<string, unknown>;
  timestamp: number;
}

export interface TestCaseResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

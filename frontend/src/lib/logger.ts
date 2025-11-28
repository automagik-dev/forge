/**
 * Logger utility for consistent logging throughout the application
 * Supports log levels and namespaced logging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enabled: boolean;
  enabledNamespaces: Set<string> | null; // null means all enabled
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default configuration
const config: LoggerConfig = {
  level: import.meta.env.DEV ? 'debug' : 'warn',
  enabled: true,
  enabledNamespaces: null,
};

// Parse DEBUG environment variable or localStorage for namespace filtering
function parseDebugNamespaces(): void {
  const debugStr =
    import.meta.env.VITE_DEBUG ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('debug')) ||
    '';

  if (debugStr === '*') {
    config.enabledNamespaces = null; // All enabled
  } else if (debugStr) {
    config.enabledNamespaces = new Set(
      debugStr.split(',').map((s: string) => s.trim().toLowerCase())
    );
  }
}

// Initialize namespace filtering
parseDebugNamespaces();

function isNamespaceEnabled(namespace: string): boolean {
  if (config.enabledNamespaces === null) return true;
  const lowerNamespace = namespace.toLowerCase();
  return config.enabledNamespaces.has(lowerNamespace);
}

function shouldLog(level: LogLevel, namespace: string): boolean {
  if (!config.enabled) return false;
  if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[config.level]) return false;
  return isNamespaceEnabled(namespace);
}

function formatMessage(namespace: string, message: string): string {
  return `[${namespace}] ${message}`;
}

/**
 * Create a namespaced logger instance
 */
export function createLogger(namespace: string) {
  return {
    debug(message: string, ...args: unknown[]): void {
      if (shouldLog('debug', namespace)) {
        console.debug(formatMessage(namespace, message), ...args);
      }
    },

    info(message: string, ...args: unknown[]): void {
      if (shouldLog('info', namespace)) {
        console.info(formatMessage(namespace, message), ...args);
      }
    },

    warn(message: string, ...args: unknown[]): void {
      if (shouldLog('warn', namespace)) {
        console.warn(formatMessage(namespace, message), ...args);
      }
    },

    error(message: string, ...args: unknown[]): void {
      if (shouldLog('error', namespace)) {
        console.error(formatMessage(namespace, message), ...args);
      }
    },

    log(message: string, ...args: unknown[]): void {
      // Alias for info level
      if (shouldLog('info', namespace)) {
        console.log(formatMessage(namespace, message), ...args);
      }
    },
  };
}

/**
 * Global logger configuration functions
 */
export const Logger = {
  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    config.level = level;
  },

  /**
   * Enable or disable all logging
   */
  setEnabled(enabled: boolean): void {
    config.enabled = enabled;
  },

  /**
   * Enable specific namespaces (pass null or '*' for all)
   */
  setNamespaces(namespaces: string[] | null): void {
    if (namespaces === null) {
      config.enabledNamespaces = null;
    } else {
      config.enabledNamespaces = new Set(namespaces.map((s) => s.toLowerCase()));
    }
  },

  /**
   * Get current configuration
   */
  getConfig(): Readonly<LoggerConfig> {
    return { ...config };
  },
};

// Pre-configured loggers for common namespaces
export const analyticsLogger = createLogger('Analytics');
export const genieLogger = createLogger('Master Genie');
export const i18nLogger = createLogger('i18n');
export const previewLogger = createLogger('Preview');
export const debugLogger = createLogger('Debug');

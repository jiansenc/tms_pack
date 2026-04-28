/**
 * Backend Logger Utility
 * Provides comprehensive logging with support for different log levels,
 * WebSocket integration, and console output.
 */

// Log levels and their corresponding console methods
const LOG_LEVELS = {
  info: { method: 'info', color: '\x1b[36m' }, // Cyan
  success: { method: 'log', color: '\x1b[32m' }, // Green
  warning: { method: 'warn', color: '\x1b[33m' }, // Yellow
  error: { method: 'error', color: '\x1b[31m' }, // Red
  debug: { method: 'debug', color: '\x1b[90m' }, // Gray
};

// Reset color
const RESET = '\x1b[0m';

/**
 * Format timestamp
 * @param {Date} date - Date object (defaults to current time)
 * @returns {string} Formatted timestamp string
 */
function formatTimestamp(date = new Date()) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * Format log message from multiple arguments
 * @param {...any} args - Arguments to format
 * @returns {string} Formatted message string
 */
function formatMessage(...args) {
  return args
    .map((arg) => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(' ');
}

/**
 * Log to console with color
 * @param {string} level - Log level
 * @param {...any} args - Arguments to log
 */
function logToConsole(level, ...args) {
  const levelConfig = LOG_LEVELS[level] || LOG_LEVELS.info;
  const timestamp = formatTimestamp();
  const prefix = `${levelConfig.color}[${timestamp}] [${level.toUpperCase()}]${RESET}`;

  console[levelConfig.method](prefix, ...args);
}

/**
 * Send log via WebSocket
 * @param {WebSocket} ws - WebSocket instance
 * @param {string} level - Log level
 * @param {string} message - Formatted message
 */
function sendViaWebSocket(ws, level, message) {
  if (ws && ws.readyState === 1) {
    // WebSocket.OPEN = 1
    try {
      ws.send(
        JSON.stringify({
          log: message,
          type: level,
          time: formatTimestamp(),
        }),
      );
    } catch (e) {
      console.error('Failed to send log via WebSocket:', e);
    }
  }
}

/**
 * Create a logger instance
 * @param {WebSocket} ws - WebSocket instance (optional)
 * @param {Function} callback - Legacy callback function (optional)
 * @returns {Object} Logger instance with methods for different log levels
 */
export function createLogger(ws = null, callback = null) {
  return {
    /**
     * Log informational message
     * @param {...any} args - Arguments to log
     */
    info(...args) {
      const message = formatMessage(...args);
      logToConsole('info', ...args);

      if (callback) {
        callback({ log: message, type: 'info' });
      }

      if (ws) {
        sendViaWebSocket(ws, 'info', message);
      }
    },

    /**
     * Log success message
     * @param {...any} args - Arguments to log
     */
    success(...args) {
      const message = formatMessage(...args);
      logToConsole('success', ...args);

      if (callback) {
        callback({ log: message, type: 'success' });
      }

      if (ws) {
        sendViaWebSocket(ws, 'success', message);
      }
    },

    /**
     * Log warning message
     * @param {...any} args - Arguments to log
     */
    warning(...args) {
      const message = formatMessage(...args);
      logToConsole('warning', ...args);

      if (callback) {
        callback({ log: message, type: 'warn' });
      }

      if (ws) {
        sendViaWebSocket(ws, 'warn', message);
      }
    },

    /**
     * Log error message
     * @param {...any} args - Arguments to log
     */
    error(...args) {
      const message = formatMessage(...args);
      logToConsole('error', ...args);

      if (callback) {
        callback({ log: message, type: 'error' });
      }

      if (ws) {
        sendViaWebSocket(ws, 'error', message);
      }
    },

    /**
     * Log debug message
     * @param {...any} args - Arguments to log
     */
    debug(...args) {
      const message = formatMessage(...args);
      logToConsole('debug', ...args);

      if (callback) {
        callback({ log: message, type: 'debug' });
      }

      if (ws) {
        sendViaWebSocket(ws, 'debug', message);
      }
    },

    /**
     * Log raw message (for compatibility with legacy code)
     * @param {string|Object} message - Message to log
     * @param {string} type - Log type
     */
    raw(message, type = 'info') {
      const level = type === 'warn' ? 'warning' : type;
      const levelConfig = LOG_LEVELS[level] || LOG_LEVELS.info;

      if (typeof message === 'object' && message !== null) {
        logToConsole(level, message);

        if (callback) {
          callback(message);
        }

        if (ws) {
          sendViaWebSocket(ws, type, message.log || formatMessage(message));
        }
      } else {
        logToConsole(level, message);

        if (callback) {
          callback({ log: String(message), type });
        }

        if (ws) {
          sendViaWebSocket(ws, type, String(message));
        }
      }
    },

    /**
     * Log a section header for better organization
     * @param {string} title - Section title
     */
    section(title) {
      const separator = '='.repeat(Math.max(title.length, 50));
      this.info(separator);
      this.info(title);
    },

    /**
     * Log a progress step
     * @param {number} current - Current step
     * @param {number} total - Total steps
     * @param {string} message - Progress message
     */
    progress(current, total, message) {
      const percentage = Math.round((current / total) * 100);
      this.debug(`[${current}/${total}] ${percentage}% - ${message}`);
    },

    /**
     * Update WebSocket instance
     * @param {WebSocket} newWs - New WebSocket instance
     */
    setWebSocket(newWs) {
      ws = newWs;
    },

    /**
     * Update callback function
     * @param {Function} newCallback - New callback function
     */
    setCallback(newCallback) {
      callback = newCallback;
    },
  };
}

/**
 * Default logger instance (without WebSocket)
 */
export const logger = createLogger();

/**
 * Create logger with only callback (for legacy compatibility)
 * @param {Function} callback - Callback function
 * @returns {Object} Logger instance
 */
export function createCallbackLogger(callback) {
  return createLogger(null, callback);
}

/**
 * Create logger with WebSocket
 * @param {WebSocket} ws - WebSocket instance
 * @returns {Object} Logger instance
 */
export function createWSLogger(ws) {
  return createLogger(ws, null);
}

export default createLogger;

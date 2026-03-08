import pino from 'pino';

/**
 * Logger configuration based on environment
 * - Production: JSON format for structured logging
 * - Development: Human-readable format with pretty printing
 */
const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  base: {
    env: process.env.NODE_ENV || 'development',
  },
});

/**
 * Creates a child logger with additional context
 * @param context - Additional context to include in all log messages
 * @returns A child logger instance
 */
export function createLogger(context: Record<string, unknown>): pino.Logger {
  return logger.child(context);
}

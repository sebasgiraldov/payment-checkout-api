import pino from 'pino';

/**
 * Logger configuration based on environment
 * - Production: JSON format for structured logging
 * - Development: Human-readable format with pretty printing
 */
const isDevelopment = process.env.NODE_ENV !== 'production';

const pinoLogger = pino({
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
 * Wrapper logger that accepts both (message, object) and (object, message) signatures
 * This provides flexibility for different logging patterns while maintaining Pino compatibility
 */
export const logger = {
  info: (msgOrObj: string | object, objOrMsg?: object | string) => {
    if (typeof msgOrObj === 'string') {
      pinoLogger.info(objOrMsg as object || {}, msgOrObj);
    } else {
      pinoLogger.info(msgOrObj, objOrMsg as string || '');
    }
  },
  error: (msgOrObj: string | object, objOrMsg?: object | string) => {
    if (typeof msgOrObj === 'string') {
      pinoLogger.error(objOrMsg as object || {}, msgOrObj);
    } else {
      pinoLogger.error(msgOrObj, objOrMsg as string || '');
    }
  },
  warn: (msgOrObj: string | object, objOrMsg?: object | string) => {
    if (typeof msgOrObj === 'string') {
      pinoLogger.warn(objOrMsg as object || {}, msgOrObj);
    } else {
      pinoLogger.warn(msgOrObj, objOrMsg as string || '');
    }
  },
  debug: (msgOrObj: string | object, objOrMsg?: object | string) => {
    if (typeof msgOrObj === 'string') {
      pinoLogger.debug(objOrMsg as object || {}, msgOrObj);
    } else {
      pinoLogger.debug(msgOrObj, objOrMsg as string || '');
    }
  },
};

/**
 * Creates a child logger with additional context
 * @param context - Additional context to include in all log messages
 * @returns A child logger instance
 */
export function createLogger(context: Record<string, unknown>): pino.Logger {
  return pinoLogger.child(context);
}

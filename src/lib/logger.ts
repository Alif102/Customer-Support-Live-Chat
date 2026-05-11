import pino from 'pino';

/**
 * Pino Logger Configuration
 * 
 * Why: Structured logging (JSON) is essential for production observability.
 * Pino is used because it's high-performance and supports child loggers.
 */

const isDev = process.env.NODE_ENV !== 'production';
const isBrowser = typeof window !== 'undefined';

// Root logger configuration
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // In development and NOT in browser, we use pino-pretty
  transport: isDev && !isBrowser
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss Z',
        },
      }
    : undefined,
});

/**
 * Creates a child logger with a unique Request ID.
 * Used for standard HTTP request tracing.
 */
export function withRequestId(requestId: string) {
  return logger.child({ requestId });
}

/**
 * Creates a child logger for SSE connections.
 * Includes both connectionId and userId for tracing realtime events.
 */
export function withConnectionId(connectionId: string, userId: string) {
  return logger.child({ connectionId, userId });
}

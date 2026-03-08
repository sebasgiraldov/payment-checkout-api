import { logger, createLogger } from '../logger';

describe('Logger', () => {
  it('should export a logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should create a child logger with context', () => {
    const childLogger = createLogger({ service: 'test-service' });

    expect(childLogger).toBeDefined();
    expect(typeof childLogger.info).toBe('function');
  });

  it('should have correct log levels', () => {
    expect(logger.level).toBeDefined();
  });
});

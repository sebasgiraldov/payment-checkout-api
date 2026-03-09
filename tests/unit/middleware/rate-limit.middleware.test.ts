import { generalRateLimiter, strictPaymentRateLimiter } from '../../../src/interfaces/middleware/rate-limit.middleware';

describe('RateLimitMiddleware', () => {
  it('should export generalRateLimiter', () => {
    expect(generalRateLimiter).toBeDefined();
    expect(typeof generalRateLimiter).toBe('function');
  });

  it('should export strictPaymentRateLimiter', () => {
    expect(strictPaymentRateLimiter).toBeDefined();
    expect(typeof strictPaymentRateLimiter).toBe('function');
  });

  it('should have different configurations', () => {
    expect(generalRateLimiter).not.toBe(strictPaymentRateLimiter);
  });
});

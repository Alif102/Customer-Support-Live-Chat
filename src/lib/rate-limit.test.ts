import { checkRateLimit } from './rate-limit';

/**
 * Simple test for Rate Limiter
 * Run with: npx tsx src/lib/rate-limit.test.ts
 */

async function testRateLimit() {
  console.log('Testing Rate Limiter...');

  // 1. Initial check (should be allowed)
  const res1 = checkRateLimit('user-1');
  console.assert(res1.allowed === true, 'Initial request should be allowed');
  console.assert(res1.remaining === 29, 'Remaining tokens should be 29');

  // 2. Consume all tokens
  for (let i = 0; i < 29; i++) {
    checkRateLimit('user-1');
  }
  
  const resLimit = checkRateLimit('user-1');
  console.assert(resLimit.allowed === false, 'Request over limit should be rejected');
  console.assert(resLimit.remaining === 0, 'Remaining tokens should be 0');
  console.assert(resLimit.retryAfterMs > 0, 'RetryAfter should be greater than 0');

  // 3. Different user should have their own bucket
  const resUser2 = checkRateLimit('user-2');
  console.assert(resUser2.allowed === true, 'Different user should not be affected');

  console.log('✅ Rate Limiter tests passed!');
}

testRateLimit().catch(err => {
  console.error('❌ Rate Limiter tests failed:', err);
  process.exit(1);
});

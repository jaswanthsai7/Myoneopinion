import { describe, it, expect } from 'vitest';
import server from '../server';

describe('Security & API Regression Tests', () => {
  const dummyEnv = {
    PUBLIC_BEEHIIV_PUBLICATION_ID: 'pub_test_canonical_123',
  };

  it('1. Rejects oversized request payloads (>16KB) with HTTP 413', async () => {
    const hugeEmail = 'a'.repeat(20000) + '@example.com';
    const req = new Request('http://localhost:8080/api/subscribe', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '25000',
      },
      body: JSON.stringify({ email: hugeEmail }),
    });

    const res = await server.fetch(req, dummyEnv, {});
    expect(res.status).toBe(413);
    const data = await res.json();
    expect(data.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('2. Rejects malformed and invalid emails with HTTP 400', async () => {
    const invalidInputs = [
      'not-an-email',
      'test@',
      '@example.com',
      'user@localhost',
      'user\r\n@evil.com',
      '',
    ];

    for (let i = 0; i < invalidInputs.length; i++) {
      const invalidEmail = invalidInputs[i];
      const req = new Request('http://localhost:8080/api/subscribe', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'cf-connecting-ip': `198.51.100.${i + 1}`,
        },
        body: JSON.stringify({ email: invalidEmail }),
      });

      const res = await server.fetch(req, dummyEnv, {});
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.code).toBe('VALIDATION_FAILED');
    }
  });

  it('3. Enforces rate limits on repeated subscription requests with HTTP 429', async () => {
    const clientIp = '203.0.113.42';

    // Send requests up to limit
    for (let i = 0; i < 5; i++) {
      const req = new Request('http://localhost:8080/api/subscribe', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'cf-connecting-ip': clientIp,
        },
        body: JSON.stringify({ email: `user_${i}@example.com` }),
      });
      await server.fetch(req, dummyEnv, {});
    }

    // 6th request from same IP must be rate-limited
    const blockedReq = new Request('http://localhost:8080/api/subscribe', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cf-connecting-ip': clientIp,
      },
      body: JSON.stringify({ email: 'user_blocked@example.com' }),
    });

    const blockedRes = await server.fetch(blockedReq, dummyEnv, {});
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get('Retry-After')).toBeTruthy();
    const data = await blockedRes.json();
    expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('4. Ignores client publication ID tampering', async () => {
    const req = new Request('http://localhost:8080/api/subscribe', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cf-connecting-ip': '198.51.100.99',
      },
      body: JSON.stringify({
        email: 'genuine_member@example.com',
        publicationId: 'pub_attacker_override_999', // Tampering attempt
      }),
    });

    const res = await server.fetch(req, dummyEnv, {});
    expect(res.status).toBe(200);
    const data = await res.json();
    // Must strictly adhere to server env publication ID, ignoring attacker input
    expect(data.data.publicationId).toBe('pub_test_canonical_123');
  });

  it('5. Attaches comprehensive HTTP security headers to all responses', async () => {
    const req = new Request('http://localhost:8080/api/visits', {
      method: 'GET',
      headers: { 'cf-connecting-ip': '198.51.100.55' },
    });

    const res = await server.fetch(req, dummyEnv, {});
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(res.headers.get('Permissions-Policy')).toContain('camera=()');
  });

  it('6. Global synchronized visit counter returns accurate count across requests', async () => {
    const getReq = new Request('http://localhost:8080/api/visits', {
      method: 'GET',
      headers: { 'cf-connecting-ip': '198.51.100.77' },
    });

    const getRes = await server.fetch(getReq, dummyEnv, {});
    expect(getRes.status).toBe(200);
    const initialData = await getRes.json();
    expect(typeof initialData.visits).toBe('number');

    // Post to increment
    const postReq = new Request('http://localhost:8080/api/visits', {
      method: 'POST',
      headers: { 'cf-connecting-ip': '198.51.100.77' },
    });
    const postRes = await server.fetch(postReq, dummyEnv, {});
    expect(postRes.status).toBe(200);
    const incrementedData = await postRes.json();
    expect(incrementedData.visits).toBe(initialData.visits + 1);
  });

  it('7. Correctly reads and writes to D1 database binding when DB is present in env', async () => {
    let storedValue: number | null = null;
    const mockD1 = {
      prepare(query: string) {
        return {
          bind(...params: any[]) {
            return {
              async run() {
                if (query.includes('INSERT INTO site_stats')) {
                  storedValue = params[0];
                }
                return { success: true };
              },
            };
          },
          async first() {
            if (storedValue !== null) {
              return { value: storedValue };
            }
            return null;
          },
          async run() {
            return { success: true };
          },
        };
      },
    };

    const d1Env = { ...dummyEnv, DB: mockD1 };

    const postReq = new Request('http://localhost:8080/api/visits', {
      method: 'POST',
      headers: { 'cf-connecting-ip': '198.51.100.88' },
    });
    const postRes = await server.fetch(postReq, d1Env, {});
    expect(postRes.status).toBe(200);
    const postData = await postRes.json();
    expect(postData.source).toBe('d1');

    const getReq = new Request('http://localhost:8080/api/visits', {
      method: 'GET',
      headers: { 'cf-connecting-ip': '198.51.100.88' },
    });
    const getRes = await server.fetch(getReq, d1Env, {});
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.source).toBe('d1');
    expect(getData.visits).toBe(postData.visits);
  });
});

import { describe, expect, test } from 'bun:test';
import { SyntroJS } from '../../src/core';

describe('Bun Performance Tests', () => {
  test('should handle high concurrency requests', async () => {
    const app = new SyntroJS({ title: 'Bun Performance Test' });
    app.get('/fast', { handler: () => ({ message: 'Fast response' }) });

    const address = await app.listen(0);
    const url = `http://localhost:${address.split(':').pop()}/fast`;

    try {
      // Test with multiple concurrent requests
      const promises = Array.from({ length: 100 }, () => fetch(url).then((res) => res.json()));

      const start = performance.now();
      const results = await Promise.all(promises);
      const end = performance.now();

      expect(results).toHaveLength(100);
      expect(results.every((r) => r.message === 'Fast response')).toBe(true);

      const duration = end - start;
      console.log(`Bun handled 100 concurrent requests in ${duration.toFixed(2)}ms`);

      // Bun should be significantly faster than Node.js
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    } finally {
      await app.close();
    }
  });

  test('should optimize memory usage', async () => {
    const app = new SyntroJS({ title: 'Bun Memory Test' });
    app.get('/memory', {
      handler: () => ({
        timestamp: Date.now(),
        memory: process.memoryUsage(),
      }),
    });

    const address = await app.listen(0);
    const url = `http://localhost:${address.split(':').pop()}/memory`;

    try {
      // Make many requests to test memory efficiency
      for (let i = 0; i < 50; i++) {
        const response = await fetch(url);
        const data = await response.json();
        expect(data.timestamp).toBeTypeOf('number');
        expect(data.memory).toBeDefined();
      }

      // Memory usage should be reasonable
      const memUsage = process.memoryUsage();
      expect(memUsage.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    } finally {
      await app.close();
    }
  });
});

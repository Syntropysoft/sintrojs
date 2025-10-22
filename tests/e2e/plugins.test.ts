/**
 * Plugins E2E Tests
 * Tests for TinyApi plugin wrappers
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { TinyApi } from '../../src/core/TinyApi';
import { registerCors, registerHelmet, registerCompression, registerRateLimit } from '../../src/plugins';

describe('Plugins E2E', () => {
  describe('Plugin Registration', () => {
    test('should throw error if Fastify instance is not provided', async () => {
      await expect(
        // biome-ignore lint/suspicious/noExplicitAny: Testing error case
        registerCors(null as any),
      ).rejects.toThrow('Fastify instance is required');

      await expect(
        // biome-ignore lint/suspicious/noExplicitAny: Testing error case
        registerHelmet(null as any),
      ).rejects.toThrow('Fastify instance is required');

      await expect(
        // biome-ignore lint/suspicious/noExplicitAny: Testing error case
        registerCompression(null as any),
      ).rejects.toThrow('Fastify instance is required');

      await expect(
        // biome-ignore lint/suspicious/noExplicitAny: Testing error case
        registerRateLimit(null as any),
      ).rejects.toThrow('Fastify instance is required');
    });

    test('should register plugins successfully when dependencies are installed', async () => {
      const app = new TinyApi();

      // All plugins should register without errors
      await expect(
        registerCors(app.getRawFastify()),
      ).resolves.toBeUndefined();

      await expect(
        registerHelmet(app.getRawFastify()),
      ).resolves.toBeUndefined();

      await expect(
        registerCompression(app.getRawFastify()),
      ).resolves.toBeUndefined();

      await expect(
        registerRateLimit(app.getRawFastify()),
      ).resolves.toBeUndefined();

      // No need to close - server was never started
    });
  });

  describe('Plugin Integration Example', () => {
    test('should work with TinyApi when plugins are installed', async () => {
      // This test serves as documentation for how to use plugins
      // In real usage, install the dependencies first:
      // pnpm add @fastify/cors @fastify/helmet @fastify/compress @fastify/rate-limit

      const app = new TinyApi();

      // Register a simple route
      app.get('/hello', {
        handler: () => ({ message: 'Hello, World!' }),
      });

      // Start server
      const server = await app.listen(0);
      const port = new URL(server).port;

      // Test basic functionality
      const response = await fetch(`http://localhost:${port}/hello`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ message: 'Hello, World!' });

      await app.close();
    });
  });

  describe('Plugin Usage Documentation', () => {
    test('CORS plugin adds headers', async () => {
      const app = new TinyApi();

      // Register CORS plugin
      await registerCors(app.getRawFastify(), {
        origin: '*',
        credentials: true,
      });

      app.get('/cors-test', {
        handler: () => ({ message: 'CORS enabled' }),
      });

      const server = await app.listen(0);
      const port = new URL(server).port;

      const response = await fetch(`http://localhost:${port}/cors-test`, {
        headers: {
          Origin: 'https://example.com',
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(response.headers.get('access-control-allow-credentials')).toBe('true');

      await app.close();
    });

    test('Helmet plugin adds security headers', async () => {
      const app = new TinyApi();

      // Register Helmet plugin
      await registerHelmet(app.getRawFastify());

      app.get('/secure-test', {
        handler: () => ({ message: 'Security headers enabled' }),
      });

      const server = await app.listen(0);
      const port = new URL(server).port;

      const response = await fetch(`http://localhost:${port}/secure-test`);
      
      expect(response.status).toBe(200);
      // Verify security headers are present
      expect(response.headers.get('x-content-type-options')).toBeTruthy();
      expect(response.headers.get('x-frame-options')).toBeTruthy();

      await app.close();
    });

    test('Compression plugin compresses large responses', async () => {
      const app = new TinyApi();

      // Register Compression plugin
      await registerCompression(app.getRawFastify(), {
        threshold: 1024, // Only compress responses > 1KB
      });

      app.get('/compressed-test', {
        handler: () => ({ message: 'Compression enabled', data: 'x'.repeat(2000) }),
      });

      const server = await app.listen(0);
      const port = new URL(server).port;

      const response = await fetch(`http://localhost:${port}/compressed-test`, {
        headers: {
          'Accept-Encoding': 'gzip, deflate, br',
        },
      });

      expect(response.status).toBe(200);
      // Verify compression was applied
      const contentEncoding = response.headers.get('content-encoding');
      expect(contentEncoding).toBeTruthy();

      await app.close();
    });

    test('Rate Limiting plugin enforces limits', async () => {
      const app = new TinyApi();

      // Register Rate Limiting plugin with low limit for testing
      await registerRateLimit(app.getRawFastify(), {
        max: 5, // Only 5 requests
        timeWindow: 60000, // Per minute
        addHeaders: {
          'x-ratelimit-limit': true,
          'x-ratelimit-remaining': true,
          'x-ratelimit-reset': true,
          'retry-after': true,
        },
      });

      app.get('/limited-test', {
        handler: () => ({ message: 'Rate limiting enabled' }),
      });

      const server = await app.listen(0);
      const port = new URL(server).port;

      // First request should succeed
      const response1 = await fetch(`http://localhost:${port}/limited-test`);
      expect(response1.status).toBe(200);
      expect(response1.headers.get('x-ratelimit-limit')).toBe('5');
      expect(response1.headers.get('x-ratelimit-remaining')).toBe('4');

      await app.close();
    });
  });
});


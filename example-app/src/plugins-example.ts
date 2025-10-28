/**
 * Plugins Example
 *
 * Demonstrates how to use SyntroJS plugins for production features
 *
 * IMPORTANT: Install the plugin dependencies first:
 * ```bash
 * pnpm add @fastify/cors @fastify/helmet @fastify/compress @fastify/rate-limit
 * ```
 */

import { z } from 'zod';
import {
  SyntroJS,
  registerCompression,
  registerCors,
  registerHelmet,
  registerRateLimit,
} from '../..';

async function main() {
  const app = new SyntroJS({
    title: 'Plugins Example API',
    version: '1.0.0',
    description: 'API with CORS, Security Headers, Compression, and Rate Limiting',
  });

  // ==============================================
  // 1. CORS Plugin
  // ==============================================
  // Enable Cross-Origin Resource Sharing
  try {
    await registerCors(app.getRawFastify(), {
      origin: '*', // Allow all origins (adjust for production)
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    });
    console.log('✅ CORS enabled');
  } catch (error) {
    console.log('⚠️  CORS plugin not available (install @fastify/cors)');
  }

  // ==============================================
  // 2. Helmet Plugin
  // ==============================================
  // Security headers to protect against common vulnerabilities
  try {
    await registerHelmet(app.getRawFastify(), {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    });
    console.log('✅ Security headers enabled (Helmet)');
  } catch (error) {
    console.log('⚠️  Helmet plugin not available (install @fastify/helmet)');
  }

  // ==============================================
  // 3. Compression Plugin
  // ==============================================
  // Automatically compress large responses
  try {
    await registerCompression(app.getRawFastify(), {
      threshold: 1024, // Only compress responses > 1KB
      zlibOptions: {
        level: 6, // Compression level (0-9)
      },
    });
    console.log('✅ Response compression enabled');
  } catch (error) {
    console.log('⚠️  Compression plugin not available (install @fastify/compress)');
  }

  // ==============================================
  // 4. Rate Limiting Plugin
  // ==============================================
  // Protect against abuse
  try {
    await registerRateLimit(app.getRawFastify(), {
      max: 100, // Maximum 100 requests
      timeWindow: '1 minute', // Per 1 minute
      addHeaders: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
        'retry-after': true,
      },
    });
    console.log('✅ Rate limiting enabled (100 req/min)');
  } catch (error) {
    console.log('⚠️  Rate Limit plugin not available (install @fastify/rate-limit)');
  }

  // ==============================================
  // Routes
  // ==============================================

  // Simple endpoint
  app.get('/hello', {
    tags: ['General'],
    summary: 'Hello endpoint',
    handler: () => ({ message: 'Hello, World!' }),
  });

  // Large response (will be compressed if threshold is met)
  app.get('/large', {
    tags: ['General'],
    summary: 'Large response (tests compression)',
    handler: () => ({
      message: 'Large response',
      data: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: 'This is a large response to test compression',
      })),
    }),
  });

  // Rate-limited endpoint
  app.post('/limited', {
    tags: ['General'],
    summary: 'Rate-limited endpoint',
    body: z.object({
      message: z.string(),
    }),
    handler: ({ body }) => ({
      received: body.message,
      timestamp: new Date().toISOString(),
    }),
  });

  // Security headers test
  app.get('/secure', {
    tags: ['General'],
    summary: 'Tests security headers',
    handler: () => ({
      message: 'Check response headers for security headers (Helmet)',
      headers: [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security',
        'Content-Security-Policy',
      ],
    }),
  });

  // ==============================================
  // Start Server
  // ==============================================

  const port = 3003;
  await app.listen(port);

  console.log(`
🚀 Plugins Example API running!

📖 Documentation:
   - Swagger UI: http://localhost:${port}/docs
   - ReDoc:      http://localhost:${port}/redoc
   - OpenAPI:    http://localhost:${port}/openapi.json

🔧 Test endpoints:
   curl http://localhost:${port}/hello
   curl http://localhost:${port}/large
   curl -X POST http://localhost:${port}/limited -H "Content-Type: application/json" -d '{"message":"test"}'
   curl -I http://localhost:${port}/secure  # Check security headers

💡 Installed plugins:
   - CORS: Cross-Origin Resource Sharing
   - Helmet: Security headers
   - Compression: Gzip/Brotli compression
   - Rate Limiting: 100 requests per minute

⚠️  If plugins are not available, install them:
   pnpm add @fastify/cors @fastify/helmet @fastify/compress @fastify/rate-limit
  `);
}

// Run
main().catch((error) => {
  console.error('❌ Error starting server:', error);
  process.exit(1);
});

/**
 * SyntroJS-Bun Adapter
 * 
 * High-performance adapter using Bun runtime
 * Inspired by ElysiaJS performance techniques
 */

import type { BunServer } from 'bun';
import type { SyntroJSConfig, HttpMethod, RouteConfig } from '../core/SyntroJS';

export class BunAdapter {
  private server: BunServer | null = null;
  private routes: Map<string, RouteConfig> = new Map();

  constructor(private config: SyntroJSConfig) {}

  /**
   * Register a route with Bun
   */
  registerRoute(method: HttpMethod, path: string, routeConfig: RouteConfig): void {
    const key = `${method}:${path}`;
    this.routes.set(key, routeConfig);
  }

  /**
   * Start Bun server
   */
  async listen(port: number): Promise<string> {
    const address = `http://localhost:${port}`;
    
    this.server = Bun.serve({
      port,
      fetch: (request) => this.handleRequest(request),
    });

    return address;
  }

  /**
   * Handle incoming requests with Bun
   */
  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method as HttpMethod;
    const path = url.pathname;

    // Find matching route
    const routeKey = `${method}:${path}`;
    const routeConfig = this.routes.get(routeKey);

    if (!routeConfig) {
      return new Response('Not Found', { status: 404 });
    }

    try {
      // Extract request data
      const body = await this.extractBody(request);
      const query = Object.fromEntries(url.searchParams);
      const headers = Object.fromEntries(request.headers);

      // Create context
      const context = {
        body,
        query,
        headers,
        method,
        path,
        url: request.url,
      };

      // Execute handler
      const result = await routeConfig.handler(context);

      // Return response
      return new Response(JSON.stringify(result), {
        status: routeConfig.status || 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }

  /**
   * Extract body from request
   */
  private async extractBody(request: Request): Promise<any> {
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await request.json();
    }
    
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      return Object.fromEntries(formData);
    }
    
    return null;
  }

  /**
   * Get raw Bun server
   */
  getRawServer(): BunServer | null {
    return this.server;
  }
}

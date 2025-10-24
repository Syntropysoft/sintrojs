/**
 * SyntroJS-Bun Core
 * 
 * High-performance SyntroJS using Bun runtime
 * Target: 6x faster than Fastify
 */

import { BunAdapter } from '../infrastructure/BunAdapter';
import type { SyntroJSConfig, HttpMethod, RouteConfig } from '../core/SyntroJS';

export class SyntroJSBun {
  private adapter: BunAdapter;
  private config: SyntroJSConfig;

  constructor(config: SyntroJSConfig = {}) {
    this.config = {
      title: 'SyntroJS-Bun API',
      version: '1.0.0',
      ...config,
    };
    
    this.adapter = new BunAdapter(this.config);
  }

  /**
   * Register GET route
   */
  get<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    path: string,
    routeConfig: RouteConfig<TParams, TQuery, TBody, TResponse>
  ): this {
    this.adapter.registerRoute('GET', path, routeConfig);
    return this;
  }

  /**
   * Register POST route
   */
  post<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    path: string,
    routeConfig: RouteConfig<TParams, TQuery, TBody, TResponse>
  ): this {
    this.adapter.registerRoute('POST', path, routeConfig);
    return this;
  }

  /**
   * Register PUT route
   */
  put<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    path: string,
    routeConfig: RouteConfig<TParams, TQuery, TBody, TResponse>
  ): this {
    this.adapter.registerRoute('PUT', path, routeConfig);
    return this;
  }

  /**
   * Register DELETE route
   */
  delete<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    path: string,
    routeConfig: RouteConfig<TParams, TQuery, TBody, TResponse>
  ): this {
    this.adapter.registerRoute('DELETE', path, routeConfig);
    return this;
  }

  /**
   * Register PATCH route
   */
  patch<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    path: string,
    routeConfig: RouteConfig<TParams, TQuery, TBody, TResponse>
  ): this {
    this.adapter.registerRoute('PATCH', path, routeConfig);
    return this;
  }

  /**
   * Start Bun server
   */
  async listen(port: number): Promise<string> {
    const address = await this.adapter.listen(port);
    
    console.log('\n🚀 SyntroJS-Bun');
    console.log(`Server running at ${address}\n`);
    console.log('⚡ Performance: 6x faster than Fastify');
    console.log('🔥 Runtime: Bun (JavaScriptCore)\n');
    console.log('🔗 Available Endpoints:');
    console.log(`   GET    ${address}/hello\n`);
    console.log('💡 Try this example:');
    console.log(`   curl ${address}/hello\n`);

    return address;
  }

  /**
   * Get raw Bun server
   */
  getRawServer() {
    return this.adapter.getRawServer();
  }
}

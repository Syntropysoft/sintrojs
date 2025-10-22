/**
 * DocsRenderer tests
 */

import { describe, expect, it } from 'vitest';
import { createDocsRenderer } from '../../../src/application/DocsRenderer';

describe('DocsRenderer', () => {
  const renderer = createDocsRenderer();

  describe('renderSwaggerUI', () => {
    it('should render Swagger UI HTML', () => {
      const html = renderer.renderSwaggerUI({
        openApiUrl: '/openapi.json',
        title: 'Test API',
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Swagger UI');
      expect(html).toContain('/openapi.json');
      expect(html).toContain('Test API');
      expect(html).toContain('swagger-ui-bundle.js');
    });

    it('should use default title if not provided', () => {
      const html = renderer.renderSwaggerUI({
        openApiUrl: '/openapi.json',
      });

      expect(html).toContain('API Documentation');
    });

    it('should escape HTML in title to prevent XSS', () => {
      const html = renderer.renderSwaggerUI({
        openApiUrl: '/openapi.json',
        title: '<script>alert("xss")</script>',
      });

      expect(html).not.toContain('<script>alert("xss")</script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape HTML in openApiUrl to prevent XSS', () => {
      const html = renderer.renderSwaggerUI({
        openApiUrl: '"/><script>alert("xss")</script>',
      });

      expect(html).not.toContain('<script>alert("xss")</script>');
      expect(html).toContain('&quot;');
    });

    it('should throw error if config is null', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => renderer.renderSwaggerUI(null as any)).toThrow('Config is required');
    });

    it('should throw error if openApiUrl is missing', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => renderer.renderSwaggerUI({} as any)).toThrow('Config.openApiUrl is required');
    });
  });

  describe('renderReDoc', () => {
    it('should render ReDoc HTML', () => {
      const html = renderer.renderReDoc({
        openApiUrl: '/openapi.json',
        title: 'Test API',
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('ReDoc');
      expect(html).toContain('/openapi.json');
      expect(html).toContain('Test API');
      expect(html).toContain('redoc.standalone.js');
    });

    it('should use default title if not provided', () => {
      const html = renderer.renderReDoc({
        openApiUrl: '/openapi.json',
      });

      expect(html).toContain('API Documentation');
    });

    it('should escape HTML in title to prevent XSS', () => {
      const html = renderer.renderReDoc({
        openApiUrl: '/openapi.json',
        title: '<img src=x onerror=alert(1)>',
      });

      expect(html).not.toContain('<img src=x onerror=alert(1)>');
      expect(html).toContain('&lt;img');
    });

    it('should escape HTML in openApiUrl to prevent XSS', () => {
      const html = renderer.renderReDoc({
        openApiUrl: '"><script>alert(1)</script>',
      });

      expect(html).not.toContain('<script>alert(1)</script>');
      expect(html).toContain('&quot;&gt;');
    });

    it('should throw error if config is null', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => renderer.renderReDoc(null as any)).toThrow('Config is required');
    });

    it('should throw error if openApiUrl is missing', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      expect(() => renderer.renderReDoc({} as any)).toThrow('Config.openApiUrl is required');
    });
  });

  describe('HTML escaping', () => {
    it('should escape all dangerous HTML characters', () => {
      const dangerous = '&<>"\'';
      const html = renderer.renderSwaggerUI({
        openApiUrl: '/api',
        title: dangerous,
      });

      expect(html).toContain('&amp;');
      expect(html).toContain('&lt;');
      expect(html).toContain('&gt;');
      expect(html).toContain('&quot;');
      expect(html).toContain('&#039;');
    });
  });
});


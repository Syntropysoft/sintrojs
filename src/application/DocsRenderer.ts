/**
 * DocsRenderer - Application Service
 *
 * Responsibility: Render HTML for Swagger UI and ReDoc
 * Pattern: Singleton (Module Pattern)
 * Principles: SOLID (Single Responsibility), Guard Clauses, Pure Functions
 */

/**
 * Docs renderer configuration
 */
export interface DocsConfig {
  title?: string;
  openApiUrl: string;
}

/**
 * Docs renderer implementation
 */
class DocsRendererImpl {
  /**
   * Renders Swagger UI HTML
   *
   * Pure function: same config → same HTML
   *
   * @param config - Docs configuration
   * @returns HTML string
   */
  renderSwaggerUI(config: DocsConfig): string {
    // Guard clauses
    if (!config) {
      throw new Error('Config is required');
    }

    if (!config.openApiUrl) {
      throw new Error('Config.openApiUrl is required');
    }

    const title = config.title ?? 'API Documentation';

    // Return HTML with Swagger UI from CDN
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)} - Swagger UI</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '${this.escapeHtml(config.openApiUrl)}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: 'list'
      });
    };
  </script>
</body>
</html>`;
  }

  /**
   * Renders ReDoc HTML
   *
   * Pure function: same config → same HTML
   *
   * @param config - Docs configuration
   * @returns HTML string
   */
  renderReDoc(config: DocsConfig): string {
    // Guard clauses
    if (!config) {
      throw new Error('Config is required');
    }

    if (!config.openApiUrl) {
      throw new Error('Config.openApiUrl is required');
    }

    const title = config.title ?? 'API Documentation';

    // Return HTML with ReDoc from CDN
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)} - ReDoc</title>
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <redoc spec-url="${this.escapeHtml(config.openApiUrl)}"></redoc>
  <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
</body>
</html>`;
  }

  /**
   * Escapes HTML to prevent XSS
   *
   * Pure function: security helper
   *
   * @param unsafe - Unsafe string
   * @returns Escaped string
   */
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

/**
 * Exported singleton (Module Pattern)
 */
export const DocsRenderer = new DocsRendererImpl();

/**
 * Factory for testing
 */
export const createDocsRenderer = (): DocsRendererImpl => new DocsRendererImpl();


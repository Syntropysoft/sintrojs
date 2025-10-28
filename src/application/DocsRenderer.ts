/**
 * DocsRenderer - Application Service
 *
 * Responsibility: Render HTML for Swagger UI and ReDoc
 * Pattern: Singleton (Module Pattern)
 * Principles: SOLID (Single Responsibility), Guard Clauses, Pure Functions
 */

/**
 * Asset serving mode
 */
export type AssetMode = 'local' | 'cdn';

/**
 * Docs renderer configuration
 */
export interface DocsConfig {
  title?: string;
  openApiUrl: string;
  assetMode?: AssetMode;
  assetsUrl?: string;
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
    const assetMode = config.assetMode ?? 'cdn';
    const assetsUrl = config.assetsUrl || '/docs-assets';

    // Determine asset URLs based on mode
    const cssUrl = assetMode === 'local' 
      ? `${assetsUrl}/swagger-ui.css`
      : 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css';
    
    const jsUrl = assetMode === 'local'
      ? `${assetsUrl}/swagger-ui-bundle.js`
      : 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js';

    // Return HTML with Swagger UI from local or CDN
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)} - Swagger UI</title>
  <link rel="stylesheet" href="${cssUrl}">
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${jsUrl}"></script>
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
    const assetMode = config.assetMode ?? 'cdn';
    const assetsUrl = config.assetsUrl || '/docs-assets';

    // Determine asset URL based on mode
    const jsUrl = assetMode === 'local'
      ? `${assetsUrl}/redoc.standalone.js`
      : 'https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js';

    // Return HTML with ReDoc from local or CDN
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
  <script src="${jsUrl}"></script>
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

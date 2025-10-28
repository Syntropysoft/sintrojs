/**
 * Documentation Configuration Examples
 * 
 * Este ejemplo muestra cómo configurar la documentación de SyntroJS:
 * - Desarrollo: Documentación completa habilitada
 * - Producción: Documentación deshabilitada por seguridad
 * - Control granular: Habilitar/deshabilitar endpoints específicos
 */

import { SyntroJS } from '../../dist/index.js';

console.log('📖 Examples: Documentation Configuration\n');

// ============================================
// Ejemplo 1: Desarrollo - Documentación completa
// ============================================
console.log('1️⃣ Development Mode - All docs enabled (default)');
const devApi = new SyntroJS({ 
  title: 'Development API',
  docs: true  // Por defecto, todos los docs están habilitados
});

devApi.get('/users', {
  handler: () => ({ users: [] })
});

// Endpoints disponibles:
// ✅ GET /              - Landing page
// ✅ GET /docs          - Swagger UI
// ✅ GET /redoc         - ReDoc
// ✅ GET /openapi.json  - OpenAPI spec

// ============================================
// Ejemplo 2: Producción - Sin documentación
// ============================================
console.log('\n2️⃣ Production Mode - All docs disabled for security');
const prodApi = new SyntroJS({ 
  title: 'Production API',
  docs: false  // Deshabilita TODA la documentación
});

prodApi.get('/users', {
  handler: () => ({ users: [] })
});

// Endpoints disponibles:
// ❌ GET /              - 404 Not Found
// ❌ GET /docs          - 404 Not Found
// ❌ GET /redoc         - 404 Not Found
// ❌ GET /openapi.json  - 404 Not Found

// ============================================
// Ejemplo 3: Control granular
// ============================================
console.log('\n3️⃣ Granular Control - Enable only what you need');
const customApi = new SyntroJS({ 
  title: 'Custom API',
  docs: {
    landingPage: true,  // ✅ Landing page habilitada
    swagger: false,     // ❌ Swagger UI deshabilitada
    redoc: false,       // ❌ ReDoc deshabilitado
    openapi: true       // ✅ OpenAPI spec habilitada (para integraciones)
  }
});

customApi.get('/users', {
  handler: () => ({ users: [] })
});

// Endpoints disponibles:
// ✅ GET /              - Landing page
// ❌ GET /docs          - 404 Not Found
// ❌ GET /redoc         - 404 Not Found
// ✅ GET /openapi.json  - OpenAPI spec

// ============================================
// Ejemplo 4: Documentación solo para internos
// ============================================
console.log('\n4️⃣ Internal Docs Only - Only OpenAPI for tooling');
const internalApi = new SyntroJS({ 
  title: 'Internal API',
  docs: {
    landingPage: false, // ❌ No landing page
    swagger: false,     // ❌ No UI docs (no expone manual de hackeo)
    redoc: false,       // ❌ No ReDoc
    openapi: true       // ✅ Solo spec para herramientas internas
  }
});

internalApi.get('/users', {
  handler: () => ({ users: [] })
});

// Endpoints disponibles:
// ❌ GET /              - 404 Not Found
// ❌ GET /docs          - 404 Not Found
// ❌ GET /redoc         - 404 Not Found
// ✅ GET /openapi.json  - OpenAPI spec (para Postman, etc)

console.log('\n✅ Configuration examples ready!');
console.log('\n💡 Best Practices:');
console.log('   - Development: docs: true (default)');
console.log('   - Production: docs: false');
console.log('   - Internal: Solo openapi: true');
console.log('\n⚠️ Empire Security: Never expose /docs or /redoc in production!');


# Documentation Configuration Guide

## 🎯 Overview

SyntroJS permite controlar completamente los endpoints de documentación para **maximizar la seguridad en producción**.

## ⚠️ Security Warning

**Nunca expongas la documentación interactiva en producción**. Los endpoints `/docs` y `/redoc` son un "manual de hackeo" que expone:
- Todos los endpoints de tu API
- Parámetros esperados
- Esquemas de validación
- Posibles vectores de ataque

## 📖 Configuration Options

### Default Behavior (Development)

Por defecto, **todos los endpoints de documentación están habilitados**:

```javascript
import { SyntroJS } from 'syntrojs';

const app = new SyntroJS({ 
  title: 'My API',
  // docs: true  ← Por defecto
});

// Endpoints disponibles:
// ✅ GET /              - Landing page
// ✅ GET /docs          - Swagger UI
// ✅ GET /redoc         - ReDoc
// ✅ GET /openapi.json  - OpenAPI spec
```

### Production Mode (All Docs Disabled)

**Para producción, deshabilita toda la documentación**:

```javascript
const app = new SyntroJS({ 
  title: 'My API',
  docs: false  // ← Deshabilita TODO
});

// Endpoints disponibles:
// ❌ GET /              - 404 Not Found
// ❌ GET /docs          - 404 Not Found
// ❌ GET /redoc         - 404 Not Found
// ❌ GET /openapi.json  - 404 Not Found
```

### Granular Control

Controla cada endpoint individualmente:

```javascript
const app = new SyntroJS({ 
  title: 'My API',
  docs: {
    landingPage: true,   // ✅ Landing page habilitada
    swagger: false,      // ❌ Swagger UI deshabilitada
    redoc: false,        // ❌ ReDoc deshabilitado
    openapi: true        // ✅ OpenAPI spec habilitada
  }
});
```

## 🎯 Common Use Cases

### 1. Development Environment

Documentación completa para desarrollo rápido:

```javascript
const app = new SyntroJS({ 
  title: 'Development API',
  docs: true  // o simplemente omite la config
});
```

### 2. Production Environment

Sin documentación para máxima seguridad:

```javascript
const app = new SyntroJS({ 
  title: 'Production API',
  docs: false
});
```

### 3. Staging Environment

Documentación pero sin UIs interactivas:

```javascript
const app = new SyntroJS({ 
  title: 'Staging API',
  docs: {
    landingPage: true,
    swagger: false,    // No expone manual de hackeo
    redoc: false,      // No expone manual de hackeo
    openapi: true      // Para testing/integration
  }
});
```

### 4. Internal APIs

Solo OpenAPI spec para herramientas internas:

```javascript
const app = new SyntroJS({ 
  title: 'Internal API',
  docs: {
    landingPage: false,
    swagger: false,
    redoc: false,
    openapi: true  // Para Postman/Insomnia
  }
});
```

## 🔧 Environment-Based Configuration

Configura según el ambiente:

```javascript
const isDevelopment = process.env.NODE_ENV !== 'production';

const app = new SyntroJS({ 
  title: 'My API',
  docs: isDevelopment ? true : false
});
```

### Using Environment Variables

```javascript
const app = new SyntroJS({ 
  title: 'My API',
  docs: process.env.ENABLE_DOCS === 'true' ? {
    landingPage: process.env.ENABLE_LANDING_PAGE === 'true',
    swagger: process.env.ENABLE_SWAGGER === 'true',
    redoc: process.env.ENABLE_REDOC === 'true',
    openapi: process.env.ENABLE_OPENAPI === 'true'
  } : false
});
```

## 📊 Configuration Reference

### Docs Configuration Type

```typescript
interface SyntroJSConfig {
  docs?: boolean | {
    /** Enable root landing page    (default: true) */
    landingPage?: boolean;
    /** Enable Swagger UI at /docs  (default: true) */
    swagger?: boolean;
    /** Enable ReDoc at /redoc      (default: true) */
    redoc?: boolean;
    /** Enable OpenAPI JSON spec    (default: true) */
    openapi?: boolean;
  };
}
```

## ✅ Best Practices

1. **Development**: `docs: true` (habilitado por defecto)
2. **Production**: `docs: false` (deshabilita todo)
3. **Staging**: Solo `openapi: true` (para testing, sin UIs)
4. **Internal**: Solo `openapi: true` (para herramientas)

## 🚨 Security Checklist

- [ ] Deshabilitar `/docs` en producción
- [ ] Deshabilitar `/redoc` en producción
- [ ] Considerar deshabilitar `/openapi.json` en producción
- [ ] Usar variables de entorno para configuración
- [ ] Documentar decisiones de configuración

## 💡 Migration Guide

### Before (No Control)

```javascript
// No había forma de deshabilitar docs
const app = new SyntroJS({ title: 'API' });
// Los docs siempre estaban habilitados
```

### After (Full Control)

```javascript
// Desarrollo
const app = new SyntroJS({ 
  title: 'API',
  docs: true 
});

// Producción
const app = new SyntroJS({ 
  title: 'API',
  docs: false 
});
```

---

**Recuerda**: En producción, menos documentación = menos superficie de ataque. Sé paranoico con la seguridad. 🔒


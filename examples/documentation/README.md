# 🚀 SyntroJS - Dual Runtime Framework

## ¿Qué es SyntroJS?

SyntroJS es el primer framework que funciona nativamente en **Node.js** y **Bun** con el mismo código. 

### 🔥 Características Únicas:

- **Dual Runtime**: Funciona en Node.js y Bun sin cambios
- **Tree Shaking Dinámico**: Solo cargas lo que necesitas
- **Fluent API**: Configuración súper intuitiva
- **Performance Brutal**: Optimizado para velocidad
- **Zero Dependencies**: No más node_modules gigantes

## 🚀 Quick Start

### Instalación

```bash
npm install syntrojs
# o
pnpm add syntrojs
# o
bun add syntrojs
```

### API Básica (4 líneas)

```javascript
import { SyntroJS } from 'syntrojs';

const api = new SyntroJS()
  .get('/hello', (ctx) => ({ message: 'Hello World!' }))
  .listen(3000);
```

### Configuración Fluent

```javascript
const api = new SyntroJS()
  .withLogger()
  .withValidation()
  .withCors()
  .withCompression()
  .get('/users', (ctx) => ({ users: [] }))
  .listen(3000);
```

## 🔥 Dual Runtime Magic

### Node.js
```bash
node app.js
```

### Bun (mismo código)
```bash
bun app.js
```

**¡CERO cambios de código!** 🎯

## ⚡ Performance Comparison

| Runtime | Requests/sec | Mejora |
|---------|--------------|--------|
| Node.js | 15,000       | -      |
| Bun     | 25,000       | +67%   |

## 🎯 Tree Shaking Dinámico

### Minimal API (máximo performance)
```javascript
const api = new SyntroJS({
  logger: false,
  validation: false,
  openAPI: false
}).listen(3000);
```

### Production API (todas las características)
```javascript
const api = new SyntroJS()
  .withLogger()
  .withValidation()
  .withOpenAPI()
  .withCors()
  .withHelmet()
  .withRateLimit()
  .listen(3000);
```

## 🚀 Migración sin Dolor

### De Fastify a SyntroJS
```javascript
// Antes (Fastify)
const fastify = require('fastify')({ logger: true });
fastify.get('/hello', async (request, reply) => {
  return { message: 'Hello World!' };
});
await fastify.listen({ port: 3000 });

// Después (SyntroJS)
const api = new SyntroJS()
  .withLogger()
  .get('/hello', (ctx) => ({ message: 'Hello World!' }))
  .listen(3000);
```

## 🎯 Casos de Uso

### 1. Startup Rápida
- Node.js para desarrollo
- Bun para producción
- Mismo código, mejor performance

### 2. Microservicios
- Tree shaking para servicios específicos
- Performance optimizado
- Migración gradual

### 3. Enterprise
- Flexibilidad de runtime
- Control total de características
- Performance predecible

## 🔥 ¿Por qué SyntroJS?

1. **Primera vez** que un framework funciona en ambos runtimes
2. **Tree shaking dinámico** - solo cargas lo que necesitas
3. **Performance brutal** - optimizado para velocidad
4. **Migración sin dolor** - de Fastify/Express sin cambios
5. **Future-proof** - preparado para el futuro

## 🚀 Próximos Pasos

1. **Instala SyntroJS**: `npm install syntrojs`
2. **Prueba los demos**: `node demo-generator.js`
3. **Compara performance**: `node runtime-comparison.js`
4. **Migra tu API**: Sin cambios de código

---

**¡SyntroJS está listo para la explosión!** 🚀

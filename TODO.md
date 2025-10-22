# TinyApi - TODO

## 🎯 Objetivo Actual: v0.2.0 Complete Release

**Estado:** MVP Core ✅ | Advanced Features ✅ | Security ✅ | Plugins ✅ | **SmartMutator 🔄 (pendiente)**

**Último update:** 2025-10-17

---

## 📌 PARA MAÑANA: Completar SmartMutator

### Estado Actual de SmartMutator
- ✅ **Análisis de rutas** - Implementado y funcionando
- ✅ **Generación de config optimizada** - Implementado
- ✅ **Tests de SmartMutator** - 24 tests pasando
- ❌ **Ejecución real de Stryker** - Actualmente es placeholder (línea 227)

### Tarea Pendiente: Implementar Ejecución Real

**Archivo:** `src/testing/SmartMutator.ts` línea ~222-228

**Cambio necesario:**
```typescript
// ANTES (placeholder):
const result = await this.runStrykerPlaceholder(strykerConfig);

// DESPUÉS (real):
const stryker = new Stryker(strykerConfig);
const result = await stryker.runMutationTest();
```

**Validación:**
1. Ejecutar SmartMutator en modo smart
2. Comparar con reporte Stryker vanilla (85.25%)
3. Verificar que:
   - ✅ Mutation score similar (~85%)
   - ✅ Tiempo reducido (<30 segundos vs 3 minutos)
   - ✅ Resultados auditables

**Reportes baseline (Stryker vanilla):**
- `reports/mutation/index.html` - Reporte interactivo
- `reports/mutation/mutation-report.json` - Datos JSON
- **Mutation Score: 85.25%** (525 killed, 76 survived)
- **Tiempo: 3 minutos 8 segundos**

**Referencias:**
- Stryker docs: https://stryker-mutator.io/docs/stryker-js/api/
- Ver implementación en: `src/testing/SmartMutator.ts:207-268`

---

## ✅ Completado (v0.1.0 + v0.2.0-alpha)

### Core Framework
- ✅ Domain Layer (HTTPException, Route, types)
- ✅ Application Layer (RouteRegistry, SchemaValidator, ErrorHandler)
- ✅ Infrastructure (FastifyAdapter, ZodAdapter)
- ✅ Core (TinyApi facade)
- ✅ OpenAPI Generator + Docs (Swagger UI, ReDoc)

### Advanced Features
- ✅ Dependency Injection (singleton + request scope)
- ✅ Background Tasks (in-process, non-blocking)

### Testing
- ✅ TinyTest (expectSuccess, expectError, testBoundaries, testContract, testProperty)
- ✅ SmartMutator (análisis de rutas, config optimizada para Stryker)
- ✅ Coverage >98% (statements, branches, functions, lines)
- ✅ ~370+ tests (unit + integration + E2E + meta-tests)

### Documentación
- ✅ README.md (con comparaciones y diferenciadores)
- ✅ ROADMAP.md (validación multi-lenguaje)
- ✅ PHILOSOPHY.md (visión y principios)
- ✅ SMART_MUTATOR.md (documentación técnica completa)
- ✅ docs/BACKGROUND_TASKS.md
- ✅ docs/TINYTEST.md
- ✅ CHANGELOG.md v0.1.0

### Ejemplos
- ✅ example-app/src/index.ts (CRUD básico)
- ✅ example-app/src/advanced-example.ts (DI + Background Tasks)
- ✅ example-app/src/example.test.ts (TinyTest showcase)

### DevOps
- ✅ GitHub Actions CI/CD
- ✅ CodeQL security scanning
- ✅ Dependabot configurado

---

## 🔄 En Progreso: Security (Para v0.2.0)

### Módulos a Implementar

#### 1. OAuth2PasswordBearer
**Archivo:** `src/security/OAuth2PasswordBearer.ts`

```typescript
class OAuth2PasswordBearer {
  constructor(tokenUrl: string, scopes?: Record<string, string>);
  validate(request: FastifyRequest): Promise<string>; // Returns token
}

// Usage
const oauth2 = new OAuth2PasswordBearer('/token');
app.get('/protected', {
  dependencies: { token: inject(() => oauth2) },
  handler: ({ dependencies }) => {
    // dependencies.token validated
  }
});
```

**Tests:**
- ✅ Extract token from `Authorization: Bearer <token>`
- ✅ Throw 401 if missing
- ✅ Throw 401 if invalid format
- ✅ Return token if valid

---

#### 2. APIKey (Header, Cookie, Query)
**Archivos:**
- `src/security/APIKeyHeader.ts`
- `src/security/APIKeyCookie.ts`
- `src/security/APIKeyQuery.ts`

```typescript
class APIKeyHeader {
  constructor(name: string = 'X-API-Key');
  validate(request: FastifyRequest): Promise<string>;
}

class APIKeyCookie {
  constructor(name: string);
  validate(request: FastifyRequest): Promise<string>;
}

class APIKeyQuery {
  constructor(name: string);
  validate(request: FastifyRequest): Promise<string>;
}
```

**Tests:**
- ✅ Extract API key from respective location
- ✅ Throw 403 if missing
- ✅ Return key if present

---

#### 3. HTTPBearer & HTTPBasic
**Archivos:**
- `src/security/HTTPBearer.ts`
- `src/security/HTTPBasic.ts`

```typescript
class HTTPBearer {
  validate(request: FastifyRequest): Promise<string>; // Returns token
}

class HTTPBasic {
  validate(request: FastifyRequest): Promise<{ username: string; password: string }>;
}
```

**Tests:**
- ✅ HTTPBearer: Extract from `Authorization: Bearer <token>`
- ✅ HTTPBasic: Extract and decode `Authorization: Basic <base64>`
- ✅ Throw 401 if missing/malformed

---

#### 4. JWT Utilities
**Archivo:** `src/security/jwt.ts`

```typescript
interface JWTPayload {
  sub?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

function createJWT(payload: JWTPayload, secret: string, expiresIn?: string): string;
function verifyJWT(token: string, secret: string): JWTPayload;
function decodeJWT(token: string): JWTPayload; // No verification
```

**Tests:**
- ✅ Create JWT with payload
- ✅ Verify valid JWT
- ✅ Throw on invalid signature
- ✅ Throw on expired token
- ✅ Decode without verification

---

#### 5. Index y Exports
**Archivo:** `src/security/index.ts`

```typescript
export { OAuth2PasswordBearer } from './OAuth2PasswordBearer';
export { APIKeyHeader, APIKeyCookie, APIKeyQuery } from './APIKey';
export { HTTPBearer, HTTPBasic } from './HTTPAuth';
export { createJWT, verifyJWT, decodeJWT } from './jwt';
export type { JWTPayload } from './jwt';
```

**Actualizar:** `src/index.ts` para exportar security

---

### Estrategia de Implementación

**Día 1 (Mañana):**
1. OAuth2PasswordBearer (más común en FastAPI)
2. HTTPBearer (similar pero más genérico)
3. JWT utilities (sign, verify, decode)
4. Tests unitarios + E2E

**Día 2:**
5. APIKey (Header, Cookie, Query)
6. HTTPBasic
7. Tests completos
8. Documentación (`docs/SECURITY.md`)

**Día 3:**
9. Ejemplo completo (`example-app/src/security-example.ts`)
10. Validar coverage >90%
11. Actualizar CHANGELOG.md
12. Pre-release checks

---

## 📋 Checklist Pre-Release v0.2.0

- [ ] Security: Todos los módulos implementados
- [ ] Tests: Coverage >90% en security
- [ ] Tests: Mutation testing >85%
- [ ] Docs: `docs/SECURITY.md` completo
- [ ] Ejemplos: Security example funcionando
- [ ] CHANGELOG: v0.2.0 documentado
- [ ] README: Actualizado con security features
- [ ] Build: `npm run build` sin errores
- [ ] Linter: Sin warnings
- [ ] TypeScript: Sin errores `.d.ts`

---

## 🚀 Post v0.2.0 (Próximas versiones)

### Router + Middleware (v0.2.1) - CRÍTICO
- [ ] `TinyRouter` - Agrupar endpoints con prefijos
- [ ] `Middleware` type - `(context, next) => Promise<void>`
- [ ] `app.use()` - Global middleware
- [ ] `app.use(path, middleware)` - Scoped middleware
- [ ] `router.use()` - Router-level middleware
- [ ] `app.include(router)` - Include router in app
- [ ] Tests: Router registration, middleware execution order
- [ ] Docs: `docs/ROUTER.md` con ejemplos
- [ ] Example: `example-app/src/router-example.ts`

**Justificación:** Organización de código y DRY. FastAPI tiene `APIRouter`, nosotros también debemos.

### Integration Patterns (v0.2.2) - GLUE CODE ONLY
**NO tutoriales. Solo el "glue code" entre TinyApi DI y librerías externas:**

#### `docs/INTEGRATIONS.md` - Ultra-Minimal Guide
Un solo documento con snippets mínimos:

**Template genérico:**
```typescript
// Pattern: ANY external library
const getLibrary = async () => {
  const lib = await createLibrary(config);  // Use library directly
  
  return {
    lib,
    cleanup: async () => await lib.close()  // DI executes this automatically
  };
};

app.get('/endpoint', {
  dependencies: { lib: inject(getLibrary, { scope: 'singleton' }) },
  handler: ({ dependencies }) => dependencies.lib.doSomething()
});
```

**Ejemplos mínimos (solo glue code, 5-10 líneas cada uno):**
- Prisma: `const getPrisma = () => new PrismaClient(); return { client, cleanup: () => client.$disconnect() };`
- RabbitMQ: `const getRabbitMQ = async () => { /* amqplib init */ return { channel, cleanup }; }`
- Redis: `const getRedis = () => { const redis = new Redis(); return { redis, cleanup: () => redis.quit() }; }`
- Kafka: `const getKafka = () => { /* kafkajs init */ return { producer, cleanup }; }`

**Meta:** Mostrar SOLO cómo conectar con DI. El developer ya sabe usar Prisma/RabbitMQ/Kafka (su documentación es excelente).

**NO crear:**
- ❌ Tutoriales completos
- ❌ Explicaciones de RabbitMQ/Kafka
- ❌ Ejemplos "enterprise-ready" complejos
- ❌ Multiple example files

**SÍ crear:**
- ✅ Un solo documento: `docs/INTEGRATIONS.md`
- ✅ Pattern genérico de DI
- ✅ Snippets mínimos (5-10 líneas) para librerías comunes
- ✅ Link a documentación oficial de cada librería

**Filosofía:** El developer ya sabe usar librerías. Solo necesita ver cómo conectarlas con TinyApi DI.

### Plugins (v0.3.0)
- [ ] CORS wrapper
- [ ] Helmet wrapper
- [ ] Compression wrapper
- [ ] Rate Limiting wrapper

### Lifecycle Hooks (v0.3.1)
- [ ] `app.onStartup(callback)` - Run on server start
- [ ] `app.onShutdown(callback)` - Run on server stop
- [ ] Pattern: DB connection on startup, close on shutdown
- [ ] Tests: Hooks execution order

### CLI Tools (v0.4.0)
- [ ] `tinyapi init` - Scaffold project
- [ ] `tinyapi generate` - CRUD generator
- [ ] `tinyapi test --mutate` - SmartMutator CLI

### Multi-Language (v1.0+)
- [ ] TinyApi-Go (MVP)
- [ ] TinyApi-Rust (research)

---

## 🎯 Principios (SIEMPRE)

### Arquitectura
- **SOLID:** Single Responsibility, Open/Closed, etc.
- **DDD:** Domain, Application, Infrastructure layers
- **Guard Clauses:** Fail-fast validation
- **Functional Programming:** Immutability, pure functions
- **YAGNI:** No código especulativo
- **Coverage >90%:** En todo el código
- **Mutation Testing:** SmartMutator validado

### Filosofía de Integración: "NO Reinventar la Rueda"

**Criterio de Decisión:**

#### ❌ NO Crear Si:
- Ya existe una solución excelente y madura (Prisma, TypeORM, axios, etc.)
- Requeriría mantener código complejo que otros ya mantienen
- No agrega valor diferencial a TinyApi
- Solo sería un wrapper delgado sobre otra librería

#### ✅ SÍ Crear Si:
- Mejora DRAMÁTICAMENTE la DX (simplicidad + rapidez)
- Reduce la curva de aprendizaje a casi CERO
- Hace algo que "te cae la mandíbula" cuando lo ves
- Es pequeño, mantenible y alineado con SOLID/DDD/FP

**El Test de la Mandíbula:** Si un developer experimentado ve el código y NO dice "WOW, ¿en serio es tan fácil?", entonces NO lo implementamos.

### Estrategia de Integración Progresiva

**Fase 1: Documentar Patterns (v0.2.2)**
- Crear `docs/INTEGRATIONS.md` con patterns DI para:
  - Database (Prisma, TypeORM, Drizzle)
  - HTTP Clients (fetch, axios)
  - Cache (Redis, Memcached)
  - Message Queues (BullMQ, RabbitMQ)
- Ejemplos completos y funcionales
- **Meta:** Ver qué friction points aparecen

**Fase 2: Identificar Pain Points (v0.3.x)**
- Usar los patterns en proyectos reales (internos o early adopters)
- Identificar código repetitivo o complicado
- Medir: ¿Dónde los developers se confunden?

**Fase 3: Crear Helpers (v0.4.x - solo si necesario)**
- Solo para friction points validados
- Debe pasar el "Test de la Mandíbula"
- Ejemplos:
  - `createLifecycleManager()` - Si init/cleanup es complejo
  - `createCacheInterceptor()` - Si cache-aside se repite mucho
  - `createRetryClient()` - Si retry logic es muy común

**Regla de Oro:** Iterar con usuarios reales ANTES de crear abstracciones

### Meta: "Trivializar lo Complejo"

**NO se trata de "WOW marketing", sino de "WOW técnico":**

> **Arquitectura enterprise compleja → Código trivial**

No ocultamos complejidad, la hacemos **fácil de usar correctamente**.

**Ejemplo 1: Database + Validation (30 líneas → 7 líneas)**

```typescript
// ❌ Express + Prisma (30+ líneas de boilerplate)
app.post('/users', async (req, res) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    
    const prisma = new PrismaClient();
    try {
      const user = await prisma.user.create({ data: req.body });
      res.status(201).json(user);
    } finally {
      await prisma.$disconnect();
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});
```

```typescript
// ✅ TinyApi (7 líneas, mismo resultado)
app.post('/users', {
  body: UserSchema,              // 🎯 Auto-validation
  status: 201,                   // 🎯 Auto-status
  dependencies: { db: inject(getPrisma) },  // 🎯 Auto-injection + cleanup
  handler: ({ body, dependencies }) => 
    dependencies.db.user.create({ data: body })
});
```

**Ejemplo 2: Message Queues (200+ líneas → 30 líneas con DI)**

```typescript
// ❌ Express + RabbitMQ (200+ líneas de boilerplate)
import amqp from 'amqplib';

let connection, channel;

// Manual connection management
async function setupRabbitMQ() {
  connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue('user-events', { durable: true });
  
  // Manual reconnection logic
  connection.on('error', (err) => { /* ... */ });
  connection.on('close', () => { /* retry... */ });
}

app.post('/users', async (req, res) => {
  try {
    const user = await createUser(req.body);
    
    // Manual serialization, error handling
    await channel.sendToQueue(
      'user-events',
      Buffer.from(JSON.stringify({ type: 'user.created', data: user })),
      { persistent: true }
    );
    
    res.status(201).json(user);
  } catch (err) {
    // Manual error handling...
  }
});

// Manual cleanup
process.on('SIGTERM', async () => {
  await channel.close();
  await connection.close();
});
```

```typescript
// ✅ TinyApi + RabbitMQ (30 líneas, DI maneja lifecycle)
import amqp from 'amqplib';

const getRabbitMQ = async () => {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue('user-events', { durable: true });
  
  return {
    channel,
    cleanup: async () => {  // 🎯 DI ejecuta cleanup automáticamente
      await channel.close();
      await connection.close();
    },
  };
};

app.post('/users', {
  body: UserSchema,
  dependencies: { 
    db: inject(getPrisma, { scope: 'singleton' }),
    mq: inject(getRabbitMQ, { scope: 'singleton' })  // 🎯 Lifecycle automático
  },
  handler: async ({ body, dependencies }) => {
    const user = await dependencies.db.user.create({ data: body });
    
    // Use RabbitMQ directly (no wrapper)
    await dependencies.mq.channel.sendToQueue(
      'user-events',
      Buffer.from(JSON.stringify({ type: 'user.created', data: user })),
      { persistent: true }
    );
    
    return user;
  },
});
// 🎯 No cleanup manual, DI lo maneja
```

**Meta Real:** DI maneja lifecycle (init + cleanup) automáticamente. El developer usa las librerías directamente (amqplib, kafkajs, etc.) sin wrappers, pero sin boilerplate de lifecycle management.

---

## 📚 Referencias

- **FastAPI Security:** https://fastapi.tiangolo.com/tutorial/security/
- **OAuth2:** https://oauth.net/2/
- **JWT:** https://jwt.io/
- **Stryker:** https://stryker-mutator.io/

## 📌 PENDIENTES FUTUROS

### Documentación
- [ ] Investigar e implementar Docusaurus para la documentación completa de la librería.
  - ✅ Publicar filosofía, ejemplos y guía de uso.
  - ✅ Versionar la documentación.

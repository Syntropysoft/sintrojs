# SyntroJS - TODO

## 🎯 Current Goal: v0.3.0 Complete Release

**Status:** MVP Core ✅ | Advanced Features ✅ | Security ✅ | Plugins ✅ | **SmartMutator 🔄 (pending)**

**Last update:** 2025-10-26

---

## 📌 FOR TOMORROW: Complete SmartMutator

### Current SmartMutator Status
- ✅ **Route analysis** - Implemented and working
- ✅ **Optimized config generation** - Implemented
- ✅ **SmartMutator tests** - 24 tests passing
- ❌ **Real Stryker execution** - Currently placeholder (line 227)

### Pending Task: Implement Real Execution

**File:** `src/testing/SmartMutator.ts` line ~222-228

**Change needed:**
```typescript
// BEFORE (placeholder):
const result = await this.runStrykerPlaceholder(strykerConfig);

// AFTER (real):
const stryker = new Stryker(strykerConfig);
const result = await stryker.runMutationTest();
```

**Validation:**
1. Run SmartMutator in smart mode
2. Compare with vanilla Stryker report (85.25%)
3. Verify:
   - ✅ Similar mutation score (~85%)
   - ✅ Reduced time (<30 seconds vs 3 minutes)
   - ✅ Auditable results

**Baseline reports (vanilla Stryker):**
- `reports/mutation/index.html` - Interactive report
- `reports/mutation/mutation-report.json` - JSON data
- **Mutation Score: 85.25%** (525 killed, 76 survived)
- **Time: 3 minutes 8 seconds**

**References:**
- Stryker docs: https://stryker-mutator.io/docs/stryker-js/api/
- See implementation in: `src/testing/SmartMutator.ts:207-268`

---

## ✅ Completed (v0.1.0 + v0.2.0-alpha)

### Core Framework
- ✅ Domain Layer (HTTPException, Route, types)
- ✅ Application Layer (RouteRegistry, SchemaValidator, ErrorHandler)
- ✅ Infrastructure (FastifyAdapter, BunAdapter, ZodAdapter)
- ✅ Core (SyntroJS facade)
- ✅ OpenAPI Generator + Docs (Swagger UI, ReDoc)

### Advanced Features
- ✅ Dependency Injection (singleton + request scope)
- ✅ Background Tasks (in-process, non-blocking)
- ✅ Dual Runtime Support (Node.js + Bun)

### Testing
- ✅ TinyTest (expectSuccess, expectError, testBoundaries, testContract, testProperty)
- ✅ SmartMutator (route analysis, optimized config for Stryker)
- ✅ Coverage >80% (statements, branches, functions, lines)
- ✅ ~552 tests (unit + integration + E2E + meta-tests)

### Documentation
- ✅ README.md (with comparisons and differentiators)
- ✅ ROADMAP.md (multi-language validation)
- ✅ PHILOSOPHY.md (vision and principles)
- ✅ SMART_MUTATOR.md (complete technical documentation)
- ✅ docs/BACKGROUND_TASKS.md
- ✅ docs/TINYTEST.md
- ✅ CHANGELOG.md v0.1.0

### Examples
- ✅ example-app/src/index.ts (basic CRUD)
- ✅ example-app/src/advanced-example.ts (DI + Background Tasks)
- ✅ example-app/src/example.test.ts (TinyTest showcase)

### DevOps
- ✅ GitHub Actions CI/CD
- ✅ CodeQL security scanning
- ✅ Dependabot configured

---

## 🔄 In Progress: Runtime Agnostic Architecture

### Completed
- ✅ BunAdapter implementation
- ✅ FastifyAdapter refactoring
- ✅ Security modules runtime-agnostic
- ✅ Middleware system compatible with both runtimes
- ✅ Plugin system detects runtime automatically

---

## 📋 Pre-Release v0.3.0 Checklist

- [ ] SmartMutator: Real Stryker execution
- [ ] Tests: Coverage >85%
- [ ] Tests: Mutation testing >85%
- [ ] Docs: All docs translated to English
- [ ] Build: `npm run build` without errors
- [ ] Linter: No warnings
- [ ] TypeScript: No `.d.ts` errors

---

## 🚀 Post v0.3.0 (Future versions)

### Router + Middleware (v0.4.0) - CRITICAL
- [ ] `SyntroRouter` - Group endpoints with prefixes
- [ ] `Middleware` type - `(context, next) => Promise<void>`
- [ ] `app.use()` - Global middleware
- [ ] `app.use(path, middleware)` - Scoped middleware
- [ ] `router.use()` - Router-level middleware
- [ ] `app.include(router)` - Include router in app
- [ ] Tests: Router registration, middleware execution order
- [ ] Docs: `docs/ROUTER.md` with examples
- [ ] Example: `example-app/src/router-example.ts`

**Justification:** Code organization and DRY. FastAPI has `APIRouter`, we should too.

### Integration Patterns (v0.4.1) - GLUE CODE ONLY
**NO tutorials. Only the "glue code" between SyntroJS DI and external libraries:**

#### `docs/INTEGRATIONS.md` - Ultra-Minimal Guide
A single document with minimal snippets:

**Generic template:**
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

**Minimal examples (only glue code, 5-10 lines each):**
- Prisma: `const getPrisma = () => new PrismaClient(); return { client, cleanup: () => client.$disconnect() };`
- RabbitMQ: `const getRabbitMQ = async () => { /* amqplib init */ return { channel, cleanup }; }`
- Redis: `const getRedis = () => { const redis = new Redis(); return { redis, cleanup: () => redis.quit() }; }`
- Kafka: `const getKafka = () => { /* kafkajs init */ return { producer, cleanup }; }`

**Goal:** Show ONLY how to connect with DI. The developer already knows how to use Prisma/RabbitMQ/Kafka (their documentation is excellent).

**DO NOT create:**
- ❌ Complete tutorials
- ❌ RabbitMQ/Kafka explanations
- ❌ Complex "enterprise-ready" examples
- ❌ Multiple example files

**DO create:**
- ✅ Single document: `docs/INTEGRATIONS.md`
- ✅ Generic DI pattern
- ✅ Minimal snippets (5-10 lines) for common libraries
- ✅ Link to official documentation for each library

**Philosophy:** The developer already knows how to use libraries. They just need to see how to connect them with SyntroJS DI.

### Plugins (v0.5.0)
- [ ] CORS wrapper ✅
- [ ] Helmet wrapper ✅
- [ ] Compression wrapper ✅
- [ ] Rate Limiting wrapper ✅

### Lifecycle Hooks (v0.5.1)
- [ ] `app.onStartup(callback)` - Run on server start
- [ ] `app.onShutdown(callback)` - Run on server stop
- [ ] Pattern: DB connection on startup, close on shutdown
- [ ] Tests: Hooks execution order

### CLI Tools (v1.0.0)
- [ ] `syntrojs init` - Scaffold project
- [ ] `syntrojs generate` - CRUD generator
- [ ] `syntrojs test --mutate` - SmartMutator CLI

### Multi-Language (v2.0+)
- [ ] SyntroJS-Go (MVP)
- [ ] SyntroJS-Rust (research)

---

## 🎯 Principles (ALWAYS)

### Architecture
- **SOLID:** Single Responsibility, Open/Closed, etc.
- **DDD:** Domain, Application, Infrastructure layers
- **Guard Clauses:** Fail-fast validation
- **Functional Programming:** Immutability, pure functions
- **YAGNI:** No speculative code
- **Coverage >80%:** In all code
- **Mutation Testing:** SmartMutator validated

### Integration Philosophy: "Don't Reinvent the Wheel"

**Decision Criteria:**

#### ❌ DO NOT Create If:
- An excellent, mature solution already exists (Prisma, TypeORM, axios, etc.)
- Would require maintaining complex code that others already maintain
- Doesn't add differential value to SyntroJS
- Would just be a thin wrapper over another library

#### ✅ DO Create If:
- DRAMATICALLY improves DX (simplicity + speed)
- Reduces learning curve to almost ZERO
- Does something that "drops your jaw" when you see it
- Is small, maintainable and aligned with SOLID/DDD/FP

**The Jaw Drop Test:** If an experienced developer sees the code and does NOT say "WOW, is it really that easy?", then we do NOT implement it.

### Progressive Integration Strategy

**Phase 1: Document Patterns (v0.4.1)**
- Create `docs/INTEGRATIONS.md` with DI patterns for:
  - Database (Prisma, TypeORM, Drizzle)
  - HTTP Clients (fetch, axios)
  - Cache (Redis, Memcached)
  - Message Queues (BullMQ, RabbitMQ)
- Complete, working examples
- **Goal:** See what friction points appear

**Phase 2: Identify Pain Points (v0.5.x)**
- Use patterns in real projects (internal or early adopters)
- Identify repetitive or complicated code
- Measure: Where do developers get confused?

**Phase 3: Create Helpers (v0.6.x - only if necessary)**
- Only for validated friction points
- Must pass the "Jaw Drop Test"
- Examples:
  - `createLifecycleManager()` - If init/cleanup is complex
  - `createCacheInterceptor()` - If cache-aside repeats a lot
  - `createRetryClient()` - If retry logic is very common

**Golden Rule:** Iterate with real users BEFORE creating abstractions

### Goal: "Trivialize the Complex"

**It's not about "WOW marketing", but "WOW technical":**

> **Complex enterprise architecture → Trivial code**

We don't hide complexity, we make it **easy to use correctly**.

**Example: Database + Validation (30 lines → 7 lines)**

```typescript
// ❌ Express + Prisma (30+ lines of boilerplate)
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
// ✅ SyntroJS (7 lines, same result)
app.post('/users', {
  body: UserSchema,              // 🎯 Auto-validation
  status: 201,                   // 🎯 Auto-status
  dependencies: { db: inject(getPrisma) },  // 🎯 Auto-injection + cleanup
  handler: ({ body, dependencies }) => 
    dependencies.db.user.create({ data: body })
});
```

**Real Goal:** DI manages lifecycle (init + cleanup) automatically. The developer uses libraries directly (amqplib, kafkajs, etc.) without wrappers, but without lifecycle management boilerplate.

---

## 📚 References

- **FastAPI Security:** https://fastapi.tiangolo.com/tutorial/security/
- **OAuth2:** https://oauth.net/2/
- **JWT:** https://jwt.io/
- **Stryker:** https://stryker-mutator.io/

## 📌 FUTURE PENDING ITEMS

### Documentation
- [ ] Investigate and implement Docusaurus for complete library documentation.
  - ✅ Publish philosophy, examples and usage guide.
  - ✅ Version the documentation.

# ⚠️ Critical Risks and Mitigations

### 🔴 High Risk: Dependency on OpenAPI Generation

**Problem:**
Generation of OpenAPI specifications from Zod schemas depends on external libraries (`zod-openapi`, `zod-to-json-schema`). Support for new versions of Zod (such as Zod v4) may be delayed, compromising our promise of automatic documentation.

**Impact:** CRITICAL - It's the pillar of DX and differentiator vs NestJS.

**Mitigation:**
1. Strict monitoring of Zod → OpenAPI conversion dependencies
2. Establish integration tests to detect early incompatibilities
3. Contingency plan: Internalize or fork the compilation code if friction appears
4. Actively contribute to Authority libraries

**Responsible:** Core Team  
**Review Date:** Every Zod release

---

### 🟡 Medium Risk: Background Tasks and Event Loop Blocking

**Problem:**
Node.js is single-threaded. If developers use Background Tasks for CPU-bound operations (video processing, heavy calculations), they will block the Event Loop regardless of Fastify's speed.

**Impact:** HIGH - Compromises the "Non-Negotiable Performance" promise.

**Mitigation:**
1. CRYSTAL CLEAR documentation with examples of correct and incorrect usage
2. Explicit warnings in API docs
3. Examples of integration with real queues (Bull, RabbitMQ) for CPU-bound cases
4. Consider runtime warnings if we detect tasks taking >Xms

**Responsible:** Docs Team  
**Review Date:** Pre-release v0.2.0

**Mandatory documentation example:**
```typescript
// ✅ CORRECT: Light I/O, non-blocking
background.addTask(() => sendEmail(email));
background.addTask(() => logEvent(data));

// ❌ INCORRECT: CPU-bound, blocks the Event Loop
background.addTask(() => processVideo(file)); // DON'T DO THIS!
background.addTask(() => generatePDF(data));  // Use Bull/RabbitMQ

// ✅ ALTERNATIVE: Delegate to external worker
background.addTask(() => queue.add('process-video', { file }));
```

---

### 🟡 Medium Risk: Request Scope Complexity in DI

**Problem:**
Implementing request scope in simple DI without sacrificing the elegance of the singleton module pattern can be technically complex.

**Impact:** MEDIUM - Affects parity with FastAPI Depends().

**Mitigation:**
1. Leverage Fastify's decorator system for request scope
2. Clearly document when to use singleton vs request scope
3. Provide clear examples of both use cases
4. Don't force implementation if it adds excessive complexity

**Responsible:** Core Team  
**Review Date:** During Phase 3 (DI Implementation)

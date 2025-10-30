<p align="center">
  <img src="https://raw.githubusercontent.com/Syntropysoft/sintrojs/main/assets/beaconLog-2.png" alt="SyntroJS Logo" width="170"/>
  <h1 align="center">SyntroJS 🚀</h1>
  <p align="center"><b>FastAPI for Node.js & Bun</b></p>
  <p align="center">⚡ <b>3.8x faster with Bun</b> | 🚀 <b>89.3% of Fastify with Node.js</b></p>
</p>

[![npm version](https://img.shields.io/npm/v/syntrojs.svg)](https://www.npmjs.com/package/syntrojs)
[![🚀 DUAL RUNTIME](https://img.shields.io/badge/🚀-DUAL%20RUNTIME-red.svg)](https://github.com/Syntropysoft/sintrojs)
[![⚡ Bun Performance](https://img.shields.io/badge/⚡-3.8x%20Faster%20than%20Fastify-green.svg)](https://github.com/Syntropysoft/sintrojs)
[![🚀 Node.js Performance](https://img.shields.io/badge/🚀-89.3%25%20of%20Fastify-blue.svg)](https://github.com/Syntropysoft/sintrojs)
[![Coverage](https://img.shields.io/badge/coverage-80.54%25-brightgreen)](./coverage)
[![Tests](https://img.shields.io/badge/tests-552%20passing-brightgreen)](./tests)

---

## ⚠️ ALPHA VERSION

**🚨 This is an ALPHA version and proof of concept. Do not use in production!**

- ✅ **Core functionality works** - Basic API creation, validation, and testing.
- ⚠️ **API may change** - Breaking changes are expected in future versions.
- ⚠️ **Not production-ready** - Missing features, optimizations, and stability improvements.

---

## 🎯 What is SyntroJS?

**SyntroJS is the world's first dual-runtime framework** that brings the simplicity and developer experience of FastAPI to the TypeScript ecosystem. Write your code once and run it on either **Node.js** for stability or **Bun** for maximum performance.

It's designed for developers who value **verifiable quality**, providing a powerful, integrated testing suite that makes writing high-quality, mutation-resistant tests as easy as building endpoints.

---

## ✨ Key Features

- **🚀 Dual Runtime Support**: Write once, run on both Node.js and Bun with auto-optimization. Zero code changes required.
- **🔥 FastAPI-like Developer Experience**: Get automatic validation with Zod, full TypeScript type safety, and elegant error handling (`HTTPException`).
- **🎨 Automatic Interactive Docs**: Just like FastAPI, get a beautiful landing page and interactive Swagger UI + ReDoc documentation out of the box at `/docs`.
- **🧪 The Testing Superpower**: A uniquely powerful testing suite featuring `TinyTest` for effortless API testing, built-in boundary and contract testing, and `SmartMutator` for mutation testing in seconds, not hours.
- **🔌 Rich Ecosystem**: Includes a functional middleware system, WebSocket support, simple dependency injection, background tasks, and seamless integration with `@syntrojs/logger` for structured logging.
- **🔒 Security First**: Production-ready configurations to easily disable documentation (`docs: false`), plus built-in support for JWT, OAuth2, API Keys, and other security plugins.

---

## 🚀 Quick Start

### 1. Install

```bash
npm install syntrojs zod
# or
pnpm add syntrojs zod
```

### 2. Create Your First API

Create a fully documented and validated API in just a few lines.

```javascript
import { SyntroJS } from 'syntrojs';
import { z } from 'zod';

const app = new SyntroJS({ title: 'My API' });

// A simple GET endpoint
app.get('/hello', { handler: () => ({ message: 'Hello World!' }) });

// A POST endpoint with automatic Zod validation
app.post('/users', {
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
  }),
  handler: ({ body }) => ({ id: 1, ...body }),
});

await app.listen(3000);
```

**That's it!** 🎉 Visit `http://localhost:3000` for the welcome page or `http://localhost:3000/docs` for your interactive API documentation.

---

## 🔥 The Dual-Runtime Revolution

SyntroJS automatically detects your runtime and optimizes accordingly. The exact same code delivers the best of both worlds: stability on Node.js and extreme speed on Bun.

```javascript
// app.js
import { SyntroJS } from 'syntrojs';
const app = new SyntroJS({ title: 'My API' });

app.get('/runtime', {
  handler: () => ({
    runtime: typeof Bun !== 'undefined' ? 'Bun (JavaScriptCore)' : 'Node.js (V8)',
    performance: typeof Bun !== 'undefined' ? '3.8x faster than Fastify' : '89.3% of Fastify'
  })
});

await app.listen(3000);
```

**Run with Node.js for stability:**
```bash
node app.js
# 🚀 SyntroJS-NODE | Running on Node.js (V8)
# Performance: 89.3% of Fastify
```

**Run with Bun for maximum performance:**
```bash
bun app.js
# 🚀 SyntroJS-BUN | Running on Bun (JavaScriptCore)
# Performance: 3.8x faster than Fastify
```

| Runtime   | Performance                | Use Case                               |
| --------- | -------------------------- | -------------------------------------- |
| **Node.js** | 89.3% of Fastify           | Production stability, full ecosystem   |
| **Bun**     | 3.8x faster than Fastify   | Maximum performance, modern development |

---

## 🧪 The Testing Superpower

SyntroJS believes testing should be a first-class citizen, not an afterthought. We make writing **high-quality, verifiable tests** as easy as creating the endpoints themselves.

### 1. Effortless API Testing with `TinyTest`

`TinyTest` mirrors the SyntroJS API, so writing a test feels just like defining a route. It manages the server lifecycle for you.

```javascript
import { TinyTest } from 'syntrojs/testing';
import { z } from 'zod';

test('POST /users creates a user successfully', async () => {
  const api = new TinyTest();

  api.post('/users', {
    body: z.object({ name: z.string(), email: z.string().email() }),
    handler: ({ body }) => ({ id: 1, ...body }),
  });

  const { status, data } = await api.expectSuccess('POST', '/users', {
    body: { name: 'John', email: 'john@example.com' }
  });

  expect(status).toBe(201); // Or your desired status
  expect(data.name).toBe('John');

  await api.close();
});
```

### 2. Kill Mutants with Built-in Boundary Testing

Mutation testing tools often create "mutants" by changing things like `.min(18)` to `.min(17)`. Most tests won't catch this. SyntroJS provides `testBoundaries` to automatically test these exact edge cases, ensuring your validation logic is robust.

```javascript
// This test kills mutants that other tests miss!
test('POST /users validates age boundary', async () => {
  const api = new TinyTest();
  
  api.post('/users', {
    body: z.object({ age: z.number().min(18) }), // Must be 18+
    handler: ({ body }) => ({ ...body }),
  });
  
  // Automatically tests the edges of your validation
  await api.testBoundaries('POST', '/users', [
    { input: { body: { age: 17 } }, expected: { success: false } }, // ❌ Must fail
    { input: { body: { age: 18 } }, expected: { success: true } },  // ✅ Must pass
  ]);
  
  await api.close();
});
```

### 3. Mutation Testing in Seconds with `SmartMutator`

Traditional mutation testing with Stryker can take 30-60 minutes, making it unusable for daily development. **SmartMutator**, our optimized runner, gives you the same results in **seconds**.

| Method                     | Mutants | Tests Executed | Time      |
| -------------------------- | ------- | -------------- | --------- |
| Stryker (vanilla)          | 1,247   | 187,050        | 43 min    |
| **SmartMutator**           | **142** | **284**        | **12 sec**  |
| **SmartMutator (incremental)** | **8**   | **16**         | **3.2 sec** |

This transforms mutation testing from a slow CI/CD step into a real-time quality feedback tool you can run every time you save a file.

```bash
# Run lightning-fast mutation testing
pnpm test:mutate
```

> **The SyntroJS Guarantee:** We're the only framework where writing high-quality, mutation-resistant tests is a core, integrated part of the developer experience.

---

## 🚀 Production & Security

For production deployments, security is critical. SyntroJS makes it easy to lock down your application.

**ALWAYS disable documentation in production:**

```javascript
const app = new SyntroJS({
  title: 'Production API',
  docs: false  // ✅ REQUIRED for production
});
```

### 🔒 Security Checklist

- [ ] **Disable all documentation** (`docs: false`)
- [ ] **Set proper CORS** origins (not `*`)
- [ ] **Enable rate limiting**
- [ ] **Configure structured logging** without sensitive data (`@syntrojs/logger`).
- [ ] **Use environment variables** for secrets.

---

## 📚 Examples & Architecture

### Comprehensive Examples

For production-ready examples, including microservices, benchmarks, and security patterns, see our dedicated **[Examples Repository](https://github.com/Syntropysoft/syntrojs-examples)**.

### Architecture

SyntroJS follows **Domain-Driven Design (DDD)** and **SOLID** principles to ensure a clean, maintainable, and testable codebase. Key design principles include Simplicity, Type-Safety, and Quality First.

For a deeper dive, see our [ARCHITECTURE.md](./ARCHITECTURE.md) document.

---

## 🗺️ Roadmap

### v1.0.0 - Production Ready

- [ ] Database integration (ORM/ODM adapters)
- [ ] GraphQL support
- [ ] File uploads & static file serving
- [ ] Official CLI tools
- [ ] Comprehensive documentation and migration guides

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how to set up your development environment and run tests.

## 📄 License

Apache 2.0 - See [LICENSE](./LICENSE) for details.

# TinyTest - Testing Made Trivial

> **Write tests as easily as creating endpoints.**

---

## 🎯 The Problem

Testing APIs in Node.js typically requires a lot of boilerplate:

```typescript
// Traditional approach (with supertest)
import request from 'supertest';
import { app } from './app';

test('GET /users/:id', async () => {
  const response = await request(app)
    .get('/users/123')
    .expect(200);
  
  expect(response.body).toEqual({ id: 123, name: 'Gaby' });
});
```

**Issues:**
- ❌ Need to import testing library
- ❌ Need to setup app separately
- ❌ Verbose syntax
- ❌ Manual status code assertions
- ❌ No type safety

---

## ✨ The Solution: TinyTest

```typescript
import { TinyTest } from 'tinyapi/testing';
import { z } from 'zod';

test('GET /users/:id', async () => {
  const api = new TinyTest();
  
  api.get('/users/:id', {
    params: z.object({ id: z.coerce.number() }),
    handler: ({ params }) => ({ id: params.id, name: 'Gaby' }),
  });
  
  const { status, data } = await api.expectSuccess('GET', '/users/123');
  
  expect(data).toEqual({ id: 123, name: 'Gaby' });
  
  await api.close();
});
```

**Benefits:**
- ✅ Define route and test in one place
- ✅ Same syntax as TinyApi
- ✅ Type-safe (TypeScript infers types from Zod)
- ✅ Clean, minimal syntax
- ✅ Auto-starts server on random port

---

## 📚 API Reference

### Basic Methods

#### `request(method, path, options)`

Makes an HTTP request to the test server.

```typescript
const response = await api.request('GET', '/users', {
  query: { page: 1, limit: 10 },
  headers: { 'x-api-key': 'secret' },
});

console.log(response.status); // 200
console.log(response.data);   // { users: [...] }
console.log(response.headers); // { 'content-type': 'application/json', ... }
```

#### `expectSuccess(method, path, options)`

Expects a 2xx success response. Throws if status is not 2xx.

```typescript
const { status, data } = await api.expectSuccess('POST', '/users', {
  body: { name: 'Gaby', email: 'gaby@example.com' },
});

// If response is 4xx or 5xx, throws error
```

#### `expectError(method, path, expectedStatus, options)`

Expects a specific error status. Throws if status doesn't match.

```typescript
const { status, data } = await api.expectError('POST', '/users', 422, {
  body: { age: 17 }, // Invalid: age < 18
});

expect(data.detail).toContain('Validation Error');
```

---

### Advanced Testing Helpers

#### `testBoundaries(method, path, cases)`

**Boundary testing** - The killer of mutation testing mutants.

```typescript
test('validates age boundary', async () => {
  const api = new TinyTest();
  
  api.post('/users', {
    body: z.object({ age: z.number().min(18) }),
    handler: ({ body }) => ({ id: 1, age: body.age }),
  });
  
  await api.testBoundaries('POST', '/users', [
    { input: { age: 17 }, expected: { success: false } }, // Just before limit
    { input: { age: 18 }, expected: { success: true } },  // At limit
    { input: { age: 19 }, expected: { success: true } },  // Just after
  ]);
  
  await api.close();
});

// When Stryker mutates .min(18) → .min(17), this test CATCHES it ✅
```

**Kills mutants:**
- `.min(18) → .min(17)`
- `.min(18) → .min(19)`
- `< 18` → `<= 18`
- `>= 18` → `> 18`

---

#### `testContract(method, path, options)`

**Contract testing** - Validates response shape and types.

```typescript
test('response matches contract', async () => {
  const api = new TinyTest();
  
  const UserResponseSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    createdAt: z.string().datetime(),
  });
  
  api.post('/users', {
    body: z.object({ name: z.string(), email: z.string() }),
    handler: ({ body }) => ({
      id: 1,
      ...body,
      createdAt: new Date().toISOString(),
    }),
  });
  
  await api.testContract('POST', '/users', {
    input: { name: 'Gaby', email: 'gaby@example.com' },
    responseSchema: UserResponseSchema,
  });
  
  await api.close();
});
```

**Detects:**
- Missing fields
- Wrong types
- Invalid formats

---

#### `testProperty(method, path, options)`

**Property-based testing** - Verifies invariants hold for random inputs.

```typescript
test('id is always positive', async () => {
  const api = new TinyTest();
  
  api.post('/users', {
    body: z.object({ name: z.string(), age: z.number() }),
    handler: ({ body }) => ({
      id: Math.floor(Math.random() * 1000) + 1,
      ...body,
    }),
  });
  
  await api.testProperty('POST', '/users', {
    schema: z.object({ name: z.string(), age: z.number() }),
    iterations: 100, // Test 100 random inputs
    property: (response) => response.id > 0, // Invariant
  });
  
  await api.close();
});
```

**Verifies:**
- Invariants (properties that must ALWAYS be true)
- Edge cases automatically
- Response consistency

---

## 🎯 Complete Example

```typescript
import { describe, test, expect } from 'vitest';
import { TinyTest } from 'tinyapi/testing';
import { z } from 'zod';

describe('Users API', () => {
  const UserCreateSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    age: z.number().min(18).max(120),
  });

  const UserResponseSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    age: z.number(),
    createdAt: z.string(),
  });

  test('creates user successfully', async () => {
    const api = new TinyTest();
    
    api.post('/users', {
      body: UserCreateSchema,
      status: 201,
      handler: ({ body }) => ({
        id: 1,
        ...body,
        createdAt: new Date().toISOString(),
      }),
    });
    
    const { status, data } = await api.expectSuccess('POST', '/users', {
      body: { name: 'Gaby', email: 'gaby@example.com', age: 30 },
    });
    
    expect(status).toBe(201);
    expect(data.id).toBe(1);
    expect(data.name).toBe('Gaby');
    
    await api.close();
  });

  test('validates age boundary', async () => {
    const api = new TinyTest();
    
    api.post('/users', {
      body: UserCreateSchema,
      handler: ({ body }) => ({ id: 1, ...body, createdAt: new Date().toISOString() }),
    });
    
    await api.testBoundaries('POST', '/users', [
      // Below minimum
      {
        input: { name: 'Minor', email: 'minor@example.com', age: 17 },
        expected: { success: false, status: 422 },
      },
      // At minimum
      {
        input: { name: 'Adult', email: 'adult@example.com', age: 18 },
        expected: { success: true },
      },
      // Above maximum
      {
        input: { name: 'Old', email: 'old@example.com', age: 121 },
        expected: { success: false, status: 422 },
      },
      // At maximum
      {
        input: { name: 'Senior', email: 'senior@example.com', age: 120 },
        expected: { success: true },
      },
    ]);
    
    await api.close();
  });

  test('response matches contract', async () => {
    const api = new TinyTest();
    
    api.post('/users', {
      body: UserCreateSchema,
      handler: ({ body }) => ({
        id: 1,
        ...body,
        createdAt: new Date().toISOString(),
      }),
    });
    
    await api.testContract('POST', '/users', {
      input: { name: 'Gaby', email: 'gaby@example.com', age: 30 },
      responseSchema: UserResponseSchema,
    });
    
    await api.close();
  });

  test('id is always positive', async () => {
    const api = new TinyTest();
    
    api.post('/users', {
      body: UserCreateSchema,
      handler: ({ body }) => ({
        id: Math.floor(Math.random() * 10000) + 1,
        ...body,
        createdAt: new Date().toISOString(),
      }),
    });
    
    await api.testProperty('POST', '/users', {
      schema: UserCreateSchema,
      iterations: 50,
      property: (response) => response.id > 0 && Number.isInteger(response.id),
    });
    
    await api.close();
  });
});
```

---

## 🆚 Comparison with Other Testing Tools

| Feature | Supertest | Jest + Fastify | **TinyTest** |
|---------|-----------|----------------|--------------|
| **Setup** | Manual app import | Manual server setup | Automatic |
| **Syntax** | Chained `.expect()` | Verbose fetch calls | Clean `expectSuccess()` |
| **Type Safety** | ❌ No | ⚠️ Manual | ✅ Automatic (Zod) |
| **Boundary Testing** | ❌ Manual | ❌ Manual | ✅ `testBoundaries()` |
| **Contract Testing** | ❌ Manual | ❌ Manual | ✅ `testContract()` |
| **Property Testing** | ❌ No | ⚠️ Separate library | ✅ `testProperty()` |
| **Mutation Testing** | ❌ No integration | ❌ No integration | ✅ SmartMutator ready |

---

## 🔗 Integration with SmartMutator

TinyTest automatically registers which tests cover which routes.

SmartMutator uses this information to:
- Only mutate relevant code
- Only run relevant tests
- **Result: 100x faster mutation testing**

```typescript
test('POST /users', async () => {
  const api = new TinyTest();
  
  api.post('/users', { /* ... */ });
  
  await api.testBoundaries('POST', '/users', [ /* ... */ ]);
});

// SmartMutator knows:
// - This test covers POST /users
// - When mutating POST /users route, only run this test
// - Result: 8 seconds instead of 30 minutes
```

---

## 💡 Best Practices

### ✅ DO:

```typescript
// Use testBoundaries for numeric limits
await api.testBoundaries('POST', '/users', [
  { input: { age: 17 }, expected: { success: false } },
  { input: { age: 18 }, expected: { success: true } },
]);

// Use testContract for response validation
await api.testContract('POST', '/users', {
  input: validInput,
  responseSchema: UserSchema,
});

// Close server in afterEach
afterEach(async () => {
  await api.close();
});
```

### ❌ DON'T:

```typescript
// Don't reuse TinyTest instance across tests
let api: TinyTest; // ❌ Shared state

beforeAll(() => {
  api = new TinyTest(); // ❌ Will cause conflicts
});

// Instead, create fresh instance per test
beforeEach(() => {
  api = new TinyTest(); // ✅ Clean slate
});
```

---

## 📖 Related Documentation

- [SmartMutator](../SMART_MUTATOR.md) - Mutation testing in seconds
- [Dependency Injection](./DEPENDENCY_INJECTION.md) - Testing with DI
- [Background Tasks](./BACKGROUND_TASKS.md) - Testing background tasks

---

**"Testing should be as easy as creating APIs."** 🚀


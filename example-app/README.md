# TinyApi Example Application

Complete examples demonstrating all TinyApi features.

## 📂 Examples

### 1. **Basic Example** (`src/index.ts`)
Simple CRUD API demonstrating core features:
- ✅ Zod validation
- ✅ OpenAPI documentation
- ✅ Exception handling
- ✅ All HTTP methods (GET, POST, PUT, DELETE)

**Run:**
```bash
npm run dev
```

### 2. **Advanced Example** (`src/advanced-example.ts`)
Demonstrates ALL TinyApi features:
- ✨ **Dependency Injection** (singleton + request scope)
- ✨ **Background Tasks** (non-blocking, with warnings)
- ✨ Zod validation
- ✨ OpenAPI docs
- ✨ Custom exception handlers
- ✨ Complete CRUD with DI

**Run:**
```bash
npx tsx src/advanced-example.ts
```

**Features:**
- Database service (singleton)
- Logger service (request-scoped with correlation ID)
- Background tasks for emails and cleanup
- Complete CRUD with DI

### 3. **Testing Example** (`src/example.test.ts`)
Demonstrates TinyTest features:
- ✅ Basic testing (`expectSuccess`, `expectError`)
- ✅ **Boundary testing** (kills mutants!)
- ✅ **Contract testing** (schema validation)
- ✅ **Property testing** (invariants)
- ✅ DI testing (singletons, cleanup)
- ✅ Background task testing
- ✅ Complete CRUD lifecycle

**Run:**
```bash
npm test
```

---

## 🚀 Quick Start

### First Time Setup

```bash
# From the example-app directory
cd example-app

# Install dependencies (links to parent framework)
npm install

# Run basic example
npm run dev
```

### Try It Out

Once running, visit:
- **Swagger UI:** http://localhost:3000/docs
- **ReDoc:** http://localhost:3000/redoc
- **OpenAPI Spec:** http://localhost:3000/openapi.json

---

## 📝 API Examples

### Health Check
```bash
curl http://localhost:3000/health
```

### Create User
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Gaby","email":"gaby@example.com","age":30}'
```

### List Users
```bash
curl http://localhost:3000/users

# With pagination
curl http://localhost:3000/users?page=1&limit=5
```

### Get User by ID
```bash
curl http://localhost:3000/users/1
```

### Update User
```bash
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Gabriel"}'
```

### Delete User
```bash
curl -X DELETE http://localhost:3000/users/1
```

---

## 💡 Code Highlights

### Type-Safe Routing
```typescript
app.get('/users/:id', {
  params: z.object({ id: z.coerce.number() }),
  response: UserSchema,
  handler: ({ params }) => {
    // params.id is typed as number!
    const user = users.get(params.id);
    if (!user) throw new NotFoundException('User not found');
    return user; // TypeScript validates this matches UserSchema
  },
});
```

### Dependency Injection
```typescript
app.get('/users', {
  dependencies: {
    db: inject(getDb, { scope: 'singleton' }),
    logger: inject(getLogger),
  },
  handler: ({ dependencies }) => {
    dependencies.logger.info('Fetching users');
    return dependencies.db.findAll();
  },
});
```

### Background Tasks
```typescript
app.post('/users', {
  handler: ({ body, background }) => {
    const user = createUser(body);

    // Non-blocking: send welcome email
    background.addTask(
      async () => {
        await sendEmail(user.email);
      },
      { name: 'send-welcome-email' }
    );

    return user; // Response sent immediately!
  },
});
```

### Testing with TinyTest
```typescript
test('validates age boundaries', async () => {
  const api = new TinyTest();

  api.post('/users', {
    body: z.object({ age: z.number().min(18).max(120) }),
    handler: ({ body }) => ({ id: 1, ...body }),
  });

  // Test exact boundaries (kills mutants!)
  await api.testBoundaries('POST', '/users', [
    { input: { age: 17 }, expected: { success: false, status: 422 } },
    { input: { age: 18 }, expected: { success: true } },
    { input: { age: 121 }, expected: { success: false, status: 422 } },
    { input: { age: 120 }, expected: { success: true } },
  ]);

  await api.close();
});
```

---

## 📚 Next Steps

1. ✅ Explore the three examples
2. 📖 Read the main [TinyApi README](../README.md)
3. 🗺️ Check the [ROADMAP](../ROADMAP.md)
4. 🧪 Learn about [SmartMutator](../SMART_MUTATOR.md)
5. 🏗️ Learn about [Background Tasks](../docs/BACKGROUND_TASKS.md)
6. 🧪 Learn about [TinyTest](../docs/TINYTEST.md)

---

## 🎯 What Makes TinyApi Different?

**Other frameworks:** "Write your API, then figure out testing"

**TinyApi:** "Testing is as easy as writing the API"

```typescript
// 1. Define your API
app.post('/users', {
  body: UserSchema,
  handler: ({ body }) => createUser(body),
});

// 2. Test it (same syntax!)
const api = new TinyTest();
api.post('/users', {
  body: UserSchema,
  handler: ({ body }) => createUser(body),
});

// 3. Kill mutants with one line
await api.testBoundaries('POST', '/users', [...]);
```

**That's it. No mocks. No complex setup. Just quality.**

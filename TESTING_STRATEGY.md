# 🧪 Testing Strategy and Coverage Requirements

### Complete Testing Suite

```
tests/
├── universal/                 # Tests that work in all runtimes (DDD structure)
│   ├── domain/                # Domain layer tests
│   │   ├── HTTPException.test.ts
│   │   └── Route.test.ts
│   │
│   ├── application/           # Application layer tests
│   │   ├── BackgroundTasks.test.ts
│   │   ├── DependencyInjector.test.ts
│   │   ├── DocsRenderer.test.ts
│   │   ├── ErrorHandler.test.ts
│   │   ├── OpenAPIGenerator.test.ts
│   │   ├── RouteRegistry.test.ts
│   │   └── SchemaValidator.test.ts
│   │
│   ├── e2e/                  # End-to-end tests
│   │   ├── background-tasks.test.ts
│   │   ├── basic-api.test.ts
│   │   ├── dependency-injection.test.ts
│   │   ├── docs.test.ts
│   │   ├── openapi.test.ts
│   │   ├── plugins.test.ts
│   │   ├── security.test.ts
│   │   └── smart-mutator.test.ts
│   │
│   ├── middleware/           # Middleware tests
│   │   └── middleware-system.test.ts
│   │
│   └── websocket/            # WebSocket tests
│       └── websocket-system.test.ts
│
├── node/                     # Node.js specific tests
│   ├── infrastructure/
│   │   ├── FastifyAdapter.test.ts
│   │   └── ZodAdapter.test.ts
│   ├── security/
│   │   ├── APIKey.test.ts
│   │   ├── HTTPBasic.test.ts
│   │   ├── HTTPBearer.test.ts
│   │   ├── jwt.test.ts
│   │   └── OAuth2PasswordBearer.test.ts
│   └── testing/
│       ├── SmartMutator.test.ts
│       └── TinyTest.test.ts
│
├── bun/                      # Bun specific tests
│   ├── performance.test.ts
│   └── runtime-detection.test.ts
│
└── mutation/                 # Mutation testing (Stryker)
    └── stryker.config.js
```

### TinyTest - Testing Wrapper

```typescript
import { TinyTest } from 'syntrojs/testing';

describe('Users API', () => {
  let api: TinyTest;
  
  beforeEach(() => {
    api = new TinyTest();
  });
  
  afterEach(() => api.close());
  
  test('GET /users/:id returns user', async () => {
    api.get('/users/:id', {
      params: z.object({ id: z.coerce.number() }),
      handler: ({ params }) => ({ id: params.id, name: 'Gaby' }),
    });
    
    const { status, data } = await api.expectSuccess('GET', '/users/123');
    
    expect(data).toEqual({ id: 123, name: 'Gaby' });
  });
  
  test('boundary testing', async () => {
    await api.testBoundaries('POST', '/users', [
      { input: { age: 17 }, expected: { success: false, status: 400 } },
      { input: { age: 18 }, expected: { success: true } },
    ]);
  });
  
  test('contract testing', async () => {
    await api.testContract('POST', '/users', {
      input: { name: 'Gaby', age: 30 },
      responseSchema: UserSchema,
    });
  });
});
```

### Directory Organization Principles

**DDD-aligned structure:** Our test directory mirrors `src/` to facilitate:
- Finding all tests for a specific domain/application layer
- Understanding test coverage at a glance
- Maintaining consistency with our architecture

**File naming convention:**
- `<component-name>.test.ts` - Standard test files
- Tests are organized by domain/application/infrastructure layers
- Runtime-specific tests are separated into `node/` and `bun/` folders

### Coverage Requirements

- **Unit tests:** >90%
- **Integration tests:** >85%
- **E2E tests:** Critical paths covered
- **Mutation testing:** >85% mutation score

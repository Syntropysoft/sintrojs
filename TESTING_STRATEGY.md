# 🧪 Testing Strategy and Coverage Requirements

### Complete Testing Suite

```
tests/
├── unit/                      # Unit tests (>90% coverage)
│   ├── domain/
│   │   ├── Route.test.ts
│   │   ├── HTTPException.test.ts
│   │   └── Context.test.ts
│   │
│   ├── application/
│   │   ├── RouteRegistry.test.ts
│   │   ├── SchemaValidator.test.ts
│   │   ├── OpenAPIGenerator.test.ts
│   │   └── DependencyInjector.test.ts
│   │
│   └── infrastructure/
│       ├── FastifyAdapter.test.ts
│       └── ZodAdapter.test.ts
│
├── integration/               # Integration tests
│   ├── routing.test.ts
│   ├── validation.test.ts
│   ├── openapi.test.ts
│   └── dependencies.test.ts
│
├── e2e/                       # End-to-end tests
│   ├── full-api.test.ts
│   ├── error-handling.test.ts
│   └── background-tasks.test.ts
│
└── mutation/                  # Mutation testing (Stryker)
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

### Coverage Requirements

- **Unit tests:** >90%
- **Integration tests:** >85%
- **E2E tests:** Critical paths covered
- **Mutation testing:** >85% mutation score

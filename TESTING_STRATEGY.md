# 🧪 Testing Strategy y Requisitos de Cobertura

### Suite de Testing Completa

```
tests/
├── unit/                      # Tests unitarios (>90% coverage)
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
├── integration/               # Tests de integración
│   ├── routing.test.ts
│   ├── validation.test.ts
│   ├── openapi.test.ts
│   └── dependencies.test.ts
│
├── e2e/                       # Tests end-to-end
│   ├── full-api.test.ts
│   ├── error-handling.test.ts
│   └── background-tasks.test.ts
│
└── mutation/                  # Mutation testing (Stryker)
    └── stryker.config.js
```

### TinyTest - Testing Wrapper

```typescript
import { TinyTest } from 'tinyapi/testing';

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
- **E2E tests:** Critical paths cubiertos
- **Mutation testing:** >85% mutation score

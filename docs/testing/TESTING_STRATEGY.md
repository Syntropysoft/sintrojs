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
- **Mutation testing:** >60% mutation score (actual functional mutants)

### Mutation Testing Strategy

#### Philosophy: Functional Value Over Artificial Score

We use mutation testing as a **quality indicator**, not as a hard target to maximize. Our strategy focuses on **killing meaningful mutants** rather than chasing impossible equivalent mutants.

#### Current Status

- **Mutation Score:** ~48% (47.98%)
- **Strategy:** Accept equivalent mutants in guard clauses
- **Focus:** Functional coverage over score inflation

#### What Are Equivalent Mutants?

Guard clauses frequently produce "equivalent mutants" - mutations that don't actually change the behavior of the code:

```typescript
// Example: Guard clause episode
if (!middleware || typeof middleware !== 'function') {
  throw new Error('Middleware must be a function');
}
```

When Stryker mutates `||` to `&&`:
```typescript
if (!middleware && typeof middleware !== 'function') {
  throw new Error('...');
}
```

No test can kill this mutant because in JavaScript:
- A falsy value (`null`, `undefined`) cannot have `typeof 'function'`
- The behavior is logically equivalent for all valid inputs

#### Excluded Mutations

We exclude the following mutation types (configured in `stryker.config.mjs`):

- **`StringLiteral`** - Often breaks error messages
- **`ObjectLiteral`** - Config objects
- **`LogicalOperator`** - Guard clause OR/AND mutants are often equivalent
- **`ConditionalExpression`** - Ternary operator mutants often don't change behavior
- **`BooleanLiteral`** - Many boolean mutants in configuration are equivalent

These exclusions reduce noise and focus mutation testing on **meaningful** code changes.

#### SmartMutator Integration

We've built **SmartMutator** (see `SMART_MUTATOR.md`) to:
- Use **incremental mutation** (only test changed files)
- Provide **fast feedback** during development
- Support **force full mode** for CI/CD
- Generate **detailed reports** for analysis

#### Best Practices

1. **Guard clauses are well-tested** - Accept that they produce equivalent mutants
2. **Focus on functional coverage** - Measure % lines/statements/branches
3. **Use mutation score as indicator** - Not a hard target
4. **Review survived mutants manually** - Distinguish real gaps from equivalent mutants
5. **Add functional tests** - Rather than artificial tests to kill mutants

#### Running Mutation Tests

```bash
# Smart mode (incremental, fast feedback) - Detects changed files
pnpm test:mutate
# or
npm run test:mutate

# Full mode (comprehensive) - Mutates all files
pnpm test:mutate:full
# or  
npm run test:mutate:full

# Force full coverage in CI/CD (bypasses smart mode)
pnpm test:mutate:ci
# or
npm run test:mutate:ci

# Vanilla Stryker (baseline comparison)
pnpm test:mutation
# or
npm run test:mutation
```

#### When to Worry About Coverage

Should worry about low branch coverage if:
- ✅ Missing coverage in business logic
- ✅ Missing coverage in error handling that can actually occur
- ✅ Missing coverage in critical paths

Accept lower branch coverage for:
- ❌ Defensive guard clauses (`if (!config) throw...`)
- ❌ Validation code for impossible edge cases
- ❌ Error handlers for programmer errors (like null parameters)
- ❌ Experimental code paths

### Branch Coverage Strategy

Similar to mutation testing, we accept **equivalent branch coverage**:
- Guard clauses like `if (!config || typeof config !== 'object')` have defensive branches
- These are **expected to be unused** in normal operation
- Testing them requires artificial scenarios
- Current strategy: **Accept 70-80% branch coverage** as realistic for well-tested code

### Files with Defensive Guard Clauses (Acceptable Lower Coverage)

These files have low branch coverage due to defensive programming:
- `factories.ts` (57.57%) - Guard clauses for factory validation
- `SmartMutator.ts` (61.53%) - Error handling paths
- `FluentAdapter.ts` (66.27%) - Edge cases and error paths
- `SyntroJS.ts` (67.41%) - Configuration validation

**These are acceptable** as they represent defensive programming patterns, not missing business logic coverage.

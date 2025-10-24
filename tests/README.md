# Testing Strategy - Dual Runtime

SyntroJS uses a **differentiated testing strategy** to ensure compatibility across both Node.js and Bun runtimes.

## 📁 Test Structure

```
tests/
├── universal/          # Tests that work on both Node.js and Bun
│   ├── domain/         # Core domain logic
│   ├── application/    # Application layer
│   └── e2e/           # End-to-end tests
├── node/              # Node.js-specific tests
│   ├── infrastructure/ # FastifyAdapter, etc.
│   ├── testing/       # TinyTest, SmartMutator
│   └── security/      # JWT, OAuth2, etc.
└── bun/               # Bun-specific tests
    ├── runtime-detection.test.ts
    └── performance.test.ts
```

## 🚀 Running Tests

### Universal Tests (Both Runtimes)
```bash
pnpm test:universal
```

### Node.js Tests (Vitest)
```bash
pnpm test:node
```

### Bun Tests
```bash
pnpm test:bun
```

### All Tests
```bash
pnpm test:all
```

## 🔧 Test Categories

### ✅ Universal Tests
- **Domain Logic**: Route definitions, HTTP exceptions
- **Application Layer**: Core SyntroJS functionality
- **E2E Tests**: Complete API workflows
- **Runtime Detection**: Basic runtime identification

### 🟢 Node.js Only Tests
- **Infrastructure**: FastifyAdapter, ZodAdapter
- **Advanced Testing**: TinyTest advanced features, SmartMutator
- **Security**: JWT utilities, OAuth2, API keys
- **Vitest Features**: Timer mocking, global stubbing

### 🔵 Bun Only Tests
- **Performance**: High concurrency, memory optimization
- **Bun Optimizations**: Runtime-specific features
- **Speed Tests**: Bun vs Node.js comparisons

## 🎯 Why This Structure?

1. **Clarity**: Clear separation of what works where
2. **CI/CD**: Run appropriate tests per environment
3. **Documentation**: Users know what to expect
4. **Maintenance**: Easier debugging of runtime-specific issues

## 📊 Test Results

| Runtime | Universal | Specific | Total |
|---------|-----------|----------|-------|
| **Node.js** | ✅ All | ✅ All | ✅ Complete |
| **Bun** | ✅ All | ✅ All | ✅ Complete |

## 🔍 Debugging

If tests fail on a specific runtime:

1. **Check the category**: Is it universal, node-specific, or bun-specific?
2. **Review the error**: Look for runtime-specific API differences
3. **Check dependencies**: Some features require specific packages
4. **Run individually**: Use `pnpm test:universal` to isolate issues

## 🚀 CI/CD Integration

```yaml
# GitHub Actions example
- name: Test Node.js
  run: pnpm ci:node

- name: Test Bun
  run: pnpm ci:bun
```

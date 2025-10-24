# Optional Dependencies in SyntroJS

## 🔧 Testing Dependencies

SyntroJS uses **optional dependencies** for testing features to avoid forcing users to install testing tools they don't need.

### SmartMutator Dependencies

The `SmartMutator` class requires Stryker for mutation testing, but these dependencies are **optional**:

```json
{
  "peerDependencies": {
    "@stryker-mutator/core": "^8.0.0",
    "@stryker-mutator/typescript-checker": "^8.0.0", 
    "@stryker-mutator/vitest-runner": "^8.0.0"
  },
  "peerDependenciesMeta": {
    "@stryker-mutator/core": { "optional": true },
    "@stryker-mutator/typescript-checker": { "optional": true },
    "@stryker-mutator/vitest-runner": { "optional": true }
  }
}
```

### How It Works

1. **Import Detection**: SyntroJS tries to import Stryker dynamically
2. **Graceful Fallback**: If Stryker is not available, it throws a helpful error
3. **Clear Instructions**: The error message tells users exactly what to install

### SmartMutatorWrapper Usage

The `SmartMutatorWrapper` provides a graceful way to handle optional dependencies:

```typescript
import { SmartMutatorWrapper } from 'syntrojs/testing';

// Check if SmartMutator is available
const isAvailable = await SmartMutatorWrapper.isAvailable();
if (isAvailable) {
  console.log('✅ SmartMutator is ready to use');
} else {
  console.log('⚠️ Install testing dependencies to use SmartMutator');
}

// Run mutation testing with graceful fallback
const result = await SmartMutatorWrapper.run({ mode: 'smart' });
if (result) {
  console.log(`Mutation score: ${result.mutationScore}%`);
} else {
  console.log('SmartMutator dependencies not installed');
}
```

### Direct SmartMutator Usage

You can still use `SmartMutator` directly if you prefer:

```typescript
import { SmartMutator } from 'syntrojs/testing';

try {
  const result = await SmartMutator.run({ mode: 'smart' });
  console.log(`Mutation score: ${result.mutationScore}%`);
} catch (error) {
  console.error('SmartMutator not available:', error.message);
}
```

### Installation for Testing

To use SmartMutator, install the testing dependencies:

```bash
# For development/testing
npm install --save-dev @stryker-mutator/core @stryker-mutator/typescript-checker @stryker-mutator/vitest-runner

# Or with pnpm
pnpm add -D @stryker-mutator/core @stryker-mutator/typescript-checker @stryker-mutator/vitest-runner
```

### Benefits

- ✅ **Smaller bundle**: Users don't get testing dependencies they don't need
- ✅ **Clear errors**: Helpful error messages when dependencies are missing
- ✅ **Flexible**: Users can choose which testing tools to install
- ✅ **Production safe**: No testing dependencies in production builds

## 🚀 Plugin Dependencies

SyntroJS also uses optional dependencies for plugins:

- `@fastify/compress` - Compression plugin
- `@fastify/cors` - CORS plugin  
- `@fastify/helmet` - Security headers plugin
- `@fastify/rate-limit` - Rate limiting plugin

These are marked as optional `peerDependencies` so users only install what they need.

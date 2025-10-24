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

### Error Handling

When `SmartMutator.run()` is called without Stryker installed:

```typescript
import { SmartMutator } from 'syntrojs/testing';

try {
  await SmartMutator.run();
} catch (error) {
  // Error: SmartMutator requires @stryker-mutator/core to be installed.
  // Please install it as a dev dependency: npm install --save-dev @stryker-mutator/core
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

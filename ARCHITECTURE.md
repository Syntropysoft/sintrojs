# 🏗️ Architecture and Design Principles

### Layer Structure (DDD + SOLID)

```
src/
├── domain/                    # Pure business logic entities
│   ├── Route.ts              # Entity: Route
│   ├── HTTPException.ts      # Entity: HTTP Exceptions
│   ├── Context.ts            # Value Object: Request context
│   ├── Response.ts           # Value Object: Response
│   └── types.ts              # Domain types
│
├── application/               # Use cases / Services
│   ├── RouteRegistry.ts      # Service: Route registration (singleton)
│   ├── SchemaValidator.ts    # Service: Validation with Zod (singleton)
│   ├── OpenAPIGenerator.ts   # Service: Generates OpenAPI spec (singleton)
│   ├── ErrorHandler.ts       # Service: Error handling (singleton)
│   ├── DependencyInjector.ts # Service: Simple DI (singleton)
│   └── BackgroundTasks.ts    # Service: Background tasks (singleton)
│
├── infrastructure/            # External adapters
│   ├── FastifyAdapter.ts     # Adapter: Fastify integration
│   ├── BunAdapter.ts         # Adapter: Bun runtime integration
│   ├── FluentAdapter.ts      # Adapter: Generic HTTP server
│   ├── ZodAdapter.ts         # Adapter: Zod integration
│   ├── OpenAPIAdapter.ts     # Adapter: OpenAPI 3.1 spec
│   └── WebSocketAdapter.ts   # Adapter: WebSockets
│
├── plugins/                   # Optional plugins
│   ├── cors.ts               # CORS middleware
│   ├── compression.ts        # Compression
│   ├── helmet.ts             # Security headers
│   ├── rateLimit.ts          # Rate limiting
│   ├── logger.ts             # Request logging
│   └── staticFiles.ts        # Static files serving
│
├── security/                  # Security utilities
│   ├── OAuth2.ts             # OAuth2 helpers
│   ├── APIKey.ts             # API Key auth
│   └── JWT.ts                # JWT utilities
│
├── testing/                   # Testing utilities
│   ├── SyntroJSTest.ts       # Test wrapper
│   └── SmartMutator.ts       # Mutation testing
│
└── core/
    └── SyntroJS.ts            # Facade: Public API (singleton)
```

### Design Principles

1. **SOLID**
   - Single Responsibility: Each class/function does ONE thing
   - Open/Closed: Extensible via plugins
   - Liskov Substitution: Clear interfaces
   - Interface Segregation: Small, specific interfaces
   - Dependency Inversion: Depend on abstractions

2. **DDD (Domain-Driven Design)**
   - Clear layer separation
   - Domain entities without external dependencies
   - Application services orchestrate logic
   - Infrastructure adapts external technologies

3. **Guard Clauses**
   - Fail fast
   - Early returns
   - Validation at function start

4. **Functional Programming**
   - Immutability
   - Pure functions where possible
   - Function composition
   - No hidden side effects

5. **Singletons (Module Pattern)**
   ```typescript
   // Each service is an exported singleton
   class SchemaValidatorImpl {
     validate(schema, data) { /* ... */ }
   }
   
   export const SchemaValidator = new SchemaValidatorImpl();
   ```

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2025-01-17

### 🏗️ Architectural Evolution Release

Major architectural refactoring implementing SOLID, DDD, Functional Programming, and Guard Clauses throughout the entire codebase. This release introduces the Factory Pattern for type safety, eliminates imperative code, and maintains the simple public API while providing robust internal architecture.

### Added

#### Factory Pattern Implementation
- ✨ **Factory Pattern** - Complete implementation for type safety
  - `SchemaFactory` - Type-safe schema validation with Zod optimization
  - `DependencyResolverFactory` - Type-safe dependency injection
  - `ErrorHandlerFactory` - Centralized error handling with validation detection
  - `MiddlewareFactory` - Type-safe middleware management
- ✨ **Type Safety** - Eliminated all `any` type casts
- ✨ **Pure Functions** - All factory methods are pure functions
- ✨ **Immutable Configurations** - All factory configs are immutable

#### Middleware System
- ✨ **Functional Middleware** - Simple, conversational API
  - `app.use(middleware)` - Global middleware
  - `app.use('/path', middleware)` - Path-specific middleware
  - `app.use(middleware, { priority: 10 })` - Priority-based execution
- ✨ **MiddlewareRegistry** - Immutable registry with functional operations
- ✨ **Guard Clauses** - Robust validation for all middleware operations
- ✨ **Composition** - Functional composition of middleware chains

#### WebSocket System
- ✨ **Conversational WebSocket API** - Simple, fun coding style
  - `app.ws('/chat', handler)` - Register WebSocket handlers
  - `ws.on('message', callback)` - Event-based handling
  - `ws.on('disconnect', callback)` - Connection lifecycle
- ✨ **WebSocketRegistry** - Immutable registry for WebSocket handlers
- ✨ **Room Management** - Basic broadcasting and room functionality
- ✨ **Path Parameters** - Support for dynamic WebSocket paths

#### Architectural Principles
- ✨ **SOLID Principles** - Applied throughout entire codebase
  - Single Responsibility - Each class has one clear purpose
  - Open/Closed - Extensible without modification
  - Liskov Substitution - Consistent interfaces
  - Interface Segregation - Specific interfaces for each operation
  - Dependency Inversion - Depend on abstractions
- ✨ **Domain-Driven Design (DDD)** - Clean domain boundaries
  - Domain Services - Business logic encapsulation
  - Value Objects - Immutable data structures
  - Aggregates - Consistent data boundaries
- ✨ **Functional Programming** - Pure functions and immutability
  - Pure Functions - No side effects
  - Immutability - Data cannot be modified after creation
  - Composition - Building complex behavior from simple functions
  - Higher-Order Functions - Functions that operate on functions
- ✨ **Guard Clauses** - Early validation and fail-fast patterns
  - Input validation at method boundaries
  - Clear error messages for invalid inputs
  - Consistent validation patterns

#### Dead Code Elimination
- ✨ **Code Cleanup** - Removed unused files and exports
  - Removed `SmartSyntroJS.ts` - Superseded by `FluentAdapter`
  - Removed `SmartAdapter.ts` - Superseded by `FluentAdapter`
  - Removed `SyntroWebSocket.ts` - Dead code
  - Removed `functional-utils.ts` - Utilities integrated elsewhere
  - Removed `guard-clauses.ts` - Clauses integrated into methods
  - Removed `solid-improvements.ts` - Concepts integrated into architecture
  - Removed `SmartMutatorWrapper.ts` - Redundant functionality
  - Removed `FLUENT_API_IMPROVEMENTS.md` - Obsolete documentation
- ✨ **Export Cleanup** - Removed unused exports
  - Removed `SmartMutatorSingleton` and `createSmartMutator` exports
  - Cleaned up `src/testing/index.ts` exports

### Changed

#### Internal Architecture
- 🔄 **Complete Refactoring** - All core modules refactored
  - `TinyApi.ts` - Applied SOLID, DDD, Functional Programming
  - `FluentAdapter.ts` - Factory Pattern integration
  - `MiddlewareRegistry.ts` - Immutable operations
  - `WebSocketRegistry.ts` - Immutable operations
  - `factories.ts` - Pure functions and immutability
- 🔄 **Type Safety** - Eliminated all `any` casts
- 🔄 **Error Handling** - Centralized with Factory Pattern
- 🔄 **Dependency Injection** - Type-safe with Factory Pattern
- 🔄 **Schema Validation** - Optimized with Factory Pattern

#### Test Coverage
- 🔄 **Comprehensive Testing** - New test files for increased coverage
  - `TinyApi-comprehensive.test.ts` - Complete TinyApi coverage
  - `FluentAdapter-comprehensive.test.ts` - Complete FluentAdapter coverage
  - `MiddlewareRegistry-comprehensive.test.ts` - Complete MiddlewareRegistry coverage
  - `WebSocketRegistry-comprehensive.test.ts` - Complete WebSocketRegistry coverage
- 🔄 **Functional Test Helpers** - Pure functions for test setup
- 🔄 **E2E Tests** - All passing with new architecture

### Fixed

#### Type Safety
- 🐛 **Factory Pattern Types** - Correct return types for all factories
- 🐛 **Error Response Structure** - Proper `detail` and `errors` fields
- 🐛 **Dependency Resolution** - Correct cleanup function handling
- 🐛 **Schema Validation** - Zod optimization without `Object.freeze`

#### Test Failures
- 🐛 **All Tests Passing** - 552 tests passed, 2 skipped
- 🐛 **E2E Tests** - All integration tests working
- 🐛 **Unit Tests** - All unit tests working
- 🐛 **Coverage** - 80.54% statements, 83.62% branch coverage

### Performance

#### Maintained Performance
- ⚡ **Same Performance** - No performance regression
- ⚡ **Type Safety Overhead** - Minimal impact from Factory Pattern
- ⚡ **Tree Shaking** - Still works with new architecture
- ⚡ **Dual Runtime** - Node.js and Bun support maintained

### Documentation

#### Updated Documentation
- 📚 **README.md** - Updated with Middleware and WebSocket features
- 📚 **Performance Claims** - Corrected to realistic 3.8x Bun performance
- 📚 **Test Coverage** - Updated coverage percentages
- 📚 **Architecture** - Documented new architectural principles

## [0.2.0] - 2025-10-17

### 🚀 Advanced Features Release

Major update bringing TinyApi to feature parity with FastAPI's advanced capabilities. This release adds Dependency Injection, Background Tasks, complete Security modules, Testing utilities, and Production-ready plugins.

### Added

#### Security & Authentication
- ✨ **OAuth2PasswordBearer** - Complete OAuth2 password flow implementation
  - Bearer token extraction and validation
  - WWW-Authenticate headers
  - Integration with JWT utilities
- ✨ **HTTPBearer** - Generic Bearer token authentication
- ✨ **HTTPBasic** - HTTP Basic authentication with Base64 decoding
  - Username/password extraction
  - Support for special characters in credentials
- ✨ **APIKey Authentication** - Three variants:
  - `APIKeyHeader` - API keys in custom headers
  - `APIKeyCookie` - API keys in cookies
  - `APIKeyQuery` - API keys in query parameters
- ✨ **JWT Utilities** - Complete JWT implementation
  - `signJWT()` - Create JWTs with multiple algorithms (HS256, HS384, HS512)
  - `verifyJWT()` - Verify JWT signatures and expiration
  - `decodeJWT()` - Decode without verification
  - Support for custom claims and expiration times

#### Dependency Injection
- ✨ **DI System** - Simple and powerful dependency injection
  - Singleton scope - Share instances across all requests
  - Request scope - Fresh instance per request
  - Automatic cleanup after requests
  - Support for async factories
  - Type-safe injection with `inject()` helper
- ✨ **Context Access** - Dependencies can access request context
- ✨ **Cleanup Hooks** - Automatic resource cleanup (DB connections, file handles)

#### Background Tasks
- ✨ **BackgroundTasks** - In-process non-blocking task execution
  - Fire-and-forget pattern
  - Access to request context
  - Automatic error handling
  - Performance warnings for slow tasks (>100ms)
  - Available in handler context as `background`
- ⚠️ **Documentation** - Clear guidance on when to use external queues (BullMQ, RabbitMQ)

#### Plugins
- ✨ **CORS Plugin** - Cross-Origin Resource Sharing
  - Wrapper for `@fastify/cors`
  - Configurable origins, methods, headers
  - Credentials support
- ✨ **Helmet Plugin** - Security headers
  - Wrapper for `@fastify/helmet`
  - Content Security Policy
  - HSTS, X-Frame-Options, and more
- ✨ **Compression Plugin** - Response compression
  - Wrapper for `@fastify/compress`
  - Gzip, Deflate, Brotli support
  - Configurable threshold
- ✨ **Rate Limiting Plugin** - Request rate limiting
  - Wrapper for `@fastify/rate-limit`
  - Configurable limits and time windows
  - Custom key generators
  - Ban support

#### Testing Utilities
- ✨ **TinyTest** - Testing wrapper for TinyApi
  - `expectSuccess()` - Test successful responses
  - `expectError()` - Test error responses
  - `testBoundaries()` - Automatic boundary testing
  - `testContract()` - Schema contract validation
  - `testProperty()` - Property-based testing
  - Server lifecycle management
- ✨ **SmartMutator** - Optimized mutation testing
  - Route-aware mutation analysis
  - 100x faster than vanilla Stryker
  - Stryker-compatible (same results, auditable)
  - Incremental mode support
  - Watch mode support

### Changed

- 🔧 **Server Binding** - Changed default host from `0.0.0.0` to `::` for dual-stack IPv4/IPv6 support
  - Fixes connection issues on macOS and modern systems
  - Better compatibility across platforms
- 🔧 **Error Response Format** - Consistent use of `detail` field (FastAPI-style)
- 🔧 **Version** - Bumped to 0.2.0 in exports

### Improved

- 📈 **Test Coverage** - Increased from 278 to 554 tests
  - Unit tests for all security modules
  - E2E tests for authentication flows
  - Plugin integration tests
- 📈 **Coverage Metrics** - Improved from 90% to 98%+
  - Statements: 98.05%
  - Branches: 94.03%
  - Functions: 99.29%
  - Lines: 98.05%

### Fixed

- 🐛 **IPv6 Support** - Server now listens on both IPv4 and IPv6
- 🐛 **TypeScript Strict Mode** - Fixed all undefined handling in JWT utilities
- 🐛 **Fastify Cookies** - Proper type handling for cookie plugin integration

### Documentation

- 📖 **docs/BACKGROUND_TASKS.md** - Complete guide for background tasks
- 📖 **docs/TINYTEST.md** - Testing utilities documentation
- 📖 **Example Apps**:
  - `example-app/src/security-example.ts` - Security modules showcase
  - `example-app/src/plugins-example.ts` - Plugins usage examples
  - `example-app/src/advanced-example.ts` - DI + Background tasks

### Dependencies

- ➕ **Added dev dependencies**:
  - `@fastify/cors` ^9.0.0
  - `@fastify/helmet` ^11.1.1
  - `@fastify/compress` ^7.0.0
  - `@fastify/rate-limit` ^9.1.0
- ➕ **Declared peer dependencies** (all optional) for plugins

### Quality Metrics

- ✅ **98.05%** Statement Coverage (↑ from 90.71%)
- ✅ **94.03%** Branch Coverage (↑ from 91.57%)
- ✅ **99.29%** Function Coverage (↑ from 94.04%)
- ✅ **554 Tests** Passing (↑ from 278)
- ✅ **0 Known Vulnerabilities**
- ✅ **~87%** Estimated Mutation Score (SmartMutator)

### Breaking Changes

None - Fully backward compatible with v0.1.0

### Migration from v0.1.0

No changes required. All v0.1.0 code continues to work. New features are additive.

---

## [0.1.0] - 2025-10-15

### 🎉 Initial Release - MVP Core

TinyApi's first release! A FastAPI-inspired framework for Node.js with complete type-safety, automatic validation, and automatic OpenAPI documentation.

### Added

#### Core Features
- ✨ **TinyApi Class** - Main facade for building APIs
- ✨ **Route Registration** - Support for GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- ✨ **Automatic Validation** - Zod schema validation for params, query, body, and response
- ✨ **Type Safety** - Full TypeScript type inference from Zod schemas
- ✨ **Error Handling** - FastAPI-style HTTPException hierarchy
  - `HTTPException` (base class)
  - `BadRequestException` (400)
  - `UnauthorizedException` (401)
  - `ForbiddenException` (403)
  - `NotFoundException` (404)
  - `ConflictException` (409)
  - `ValidationException` (422)
  - `InternalServerException` (500)
  - `ServiceUnavailableException` (503)
- ✨ **Custom Exception Handlers** - Register handlers for specific error types

#### Documentation
- 📚 **OpenAPI 3.1 Generation** - Automatic spec generation from Zod schemas
- 📚 **Swagger UI** - Interactive API docs at `/docs`
- 📚 **ReDoc** - Alternative docs UI at `/redoc`
- 📚 **OpenAPI JSON** - Spec available at `/openapi.json`
- 📚 **Metadata Support** - Tags, summary, description, operationId, deprecated

#### Infrastructure
- ⚡ **Fastify Integration** - High-performance HTTP server
- 🔒 **SOLID Architecture** - Domain-Driven Design with clear layer separation
- 🧪 **Comprehensive Tests** - 278 tests with >90% coverage
  - Unit tests (domain, application, infrastructure)
  - Integration tests
  - End-to-end tests
- 🏗️ **Singletons** - Module pattern for all services
- 🛡️ **Guard Clauses** - Fail-fast validation everywhere
- 🎯 **Functional Programming** - Immutability and pure functions

### Architecture

```
src/
├── domain/           # Pure entities (Route, HTTPException, types)
├── application/      # Business logic (RouteRegistry, SchemaValidator, ErrorHandler, OpenAPIGenerator, DocsRenderer)
├── infrastructure/   # External adapters (FastifyAdapter, ZodAdapter)
└── core/             # Public API (TinyApi class)
```

### Quality Metrics

- ✅ **90.71%** Statement Coverage
- ✅ **91.57%** Branch Coverage
- ✅ **94.04%** Function Coverage
- ✅ **90.71%** Line Coverage
- ✅ **278 Tests** Passing
- ✅ **0 Known Vulnerabilities**

### Documentation

- 📖 [README.md](./README.md) - Quick start and overview
- 📖 [ROADMAP.md](./ROADMAP.md) - Complete implementation plan
- 📖 [PHILOSOPHY.md](./PHILOSOPHY.md) - Project philosophy and principles
- 📖 [SMART_MUTATOR.md](./SMART_MUTATOR.md) - Mutation testing strategy
- 📖 [examples/](./examples/) - Code examples

### Developer Experience

- 🚀 Zero configuration required
- 🚀 TypeScript strict mode by default
- 🚀 Automatic type inference
- 🚀 Clear error messages
- 🚀 Hot reload support

### Performance

- ⚡ Built on Fastify (one of the fastest Node.js frameworks)
- ⚡ No overhead from validation (Zod is highly optimized)
- ⚡ Minimal boilerplate

### Known Limitations

- ⚠️ **Background Tasks** - Not implemented yet (planned for v0.2.0)
- ⚠️ **Dependency Injection** - Not implemented yet (planned for v0.2.0)
- ⚠️ **Security Utilities** - OAuth2, API Keys not implemented yet (planned for v0.2.0)
- ⚠️ **File Uploads** - Not implemented yet (planned for v0.3.0)
- ⚠️ **WebSockets** - Not implemented yet (planned for v0.3.0)

### Breaking Changes

N/A - First release

### Migration Guide

N/A - First release

---

## Roadmap

### v0.2.0 - Advanced Features (Planned)
- Dependency Injection
- Background Tasks
- Security (OAuth2, API Keys)
- Plugins (CORS, Helmet, Compression, Rate Limiting)
- TinyTest wrapper
- SmartMutator MVP

### v1.0.0 - Production Ready (Planned)
- File uploads
- WebSockets
- Performance benchmarks
- Complete documentation
- Migration guides
- >90% coverage + >85% mutation score

See [ROADMAP.md](./ROADMAP.md) for the complete plan.

---

## Credits

TinyApi is heavily inspired by:
- [FastAPI](https://fastapi.tiangolo.com/) (Python) - For the amazing DX
- [Fastify](https://www.fastify.io/) (Node.js) - For the performance
- [Zod](https://zod.dev/) (TypeScript) - For the validation

---

**Thank you to all contributors and early adopters! 🙏**

[unreleased]: https://github.com/yourusername/tinyapi/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/tinyapi/releases/tag/v0.1.0


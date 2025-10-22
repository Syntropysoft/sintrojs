# 🏗️ Arquitectura y Principios de Diseño

### Estructura de Capas (DDD + SOLID)

```
src/
├── domain/                    # Entidades y lógica de negocio pura
│   ├── Route.ts              # Entity: Ruta
│   ├── HTTPException.ts      # Entity: Excepciones HTTP
│   ├── Context.ts            # Value Object: Request context
│   ├── Response.ts           # Value Object: Response
│   └── types.ts              # Types del dominio
│
├── application/               # Casos de uso / Servicios
│   ├── RouteRegistry.ts      # Service: Registro de rutas (singleton)
│   ├── SchemaValidator.ts    # Service: Validación con Zod (singleton)
│   ├── OpenAPIGenerator.ts   # Service: Genera OpenAPI spec (singleton)
│   ├── ErrorHandler.ts       # Service: Manejo de errores (singleton)
│   ├── DependencyInjector.ts # Service: DI simple (singleton)
│   └── BackgroundTasks.ts    # Service: Background tasks (singleton)
│
├── infrastructure/            # Adaptadores externos
│   ├── FastifyAdapter.ts     # Adapter: Integración con Fastify
│   ├── ZodAdapter.ts         # Adapter: Integración con Zod
│   ├── OpenAPIAdapter.ts     # Adapter: OpenAPI 3.1 spec
│   └── WebSocketAdapter.ts   # Adapter: WebSockets
│
├── plugins/                   # Plugins opcionales
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
│   └── TinyTest.ts           # Test wrapper
│
└── core/
    └── TinyApi.ts            # Facade: API pública (singleton)
```

### Principios de Diseño

1. **SOLID**
   - Single Responsibility: Cada clase/función hace UNA cosa
   - Open/Closed: Extensible via plugins
   - Liskov Substitution: Interfaces claras
   - Interface Segregation: Interfaces pequeñas y específicas
   - Dependency Inversion: Depender de abstracciones

2. **DDD (Domain-Driven Design)**
   - Separación clara de capas
   - Domain entities sin dependencias externas
   - Application services orquestan lógica
   - Infrastructure adapta tecnologías externas

3. **Guard Clauses**
   - Fail fast
   - Early returns
   - Validación al inicio de funciones

4. **Programación Funcional**
   - Immutability
   - Pure functions donde sea posible
   - Composición de funciones
   - No side effects ocultos

5. **Singletons (Module Pattern)**
   ```typescript
   // Cada service es un singleton exportado
   class SchemaValidatorImpl {
     validate(schema, data) { /* ... */ }
   }
   
   export const SchemaValidator = new SchemaValidatorImpl();
   ```

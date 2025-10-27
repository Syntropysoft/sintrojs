# SintroNet - Guía de Implementación
## Framework Minimalista para CQRS + SAGA + Event-Driven en .NET

> **Filosofía:** "Minimal en configuración. Máximo en potencia. La complejidad empresarial reducida a APIs declarativas."

---

## 📚 Índice

1. [Visión General](#visión-general)
2. [El Problema que Resolvemos](#el-problema-que-resolvemos)
3. [Solución: API Declarativa](#solución-api-declarativa)
4. [Similitudes con SyntroJS](#similitudes-con-syntrojs)
5. [Ventajas Exclusivas de .NET](#ventajas-exclusivas-de-net)
6. [Swagger y Documentación Automática](#swagger-y-documentación-automática)
7. [Observabilidad y Logging](#observabilidad-y-logging)
8. [Arquitectura Interna](#arquitectura-interna)
9. [Stack Tecnológico](#stack-tecnológico)
10. [Implementación Detallada](#implementación-detallada)
11. [Consideraciones para Agentes de IA](#consideraciones-para-agentes-de-ia)

---

## 🎯 Visión General

**SintroNet** es una librería de .NET que abstrae toda la complejidad de arquitectura empresarial (CQRS, SAGAs, Event-Driven, Proyecciones) detrás de una API declarativa extremadamente simple, inspirada en **SyntroJS** pero aprovechando las ventajas únicas de .NET.

### Principios Fundamentales

1. **Configuración Declarativa**: El usuario define QUÉ necesita, la librería maneja CÓMO
2. **Abstracción Total**: CQRS, SAGAs, eventos, proyecciones son implícitos
3. **Zero Boilerplate**: No hay CommandHandlers, QueryHandlers, EventHandlers manuales
4. **Auto-Orchestration**: SAGAs se generan automáticamente desde la configuración
5. **Type-Safe**: Todo fuertemente tipado con compilación estática
6. **Observability First**: Logging, métricas y tracing con mínima configuración
7. **Swagger Integrado**: OpenAPI y documentación interactiva automática
8. **Performance Nativo**: Aprovecha .NET para máximo rendimiento

---

## ❌ El Problema que Resolvemos

### Código Tradicional (Sin Framework)

```csharp
// ❌ El usuario necesita escribir MILES de líneas:

// 1. Domain Aggregate
public class Order : AggregateRoot { /* 100+ líneas */ }

// 2. Command
public class CreateOrderCommand : IRequest<OrderDto> { }

// 3. Command Handler
public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, OrderDto> 
{ 
    /* 50+ líneas de lógica boilerplate */
}

// 4. Query
public class GetOrderByIdQuery : IRequest<OrderDto> { }

// 5. Query Handler
public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, OrderDto>
{
    /* 50+ líneas de lógica boilerplate */
}

// 6. Event Handlers
public class OrderPlacedEventHandler : IEventHandler<OrderPlacedEvent> { }
public class OrderProjectionHandler : IConsumer<OrderPlacedEvent> { }

// 7. SAGA
public class OrderProcessingSaga : ISaga { /* 200+ líneas */ }

// 8. DTOs, Mappings, Configuraciones...
// TOTAL: 2000+ líneas para una entidad simple
```

---

## ✅ Solución: API Declarativa

### Código con SyntroJS for .NET

```csharp
// ✅ El usuario escribe SOLO 20 líneas:

using SyntroJS;

var app = SyntroApp.Create();

// Definir entidad Order con configuración declarativa
app.Entity<Order>()
    .Write(model => model
        .Aggregate<OrderAggregate>()  // La librería crea el aggregate
        .AutoCreateEndpoint()          // POST /api/orders
        .AutoUpdateEndpoint()          // PUT /api/orders/{id}
        .AutoDeleteEndpoint()          // DELETE /api/orders/{id}
        .OnCreated("OrderPlaced")      // Emite evento automáticamente
    )
    .Read(model => model
        .AutoGetByIdEndpoint()         // GET /api/orders/{id}
        .AutoListEndpoint()            // GET /api/orders
        .AutoSearchEndpoint()          // GET /api/orders?search=...
        .Projection<OrderView>()       // Proyección automática
        .Cache(duration: 5.Minutes())  // Cache automático
    )
    .Saga("OrderProcessing", saga => saga
        .Step<OrderPlacedEvent>(async (ctx, next) =>
        {
            // Reservar inventario
            await ReserveInventory(ctx.Order.Items);
            await ctx.Publish("InventoryReserved");
        })
        .Step<InventoryReservedEvent>(async (ctx, next) =>
        {
            // Procesar pago
            await ProcessPayment(ctx.Order.Total);
            await ctx.Publish("PaymentProcessed");
        })
        .Step<PaymentProcessedEvent>(async (ctx, next) =>
        {
            // Completar orden
            await CompleteOrder(ctx.OrderId);
        })
        .Compensate(async (ctx) =>
        {
            // Rollback automático si falla
            await ReleaseInventory(ctx.Order.Items);
        })
    );

app.Run();
```

**Lo que la librería genera automáticamente:**
- ✅ Commands y Command Handlers
- ✅ Queries y Query Handlers
- ✅ Event Handlers
- ✅ Projections
- ✅ SAGA completa con compensación
- ✅ Endpoints REST
- ✅ Validación automática
- ✅ Mapeos DTO ↔ Aggregate
- ✅ Migraciones EF Core
- ✅ Queries optimizadas con Dapper
- ✅ OpenAPI/Swagger automático
- ✅ Logging estructurado
- ✅ Métricas y trazabilidad

---

## 🔄 Similitudes con SyntroJS

### API Fluent Similar

**SintroNet** toma inspiración directa de **SyntroJS**:

#### SyntroJS (TypeScript/Node.js)
```typescript
app.post('/orders', {
  body: OrderSchema,
  status: 201,
  dependencies: { db: inject(getDatabase) },
  handler: ({ body, dependencies }) => 
    dependencies.db.orders.create(body)
});
```

#### SintroNet (C#)
```csharp
app.Entity<Order>()
    .Write(model => model
        .AutoCreateEndpoint()  // POST /api/orders
        .UseAggregate<OrderAggregate>()
        .Dependencies(db => db.Use<Database>())
    );
```

### Características Compartidas

| Característica | SyntroJS | SintroNet |
|----------------|----------|-----------|
| **API Declarativa** | ✅ | ✅ |
| **Zero Boilerplate** | ✅ | ✅ |
| **Dependency Injection** | ✅ | ✅ |
| **Validación Automática** | ✅ | ✅ |
| **OpenAPI/Swagger** | ✅ | ✅ |
| **Type-Safe** | ✅ TypeScript | ✅ C# Strong Typing |
| **Event-Driven** | ✅ | ✅ |
| **CQRS** | Manual | ✅ Auto-generado |
| **SAGAs** | Manual | ✅ Auto-orquestadas |

---

## 🚀 Ventajas Exclusivas de .NET

### 1. Compilación Estática
```csharp
// ❌ Error en COMPILACIÓN, no en runtime
app.Entity<Order>()
    .Write(model => model
        .AutoCreateEndpoint()
        .InvalidMethod()  // ← Errores detectados en dev
    );
```

### 2. Performance Nativo
```csharp
// .NET compilado a máquina nativa
// - 10x más rápido que Node.js para CPU-bound
// - Menor consumo de memoria
// - Mejor latencia
```

### 3. Tooling Ecosystem
```csharp
// JetBrains Rider / Visual Studio
// - IntelliSense perfecto
// - Refactoring automático
// - Debug visual
// - Profiling integrado
```

### 4. Generics y Type System Avanzado
```csharp
// Type inference extremo
app.Entity<Order>()
    .Read(model => model
        .AutoGetByIdEndpoint<Guid>()  // Type inferido
        .AutoListEndpoint()            // PagedResponse<T> inferido
        .AutoSearchEndpoint(query => query
            .Where(o => o.Total > 100)  // Expression trees compiladas
        )
    );
```

### 5. Null Safety
```csharp
// C# 11 nullable reference types
public record OrderDto(
    Guid Id,
    string CustomerName,  // Non-nullable
    string? Notes        // Nullable explícito
);
```

### 6. Pattern Matching Avanzado
```csharp
app.Entity<Order>()
    .Saga("OrderProcessing", saga => saga
        .Step<OrderPlacedEvent>(async ctx => 
            ctx.Order.Status switch
            {
                OrderStatus.Draft => await ProcessDraft(ctx),
                OrderStatus.Pending => await ProcessPending(ctx),
                _ => throw new InvalidOperationException()
            }
        )
    );
```

---

## 📋 Swagger y Documentación Automática

### Auto-Generación de OpenAPI

**SintroNet** genera automáticamente OpenAPI 3.0 desde la configuración declarativa:

```csharp
var app = SyntroApp.Create()
    .EnableSwagger(config => config
        .Title("E-Commerce API")
        .Description("API for managing orders and products")
        .Version("v1")
        .AddServer("https://api.example.com")
        .AddServer("https://staging.example.com", "Staging")
    );

app.Entity<Order>()
    .Write(model => model
        .AutoCreateEndpoint()
        .Summary("Create a new order")
        .Description("Allows customers to create orders")
        .ProducesResponse<OrderDto>(201, "Order created successfully")
        .ProducesResponse(400, "Validation error")
    )
    .Read(model => model
        .AutoGetByIdEndpoint()
        .Summary("Get order by ID")
        .ProducesResponse<OrderDto>(200, "Order found")
        .ProducesResponse(404, "Order not found")
    );
```

### UI Interactiva

```
GET /swagger        → Swagger UI (interactive)
GET /swagger/v1/swagger.json  → OpenAPI spec
GET /redoc         → ReDoc (alternative UI)
```

### Documentación Automática

```csharp
public record OrderDto(
    /// <summary>Unique order identifier</summary>
    /// <example>123e4567-e89b-12d3-a456-426614174000</example>
    Guid Id,
    
    /// <summary>Customer ID who placed the order</summary>
    Guid CustomerId,
    
    /// <summary>Total amount including tax</summary>
    /// <example>99.99</example>
    decimal Total,
    
    /// <summary>Order status</summary>
    /// <example>Pending</example>
    OrderStatus Status
);
```

---

## 📊 Observabilidad y Logging

### Logging Estructurado Automático

```csharp
var app = SyntroApp.Create()
    .UseLogger(config => config
        .AddConsole()                    // Console logs
        .AddSeq("http://localhost:5341")  // Seq aggregation
        .AddApplicationInsights()         // Azure telemetry
        .SetMinimumLevel(LogLevel.Information)
    );

// Los logs se generan automáticamente:
// [INFO] Order created: { OrderId: "abc", CustomerId: "xyz", Total: 99.99 }
// [INFO] Command processed: CreateOrderCommand in 45ms
// [ERROR] Validation failed: { Field: "CustomerId", Error: "Required" }
```

### Logging a Demanda

```csharp
app.Entity<Order>()
    .Write(model => model
        .AutoCreateEndpoint()
        .LogRequest()     // Log incoming requests
        .LogResponse()    // Log outgoing responses
        .LogPerformance() // Log execution time
        .LogErrors()      // Log exceptions
    );
```

### Métricas Automáticas

```csharp
var app = SyntroApp.Create()
    .UseMetrics(config => config
        .Counter("orders_created_total")
        .Histogram("order_processing_duration_ms")
        .Gauge("active_orders_count")
    );

// Métricas expuestas automáticamente en /metrics (Prometheus format)
```

### Distributed Tracing

```csharp
var app = SyntroApp.Create()
    .UseTracing(config => config
        .AddOpenTelemetry()  // OpenTelemetry estándar
        .AddJaeger()         // Jaeger integration
        .AddZipkin()         // Zipkin integration
    );

// Traces automáticos para:
// - Request lifecycle
// - Database queries
// - External API calls
// - SAGA steps
// - Event publishing
```

### Observabilidad Completa

```csharp
var app = SyntroApp.Create()
    .EnableObservability(config => config
        .RequestId()              // Correlation IDs
        .UserAgent()              // Client info
        .Duration()               // Request duration
        .StatusCodes()            // Response codes
        .ExceptionDetails()       // Stack traces
        .CustomTags(tags => tags  // Custom metadata
            .Add("environment", "production")
            .Add("version", "1.0.0")
        )
    );
```

---

## 🏗️ Arquitectura Interna

La librería internamente organiza todo como arquitectura CQRS/SAGA:

```
┌─────────────────────────────────────────────────────────────┐
│                   SyntroApp (User Code)                     │
│  app.Entity<Order>().Write().Read().Saga()                  │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              SyntroJS.Core (Library Core)                   │
│  ┌────────────────────────────────────────────────┐        │
│  │  EntityRegistry: Convierte configuración       │        │
│  │  declarativa en arquitectura CQRS              │        │
│  └────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────┐        │
│  │  CommandGenerator: Genera Commands + Handlers  │        │
│  └────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────┐        │
│  │  QueryGenerator: Genera Queries + Handlers     │        │
│  └────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────┐        │
│  │  ProjectionGenerator: Genera proyecciones      │        │
│  └────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────┐        │
│  │  SagaGenerator: Genera SAGAs con compensación  │        │
│  └────────────────────────────────────────────────┘        │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          SyntroJS.Infrastructure (Generated Code)           │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Commands/       │  │  Queries/        │                │
│  │  Handlers        │  │  Handlers        │                │
│  └──────────────────┘  └──────────────────┘                │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Events/         │  │  Sagas/          │                │
│  │  Projections     │  │  Orchestration   │                │
│  └──────────────────┘  └──────────────────┘                │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              MassTransit + MediatR + EF Core                │
│              (Orquestación, Event Bus, Persistence)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Idempotencia Automática (Inbox Pattern)

### El Problema de Mensajes Duplicados

En sistemas distribuidos basados en eventos, los message brokers garantizan entrega "at-least-once" (al menos una vez). Esto significa que el mismo mensaje puede entregarse múltiples veces.

**Consecuencias sin Idempotencia:**
```csharp
// ❌ Sin idempotencia: Procesar pago DOS veces
PaymentProcessedEvent (ID: "abc-123") → Procesar $100
PaymentProcessedEvent (ID: "abc-123") → Procesar $100 OTRA VEZ ❌

// Cliente cobrado $200 en lugar de $100
```

### Solución: Inbox Pattern Automático

**SintroNet** implementa automáticamente el **Inbox Pattern**, garantizando que cada mensaje se procese exactamente una vez:

```csharp
app.Entity<Order>()
    .Write(model => model
        .AutoCreateEndpoint()
        .WithIdempotency()  // ← Una sola línea habilita idempotencia
    );

// También funciona en SAGAs
app.Saga("OrderProcessing", saga => saga
    .Step<PaymentProcessedEvent>(async (ctx, next) => 
    {
        await ProcessPayment(ctx.Amount);
    })
    .WithIdempotency()  // ← Protege contra duplicados
);
```

### ¿Cómo Funciona Internamente?

La librería mantiene una tabla `inbox_messages`:

```sql
CREATE TABLE inbox_messages (
    id UUID PRIMARY KEY,        -- Message ID único
    handler_name VARCHAR(255),  -- Handler que procesa el mensaje
    processed_at TIMESTAMP,     -- Cuándo se procesó
    payload TEXT                -- Serialización del mensaje
);
```

**Flujo Automático:**
1. Mensaje llega con ID `"abc-123"`
2. Librería verifica: `SELECT * FROM inbox_messages WHERE id = 'abc-123'`
3. Si existe → Ignora mensaje (ya procesado)
4. Si no existe → Procesa mensaje y guarda en `inbox_messages`

### Configuración Avanzada

```csharp
app.UseInbox(config => config
    .Provider<SqlServerInbox>()  // PostgreSQL, MySQL, etc.
    .RetentionDays(90)            // Limpiar mensajes antiguos
    .BatchSize(100)                // Procesar en lotes
);
```

**Beneficios:**
- ✅ Garantía de procesamiento exactamente-una-vez
- ✅ Zero configuración por default
- ✅ Transparente para el desarrollador
- ✅ Soporte multi-provider (SQL, MongoDB, etc.)

---

## 📦 Event Sourcing (Opcional)

### ¿Qué es Event Sourcing?

**Event Sourcing** es una estrategia de persistencia donde en lugar de guardar el **estado actual** del agregado, guardamos la **secuencia inmutable de eventos** que ocurrieron.

### Comparación: Estado vs Eventos

| Aspecto | Estado Tradicional | Event Sourcing |
|---------|-------------------|----------------|
| **Persistencia** | Tabla `Orders` con estado actual | Tabla `events` con historia |
| **Queries** | ✅ Directo (SELECT * FROM Orders) | ❌ Requiere replay eventos |
| **Auditoría** | ❌ Limitada (solo estado actual) | ✅ Historial completo |
| **Time Travel** | ❌ Imposible | ✅ Ver estado en cualquier momento |
| **Nuevas Proyecciones** | ❌ Requiere migración | ✅ Replay eventos históricos |
| **Debugging** | ❌ Solo estado actual | ✅ Ver exactamente qué pasó |

### API Declarativa con Event Sourcing

```csharp
app.Entity<Order>()
    .Write(model => model
        .UseEventSourcing()        // ← Habilita Event Sourcing
        .AutoCreateEndpoint()
        .SnapshotEvery(100)        // Performance: snapshot cada 100 eventos
    );
```

### Flujo Interno

```csharp
// 1. Comando llega: CreateOrderCommand
var command = new CreateOrderCommand { CustomerId = "abc", Items = [...] };

// 2. Librería reconstruye agregado (si existe)
var order = await eventStore.GetAggregate<Order>(orderId);
// Reproduce eventos: OrderCreated → OrderItemAdded → OrderPaid

// 3. Ejecuta lógica de negocio
order.AddItem(newItem);

// 4. Guarda NUEVO evento (no actualiza estado)
await eventStore.AppendEvent(new OrderItemAddedEvent { ... });
```

### Configuración

```csharp
app.UseEventStore(config => config
    .Provider<PostgresEventStore>()  // o SQL Server, MongoDB
    .EnableSnapshots()                // Performance
    .RetentionPolicy(years: 7)        // Retención histórica
);
```

**Casos de Uso:**
- ✅ Sistemas financieros (auditoría completa requerida)
- ✅ Sistemas de compliance (historial inmutable)
- ✅ Analytics y machine learning (todos los eventos históricos)
- ✅ Domain Events complejos (workflow rastreado)

---

## 🔄 Evolución de Esquemas de Eventos

### El Problema del Versionado

Los eventos evolucionan con el tiempo:
```csharp
// Versión 1 (t0)
public record OrderPlacedEvent(
    Guid OrderId,
    Guid CustomerId,
    decimal Total
);

// Versión 2 (t1) - Campo nuevo añadido
public record OrderPlacedEvent(
    Guid OrderId,
    Guid CustomerId,
    decimal Total,
    string? DiscountCode  // ← Nuevo campo
);
```

**Problema:** Consumidores antiguos procesando eventos nuevos rompen.

### Estrategias

#### 1. Tolerant Reader (Recomendado)

Diseña consumidores que ignoren campos desconocidos:

```csharp
public class OrderProjection : IEventHandler<OrderPlacedEvent>
{
    public async Task Handle(OrderPlacedEvent @event)
    {
        // ✅ IGNORA campos desconocidos
        // @event.DiscountCode será null para eventos v1, OK!
        
        await UpdateProjection(@event.OrderId, @event.CustomerId, @event.Total);
    }
}
```

#### 2. Campos Opcionales Siempre

```csharp
// ✅ BIEN: Nuevos campos siempre opcionales
public record OrderPlacedEvent(
    Guid OrderId,
    string? DiscountCode = null,  // ← Nullable con default
    Guid? CampaignId = null
);
```

#### 3. Upcasting Automático

**SintroNet** puede convertir eventos v1 a v2 automáticamente:

```csharp
app.Events(config => config
    .Upcast<OrderPlacedEventV1, OrderPlacedEventV2>(v1 => new OrderPlacedEventV2
    {
        OrderId = v1.OrderId,
        CustomerId = v1.CustomerId,
        Total = v1.Total,
        DiscountCode = null  // ← Valor por defecto
    })
);
```

**Flujo:**
1. Evento v1 deserializado desde almacenamiento
2. Upcaster convierte a v2 en memoria
3. Handler recibe evento v2
4. Transparente para consumidor

#### 4. Versionado en Nombre (Breaking Changes)

Para cambios incompatibles:

```csharp
// Eventos completamente diferentes
public record OrderPlacedV2Event(...) { }
public record OrderPlacedV3Event(...) { }

// Consumidores específicos
app.Consume<OrderPlacedV2Event>(...)
app.Consume<OrderPlacedV3Event>(...)
```

### Mejores Prácticas

1. **Siempre** añade campos opcionales
2. **Nunca** elimines campos existentes
3. **Usa** Tolerant Reader por defecto
4. **Documenta** cambios de schema
5. **Versiona** para breaking changes

---

## 🎼 SAGAs: Orquestación vs Coreografía

### Orquestación (Centralizada)

Una clase central orquesta el flujo completo:

```csharp
app.Saga("OrderProcessing", saga => saga
    .Orchestration()  // ← Modo orquestado
    .Step<OrderPlacedEvent>(async (ctx, next) => 
    {
        await ReserveInventory(ctx);
        await ctx.Publish("InventoryReserved");
    })
    .Step<InventoryReservedEvent>(async (ctx, next) => 
    {
        await ProcessPayment(ctx);
        await ctx.Publish("PaymentProcessed");
    })
);
```

**Características:**
- ✅ Flujo centralizado y fácil de entender
- ✅ Monitoreo en un solo lugar
- ✅ Lógica de compensación compleja
- ❌ Acoplamiento entre servicios

**Ideal para:** Workflows complejos (3+ pasos), transacciones críticas

### Coreografía (Descentralizada)

Cada servicio reacciona a eventos publicados:

```csharp
// Order Service
app.Consume<PaymentProcessedEvent>(async (@event) => 
{
    await MarkOrderAsCompleted(@event.OrderId);
});

// Inventory Service
app.Consume<OrderPlacedEvent>(async (@event) => 
{
    await ReserveInventory(@event.Items);
    await ctx.Publish("InventoryReserved");
});

// Payment Service
app.Consume<InventoryReservedEvent>(async (@event) => 
{
    await ChargeCustomer(@event.OrderId);
    await ctx.Publish("PaymentProcessed");
});
```

**Características:**
- ✅ Desacoplamiento total
- ✅ Autonomía de servicios
- ✅ Escalabilidad independiente
- ❌ Flujo distribuido (más difícil debuggear)

**Ideal para:** Workflows simples (2-3 pasos), microservicios independientes

### Decisión

| Criterio | Orquestación | Coreografía |
|----------|--------------|-------------|
| **Complejidad** | Alta | Baja |
| **Pasos** | 3+ | 1-3 |
| **Compensación** | Compleja | Simple |
| **Desacoplamiento** | Medio | Alto |
| **Debugging** | Fácil | Difícil |
| **Monitoreo** | Centralizado | Distribuido |

**Recomendación:** Orquestación para workflows críticos, Coreografía para notificaciones simples.

---

## 🛠️ Stack Tecnológico

### Core Framework
```xml
<PackageReference Include="Microsoft.NET" Version="8.0" />
<PackageReference Include="MediatR" Version="12.2.0" />
<PackageReference Include="FluentValidation" Version="11.9.0" />
<PackageReference Include="AutoMapper" Version="12.0.1" />
```

### Persistence
```xml
<!-- Write Database -->
<PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0" />

<!-- Read Database (Dapper) -->
<PackageReference Include="Dapper" Version="2.1.24" />
<PackageReference Include="System.Data.SqlClient" Version="4.8.6" />

<!-- Caching -->
<PackageReference Include="StackExchange.Redis" Version="2.7.10" />
```

### Messaging
```xml
<PackageReference Include="MassTransit" Version="8.1.3" />
<PackageReference Include="MassTransit.RabbitMQ" Version="8.1.3" />
<!-- O alternativamente: -->
<PackageReference Include="MassTransit.Azure.ServiceBus.Core" Version="8.1.3" />
```

### API
```xml
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.0" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
<PackageReference Include="Serilog.AspNetCore" Version="8.0.0" />
<PackageReference Include="Serilog.Sinks.Seq" Version="6.0.0" />
```

### Observability
```xml
<PackageReference Include="Microsoft.ApplicationInsights" Version="2.22.0" />
<PackageReference Include="OpenTelemetry.Extensions.Hosting" Version="1.7.0" />
<PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore" Version="1.7.0" />
```

---

## 📁 Estructura de Proyecto

```
src/
├── OrderService.Api/                    # Minimal API
│   ├── Program.cs
│   ├── Controllers/
│   │   ├── OrderController.cs
│   │   └── OrderQueryController.cs
│   ├── Middleware/
│   │   ├── ExceptionHandlingMiddleware.cs
│   │   └── LoggingMiddleware.cs
│   └── Extensions/
│       ├── DependencyInjection.cs
│       └── ApiConfiguration.cs
│
├── OrderService.Application/            # Application Layer
│   ├── Commands/
│   │   ├── CreateOrder/
│   │   │   ├── CreateOrderCommand.cs
│   │   │   ├── CreateOrderCommandHandler.cs
│   │   │   └── CreateOrderCommandValidator.cs
│   │   └── MarkOrderAsPaid/
│   │       ├── MarkOrderAsPaidCommand.cs
│   │       ├── MarkOrderAsPaidCommandHandler.cs
│   │       └── MarkOrderAsPaidCommandValidator.cs
│   │
│   ├── Queries/
│   │   ├── GetOrderById/
│   │   │   ├── GetOrderByIdQuery.cs
│   │   │   └── GetOrderByIdQueryHandler.cs
│   │   └── GetAllOrders/
│   │       ├── GetAllOrdersQuery.cs
│   │       └── GetAllOrdersQueryHandler.cs
│   │
│   ├── Events/
│   │   ├── OrderPlacedEvent.cs
│   │   ├── OrderPaidEvent.cs
│   │   └── OrderCancelledEvent.cs
│   │
│   ├── DTOs/
│   │   ├── OrderDto.cs
│   │   ├── OrderItemDto.cs
│   │   └── CreateOrderRequest.cs
│   │
│   └── Mappings/
│       └── OrderProfile.cs
│
├── OrderService.Domain/                 # Domain Layer
│   ├── Aggregates/
│   │   ├── Order.cs
│   │   ├── OrderItem.cs
│   │   └── OrderStatus.cs
│   │
│   ├── Events/
│   │   ├── IDomainEvent.cs
│   │   ├── OrderCreatedEvent.cs
│   │   ├── OrderItemAddedEvent.cs
│   │   └── OrderPaidEvent.cs
│   │
│   ├── ValueObjects/
│   │   ├── Money.cs
│   │   ├── Address.cs
│   │   └── Email.cs
│   │
│   └── Interfaces/
│       ├── IOrderRepository.cs
│       └── IRepository.cs
│
├── OrderService.Infrastructure/         # Infrastructure Layer
│   ├── Persistence/
│   │   ├── WriteDbContext.cs
│   │   ├── Configurations/
│   │   │   └── OrderConfiguration.cs
│   │   └── Repositories/
│   │       └── OrderRepository.cs
│   │
│   ├── ReadModels/
│   │   ├── OrderView.cs
│   │   ├── OrderItemView.cs
│   │   └── ReadDbContext.cs
│   │
│   ├── Projections/
│   │   └── OrderProjection.cs
│   │
│   ├── Messaging/
│   │   ├── Consumers/
│   │   │   ├── OrderPlacedConsumer.cs
│   │   │   └── InventoryReservedConsumer.cs
│   │   └── Publishers/
│   │       └── EventPublisher.cs
│   │
│   ├── Caching/
│   │   └── RedisCacheService.cs
│   │
│   └── External/
│       ├── PaymentService.cs
│       └── InventoryService.cs
│
├── OrderService.Sagas/                  # SAGA Orchestration
│   ├── OrderProcessingSaga.cs
│   ├── OrderProcessingSagaState.cs
│   └── SagaConfiguration.cs
│
└── OrderService.Tests/                  # Tests
    ├── Unit/
    │   ├── Domain/
    │   ├── Application/
    │   └── Infrastructure/
    │
    ├── Integration/
    │   └── OrderIntegrationTests.cs
    │
    └── E2E/
        └── OrderWorkflowTests.cs
```

---

## 💻 Implementación

### 1. Setup Básico (Program.cs)

```csharp
using MediatR;
using MassTransit;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add MediatR
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

// Add DbContexts
builder.Services.AddDbContext<WriteDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("WriteDb")));

builder.Services.AddScoped<ReadDbContext>();

// Add Repositories
builder.Services.AddScoped<IOrderRepository, OrderRepository>();

// Add Caching
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
});

// Add MassTransit (Messaging)
builder.Services.AddMassTransit(x =>
{
    x.AddSaga<OrderProcessingSaga>()
        .EntityFrameworkRepository(r =>
        {
            r.ExistingDbContext<WriteDbContext>();
            r.UseSqlServer();
        });
    
    x.AddConsumer<OrderPlacedConsumer>();
    x.AddConsumer<InventoryReservedConsumer>();
    
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(builder.Configuration.GetConnectionString("RabbitMQ"));
        cfg.ConfigureEndpoints(context);
    });
});

// Add Logging
builder.Logging.ClearProviders();
builder.Logging.AddSerilog(new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.Seq("http://localhost:5341")
    .CreateLogger());

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

// Map endpoints
app.MapPost("/api/orders", async (
    CreateOrderRequest request,
    IMediator mediator,
    CancellationToken ct) =>
{
    var command = new CreateOrderCommand
    {
        CustomerId = request.CustomerId,
        Items = request.Items,
        ShippingAddress = request.ShippingAddress
    };
    
    var result = await mediator.Send(command, ct);
    return Results.Ok(result);
})
.Produces<OrderDto>(StatusCodes.Status201Created)
.Produces(StatusCodes.Status400BadRequest);

app.MapGet("/api/orders/{id}", async (
    Guid id,
    IMediator mediator,
    CancellationToken ct) =>
{
    var query = new GetOrderByIdQuery { OrderId = id };
    var result = await mediator.Send(query, ct);
    return Results.Ok(result);
})
.Produces<OrderDto>()
.Produces(StatusCodes.Status404NotFound);

app.Run();
```

### 2. Domain Aggregate (Order.cs)

```csharp
public class Order : AggregateRoot
{
    public Guid Id { get; private set; }
    public Guid CustomerId { get; private set; }
    public decimal Total { get; private set; }
    public OrderStatus Status { get; private set; }
    public Address ShippingAddress { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? PaidAt { get; private set; }
    
    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();
    
    private Order() { } // EF Core
    
    public static Order Create(Guid customerId, Address shippingAddress)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            ShippingAddress = shippingAddress,
            Status = OrderStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };
        
        order.AddDomainEvent(new OrderCreatedEvent(order.Id, customerId));
        return order;
    }
    
    public void AddItem(ProductId productId, int quantity, decimal unitPrice)
    {
        if (Status != OrderStatus.Draft)
            throw new InvalidOperationException("Cannot modify order in current state");
        
        var item = new OrderItem(Id, productId, quantity, unitPrice);
        _items.Add(item);
        
        Total = _items.Sum(i => i.SubTotal);
        
        AddDomainEvent(new OrderItemAddedEvent(Id, productId, quantity, unitPrice));
    }
    
    public void MarkAsPaid(PaymentId paymentId)
    {
        if (Status != OrderStatus.Draft)
            throw new InvalidOperationException("Cannot pay order in current state");
        
        Status = OrderStatus.Paid;
        PaidAt = DateTime.UtcNow;
        
        AddDomainEvent(new OrderPaidEvent(Id, paymentId, Total));
    }
    
    public void MarkAsCompleted()
    {
        if (Status != OrderStatus.Paid)
            throw new InvalidOperationException("Cannot complete unpaid order");
        
        Status = OrderStatus.Completed;
        
        AddDomainEvent(new OrderCompletedEvent(Id));
    }
}
```

### 3. Command Handler

```csharp
public class CreateOrderCommand : IRequest<OrderDto>
{
    public Guid CustomerId { get; set; }
    public List<OrderItemDto> Items { get; set; }
    public Address ShippingAddress { get; set; }
}

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, OrderDto>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ILogger<CreateOrderCommandHandler> _logger;
    private readonly IPublishEndpoint _publishEndpoint;
    
    public CreateOrderCommandHandler(
        IOrderRepository orderRepository,
        ILogger<CreateOrderCommandHandler> logger,
        IPublishEndpoint publishEndpoint)
    {
        _orderRepository = orderRepository;
        _logger = logger;
        _publishEndpoint = publishEndpoint;
    }
    
    public async Task<OrderDto> Handle(CreateOrderCommand request, CancellationToken ct)
    {
        // 1. Create Aggregate
        var order = Order.Create(request.CustomerId, request.ShippingAddress);
        
        foreach (var item in request.Items)
        {
            order.AddItem(item.ProductId, item.Quantity, item.UnitPrice);
        }
        
        // 2. Persist Aggregate
        await _orderRepository.AddAsync(order, ct);
        await _orderRepository.SaveChangesAsync(ct);
        
        // 3. Publish Domain Events (para proyecciones)
        var events = order.DomainEvents;
        foreach (var @event in events)
        {
            await _publishEndpoint.Publish(@event, ct);
        }
        
        order.ClearDomainEvents();
        
        _logger.LogInformation("Order {OrderId} created for customer {CustomerId}", 
            order.Id, order.CustomerId);
        
        // 4. Return DTO
        return new OrderDto
        {
            Id = order.Id,
            CustomerId = order.CustomerId,
            Total = order.Total,
            Status = order.Status.ToString(),
            Items = order.Items.Select(i => new OrderItemDto
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice
            }).ToList(),
            CreatedAt = order.CreatedAt
        };
    }
}
```

### 4. Query Handler (Read Model)

```csharp
public class GetOrderByIdQuery : IRequest<OrderDto>
{
    public Guid OrderId { get; set; }
}

public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, OrderDto>
{
    private readonly ReadDbContext _readDb;
    private readonly IMemoryCache _cache;
    
    public GetOrderByIdQueryHandler(ReadDbContext readDb, IMemoryCache cache)
    {
        _readDb = readDb;
        _cache = cache;
    }
    
    public async Task<OrderDto> Handle(GetOrderByIdQuery request, CancellationToken ct)
    {
        // 1. Try cache first
        var cacheKey = $"order:{request.OrderId}";
        if (_cache.TryGetValue<OrderDto>(cacheKey, out var cached))
        {
            return cached;
        }
        
        // 2. Query from Read DB (Dapper - optimized for reads)
        var sql = @"
            SELECT 
                o.Id,
                o.CustomerId,
                o.Total,
                o.Status,
                o.CreatedAt,
                o.PaidAt,
                oi.ProductId,
                oi.ProductName,
                oi.Quantity,
                oi.UnitPrice,
                oi.SubTotal
            FROM OrderView o
            LEFT JOIN OrderItemView oi ON o.Id = oi.OrderId
            WHERE o.Id = @OrderId
        ";
        
        var orderDict = new Dictionary<Guid, OrderDto>();
        
        await _readDb.Connection.QueryAsync<OrderDto, OrderItemDto, OrderDto>(
            sql,
            (order, item) =>
            {
                if (!orderDict.TryGetValue(order.Id, out var orderEntry))
                {
                    orderEntry = order;
                    orderEntry.Items = new List<OrderItemDto>();
                    orderDict.Add(order.Id, orderEntry);
                }
                
                if (item != null)
                {
                    orderEntry.Items.Add(item);
                }
                
                return orderEntry;
            },
            new { OrderId = request.OrderId },
            splitOn: "ProductId"
        );
        
        if (!orderDict.TryGetValue(request.OrderId, out var result))
        {
            throw new NotFoundException($"Order {request.OrderId} not found");
        }
        
        // 3. Cache for 5 minutes
        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(5));
        
        return result;
    }
}
```

### 5. Projection Handler

```csharp
public class OrderProjection : IConsumer<OrderPlacedEvent>
{
    private readonly ReadDbContext _readDb;
    private readonly ILogger<OrderProjection> _logger;
    
    public OrderProjection(ReadDbContext readDb, ILogger<OrderProjection> logger)
    {
        _readDb = readDb;
        _logger = logger;
    }
    
    public async Task Consume(ConsumeContext<OrderPlacedEvent> context)
    {
        var @event = context.Message;
        
        // Update Read Model
        var orderView = new OrderView
        {
            Id = @event.OrderId,
            CustomerId = @event.CustomerId,
            Total = @event.Total,
            Status = "Draft",
            CreatedAt = @event.OccurredAt,
            ItemCount = @event.Items.Count,
            Discount = CalculateDiscount(@event.Items)
        };
        
        await _readDb.OrderViews.AddAsync(orderView);
        
        foreach (var item in @event.Items)
        {
            var itemView = new OrderItemView
            {
                OrderId = @event.OrderId,
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                SubTotal = item.SubTotal,
                Category = item.Category  // Pre-joined
            };
            
            await _readDb.OrderItemViews.AddAsync(itemView);
        }
        
        await _readDb.SaveChangesAsync();
        
        _logger.LogInformation("Projection updated for order {OrderId}", @event.OrderId);
    }
}
```

---

## 🔄 Casos de Uso

### Caso 1: Crear Orden (Write)

```csharp
// Request
POST /api/orders
{
    "customerId": "123e4567-e89b-12d3-a456-426614174000",
    "items": [
        {
            "productId": "789e4567-e89b-12d3-a456-426614174001",
            "quantity": 2,
            "unitPrice": 99.99
        }
    ],
    "shippingAddress": {
        "street": "123 Main St",
        "city": "New York",
        "zipCode": "10001"
    }
}

// Flow:
// 1. API → CreateOrderCommand
// 2. MediatR → CreateOrderCommandHandler
// 3. Handler → Order.Create() (Aggregate)
// 4. Handler → Repository.Save()
// 5. Handler → Publish Domain Events
// 6. Event Bus → OrderProjection (Update Read Model)
// 7. API → Return OrderDto
```

### Caso 2: Consultar Orden (Read)

```csharp
// Request
GET /api/orders/123e4567-e89b-12d3-a456-426614174000

// Flow:
// 1. API → GetOrderByIdQuery
// 2. MediatR → GetOrderByIdQueryHandler
// 3. Handler → Check Cache
// 4. Handler → Query Read DB (Dapper)
// 5. Handler → Cache result
// 6. API → Return OrderDto
```

### Caso 3: Procesar Orden Completa (SAGA)

```csharp
// Flow:
// 1. OrderPlacedEvent → OrderProcessingSaga iniciada
// 2. Saga → Publish ReserveInventoryCommand
// 3. Inventory Service → Reserve inventory
// 4. Inventory Service → Publish InventoryReservedEvent
// 5. Saga → Publish ProcessPaymentCommand
// 6. Payment Service → Charge customer
// 7. Payment Service → Publish PaymentProcessedEvent
// 8. Saga → Publish OrderCompletedEvent
// 9. Order Service → Mark order as completed
```

---

## 🤖 Consideraciones para Agentes de IA

### Patrones Clave a Entender

1. **Siempre separar Write y Read**
   - Write: Use Aggregates (EF Core)
   - Read: Use DTOs (Dapper)

2. **Los eventos son el pegamento**
   - Todo cambio de estado genera un evento
   - Los eventos actualizan proyecciones automáticamente

3. **SAGA maneja transacciones distribuidas**
   - No uses transacciones ACID distribuidas
   - Usa compensaciones (rollback manual)

4. **Optimiza Reads agresivamente**
   - Pre-cálculo
   - Denormalización
   - Caching

### Comandos Útiles

```bash
# Crear migración (Write DB)
dotnet ef migrations add AddOrderStatus --project OrderService.Infrastructure --startup-project OrderService.Api

# Aplicar migración
dotnet ef database update --project OrderService.Infrastructure --startup-project OrderService.Api

# Ejecutar tests
dotnet test --verbosity normal

# Observar logs en Seq
# Ir a http://localhost:5341
```

### Red Flags a Evitar

❌ **Mezclar Write y Read en el mismo handler**
```csharp
// MAL
public async Task<OrderDto> Handle(CreateOrderCommand request)
{
    var order = Order.Create(...);
    await SaveOrder(order);
    
    // MAL: Leer de la misma DB donde acabas de escribir
    var savedOrder = await ReadOrder(order.Id);
    return savedOrder;
}
```

❌ **Usar EF Core para Reads**
```csharp
// MAL: Muy lento
var orders = await _context.Orders
    .Include(o => o.Items)
    .Include(o => o.Customer)
    .Where(o => o.Status == "Paid")
    .ToListAsync();
```

❌ **Transacciones distribuidas ACID**
```csharp
// MAL: No funciona en microservicios
using var transaction = scope.BeginTransaction();
await ReserveInventory();
await ChargePayment();
transaction.Commit();
```

✅ **En lugar de eso:**
- Usa Dapper para reads
- Usa SAGA para transacciones distribuidas
- Usa proyecciones para mantener consistencia eventual

---

## 📊 Métricas de Éxito

- **Write Latency**: < 50ms (p95)
- **Read Latency**: < 10ms (p95)
- **Throughput**: > 10,000 req/s (reads)
- **Consistency Window**: < 1 segundo (eventual)
- **Availability**: 99.9%

---

## 🔗 Recursos Adicionales

- [Martin Fowler - CQRS](https://martinfowler.com/bliki/CQRS.html)
- [MassTransit Documentation](https://masstransit.io/)
- [MediatR Library](https://github.com/jbogard/MediatR)
- [EF Core Best Practices](https://learn.microsoft.com/en-us/ef/core/performance/)

---

**Filosofía Final:** "Separa para dominar. Optimiza reads y writes por separado. Usa eventos para la consistencia eventual. Los SAGAs manejan las transacciones distribuidas. El rendimiento viene de la arquitectura, no del hardware."

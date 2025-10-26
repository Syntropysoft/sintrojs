# CQRS + SAGA + Event-Driven Architecture en .NET
## Guía Completa para Agentes de IA

> **Filosofía:** "Separar es poder. Unwrite optimizado no compite con un read optimizado. La consistencia eventual permite escalar sin límites."

---

## 📚 Índice

1. [Visión General](#visión-general)
2. [Filosofía de Diseño](#filosofía-de-diseño)
3. [Arquitectura](#arquitectura)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Estructura de Proyecto](#estructura-de-proyecto)
6. [Implementación](#implementación)
7. [Casos de Uso](#casos-de-uso)
8. [Consideraciones para Agentes de IA](#consideraciones-para-agentes-de-ia)

---

## 🎯 Visión General

Esta arquitectura combina **CQRS** (Command Query Responsibility Segregation), **SAGA Pattern**, y **Proyecciones Materializadas** para crear sistemas escalables de alta performance.

### Principios Fundamentales

1. **Separación de Reads y Writes**: Bases de datos diferentes, modelos diferentes, optimizaciones diferentes
2. **Event-Driven**: Todo evento es una oportunidad de propagación de estado
3. **Consistencia Eventual**: Permitir inconsistencias temporales para ganar performance
4. **SAGA Orchestration**: Manejar workflows complejos distribuidos transaccionalmente

---

## 🧠 Filosofía de Diseño

### 1. Separación de Concerns (CQRS Core)

```csharp
// ❌ MAL: Mezclar read y write en el mismo modelo
public class Order
{
    public int Id { get; set; }
    public string CustomerName { get; set; }
    public decimal Total { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OrderItem> Items { get; set; }
    
    // Write methods
    public void AddItem(OrderItem item) { }
    public void MarkAsPaid() { }
    
    // Read methods
    public decimal CalculateDiscount() { }
    public List<OrderItem> GetItemsByCategory(string category) { }
}
```

**Problemas:**
- ❌ Imposible optimizar reads y writes por separado
- ❌ Modelo de dominio mezclado con queries
- ❌ Scaling horizontal limitado

```csharp
// ✅ BIEN: Separar Write Model y Read Model

// Write Model (Domain)
public class OrderAggregate
{
    public Guid Id { get; private set; }
    private List<OrderItem> _items = new();
    private decimal _total;
    
    public void AddItem(ProductId productId, int quantity, decimal price)
    {
        var item = new OrderItem(productId, quantity, price);
        _items.Add(item);
        _total += item.SubTotal;
        
        AddDomainEvent(new OrderItemAddedEvent(Id, productId, quantity));
    }
    
    public void MarkAsPaid(PaymentId paymentId)
    {
        AddDomainEvent(new OrderPaidEvent(Id, paymentId, _total));
    }
}

// Read Model (View)
public class OrderView
{
    public Guid Id { get; set; }
    public string CustomerName { get; set; }
    public decimal Total { get; set; }
    public decimal Discount { get; set; }  // Pre-calculado
    public int ItemCount { get; set; }     // Pre-calculado
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; }
}

public class OrderItemView
{
    public Guid OrderId { get; set; }
    public string ProductName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal SubTotal { get; set; }
    public string Category { get; set; }  // Pre-joined
}
```

**Beneficios:**
- ✅ Write Model optimizado para consistencia (ACID)
- ✅ Read Model denormalizado para performance
- ✅ Scaling independiente de reads y writes

### 2. Event-Driven Everything

```csharp
// Todo lo que pasa en el sistema es un evento
public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredAt { get; }
    string EventType { get; }
}

// Eventos de Dominio
public record OrderPlacedEvent(
    Guid OrderId,
    Guid CustomerId,
    decimal Total,
    List<OrderItemDto> Items
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
    public string EventType => "OrderPlaced";
}

// Los eventos disparan proyecciones automáticamente
public class OrderProjection : IEventHandler<OrderPlacedEvent>
{
    public async Task Handle(OrderPlacedEvent @event, CancellationToken ct)
    {
        // 1. Actualizar Read Model
        await UpdateReadModel(@event);
        
        // 2. Actualizar Cache
        await UpdateCache(@event);
        
        // 3. Emitir notificaciones
        await NotifyStakeholders(@event);
        
        // 4. Actualizar Analytics
        await UpdateAnalytics(@event);
    }
}
```

### 3. SAGA Pattern para Transacciones Distribuidas

```csharp
// ❌ MAL: Intentar transacción distribuida ACID
public class OrderService
{
    public async Task PlaceOrder(OrderDto order)
    {
        using var transaction = _db.BeginTransaction();
        try
        {
            await ReserveInventory(order.Items);
            await ChargeCustomer(order.CustomerId, order.Total);
            await CreateOrder(order);
            
            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }
}

// Problema: ¿Y si el siguiente servicio está inactivo?
// Toda la transacción falla, incluso si ya pagó el cliente.
```

```csharp
// ✅ BIEN: SAGA Pattern con compensación
public class OrderProcessingSaga :
    ISaga,
    InitiatedBy<OrderPlacedEvent>,
    Orchestrates<InventoryReservedEvent>,
    Orchestrates<PaymentProcessedEvent>,
    Orchestrates<InventoryReservationFailedEvent>,
    Orchestrates<PaymentFailedEvent>
{
    public Guid CorrelationId { get; set; }
    public OrderState State { get; set; }
    public int CustomerId { get; set; }
    public List<OrderItemDto> Items { get; set; }
    public decimal Total { get; set; }

    // Paso 1: Orden creada → Reservar inventario
    public async Task Consume(ConsumeContext<OrderPlacedEvent> context)
    {
        CorrelationId = context.Message.OrderId;
        State = OrderState.ReservingInventory;
        
        await context.Publish(new ReserveInventoryCommand
        {
            OrderId = CorrelationId,
            Items = context.Message.Items
        });
    }

    // Paso 2: Inventario reservado → Procesar pago
    public async Task Consume(ConsumeContext<InventoryReservedEvent> context)
    {
        State = OrderState.ProcessingPayment;
        
        await context.Publish(new ProcessPaymentCommand
        {
            OrderId = CorrelationId,
            CustomerId = CustomerId,
            Amount = Total
        });
    }

    // Éxito: Pago procesado → Orden completa
    public async Task Consume(ConsumeContext<PaymentProcessedEvent> context)
    {
        State = OrderState.Completed;
        
        await context.Publish(new OrderCompletedEvent
        {
            OrderId = CorrelationId
        });
    }

    // Compensación: Si falla inventario → Cancelar orden
    public async Task Consume(ConsumeContext<InventoryReservationFailedEvent> context)
    {
        State = OrderState.Cancelled;
        
        await context.Publish(new OrderCancelledEvent
        {
            OrderId = CorrelationId,
            Reason = "Insufficient inventory"
        });
    }

    // Compensación: Si falla pago → Liberar inventario
    public async Task Consume(ConsumeContext<PaymentFailedEvent> context)
    {
        State = OrderState.Cancelled;
        
        // Rollback: Liberar inventario que ya se reservó
        await context.Publish(new ReleaseInventoryCommand
        {
            OrderId = CorrelationId,
            Items = Items
        });
        
        await context.Publish(new OrderCancelledEvent
        {
            OrderId = CorrelationId,
            Reason = "Payment failed"
        });
    }
}
```

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer (Minimal API)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Commands    │  │   Queries    │  │   WebSocket  │         │
│  │   (POST)     │  │    (GET)     │  │  (Real-time) │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer (MediatR)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Command     │  │   Query      │  │   Event      │         │
│  │  Handlers    │  │   Handlers   │  │   Handlers   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐      ┌─────────────────────────┐
│   Domain Layer          │      │   Messaging Layer       │
│  ┌─────────────────┐   │      │  ┌──────────────────┐   │
│  │   Aggregates    │   │      │  │  MassTransit/    │   │
│  │   (Write Model) │   │      │  │  NServiceBus     │   │
│  └─────────────────┘   │      │  └──────────────────┘   │
│  ┌─────────────────┐   │      │  ┌──────────────────┐   │
│  │  Domain Events  │   │      │  │  Event Bus       │   │
│  └─────────────────┘   │      │  └──────────────────┘   │
└─────────────────────────┘      └─────────────────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────────┐      ┌─────────────────────────┐
│   Infrastructure Layer  │      │   Event Handlers        │
│  ┌─────────────────┐   │      │  ┌──────────────────┐   │
│  │  Write DB       │   │      │  │  Projections     │   │
│  │  (EF Core)      │   │      │  │  Read Model      │   │
│  └─────────────────┘   │      │  │  Updates         │   │
│  ┌─────────────────┐   │      │  └──────────────────┘   │
│  │  Read DB        │   │      │  ┌──────────────────┐   │
│  │  (Dapper)       │   │      │  │  SAGA            │   │
│  └─────────────────┘   │      │  │  Orchestration   │   │
│  ┌─────────────────┐   │      │  └──────────────────┘   │
│  │  Redis Cache    │   │      │  ┌──────────────────┐   │
│  └─────────────────┘   │      │  │  Notifications   │   │
│  ┌─────────────────┐   │      │  └──────────────────┘   │
│  │  Azure Storage  │   │      │                         │
│  └─────────────────┘   │      │                         │
└─────────────────────────┘      └─────────────────────────┘
```

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

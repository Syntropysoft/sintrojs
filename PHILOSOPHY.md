# TinyApi - Filosofía y Principios Fundamentales

> "Construir el framework que el ecosistema necesitaba, pero nadie había creado."

---

## 🎯 Nuestra Visión

Crear el framework más simple y poderoso para construir APIs en Node.js, encontrando el punto óptimo entre **velocidad extrema** y **estructura sólida**, sin sacrificar la experiencia del desarrollador ni la preparación para producción.

---

## 🧭 El Problema que Resolvemos

El ecosistema de frameworks para APIs en Node.js presenta un dilema:

### El Espectro del Compromiso

```
[Minimalista]  ←――――――――――――――→  [Estructurado]
   Rápido                           Complejo
   Sin guía                         Mucho boilerplate
   Máxima libertad                  Curva de aprendizaje alta
```

**El Gap:** Buscamos ofrecer una combinación que actualmente es difícil de encontrar:
- Alta velocidad de ejecución
- Arquitectura clara y guiada
- Mínimo código repetitivo
- Type-safety total
- Preparación para producción desde día 1

**TinyApi es nuestra propuesta para llenar ese gap.**

---

## 🏛️ Pilares Fundamentales

### 1. **Simplicidad como Principio, No como Limitación**

La simplicidad no significa "features limitadas". Significa:
- API intuitiva que no requiere documentación extensa para empezar
- Configuración mínima para casos comunes
- Complejidad disponible solo cuando se necesita
- Defaults sensatos que funcionan para el 80% de los casos

**Filosofía:** Si no podés explicarlo en 5 líneas de código, no es suficientemente simple.

---

### 2. **Type-Safety Total: Compile-Time + Runtime**

La seguridad de tipos no es opcional. Es fundamental para:
- Prevenir errores en producción
- Mejorar la refactorización
- Generar documentación automática
- Aumentar la confianza del desarrollador

**Principio:** Un solo esquema define tipos (compile-time), validación (runtime) y documentación (OpenAPI).

**No duplicación:**
```
❌ Definir: Tipo + Validador + Documentación
✅ Definir: Esquema → (Tipo, Validador, Docs)
```

---

### 3. **Performance No Negociable**

La velocidad no es una característica opcional. Es un requisito fundamental.

**Compromisos que NO hacemos:**
- No sacrificamos velocidad por conveniencia
- No agregamos overhead innecesario
- No usamos abstracciones costosas sin justificación

**Compromisos que SÍ hacemos:**
- Usar el motor HTTP más rápido disponible
- Medir y publicar benchmarks constantemente
- Optimizar el path crítico de cada request

**Filosofía:** Si es más lento que una implementación manual bien hecha, no lo incluimos.

---

### 4. **Arquitectura Opinionada, Implementación Flexible**

Proveemos estructura sin imponer rigidez.

**Opiniones fuertes:**
- Separación clara de capas (Dominio, Aplicación, Infraestructura)
- Principios SOLID en el diseño
- Guard clauses y fail-fast
- Immutability donde sea posible

**Flexibilidad donde importa:**
- Funcional o OOP: el desarrollador elige
- Inyección de dependencias simple, no contenedores complejos
- Plugins opcionales, no framework monolítico

**Filosofía:** Guiar sin encerrar. Estructurar sin sobrecargar.

---

### 5. **Developer Experience (DX) como Métrica de Éxito**

El framework se juzga por la productividad que genera.

**Indicadores de DX excelente:**
- Time to first API: < 2 minutos
- Documentación generada automáticamente
- Error messages claros y accionables
- Testing tan fácil como escribir la API
- Hot reload sin configuración

**Filosofía:** Si el desarrollador tiene que buscar en Stack Overflow, podemos mejorar.

---

### 6. **NO Reinventar la Rueda: El Test de la Mandíbula**

El ecosistema Node.js ya tiene soluciones excelentes para muchos problemas. No competimos con ellas, las potenciamos.

**Criterio de NO Implementación:**
- ❌ ORMs (Prisma, TypeORM, Drizzle ya son excelentes)
- ❌ HTTP Clients (fetch/axios funcionan perfectamente)
- ❌ Validation libraries (Zod/Yup/Joi ya existen)
- ❌ Cualquier cosa que requiera mantener código complejo que otros ya mantienen

**Criterio de SÍ Implementación - "Trivializar lo Complejo":**

Solo implementamos algo si cumple:
> **Arquitectura enterprise compleja → Código trivial**

No se trata de ocultar complejidad, sino de hacerla **fácil de usar correctamente**.

**Ejemplo 1: Database (Prisma)**
```typescript
// ❌ Express + Prisma (código típico: 30+ líneas)
app.post('/users', async (req, res) => {
  try {
    const parsed = userSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const prisma = new PrismaClient();
    try {
      const user = await prisma.user.create({ data: parsed.data });
      res.status(201).json(user);
    } finally {
      await prisma.$disconnect();
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});
```

```typescript
// ✅ TinyApi (mismo resultado: 7 líneas)
app.post('/users', {
  body: UserSchema,
  status: 201,
  dependencies: { db: inject(getPrisma) },
  handler: ({ body, dependencies }) => 
    dependencies.db.user.create({ data: body })
});
```

**Ejemplo 2: Message Queues (RabbitMQ, NATS, Kafka)**
```typescript
// ❌ Express + RabbitMQ (código típico: 200+ líneas)
import amqp from 'amqplib';

let connection, channel;
async function setupRabbitMQ() {
  connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue('user-events', { durable: true });
  connection.on('error', (err) => { /* reconnection logic... */ });
  connection.on('close', () => { /* retry... */ });
}

app.post('/users', async (req, res) => {
  try {
    const user = await createUser(req.body);
    await channel.sendToQueue(
      'user-events',
      Buffer.from(JSON.stringify({ type: 'user.created', data: user })),
      { persistent: true }
    );
    res.status(201).json(user);
  } catch (err) { /* error handling... */ }
});

// Manual cleanup
process.on('SIGTERM', async () => {
  await channel.close();
  await connection.close();
});
```

```typescript
// ✅ TinyApi (mismo resultado: 30 líneas, DI maneja lifecycle)
import amqp from 'amqplib';

const getRabbitMQ = async () => {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue('user-events', { durable: true });
  
  return {
    channel,
    cleanup: async () => {  // 🎯 DI ejecuta cleanup automáticamente
      await channel.close();
      await connection.close();
    },
  };
};

app.post('/users', {
  body: UserSchema,
  dependencies: { 
    db: inject(getPrisma, { scope: 'singleton' }),
    mq: inject(getRabbitMQ, { scope: 'singleton' })  // 🎯 Lifecycle automático
  },
  handler: async ({ body, dependencies }) => {
    const user = await dependencies.db.user.create({ data: body });
    
    // Use RabbitMQ directly (no wrapper needed)
    await dependencies.mq.channel.sendToQueue(
      'user-events',
      Buffer.from(JSON.stringify({ type: 'user.created', data: user })),
      { persistent: true }
    );
    
    return user;
  },
});
// 🎯 No cleanup manual, DI lo maneja
```

**Eso es "trivializar lo complejo".** NO creamos wrappers (RabbitMQ, NATS, Kafka tienen excelentes librerías). Solo eliminamos el boilerplate de lifecycle management usando DI.

**Meta:** Que integrar RabbitMQ, NATS, Kafka, AWS SQS sea trivial gracias al DI que maneja init/cleanup automáticamente, pero usando las librerías directamente.

**Estrategia Ultra-Minimalista:**
1. **Glue code ONLY** (v0.2.2): Un solo documento (`docs/INTEGRATIONS.md`) con snippets de 5-10 líneas mostrando cómo conectar librerías con DI
2. **Link a docs oficiales:** Prisma ya tiene excelente documentación, RabbitMQ también, Kafka también. No duplicamos.
3. **Crear helpers solo si hay friction validado** (v0.4.x+): Iterar con usuarios reales primero

**Regla de Oro:** El developer ya sabe usar Prisma/RabbitMQ/Kafka. Solo necesita ver cómo conectarlo con TinyApi DI.

**NO creamos:**
- ❌ Tutoriales de Prisma (Prisma docs ya es excelente)
- ❌ Tutoriales de RabbitMQ (amqplib docs ya existe)
- ❌ Tutoriales de Kafka (kafkajs docs ya existe)
- ❌ Ejemplos "enterprise-ready" complejos

**SÍ creamos:**
- ✅ Template genérico: "Así conectás CUALQUIER librería con DI"
- ✅ Snippets mínimos (5-10 líneas) para librerías comunes
- ✅ Links a documentación oficial

**Filosofía:** Respetamos el tiempo del developer. No duplicamos docs que ya existen. Solo mostramos el "glue code" necesario.

---

### 7. **Production-First, Desde v1.0**

No construimos un framework de "juguete". Construimos una herramienta de producción.

**Requisitos no negociables para v1.0:**
- Mutation testing >85% (tests que realmente validan)
- Coverage >90% (no métrica vanidosa)
- Zero vulnerabilidades conocidas
- Graceful shutdown
- Observability built-in
- Health checks estándar

**Filosofía:** Confianza antes que features. Robustez antes que popularidad rápida.

---

### 8. **La Simplicidad es Difícil: Por Qué TypeScript**

La simplicidad no ocurre por accidente. Requiere diseño intencional y las herramientas correctas.

**Por qué TypeScript es superior para este problema:**
- Type inference: Menos anotaciones, más safety
- Compile-time validation: Errores antes de runtime
- IDE support: Autocompletado que "enseña" el framework
- Ecosystem maturity: npm, tooling, community

**Por qué no Go/Rust para APIs (todavía):**
```go
// Go: Verbose, sin generics elegantes
func CreateUser(w http.ResponseWriter, r *http.Request) {
    var user User
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        // Manual error handling...
    }
    if err := validate(user); err != nil {
        // More manual handling...
    }
    // ...más boilerplate
}
```

```typescript
// TypeScript + TinyApi: Conciso, type-safe
app.post('/users', {
  body: UserSchema,
  handler: ({ body }) => createUser(body)  // Todo inferido
});
```

**Validación Multi-Ecosistema:** Go y Rust brillan en otros dominios (systems, CLI, performance crítica). Para APIs con DX extraordinario, TypeScript es imbatible hoy.

---

## 🛡️ Trust Engineering: Transparencia Total

Creemos que la calidad del código debe ser **verificable públicamente**.

### Compromisos de Transparencia:

1. **Reportes Públicos de Calidad**
   - Coverage reports en cada release
   - Mutation testing results públicos
   - Security audit results disponibles

2. **Benchmarks Honestos**
   - Comparaciones justas con alternativas
   - Metodología pública y reproducible
   - Reconocimiento de trade-offs

3. **Gestión de Riesgos Abierta**
   - Dependencias críticas documentadas
   - Planes de mitigación públicos
   - Comunicación proactiva de breaking changes

**Filosofía:** Buscamos ganar confianza con hechos verificables, no solo con promesas.

---

## 🧬 Principios de Diseño de API

### El Principio de Mínima Sorpresa

```typescript
// Si un desarrollador espera que esto funcione...
app.get('/users/:id', {
  params: Schema.object({ id: Schema.number() }),
  handler: ({ params }) => getUser(params.id)
});

// ...entonces debe funcionar, sin configuración adicional.
```

### El Principio de Escalabilidad Progresiva

```typescript
// Día 1: Simple
app.get('/hello', {
  handler: () => ({ message: 'Hello' })
});

// Día 30: Complejo (cuando lo necesites)
app.get('/users', {
  dependencies: { db, auth, cache },
  middleware: [rateLimit, validate],
  handler: async ({ dependencies, background }) => {
    // Toda la complejidad disponible, sin cambiar paradigma
  }
});
```

### El Principio de Consistencia

- Los conceptos se reutilizan, no se reinventan
- Los patrones se repiten, no se multiplican
- Las convenciones son universales, no contextuales

---

## 🌊 Filosofía de Evolución

### Cómo Decidimos Qué Agregar

**Pregunta #1:** ¿Resuelve un problema real del 80% de usuarios?
- Si no → No lo agregamos al core
- Si sí → Continuar evaluación

**Pregunta #2:** ¿Se puede implementar como plugin sin tocar el core?
- Si sí → Hacerlo plugin
- Si no → Continuar evaluación

**Pregunta #3:** ¿Compromete algún pilar fundamental (simplicidad, performance, DX)?
- Si sí → Rechazar o replantear
- Si no → Proceder con implementación

**Pregunta #4:** ¿Pasa mutation testing y tiene >90% coverage?
- Si no → No mergear
- Si sí → Aceptar

### Cómo Manejamos Breaking Changes

**Principio:** Las APIs públicas son contratos sagrados.

**Proceso:**
1. Deprecation notice en versión N
2. Mantener backward compatibility en N+1, N+2
3. Breaking change solo en major version (N+3)
4. Migration guide detallada
5. Automated migration tools cuando sea posible

---

## 🎯 Posicionamiento Filosófico

### No Somos:

❌ Un framework full-stack (hacemos APIs, punto)  
❌ Una copia de herramientas de otros ecosistemas  
❌ La solución para todos los problemas  
❌ Un experimento académico

### Somos:

✅ **El punto óptimo** entre velocidad bruta y estructura sólida  
✅ **Type-safety nativo** desde el diseño, no como agregado  
✅ **Production-ready** desde v1.0, no "eventualmente"  
✅ **Transparentes** en calidad, trade-offs y limitaciones

---

## 🌐 Validación Multi-Ecosistema

### Por Qué Elegimos TypeScript para Este Problema

No construimos TinyApi "porque TypeScript está de moda". Lo construimos porque TypeScript ofrece ventajas arquitecturales inherentes para el problema específico de "FastAPI-like DX".

**Comparación con otros ecosistemas:**

| Decisión | Go (alternativa común) | TinyApi (TypeScript) |
|----------|------------------------|----------------------|
| **Validación** | Struct tags (strings) sin verificación estática | Schemas como código nativo con inferencia de tipos |
| **Build** | Requiere code generation (`go generate`) | Transparente, sin pasos extra |
| **Docs** | Herramientas externas para OpenAPI | Integración nativa (Zod → JSON Schema) |
| **Type System** | Type hints básicos | Inferencia avanzada + generics |

**Conclusión:** Para frameworks de alto DX, TypeScript + Zod resuelve NATIVAMENTE problemas que otros lenguajes intentan resolver con herramientas externas.

**Esto no significa que TypeScript sea "mejor" en general.** Go destaca en infraestructura cloud-native y concurrencia extrema. Rust domina en sistemas de bajo nivel. Pero para APIs con alta DX y type-safety total, TypeScript tiene ventajas estructurales.

### Lecciones de Otros Ecosistemas que Adoptamos

**De Go:**
- Background Tasks deben ser deliberados (no goroutines/Promises sueltas)
- Context propagation solo para request-scoped data
- Performance de compilación importa

**De Rust:**
- Type-safety extremo previene errores en producción
- Fail-fast con validación en boundaries
- Inmutabilidad como default

**De Python (FastAPI):**
- Single source of truth para schemas
- Docs automáticas desde código
- DX como prioridad #1

**Filosofía:** Estudiamos soluciones en múltiples ecosistemas, adoptamos lo mejor de cada uno, y descartamos lo que no encaja con nuestros pilares.

---

## 🧪 Filosofía de Testing: Nuestro Diferenciador Real

### Testing No Es Una Métrica, Es Una Cultura (Y Una Ventaja Competitiva)

**El problema que nadie está resolviendo:**

En TODOS los ecosistemas (Node.js, Python, Go, Rust, Java), el testing tiene un problema fundamental:

```typescript
✅ Tests passing: 150/150
✅ Coverage: 95%
❌ Código con bug crítico en producción
```

**¿Por qué?** Porque **coverage no mide calidad de tests**, solo líneas ejecutadas.

---

### El Problema del Coverage Superficial

**Test inútil con 100% coverage:**
```typescript
test('user creation', async () => {
  const result = await createUser({ name: 'Gaby', age: 30 });
  expect(result).toBeDefined(); // ✅ Pasa, coverage = 100%
});

// Código en producción con bug:
function createUser(data) {
  // ❌ BUG: No valida age > 18
  return db.insert(data); // El test "pasa" igual
}
```

**Este test da falsa sensación de seguridad:**
- Ejecuta todas las líneas ✅
- El test pasa ✅
- El bug llega a producción ❌

---

### La Solución: Mutation Testing + TinyTest

**Mutation Testing detecta tests inútiles:**

1. **Stryker introduce un mutante** (cambia el código):
   ```typescript
   // Original: .min(18)
   // Mutante: .min(17)  ← Si el test sigue pasando, el test es inútil
   ```

2. **TinyTest hace que escribir tests BUENOS sea fácil:**
   ```typescript
   test('user creation validates age', async () => {
     const api = new TinyTest();
     
     api.post('/users', {
       body: z.object({ name: z.string(), age: z.number().min(18) }),
       handler: ({ body }) => createUser(body),
     });
     
     // Boundary testing: valida el límite exacto
     await api.testBoundaries('POST', '/users', [
       { input: { age: 17 }, expected: { success: false } }, // ❌ Debe fallar
       { input: { age: 18 }, expected: { success: true } },  // ✅ Debe pasar
     ]);
   });
   // Cuando Stryker cambia .min(18) → .min(17), este test FALLA
   // Mutante detectado ✅
   ```

---

### Por Qué TinyTest Es Nuestro Diferenciador Real

**Mutation Testing existe en todos los lenguajes:**
- Python: mutpy, cosmic-ray
- Go: go-mutesting, gremlins
- Rust: cargo-mutants
- Java: PIT (el más maduro)
- JavaScript: Stryker

**Pero NADIE lo usa (<5% de proyectos) porque:**
1. ❌ Setup complicado
2. ❌ Lento (10-100x más que tests normales)
3. ❌ Reportes difíciles de interpretar
4. ❌ No integrado en el workflow

**TinyApi resuelve todos estos problemas:**
1. ✅ **Setup automático:** Viene configurado out-of-the-box
2. ✅ **Tests rápidos de escribir:** TinyTest elimina boilerplate
3. ✅ **Reportes públicos:** Trust Engineering = transparencia total
4. ✅ **Parte del framework:** No es un addon, es core

---

### Qué Rechazamos

❌ **Coverage como vanity metric**
- 100% coverage no garantiza calidad
- Solo mide "líneas ejecutadas", no "lógica validada"

❌ **Tests que solo verifican "que no crashea"**
```typescript
// Test inútil:
expect(result).toBeDefined(); // ¿Y qué? ¿Qué valida esto?
```

❌ **Mocks excesivos que no validan comportamiento real**
```typescript
// Test que mockea TODO:
const mockDb = { insert: vi.fn(() => ({ id: 1 })) };
// No valida que la DB realmente funcione
```

---

### Qué Abrazamos

✅ **Mutation testing (tests que realmente validan lógica)**
- Si el test no puede detectar un mutante, es inútil
- >85% mutation score = tests robustos

✅ **Boundary testing (validación de límites exactos)**
```typescript
await api.testBoundaries('POST', '/users', [
  { input: { age: 17 }, expected: { success: false } }, // Justo antes del límite
  { input: { age: 18 }, expected: { success: true } },  // Justo en el límite
]);
```

✅ **Contract testing (validación de interfaces)**
```typescript
await api.testContract('POST', '/users', {
  input: { name: 'Gaby', age: 30 },
  responseSchema: UserResponseSchema, // Valida el contrato
});
```

✅ **Property-based testing (exploración de edge cases)**
```typescript
await api.testProperty('POST', '/users', {
  schema: UserSchema,
  iterations: 100, // Genera 100 inputs aleatorios válidos
  property: (response) => response.id > 0, // Invariante que debe cumplirse
});
```

---

### La Filosofía

> **"Si un test no puede fallar cuando el código está roto, no es un test útil."**

**Corolario:** Si Stryker muta tu código y el test sigue pasando, el test es inútil.

**Nuestro compromiso:** Hacer que escribir tests BUENOS sea tan fácil como escribir tests malos.

---

### Por Qué Esto Es Único

**Ningún framework hace esto:**
- NestJS: Testing estándar (Jest/Vitest)
- Fastify: Testing manual
- Express: Testing manual
- FastAPI (Python): Testing estándar (pytest)
- Echo/Chi (Go): Testing estándar (testing/httptest)

**TinyApi es el único que:**
1. Hace que escribir tests sea trivial (TinyTest)
2. Valida que los tests sean útiles (Mutation Testing)
3. Publica reportes de calidad (Trust Engineering)
4. Lo hace todo parte del framework, no opcional

**Esto nos convierte en el framework para equipos que valoran calidad verificable.**

---

## 🌍 Filosofía de Comunidad

### Construimos Con la Comunidad, No Para la Comunidad

**Principios de gobernanza:**
1. **Decisiones técnicas son públicas** - RFCs para features mayores
2. **Contribuciones son bienvenidas** - Good first issues siempre disponibles
3. **Meritocracia de ideas** - La mejor idea gana, sin importar quién la propone
4. **Respeto absoluto** - Zero tolerance para toxicidad

**Filosofía:** Creemos que el mejor código viene de la diversidad de perspectivas.

---

## ⚠️ Advertencias Conscientes

### Reconocemos Nuestras Limitaciones

**No somos la mejor opción si:**
- Necesitás un framework full-stack con ORM integrado
- Preferís máxima flexibilidad sin opiniones arquitectónicas
- Tu equipo ya domina otra herramienta y está satisfecho
- Buscás la última moda tecnológica sin fundamentos sólidos

**Podemos ser una buena opción si:**
- Construís APIs puras de alto rendimiento
- Valorás type-safety total sobre todo
- Necesitás estructura sin complejidad innecesaria
- Buscás preparación para producción desde día 1

**Filosofía:** Ser excelente en nuestro nicho > ser mediocre en todo.

---

## 🔮 Visión a Largo Plazo

### ¿Qué Queremos Ser en 5 Años?

**No queremos:**
- Ser el framework más popular (popularidad es vanidad)
- Tener la mayor cantidad de features (features son deuda)
- Dominar todos los casos de uso (especialización > generalización)

**Sí aspiramos a:**
- Ser un framework **confiable** para APIs de producción
- Ofrecer una **excelente DX** en nuestro segmento
- Ser una **opción sólida** cuando type-safety y performance importan
- Mantener **coherencia** con nuestros pilares fundamentales

---

## 💎 El Mantra

> **"Tiny en código. Mighty en impacto."**

Cada línea de código justificada.  
Cada feature medida por su valor.  
Cada decisión guiada por principios.

No solo construimos un framework.  
Construimos una filosofía ejecutable.

---

**TinyApi: Nuestra visión de lo que un framework moderno puede ser.**

_Última actualización: Octubre 2025_  
_Este documento evoluciona con el proyecto, pero los principios permanecen._


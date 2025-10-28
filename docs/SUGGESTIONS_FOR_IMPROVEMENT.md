# Propuestas de Refinamiento Arquitectónico para SyntroJS

Este documento resume las sugerencias de refinamiento discutidas durante nuestro análisis. El código base ya es de una calidad excepcional; estas propuestas son "nitpicking" de alto nivel con el objetivo de llevar la pureza arquitectónica y la robustez a un nivel aún más alto, alineándose con la excelente filosofía del proyecto.

---

### 1. Refinamiento de la Entidad `Route` para una Única Fuente de Verdad

**Observación:**
Actualmente, en `src/domain/Route.ts`, el constructor de la clase `Route` almacena el `handler` de la ruta en dos lugares: directamente en `this.handler` y también dentro del objeto `this.config`.

**Sugerencia:**
Modificar el constructor de la entidad `Route` para que solo haya una fuente de verdad para el `handler`. Esto se puede lograr separando el `handler` del resto de la configuración en el momento de la construcción.

**Ejemplo de Implementación:**
```typescript
// En src/domain/Route.ts

export class Route<...> {
  public readonly method: HttpMethod;
  public readonly path: string;
  public readonly handler: RouteHandler<...>;
  // La configuración ahora omite explícitamente el handler
  public readonly config: Omit<RouteConfig<...>, 'handler'>;

  constructor(
    method: HttpMethod,
    path: string,
    config: RouteConfig<...>,
  ) {
    // ... guard clauses
    
    // Desestructuramos para separar el handler del resto
    const { handler, ...restOfConfig } = config;

    if (!handler) {
      throw new Error('Route handler is required');
    }

    this.method = method;
    this.path = path;
    this.handler = handler;
    this.config = restOfConfig; // Almacenamos solo el resto
  }
  // ...
}
```

**Beneficio:**
Asegura una **única fuente de verdad (Single Source of Truth)** para el `handler`, evitando redundancia y adhiriéndose más estrictamente al Principio de Responsabilidad Única.

---

### 2. Tipificación de Errores de Seguridad para un Manejo Más Robusto

**Observación:**
En `src/application/ErrorHandler.ts`, la detección de ciertos errores de seguridad (como los de JWT) se basa en la inspección de strings en el mensaje del error (`error.message.includes('JWT...')`).

**Sugerencia:**
Crear clases de excepción específicas para errores de seguridad en el dominio, siguiendo el patrón ya establecido con `HTTPException` y `ValidationException`.

**Plan de Acción:**
1.  **Crear Excepciones de Dominio:** En `src/domain/`, crear un nuevo archivo (`SecurityException.ts` o similar) o añadir a `HTTPException.ts` clases como `JWTException extends UnauthorizedException` o `AuthenticationException extends UnauthorizedException`.
2.  **Lanzar Errores Específicos:** La capa de seguridad (`src/security/`), al detectar un error de autenticación o de JWT, debería lanzar estas nuevas excepciones específicas (`throw new JWTException('Token has expired')`) en lugar de un `Error` genérico.
3.  **Registrar Manejadores Específicos:** En `ErrorHandler.ts`, registrar manejadores para estas nuevas clases de excepción.

**Ejemplo de Implementación:**
```typescript
// En ErrorHandler.ts
import { JWTException } from '../domain/SecurityException';

// ...
this.register(JWTException, (context, error) => {
  return {
    status: 401,
    headers: { 'WWW-Authenticate': 'Bearer' },
    body: { detail: error.detail || 'Invalid token' },
  };
});
```

**Beneficio:**
**Elimina el acoplamiento frágil** con los mensajes de error de librerías externas, que podrían cambiar. Hace el sistema más robusto, desacoplado y fácil de testear, además de ser consistente con la arquitectura general del framework.

---

### 3. Optimización de la Creación del `RequestContext` en el Adaptador

**Observación:**
En `src/infrastructure/FastifyAdapter.ts`, dentro del método `registerRoute`, el `RequestContext` se construye una vez en el bloque `try` y se vuelve a construir en el bloque `catch`.

**Sugerencia:**
Construir el `RequestContext` una sola vez al inicio del manejador de la ruta de Fastify y reutilizar esa instancia tanto en el bloque `try` como en el `catch`.

**Ejemplo de Implementación:**
```typescript
// En src/infrastructure/FastifyAdapter.ts
fastify[method](route.path, async (request: FastifyRequest, reply: FastifyReply) => {
  // Construir el contexto UNA SOLA VEZ
  const context = this.buildContext(request);
  let cleanup: (() => Promise<void>) | undefined;

  try {
    // ... lógica principal (middlewares, DI, validación, handler)
    // Ya no se necesita construir el contexto aquí dentro.
  } catch (error) {
    // ... lógica de cleanup de dependencias

    // Reutilizar el contexto ya creado.
    // Este contexto es más preciso, ya que puede haber sido modificado por middlewares.
    const response = await ErrorHandler.handle(error as Error, context);

    // ... enviar respuesta de error
  }
});
```

**Beneficio:**
Garantiza que el `ErrorHandler` reciba un contexto que refleje el **estado más preciso en el momento del error**. Simplifica el código, evita la creación redundante de objetos y mejora la capacidad de diagnóstico.

---

### 4. (Opcional) Reestructuración de Directorios de Tests para Reflejar la Arquitectura

**Observación:**
Actualmente, los tests están estructurados por tipo (`/unit`, `/integration`, `/e2e`).

**Sugerencia:**
Considerar una estructura de directorios en `tests/` que replique la de `src/`. Esto significa tener directorios como `tests/domain`, `tests/application`, `tests/infrastructure`. El tipo de test (unit, integration) se puede especificar en el nombre del archivo.

**Ejemplo de Estructura:**
```
tests/
├── application/
│   ├── RouteRegistry.integration.test.ts
│   └── SchemaValidator.unit.test.ts
├── domain/
│   └── Route.unit.test.ts
├── e2e/
│   └── full-api.e2e.test.ts
└── ...
```

**Beneficio:**
Agrupa los tests por **funcionalidad** en lugar de por tipo. Esto puede facilitar la navegación y la localización de todos los tests relacionados con una entidad o servicio específico, alineando la estructura de testing con la arquitectura DDD del proyecto.

---

Estas sugerencias son un reflejo de la madurez del proyecto: son mejoras finas sobre una base que ya es excelente. ¡Gran trabajo!

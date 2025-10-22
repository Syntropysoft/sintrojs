# ⚠️ Riesgos Críticos y Mitigaciones

### 🔴 Riesgo Alto: Dependencia en Generación de OpenAPI

**Problema:**
La generación de especificaciones OpenAPI a partir de esquemas Zod depende de librerías externas (`zod-openapi`, `zod-to-json-schema`). El soporte para nuevas versiones de Zod (como Zod v4) puede retrasarse, comprometiendo nuestra promesa de documentación automática.

**Impacto:** CRÍTICO - Es el pilar de la DX y diferenciador vs NestJS.

**Mitigación:**
1. Monitoreo estricto de las dependencias de conversión Zod → OpenAPI
2. Establecer tests de integración para detectar incompatibilidades early
3. Plan de contingencia: Internalizar o fork el código de compilación si aparece fricción
4. Contribuir activamente a las librerías upstream

**Responsable:** Core Team  
**Fecha revisión:** Cada release de Zod

---

### 🟡 Riesgo Medio: Background Tasks y Event Loop Blocking

**Problema:**
Node.js es single-threaded. Si los desarrolladores usan Background Tasks para operaciones CPU-bound (procesamiento de video, cálculos pesados), bloquearán el Event Loop independientemente de la velocidad de Fastify.

**Impacto:** ALTO - Compromete la promesa de "Performance No Negociable".

**Mitigación:**
1. Documentación CRISTALINA con ejemplos de uso correcto e incorrecto
2. Advertencias explícitas en la API docs
3. Ejemplos de integración con colas reales (Bull, RabbitMQ) para casos CPU-bound
4. Considerar warnings en runtime si detectamos tareas que tarden >Xms

**Responsable:** Docs Team  
**Fecha revisión:** Pre-release v0.2.0

**Ejemplo de documentación obligatoria:**
```typescript
// ✅ CORRECTO: I/O ligero, no bloqueante
background.addTask(() => sendEmail(email));
background.addTask(() => logEvent(data));

// ❌ INCORRECTO: CPU-bound, bloquea el Event Loop
background.addTask(() => processVideo(file)); // ¡NO HACER ESTO!
background.addTask(() => generatePDF(data));  // Usar Bull/RabbitMQ

// ✅ ALTERNATIVA: Delegar a un worker externo
background.addTask(() => queue.add('process-video', { file }));
```

---

### 🟡 Riesgo Medio: Complejidad de Request Scope en DI

**Problema:**
Implementar request scope en la DI simple sin sacrificar la elegancia del patrón de módulo singleton puede ser técnicamente complejo.

**Impacto:** MEDIO - Afecta paridad con FastAPI Depends().

**Mitigación:**
1. Aprovechar el sistema de decoradores de Fastify para request scope
2. Documentar claramente cuándo usar singleton vs request scope
3. Proveer ejemplos claros de ambos casos de uso
4. No forzar implementación si agrega complejidad excesiva

**Responsable:** Core Team  
**Fecha revisión:** Durante Fase 3 (DI Implementation)

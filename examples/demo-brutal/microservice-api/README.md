# ⚡ Microservice API - Optimizado para servicios

API optimizada para microservicios

## 🚀 Ejecutar Demo

### Node.js
```bash
node app.js
```

### Bun
```bash
bun app.js
```

## ⚡ Benchmark

```bash
node benchmark.js
# o
bun benchmark.js
```

## 📊 Configuración

```javascript
{
  "logger": true,
  "validation": true,
  "errorHandling": true,
  "openAPI": false,
  "compression": true,
  "cors": true,
  "helmet": true,
  "rateLimit": false
}
```

## 🔗 Endpoints

- **GET** `/service/status`
- **GET** `/service/metrics`
- **POST** `/service/health`

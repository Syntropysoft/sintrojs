# SyntroJS Examples

This directory contains simple examples to get you started with SyntroJS.

## Quick Start Examples

### 1. Ultra Simple API (4 lines)

```bash
cd examples/quick-start
node app.js
```

This creates the simplest possible SyntroJS API with:
- ✅ One GET endpoint
- ✅ Automatic documentation
- ✅ Interactive Swagger UI and ReDoc

### 2. Simple Testing

```bash
cd examples/quick-start
node test.js
```

This shows how to test the exact same API you created in `app.js` using TinyTest.

### 3. Dual Runtime Magic 🚀

```bash
cd examples/dual-runtime
node app.js    # Node.js runtime
bun app.js     # Bun runtime (6x faster!)
```

This demonstrates SyntroJS's **dual runtime support**:
- ✅ Same code runs on both Node.js and Bun
- ✅ Auto-detection and optimization
- ✅ Different performance characteristics
- ✅ Zero code changes required

## What You'll See

When you run `app.js`, you'll see:

```
🚀 Simple API
Server running at http://localhost:8080

📖 Interactive Documentation:
   Swagger UI: http://localhost:8080/docs
   ReDoc:      http://localhost:8080/redoc

🔗 Available Endpoints:
   GET    http://localhost:8080/hello

💡 Try this example:
   curl http://localhost:8080/hello
```

## Test Your API

```bash
curl http://localhost:8080/hello
# Response: {"message":"Hello World!"}
```

## Explore the Documentation

- **Swagger UI**: http://localhost:8080/docs
- **ReDoc**: http://localhost:8080/redoc

Both provide interactive documentation where you can test your API directly in the browser!

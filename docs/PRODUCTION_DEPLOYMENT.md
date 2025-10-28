# Production Deployment Guide

## ⚠️ Critical Security Configuration

### Documentation Endpoints

**For production, ALWAYS disable documentation:**

```javascript
const app = new SyntroJS({
  title: 'Production API',
  docs: false  // ✅ REQUIRED
});
```

**Why?**
- `/docs` (Swagger UI) exposes all endpoints with parameter schemas
- `/redoc` (ReDoc) provides the same information in a different format
- `/openapi.json` exposes the complete API specification
- These endpoints are essentially a "hacking manual" for your API

## 🔒 Production Security Checklist

### Critical Items
- [ ] **Disable all documentation** (`docs: false`)
- [ ] **Remove development routes** from production
- [ ] **Remove test endpoints** (e.g., `/test`, `/health/debug`)
- [ ] **Set proper CORS** origins (whitelist specific domains)
- [ ] **Enable rate limiting** on all public endpoints
- [ ] **Use HTTPS** only (no HTTP in production)
- [ ] **Store secrets in environment variables** (never hardcode)

### Recommended Items
- [ ] **Configure proper logging** (avoid logging sensitive data)
- [ ] **Set up error tracking** (Sentry, Rollbar, etc.)
- [ ] **Enable request validation** (all endpoints)
- [ ] **Use JWT for authentication** (stateless)
- [ ] **Implement API versioning** (v1, v2, etc.)
- [ ] **Set up monitoring and alerts** (uptime, errors, latency)

### Optional Items
- [ ] **Enable request compression** (gzip/brotli)
- [ ] **Set up CDN** for static assets
- [ ] **Configure load balancing**
- [ ] **Set up database connection pooling**

## 📦 CDN vs Local Documentation Assets

### Default Behavior (Most Users)

By default, Swagger UI and ReDoc assets are loaded from CDN:

- ✅ **Works out of the box** with internet access
- ✅ **Zero configuration** required
- ✅ **Small bundle size** (no extra dependencies)
- ✅ **CDN benefits**: Fast global delivery, automatic caching

### For Air-Gapped / High-Security Environments

If you need documentation in environments without internet access:

```bash
# Install optional dependencies for local asset serving
pnpm install --include=optional

# Or install specific packages
pnpm install swagger-ui-dist redoc
```

**Auto-Detection:** SyntroJS automatically detects if optional dependencies are installed:
- If installed → Serves from `node_modules` (no CDN)
- If not installed → Falls back to CDN automatically
- **No configuration needed!**

### When to Install Optional Dependencies

**✅ Install for:**
- Banking/Financial production systems
- Government/Defense systems
- Air-gapped networks (no internet access)
- Healthcare systems with strict compliance
- Highly regulated industries
- Production environments requiring CSP

**❌ Not needed for:**
- Development
- Staging with internet access
- Internal tools
- Personal projects
- SaaS applications with internet

## 🎨 Custom Landing Page (Future Enhancement)

### Current Implementation

Landing page HTML is embedded in code:

```typescript
// Current: HTML is string in code
private renderWelcomePage(): string {
  return `<!DOCTYPE html>...`;
}
```

### Planned Enhancement

Allow custom HTML for brand consistency:

```javascript
const app = new SyntroJS({
  title: 'My API',
  customLandingPage: './static/welcome.html'
});
```

**Benefits:**
- Custom branding
- Consistent user experience
- Full HTML control
- Easy to maintain outside code

## 🌍 Environment-Based Configuration

### Recommended Pattern

```javascript
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const app = new SyntroJS({
  title: 'My API',
  
  // Documentation: Only in development
  docs: isDevelopment ? true : false,
  
  // Logger: Only in development
  logger: isDevelopment,
  
  // Security: Stricter in production
  cors: {
    origin: isProduction 
      ? process.env.ALLOWED_ORIGINS.split(',')  // Specific origins
      : '*'  // Allow all in development
  }
});
```

### Using Environment Variables

```bash
# .env
NODE_ENV=production
ALLOWED_ORIGINS=https://myapp.com,https://admin.myapp.com
API_VERSION=v1
```

```javascript
const app = new SyntroJS({
  title: process.env.APP_NAME || 'My API',
  version: process.env.API_VERSION || '1.0.0',
  docs: process.env.ENABLE_DOCS === 'true',
});
```

## 📊 Deployment Matrix

| Environment | docs    | logger  | CORS    | Rate Limit |
|-------------|---------|---------|---------|------------|
| Development | ✅ true | ✅ true | ✅ *     | ❌ false   |
| Staging     | ⚠️ openapi only | ✅ true | ⚠️ specific | ✅ enabled |
| Production  | ❌ false | ⚠️ errors only | ✅ specific | ✅ enabled |

## 🚨 Common Production Mistakes

### ❌ Don't Do This

```javascript
// ❌ BAD: Documentation enabled in production
const app = new SyntroJS({ title: 'API' }); // docs: true by default

// ❌ BAD: CORS allowing all origins
app.use(cors({ allowOrigins: ['*'] })); 

// ❌ BAD: Secrets in code
const API_KEY = 'sk-live-1234567890abcdef'; // NEVER!

// ❌ BAD: No rate limiting
// Rate limiting not enabled
```

### ✅ Do This Instead

```javascript
// ✅ GOOD: Explicitly disable docs in production
const app = new SyntroJS({ 
  title: 'API',
  docs: process.env.NODE_ENV !== 'production'
});

// ✅ GOOD: Specific CORS origins
app.use(cors({ 
  allowOrigins: process.env.ALLOWED_ORIGINS.split(',')
})); 

// ✅ GOOD: Secrets from environment
const API_KEY = process.env.API_KEY;

// ✅ GOOD: Rate limiting enabled
app.use(rateLimit({ 
  max: 100,
  windowMs: 60000 
}));
```

## 📝 Migration Guide

### From Development to Production

**Step 1: Update Configuration**
```javascript
// Before (Development)
const app = new SyntroJS({ title: 'My API' });

// After (Production)
const app = new SyntroJS({ 
  title: 'My API',
  docs: false
});
```

**Step 2: Environment Variables**
```bash
# Add to .env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
API_KEY=sk-prod-...
```

**Step 3: Security Headers**
```javascript
app.use(helmet());
```

**Step 4: Rate Limiting**
```javascript
app.use(rateLimit({
  max: 100,
  windowMs: 60000
}));
```

## 🔗 Additional Resources

- [Security Best Practices](./SECURITY_RISKS.md)
- [Trust Engineering](./TRUST_ENGINEERING.md)
- [Documentation Configuration](./DOCUMENTATION_CONFIG.md)


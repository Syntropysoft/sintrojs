# Production Configuration Warning

## 🚨 Overview

SyntroJS includes a **highly visible warning** when documentation is enabled in production environment.

## ⚠️ When It Appears

The warning appears when:
- `NODE_ENV=production` **AND**
- `docs` configuration is enabled (default: `true` or `undefined`)

## 📋 What It Shows

When running the server in production with docs enabled, you'll see:

```
╔════════════════════════════════════════════════════════════════╗
║                                                            ║
║         ⚠️   SECURITY WARNING   ⚠️                         ║
║                                                            ║
╠════════════════════════════════════════════════════════════════╣
║  DOCUMENTATION IS ENABLED IN PRODUCTION!                      ║
║                                                            ║
║  This exposes your entire API structure to potential attackers! ║
║                                                            ║
║  🔒 TO FIX: Add docs: false to your configuration              ║
║                                                            ║
║  const app = new SyntroJS({ docs: false });                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════════╝
```

**Visual Effect:**
- Red background (`\x1b[41m`)
- White text (`\x1b[37m`)
- Printed to `stderr` (visible in logs)
- **Non-blocking** (server still starts)

## 💡 Design Philosophy

### Why a Warning, Not an Error?

- **Non-intrusive**: Doesn't break deployments
- **Developer choice**: Advanced users can override if needed
- **Awareness**: Makes the risk visible to the entire team
- **Actionable**: Provides clear fix instructions

### Why "Escandaloso"?

- **Visibility**: Needs to be seen in production logs
- **Urgency**: Security issues shouldn't be subtle
- **Team awareness**: Makes it clear something needs attention
- **Compliance**: Helps with security audits

## 🔧 How to Fix

### Option 1: Explicit Disable (Recommended)

```javascript
const app = new SyntroJS({
  title: 'Production API',
  docs: false
});
```

### Option 2: Environment-Based

```javascript
const app = new SyntroJS({
  title: 'API',
  docs: process.env.NODE_ENV !== 'production'
});
```

### Option 3: Granular Control

```javascript
const app = new SyntroJS({
  title: 'API',
  docs: {
    landingPage: false,
    swagger: false,
    redoc: false,
    openapi: true  // Only spec for tooling
  }
});
```

## 🎯 Real-World Scenarios

### Scenario 1: First Deployment

**Problem:** Forgot to set `docs: false`

**What happens:**
1. Server starts successfully
2. Warning appears in logs
3. DevOps team sees it
4. Team fixes before next deploy

**Result:** ✅ Graceful handling

### Scenario 2: Intentional Override

**Problem:** Need docs temporarily in production for debugging

**What happens:**
1. Server starts successfully
2. Warning appears (expected)
3. Docs are accessible
4. Removed after debugging

**Result:** ✅ Developer choice respected

### Scenario 3: Development to Production

**Problem:** Forgot to update configuration for production

**What happens:**
1. CI/CD pipeline runs
2. Warning appears in deployment logs
3. Deployment succeeds (doesn't block)
4. Team sees warning and fixes

**Result:** ✅ Catches configuration drift

## 📊 Best Practices

1. **Always disable in production** (`docs: false`)
2. **Use environment variables** for environment-specific config
3. **Monitor logs** for warnings
4. **Document decisions** if overriding
5. **Regular security audits** to verify config

## 🔗 Related Documentation

- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Documentation Configuration](./DOCUMENTATION_CONFIG.md)
- [Security Risks](./SECURITY_RISKS.md)


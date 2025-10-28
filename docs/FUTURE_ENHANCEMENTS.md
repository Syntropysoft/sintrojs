# Future Enhancements

## 🎯 Identified Opportunities

This document tracks identified opportunities for improvement based on architecture reviews and user feedback.

---

## 1. 📦 Local Asset Serving for Documentation

### Current State
- Swagger UI and ReDoc load assets from CDN (jsdelivr.net)
- Embedded in code: HTML strings for UI components

### Problem
- Not suitable for air-gapped networks
- External dependency in high-security environments
- CDN downtime affects documentation
- Not acceptable for banking/government systems

### Proposed Solution

**Option A: Optional Package**
```bash
npm install @syntrojs/swagger-ui-local
```

```javascript
const app = new SyntroJS({
  docs: {
    swagger: true,
    useLocalAssets: true  // Serve from node_modules
  }
});
```

**Option B: Built-in Local Mode**
```javascript
const app = new SyntroJS({
  docs: {
    swagger: true,
    assetMode: 'local'  // 'cdn' | 'local'
  }
});
```

### Benefits
- ✅ Works in air-gapped environments
- ✅ No external dependencies
- ✅ Faster (no CDN latency)
- ✅ Compliance-friendly
- ✅ Increased enterprise adoption

### Priority
**HIGH** - Blocks enterprise adoption in certain sectors

### Estimated Effort
- Research: 2h
- Implementation: 4h
- Testing: 2h
- Documentation: 1h
- **Total: ~1 day**

---

## 2. 🎨 Custom Landing Page Support

### Current State
- Landing page HTML is embedded as string in `SyntroJS.ts`
- Not customizable beyond title and version

### Problem
- No brand customization
- Can't match company identity
- Hard to maintain if customization needed

### Proposed Solution

```javascript
const app = new SyntroJS({
  title: 'My API',
  customLandingPage: './static/welcome.html'  // Custom HTML file
});
```

**Alternative: Template System**
```javascript
const app = new SyntroJS({
  title: 'My API',
  landingPage: {
    template: './templates/welcome.ejs',
    data: {
      brandColor: '#FF5733',
      logo: '/static/logo.png'
    }
  }
});
```

### Benefits
- ✅ Brand consistency
- ✅ Custom user experience
- ✅ Easier to maintain
- ✅ Better onboarding

### Priority
**MEDIUM** - Nice to have, not blocking

### Estimated Effort
- Implementation: 3h
- Testing: 1h
- Documentation: 1h
- **Total: ~5 hours**

---

## 3. 🔧 Configuration Consistency Check

### Current State
- Some confusion exists between nested vs flat configuration
- Examples show different patterns

### Problem
- Documentation may show structures not yet implemented
- Potential for user confusion

### Resolution
✅ **Already implemented**: Configuration uses nested structure
```typescript
docs?: boolean | {
  landingPage?: boolean;
  swagger?: boolean;
  redoc?: boolean;
  openapi?: boolean;
}
```

### Action Items
- [x] Verify implementation matches documentation
- [x] Update all examples to use nested structure
- [ ] Add TypeScript types validation
- [ ] Add runtime configuration validation

### Priority
**LOW** - Already consistent, just need to verify documentation

---

## 4. 📚 Enhanced Production Documentation

### Current State
- Production security mentioned in README
- No dedicated guide

### Resolution
✅ **Implemented**: Created `PRODUCTION_DEPLOYMENT.md`

### Improvements Made
- Production deployment guide
- Security checklist
- CDN limitations documented
- Best practices section
- Common mistakes guide

### Priority
✅ **COMPLETED**

---

## 5. 🛡️ Security Audit

### Suggested Improvements

#### A. Content Security Policy (CSP) Support
```javascript
const app = new SyntroJS({
  security: {
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net']
    }
  }
});
```

#### B. Rate Limiting Configuration
```javascript
const app = new SyntroJS({
  rateLimit: {
    global: { max: 100, windowMs: 60000 },
    perEndpoint: true,
    customEndpoints: {
      '/login': { max: 5, windowMs: 60000 }
    }
  }
});
```

### Priority
**MEDIUM** - Important for production hardening

---

## 📋 Summary of Action Items

### High Priority
1. **Local Asset Serving** - Enable enterprise adoption
   - Research CDN-free implementation
   - Create optional package or built-in mode
   - Document usage

### Medium Priority
2. **Custom Landing Page** - Improve branding
   - Add file path configuration
   - Implement template system
   - Test with various templates

3. **Security Enhancements** - Production hardening
   - CSP support
   - Enhanced rate limiting
   - Security headers configuration

### Low Priority
4. **Configuration Validation** - Developer experience
   - Runtime type checking
   - Better error messages
   - Schema validation

---

## 🎯 Success Metrics

### For Local Asset Serving
- [ ] Package published to npm
- [ ] Documentation complete
- [ ] Works in air-gapped environment (validated)
- [ ] Zero CDN dependencies when enabled

### For Custom Landing Page
- [ ] Supports custom HTML files
- [ ] Template system functional
- [ ] Examples provided
- [ ] Documentation complete

---

**Last Updated:** December 27, 2024  
**Status:** Active enhancement tracking


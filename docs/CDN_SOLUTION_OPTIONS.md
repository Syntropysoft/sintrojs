# CDN Dependency - Solution Options Analysis

## 🔴 Current Problem

**Assets load from CDN:**
- Swagger UI: `https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/...`
- ReDoc: `https://cdn.jsdelivr.net/npm/redoc@latest/...`

**Impact:**
- ❌ Air-gapped networks: Documentation won't work
- ❌ Government/military: CDN access often blocked
- ❌ Banking: Compliance issues with external dependencies
- ❌ High-security: Supply chain attack risk

---

## 🎯 Solution Options

### Option 1: Optional Dependencies Package (RECOMMENDED)

#### Concept
Create an **optional** npm package that users can install if they need local assets.

#### Implementation

**Step 1: Create `@syntrojs/docs-local` package**
```json
{
  "name": "@syntrojs/docs-local",
  "dependencies": {
    "swagger-ui-dist": "^5.9.0",
    "redoc": "^2.1.0"
  }
}
```

**Step 2: Configure SyntroJS to detect local assets**
```typescript
// In DocsRenderer.ts
private getAssetPath(asset: 'swagger-css' | 'swagger-js' | 'redoc-js'): string {
  // Check if local assets are available
  const hasLocalAssets = this.checkLocalAssets();
  
  if (hasLocalAssets) {
    return `/docs-assets/${asset}`;
  }
  
  // Fallback to CDN
  return this.getCDNUrl(asset);
}

private checkLocalAssets(): boolean {
  try {
    require.resolve('swagger-ui-dist');
    require.resolve('redoc');
    return true;
  } catch {
    return false;
  }
}
```

**Step 3: Register static assets endpoint**
```typescript
// In SyntroJS.ts listen()
if (hasLocalAssets) {
  fastify.register(require('@fastify/static'), {
    root: path.join(require.resolve('swagger-ui-dist'), '../'),
    prefix: '/docs-assets/'
  });
}
```

#### Pros
- ✅ Zero impact on users who don't need it
- ✅ Doesn't bloat main package
- ✅ Explicit opt-in (security-conscious teams see it)
- ✅ Can be used selectively per environment
- ✅ Clear separation of concerns

#### Cons
- ❌ Extra package to maintain
- ❌ Requires installation step
- ❌ Need to document setup

#### Usage
```bash
# For air-gapped/government/banking
npm install @syntrojs/docs-local
```

```javascript
// Assets automatically load locally
const app = new SyntroJS({ title: 'Secure API' });
// No additional config needed!
```

---

### Option 2: Built-in Local Mode with Muon Bundle

#### Concept
Bundle **minimal, self-contained** documentation UI directly in SyntroJS.

#### Tamplementation

**Create custom lightweight docs renderer:**
```typescript
// Minimal documentation UI (no external deps)
private renderSecureDocs(config: DocsConfig): string {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>${config.title}</h1>
        <pre id="spec"></pre>
        <script>
          fetch('${config.openApiUrl}')
            .then(r => r.json())
            .then(spec => {
              document.getElementById('spec').textContent = JSON.stringify(spec, null, 2);
            });
        </script>
      </body>
    </html>
  `;
}
```

#### Pros
- ✅ Zero external dependencies
- ✅ Works everywhere (air-gapped, etc.)
- ✅ No installation needed
- ✅ Small bundle size

#### Cons
- ❌ Less visual than Swagger UI
- ❌ No interactive testing
- ❌ Need to build custom UI for better UX
- ❌ More development time

---

### Option 3: Automatic Detection with Graceful Degradation

#### Concept
Auto-detect local assets, fall back to CDN if not available.

#### Implementation

```typescript
private resolveAssetUrl(asset: string): string {
  try {
    // Try local assets first
    require.resolve('swagger-ui-dist');
    return `/static/${asset}`;
  } catch {
    // Fallback to CDN
    console.warn('⚠️  Using CDN assets. For air-gapped environments, install @syntrojs/docs-local');
    return this.getCDNUrl(asset);
  }
}
```

#### Pros
- ✅ Works out of the box (CDN)
- ✅ Upgrades automatically when local pkg installed
- ✅ No config needed
- ✅ Graceful degradation

#### Cons
- ⚠️ Users might not realize they're using CDN
- ⚠️ Could catch people by surprise
- ⚠️ Mixes two approaches in one

---

### Option 4: Hybrid Approach (BEST OF BOTH WORLDS)

#### Concept
Combine lightweight built-in + optional enhanced UI.

#### Implementation

```typescript
// In config
docs?: boolean | {
  landingPage?: boolean;
  swagger?: boolean;
  swaggerMode?: 'cdn' | 'local' | 'basic';  // NEW
  redoc?: boolean;
  redocMode?: 'cdn' | 'local' | 'basic';   // NEW
  openapi?: boolean;
};
```

**Three modes per UI:**
1. **`cdn`** - Load from jsdelivr (default, current behavior)
2. **`local`** - Load from node_modules (requires @syntrojs/docs-local)
3. **`basic`** - Minimal built-in HTML (no external deps, always works)

#### Usage Examples

```javascript
// Development: CDN (fast, easy)
const dev = new SyntroJS({
  docs: { swagger: true, swaggerMode: 'cdn' }
});

// Production/internal: Local (no CDN dependency)
const internal = new SyntroJS({
  docs: { swagger: true, swaggerMode: 'local' }
});

// Air-gapped/secure: Basic (zero external deps)
const secure = new SyntroJS({
  docs: { swagger: true, swaggerMode: 'basic' }
});
```

#### Pros
- ✅ Maximum flexibility
- ✅ Works in all scenarios
- ✅ Explicit mode selection
- ✅ No surprises
- ✅ Production-ready for all environments

#### Cons
- ❌ More complex to implement
- ❌ Need to build "basic" mode
- ❌ More config options

---

## 📊 Comparison Matrix

| Option | Air-gapped | Government | Banking | Zero-config | Size Impact | Effort |
|--------|------------|------------|---------|-------------|-------------|---------|
| 1. Optional Package | ✅ | ✅ | ✅ | ⚠️ | ✅ None | Medium |
| 2. Minimal Built-in | ✅ | ✅ | ✅ | ✅ | ⚠️ +10KB | High |
| 3. Auto-detect | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ None | Low |
| 4. **Hybrid (3 modes)** | ✅ | ✅ | ✅ | ✅ | ⚠️ +5KB | **High** |

---

## 🎯 Recommendation: Option 4 (Hybrid)

### Why?
1. **Maximum flexibility** - Works everywhere
2. **Production-ready** - Suitable for all environments
3. **Explicit control** - Users choose their mode
4. **Backward compatible** - Default to CDN (existing behavior)
5. **Future-proof** - Can add more modes later

### Implementation Steps

#### Phase 1: Build Basic Mode (MVP)
- Create minimal HTML renderer
- Show OpenAPI spec in readable format
- No external dependencies
- Works everywhere

#### Phase 2: Add Local Mode Support
- Create optional package detector
- Add static asset serving
- Auto-configure when installed

#### Phase 3: Configuration Options
- Add `swaggerMode` and `redocMode` config
- Document all three modes
- Provide migration guide

---

## 💡 Alternative: Start Simple

If Option 4 is too complex, start with **Option 1 (Optional Package)** because:

- ✅ **Easiest to implement** (1-2 days)
- ✅ **Solves 90% of cases** immediately
- ✅ **No breaking changes** to existing users
- ✅ **Can add basic mode later** as enhancement

---

## 🚀 Quick Win Strategy

**Immediate Action (Today):**
1. Document the CDN limitation clearly ✅ (Done)
2. Add warning in production if using CDN mode
3. Create issue/plan for local asset support

**Short Term (1-2 weeks):**
1. Build optional package `@syntrojs/docs-local`
2. Implement local asset detection
3. Add static asset serving

**Long Term (Future):**
1. Build basic/minimal mode
2. Add mode selection config
3. Full hybrid approach

---

## 🤔 Discussion Points

1. **Which option do you prefer?**
   - Option 1: Quick win, solves most cases
   - Option 4: Comprehensive, future-proof

2. **Timeline:**
   - Can we ship v1.0 without it?
   - Is it a blocker for production?

3. **Priority:**
   - How important is air-gapped support now vs later?

4. **Effort vs Impact:**
   - Start simple (Option 1) and iterate?
   - Or go comprehensive (Option 4) from the start?

---

**What do you think? Let's discuss before implementing anything!** 🤝


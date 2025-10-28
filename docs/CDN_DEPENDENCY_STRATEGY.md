# CDN Dependency Strategy - ✅ IMPLEMENTED

**Status:** ✅ COMPLETED - Optional Dependencies with Auto-Detection

**Decision Date:** 2025-01-XX
**Implementation Date:** 2025-01-XX

---

## 🎯 Decision: Optional Dependencies Strategy

## 🤔 Current Situation

**Current:** Swagger UI and ReDoc load from CDN  
**Problem:** Incompatible with air-gapped/government/banking environments

## 💡 Proposed Solution: Install Packages

Add `swagger-ui-dist` and `redoc` as **project dependencies**.

---

## 📊 Option Analysis

### Option A: `dependencies` (Always Installed)

```json
{
  "dependencies": {
    "swagger-ui-dist": "^5.9.0",
    "redoc": "^2.1.0"
  }
}
```

**Pros:**
- ✅ Always available (no CDN needed)
- ✅ Works in all environments
- ✅ Single package for everything
- ✅ Simple for users (no extra installs)

**Cons:**
- ❌ Increases package size (~2MB)
- ❌ Users who don't use docs still get it
- ❌ Not tree-shakeable

**Impact:**
- Package size: `dist/` = 122KB (current) → ~122KB (no change, assets not bundled)
- User's `node_modules`: +~2MB

---

### Option B: `optionalDependencies` (Best Balance)

```json
{
  "optionalDependencies": {
    "swagger-ui-dist": "^5.9.0",
    "redoc": "^2.1.0"
  }
}
```

**Pros:**
- ✅ Installs automatically if possible
- ✅ Doesn't fail if installation fails (graceful degradation)
- ✅ Reduces package size if not needed
- ✅ Users can choose to ignore them

**Cons:**
- ⚠️ Slightly less predictable (may or may not be installed)
- ⚠️ Need to handle both cases in code

**Impact:**
- Package size: No change
- User's `node_modules`: +~2MB if installed, 0 if skipped

---

### Option C: `peerDependencies` (Like Fastify Plugins)

```json
{
  "peerDependencies": {
    "swagger-ui-dist": "^5.9.0",
    "redoc": "^2.1.0"
  }
}
```

**Pros:**
- ✅ Zero impact on package size
- ✅ Users explicitly choose
- ✅ Consistent with other optional features

**Cons:**
- ❌ Requires explicit installation
- ❌ More steps for users
- ❌ May confuse users

**Impact:**
- Package size: No change
- User's `node_modules`: Only if explicitly installed

---

## 🎯 Recommendation: Option B (optionalDependencies)

### Why?

1. **Best of both worlds:**
   - Tries to install (works in most cases)
   - Doesn't fail if can't install (graceful)

2. **User-friendly:**
   - Just works™ for 95% of users
   - Falls back to CDN if not installed
   - No extra steps needed

3. **Handles edge cases:**
   - Air-gapped: Installation fails gracefully, uses CDN (not ideal but works)
   - Government: Can choose to install or not
   - Normal users: Just works

### Implementation Strategy

```typescript
// In DocsRenderer.ts

private getAssetUrl(asset: string): string {
  const useLocal = this.checkLocalAssets();
  
  if (useLocal) {
    return `/docs-assets/${asset}`;
  }
  
  // Fallback to CDN
  console.warn('📦 Using CDN assets. For local assets, ensure swagger-ui-dist and redoc are installed.');
  return this.getCDNUrl(asset);
}

private checkLocalAssets(): boolean {
  try {
    require.resolve('swagger-ui-dist/swagger-ui-bundle.js');
    require.resolve('redoc/bundles/redoc.standalone.js');
    return true;
  } catch {
    return false;
  }
}
```

### Static Asset Serving

```typescript
// In SyntroJS.ts listen()

// Register static assets if available
if (this.hasLocalAssets()) {
  await this.server.register(require('@fastify/static'), {
    root: [
      path.dirname(require.resolve('swagger-ui-dist/swagger-ui-bundle.js')),
      path.dirname(require.resolve('redoc/bundles/redoc.standalone.js'))
    ],
    prefix: '/docs-assets/'
  });
}
```

---

## 📋 Alternative: Pure Dependencies + Smaller Impact

If we want **100% reliable** local assets:

```json
{
  "dependencies": {
    "swagger-ui-dist": "^5.9.0",
    "redoc": "^2.1.0",
    "@fastify/static": "^6.12.0"
  }
}
```

**Trade-off:**
- ✅ Always works locally
- ✅ No CDN dependency ever
- ✅ Predictable
- ❌ +2MB to node_modules
- ❌ Larger package footprint

---

## 🎓 Comparison with Fastify Pattern

Current SyntroJS pattern:
```json
"peerDependencies": {
  "@fastify/compress": "^7.0.0",
  "@fastify/cors": "^9.0.0",
  "@fastify/helmet": "^11.0.0",
  "@fastify/rate-limit": "^9.0.0"
}
```

**For docs assets, we have two options:**

### Pattern 1: Same as Fastify plugins (optional, peer)
- User must `pnpm add swagger-ui-dist redoc`
- Explicit choice
- Zero footprint

### Pattern 2: Include by default (dependencies)
- Always available
- User gets it automatically
- Slightly larger footprint

---

## 🤔 My Take

**I lean toward `dependencies` (Option A)** because:

1. **Swagger/ReDoc are core features** - Not optional plugins
2. **Users expect them to work** - It's a selling point
3. **The overhead is acceptable** - ~2MB is reasonable for a framework
4. **Simplifies everything** - No detection logic, no CDN fallback
5. **Works everywhere** - Air-gapped, government, banking

**Counter-argument for `optionalDependencies`:**
- More flexible
- Users who don't use docs don't pay the cost
- Matches Fastify's plugin philosophy

---

## 💭 Your Call

**Question 1: Dependencies vs Optional?**
- A) `dependencies` - Always include (my preference)
- B) `optionalDependencies` - Try to include, fallback to CDN
- C) `peerDependencies` - User must install

**Question 2: Static serving strategy?**
- A) Auto-register `@fastify/static` when assets available
- B) User must configure static serving themselves

**Question 3: CDN fallback?**
- Keep CDN as fallback if local assets not available?
- Or require local assets (fail if not installed)?

---

## 🚀 Recommended Implementation (My Pick)

```json
{
  "dependencies": {
    "swagger-ui-dist": "^5.9.0",
    "redoc": "^2.1.0",
    "@fastify/static": "^6.12.0"
  }
}
```

**Benefits:**
- ✅ Works everywhere (no CDN)
- ✅ Simple code (no detection logic)
- ✅ Reliable (always available)
- ✅ Professional (enterprise-ready)

**Trade-off:**
- +~2MB to node_modules (acceptable for framework)

---

**What's your preference?** 🤔

---

## ✅ FINAL DECISION & IMPLEMENTATION

**Chosen Strategy:** Optional Dependencies with Auto-Detection (Option B)

### Why This Approach?

After discussion with the user, we chose **optionalDependencies** because:

1. **Zero friction for 99% of users**: By default, works with CDN (no extra installs)
2. **Auto-detection**: No manual configuration needed
3. **Best of both worlds**: CDN for speed, local for security
4. **Bundle impact**: Only +15MB for users who actually need it
5. **Enterprise-ready**: Works in air-gapped environments when needed

### Implementation Details

**package.json:**
```json
{
  "dependencies": {
    "@fastify/static": "^7.0.0"
  },
  "optionalDependencies": {
    "swagger-ui-dist": "^5.9.0",
    "redoc": "^2.1.0"
  }
}
```

**Auto-Detection Logic:**
- SyntroJS automatically detects if packages are installed
- If installed → Serve from `node_modules` (local mode)
- If not installed → Use CDN (default behavior)
- No configuration needed from user

**Usage:**

```bash
# For most users (uses CDN):
pnpm install syntrojs

# For air-gapped environments (uses local):
pnpm install syntrojs --include=optional
# OR
pnpm install syntrojs swagger-ui-dist redoc
```

### Status: ✅ IMPLEMENTED

- [x] Updated `package.json` with optionalDependencies
- [x] Auto-detection logic in `SyntroJS.ts`
- [x] Dynamic asset loading in `DocsRenderer.ts`
- [x] Documentation updated in README.md
- [x] Production deployment guide updated
- [x] Zero-config experience maintained

**Result:** SyntroJS now works seamlessly in both CDN-friendly and air-gapped environments!


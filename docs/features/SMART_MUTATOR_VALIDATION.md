# SmartMutator Validation Plan

## Goals

Validate that SmartMutator is truly fast in real-world scenarios, not just in theory.

## Test Scenarios

### 1. Current Test (In Progress)
```bash
# CI/CD simulation with force full
npm run test:mutate:ci
```

**Expected**: Complete mutation coverage of all files

### 2. Incremental Test (Next)
Make a small change to a file in `src/` and test smart mode:

```bash
# 1. Make a small change to src/application/SchemaValidator.ts
# (e.g., add a comment or change a variable name)

# 2. Run smart mode
npm run test:mutate

# Expected behavior:
# - Detects ONLY SchemaValidator.ts as changed
# - Mutates ONLY SchemaValidator.ts
# - Runs faster than full mode
# - Reports time: < 10 seconds
```

### 3. No Changes Test
```bash
# No git changes
npm run test:mutate

# Expected behavior:
# - Detects no changes
# - Falls back to full config
# - Runs complete mutation testing
```

### 4. Multiple Files Test
```bash
# Make changes to 3-4 files
git add .  # stage changes
npm run test:mutate

# Expected behavior:
# - Detects all changed files
# - Mutates only those files
# - Faster than full mode
```

## Validation Checklist

- [ ] Smart mode detects changed files correctly
- [ ] Smart mode only mutates changed files
- [ ] Smart mode is faster than full mode
- [ ] Smart mode produces similar results to full mode
- [ ] Fallback to full config works when no changes
- [ ] CI/CD mode forces full coverage
- [ ] Results are auditable and repeatable

## Performance Targets

| Scenario | Target Time | Actual Time | Status |
|----------|-------------|-------------|--------|
| Single file change | < 10s | TBD | ⏳ |
| 3-4 file changes | < 30s | TBD | ⏳ |
| Full mode | < 5 min | TBD | ⏳ |
| CI/CD mode | < 5 min | TBD | ⏳ |

## Notes

- Mutation testing in the main library (`src/`) validates the tool
- Examples directory uses `.js` files, not `.ts`, so won't be covered
- Real-world validation happens when users adopt SmartMutator in their projects

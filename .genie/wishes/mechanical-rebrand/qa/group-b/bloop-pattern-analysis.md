# Bloop AI Pattern Analysis

## Summary
Found **17 occurrences** across **8 files** in upstream/

## Pattern Variants Found

### 1. Company Name Variants
- `Bloop AI` → `Namastex Labs` (with space, title case)
- `bloop` → `namastex` (lowercase, single word)
- `BloopAI` → `NamastexLabs` (no space, PascalCase)

### 2. Email Domain
- `bloop.ai` → `namastex.ai` (domain)
- `maintainers@bloop.ai` → `maintainers@namastex.ai`

### 3. Organization/Namespace
- `"ai", "bloop"` → `"ai", "namastex"` (in ProjectDirs paths)
- `"ai", "bloop-dev"` → `"ai", "namastex-dev"` (dev variant)
- `org: "bloop-ai"` → `org: "namastex-labs"` (Sentry config)

### 4. Package/Extension IDs
- `bloop.automagik-forge` → `namastex.automagik-forge` (VSCode extension ID)
- `@id:bloop.automagik-forge` → `@id:namastex.automagik-forge`
- `extension/bloop/automagik-forge` → `extension/namastex/automagik-forge`
- `itemName=bloop.automagik-forge` → `itemName=namastex.automagik-forge`

### 5. Author Field
- `"author": "bloop"` → `"author": "namastex"`

### 6. URL Paths
- `/BloopAI/` → `/NamastexLabs/` (DeepWiki URL path)

## Files to Modify (8 files)

### 1. README.md (2 occurrences)
```
Line: <a href="https://deepwiki.com/BloopAI/automagik-forge">
Pattern: BloopAI → NamastexLabs

Line: By default, Automagik Forge uses Bloop AI's GitHub OAuth app
Pattern: Bloop AI → Namastex Labs
```

### 2. CLAUDE.md (1 occurrence)
```
Line: - `GITHUB_CLIENT_ID`: GitHub OAuth app ID (default: Bloop AI's app)
Pattern: Bloop AI → Namastex Labs
```

### 3. CODE-OF-CONDUCT.md (1 occurrence)
```
Line: maintainers@bloop.ai through e-mail
Pattern: bloop.ai → namastex.ai
```

### 4. npx-cli/package.json (1 occurrence)
```
Line: "author": "bloop",
Pattern: bloop → namastex
```

### 5. crates/utils/src/assets.rs (1 occurrence)
```
Line: ProjectDirs::from("ai", "bloop", "automagik-forge")
Pattern: "bloop" → "namastex"
```

### 6. crates/utils/src/lib.rs (2 occurrences)
```
Line: ProjectDirs::from("ai", "bloop-dev", env!("CARGO_PKG_NAME"))
Pattern: "bloop-dev" → "namastex-dev"

Line: ProjectDirs::from("ai", "bloop", env!("CARGO_PKG_NAME"))
Pattern: "bloop" → "namastex"
```

### 7. frontend/vite.config.ts (1 occurrence)
```
Line: sentryVitePlugin({ org: "bloop-ai", project: "automagik-forge" })
Pattern: "bloop-ai" → "namastex-labs"
```

### 8. docs/integrations/vscode-extension.mdx (8 occurrences)
```
Lines (multiple):
- VSCode Marketplace URL: itemName=bloop.automagik-forge
- Open VSX URL: extension/bloop/automagik-forge (appears 2x)
- Search instructions: @id:bloop.automagik-forge (appears 4x)
- Extension ID reference: bloop.automagik-forge (appears 1x)

Pattern: bloop → namastex (all instances)
```

## Recommended Sed Patterns

```bash
# Company name variants
-e 's/Bloop AI/Namastex Labs/g'
-e 's/BloopAI/NamastexLabs/g'

# Email domain
-e 's/bloop\.ai/namastex.ai/g'

# Organization IDs (careful - order matters)
-e 's/"bloop-dev"/"namastex-dev"/g'
-e 's/"bloop-ai"/"namastex-labs"/g'
-e 's/"bloop"/"namastex"/g'

# Extension/package IDs (be careful with dots)
-e 's/bloop\.automagik-forge/namastex.automagik-forge/g'
-e 's/extension\/bloop\//extension\/namastex\//g'
-e 's/itemName=bloop\./itemName=namastex./g'

# URL paths
-e 's/\/BloopAI\//\/NamastexLabs\//g'

# Generic lowercase (catch-all, but be careful)
-e 's/\bbloop\b/namastex/g'
```

## Important Notes

1. **Order Matters:** Process `bloop-dev` and `bloop-ai` BEFORE generic `bloop`
2. **Word Boundaries:** Use `\b` for generic patterns to avoid partial matches
3. **Escaped Dots:** Use `\.` for literal dots in domains/IDs
4. **Case Sensitivity:** Pattern needs both `Bloop AI` and `BloopAI`

## Verification After Replacement

```bash
# Should return 0
grep -ri "bloop" upstream | grep -v ".git" | wc -l
```

## Expected Results

- **Files modified:** 8
- **Occurrences replaced:** 17
- **Remaining "bloop" references:** 0

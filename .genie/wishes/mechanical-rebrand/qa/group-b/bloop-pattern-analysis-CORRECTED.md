# Bloop AI Pattern Analysis - CORRECTED

## Summary
Found **17 occurrences** across **8 files** in upstream/

## Correct Mappings (Based on Namastex Infrastructure)

- **GitHub Org:** `namastexlabs` (no hyphen, lowercase)
- **Website:** `namastex.ai`
- **Forge Website:** `forge.automag.ik`

## Pattern Variants Found & CORRECT Replacements

### 1. Company Name Variants
- `Bloop AI` → `Namastex Labs` (with space, title case)
- `BloopAI` → `NamastexLabs` (no space, PascalCase - for URLs/paths)
- `bloop` → `namastex` (lowercase, single word - for author field)

### 2. Email Domain
- `bloop.ai` → `namastex.ai` (domain)
- `maintainers@bloop.ai` → `maintainers@namastex.ai`

### 3. Organization/Namespace (ProjectDirs paths)
- `"ai", "bloop"` → `"ai", "namastex"` (in ProjectDirs paths)
- `"ai", "bloop-dev"` → `"ai", "namastex-dev"` (dev variant)

### 4. Sentry Organization
- `org: "bloop-ai"` → `org: "namastexlabs"` (GitHub org name, no hyphens)

### 5. VSCode Extension IDs
- `bloop.automagik-forge` → `namastexlabs.automagik-forge` (publisher.extension)
- `@id:bloop.automagik-forge` → `@id:namastexlabs.automagik-forge`
- `extension/bloop/automagik-forge` → `extension/namastexlabs/automagik-forge`
- `itemName=bloop.automagik-forge` → `itemName=namastexlabs.automagik-forge`

### 6. Author Field
- `"author": "bloop"` → `"author": "Namastex Labs"`

### 7. URL Paths
- `/BloopAI/` → `/NamastexLabs/` (DeepWiki URL path - keep PascalCase)

## Files to Modify (8 files)

### 1. README.md (2 occurrences)
```
Line: <a href="https://deepwiki.com/BloopAI/automagik-forge">
Replacement: BloopAI → NamastexLabs
Result: https://deepwiki.com/NamastexLabs/automagik-forge

Line: By default, Automagik Forge uses Bloop AI's GitHub OAuth app
Replacement: Bloop AI → Namastex Labs
Result: By default, Automagik Forge uses Namastex Labs' GitHub OAuth app
```

### 2. CLAUDE.md (1 occurrence)
```
Line: - `GITHUB_CLIENT_ID`: GitHub OAuth app ID (default: Bloop AI's app)
Replacement: Bloop AI → Namastex Labs
Result: (default: Namastex Labs' app)
```

### 3. CODE-OF-CONDUCT.md (1 occurrence)
```
Line: maintainers@bloop.ai through e-mail
Replacement: bloop.ai → namastex.ai
Result: maintainers@namastex.ai through e-mail
```

### 4. npx-cli/package.json (1 occurrence)
```
Line: "author": "bloop",
Replacement: "bloop" → "Namastex Labs"
Result: "author": "Namastex Labs",
```

### 5. crates/utils/src/assets.rs (1 occurrence)
```
Line: ProjectDirs::from("ai", "bloop", "automagik-forge")
Replacement: "bloop" → "namastex"
Result: ProjectDirs::from("ai", "namastex", "automagik-forge")
```

### 6. crates/utils/src/lib.rs (2 occurrences)
```
Line: ProjectDirs::from("ai", "bloop-dev", env!("CARGO_PKG_NAME"))
Replacement: "bloop-dev" → "namastex-dev"
Result: ProjectDirs::from("ai", "namastex-dev", env!("CARGO_PKG_NAME"))

Line: ProjectDirs::from("ai", "bloop", env!("CARGO_PKG_NAME"))
Replacement: "bloop" → "namastex"
Result: ProjectDirs::from("ai", "namastex", env!("CARGO_PKG_NAME"))
```

### 7. frontend/vite.config.ts (1 occurrence)
```
Line: sentryVitePlugin({ org: "bloop-ai", project: "automagik-forge" })
Replacement: "bloop-ai" → "namastexlabs" (GitHub org name)
Result: sentryVitePlugin({ org: "namastexlabs", project: "automagik-forge" })
```

### 8. docs/integrations/vscode-extension.mdx (8 occurrences)
```
All instances: bloop → namastexlabs (VSCode publisher name = GitHub org)

Examples:
- itemName=bloop.automagik-forge → itemName=namastexlabs.automagik-forge
- extension/bloop/automagik-forge → extension/namastexlabs/automagik-forge  
- @id:bloop.automagik-forge → @id:namastexlabs.automagik-forge

Note: VSCode publisher/extension IDs use GitHub org name: namastexlabs
```

## CORRECTED Sed Patterns (Order Matters!)

```bash
# 1. Company name variants (must come first)
-e 's/Bloop AI/Namastex Labs/g'
-e 's/BloopAI/NamastexLabs/g'

# 2. Email domain
-e 's/bloop\.ai/namastex.ai/g'

# 3. Organization IDs - SPECIFIC FIRST, then generic
-e 's/"bloop-dev"/"namastex-dev"/g'
-e 's/"bloop-ai"/"namastexlabs"/g'  # Sentry uses GitHub org name

# 4. VSCode Extension IDs (publisher = GitHub org)
-e 's/bloop\.automagik-forge/namastexlabs.automagik-forge/g'
-e 's/extension\/bloop\//extension\/namastexlabs\//g'
-e 's/itemName=bloop\./itemName=namastexlabs./g'
-e 's/@id:bloop\./@id:namastexlabs./g'

# 5. URL paths
-e 's/\/BloopAI\//\/NamastexLabs\//g'

# 6. Author field (must replace with full name)
-e 's/"author": "bloop"/"author": "Namastex Labs"/g'

# 7. ProjectDirs paths (after specific patterns)
-e 's/"bloop"/"namastex"/g'

# 8. Generic catch-all (LAST, for any remaining)
# (Disabled - too risky, use specific patterns only)
# -e 's/\bbloop\b/namastex/g'
```

## Key Corrections

1. **VSCode Extension Publisher:** `namastexlabs` (matches GitHub org, no hyphen/space)
2. **Sentry Org:** `namastexlabs` (matches GitHub org)
3. **Author Field:** `"Namastex Labs"` (full company name with space)
4. **ProjectDirs:** `"namastex"` (lowercase, simple)
5. **Email Domain:** `namastex.ai` (matches website)

## Verification After Replacement

```bash
# Should return 0
grep -ri "bloop" upstream | grep -v ".git" | wc -l

# Verify correct replacements
grep -r "namastexlabs" upstream | grep -v ".git"  # Should find Sentry + VSCode refs
grep -r "Namastex Labs" upstream | grep -v ".git"  # Should find company name refs
grep -r "namastex.ai" upstream | grep -v ".git"    # Should find email
```

## Expected Results

- **Files modified:** 8
- **Occurrences replaced:** 17
- **Remaining "bloop" references:** 0
- **GitHub org used:** namastexlabs (no hyphen)
- **Email domain:** namastex.ai
- **Company name:** Namastex Labs (with space)

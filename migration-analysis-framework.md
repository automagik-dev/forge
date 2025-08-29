# MIGRATION ANALYSIS FRAMEWORK
## Critical Analysis Mission: workspace-migration-old vs dev

### 🎯 ANALYSIS CHECKLIST

#### **1. STRUCTURAL ANALYSIS**
- [ ] **Root Level Changes**
  - New files in root directory
  - Modified package.json, Cargo.toml
  - New scripts or configuration files
  - Changes to README, CLAUDE.md, or documentation

- [ ] **Frontend Structure** (`/frontend/`)
  - New React components
  - Modified existing components
  - New hooks, contexts, or utilities
  - Changes to package.json dependencies
  - Modified vite.config.ts or other configs
  - New pages or routing changes

- [ ] **Backend Structure** (`/crates/`)
  - New Rust crates or modules
  - Modified existing crates
  - New database migrations
  - Changes to API routes
  - New services or utilities

#### **2. CONFIGURATION ANALYSIS**
- [ ] **Package Dependencies**
  - `/package.json` - new/modified dependencies
  - `/frontend/package.json` - frontend dependencies
  - `/Cargo.toml` - Rust dependencies
  - Individual crate dependencies

- [ ] **Build Configuration**
  - `/frontend/vite.config.ts`
  - `/frontend/tsconfig.json`
  - Rust build configurations
  - Docker or deployment configs

- [ ] **Development Environment**
  - Scripts in `/scripts/`
  - Development setup files
  - Environment variable definitions

#### **3. FEATURE CUSTOMIZATIONS**
- [ ] **Frontend Features**
  - New UI components
  - Modified user interfaces
  - New pages or views
  - Custom styling or themes

- [ ] **Backend Features**
  - New API endpoints
  - Modified business logic
  - New database schemas
  - Custom services or integrations

- [ ] **Integration Features**
  - External API integrations
  - Authentication modifications
  - Custom middleware

#### **4. CODE PATTERNS & UTILITIES**
- [ ] **Frontend Patterns**
  - Custom hooks (`/frontend/src/hooks/`)
  - Utilities (`/frontend/src/lib/`, `/frontend/src/utils/`)
  - Context providers (`/frontend/src/contexts/`)
  - Custom components (`/frontend/src/components/`)

- [ ] **Backend Patterns**
  - Rust utilities (`/crates/utils/`)
  - Services (`/crates/services/`)
  - Database models (`/crates/db/`)
  - Executors or custom logic

#### **5. DATABASE & MIGRATIONS**
- [ ] **Schema Changes**
  - New migration files in `/crates/db/migrations/`
  - Modified database models
  - New tables or relationships

#### **6. ASSETS & RESOURCES**
- [ ] **Static Assets**
  - New images, sounds, or media
  - Modified public files
  - Custom icons or branding

### 🔍 DETAILED DIFF COMMANDS

```bash
# For each category, run detailed diffs:

# 1. Package.json changes
git diff dev..workspace-migration-old -- package.json
git diff dev..workspace-migration-old -- frontend/package.json

# 2. Configuration files
git diff dev..workspace-migration-old -- "*.config.*" "*.json" "*.toml"

# 3. Frontend component changes
git diff dev..workspace-migration-old -- frontend/src/components/

# 4. Backend API routes
git diff dev..workspace-migration-old -- crates/server/src/routes/

# 5. Database migrations
git diff dev..workspace-migration-old -- crates/db/migrations/

# 6. Custom utilities and services
git diff dev..workspace-migration-old -- crates/services/src/
git diff dev..workspace-migration-old -- crates/utils/src/
```

### 📊 PRIORITY ANALYSIS AREAS

**HIGH PRIORITY** (Core Functionality):
1. Database migrations and schema changes
2. API endpoint modifications
3. Authentication or security changes
4. Core business logic modifications

**MEDIUM PRIORITY** (Features):
1. New UI components or pages
2. Custom hooks and utilities  
3. Configuration changes
4. New integrations

**LOW PRIORITY** (Polish):
1. Styling or theme changes
2. Asset updates
3. Documentation changes
4. Development tooling

### 📝 DOCUMENTATION TEMPLATE

For each significant change found:
```
**File**: [path/to/file]
**Category**: [Frontend|Backend|Config|Database]
**Change Type**: [New|Modified|Deleted]
**Description**: [What was changed and why]
**Impact**: [How this affects functionality]
**Dependencies**: [What other changes depend on this]
```
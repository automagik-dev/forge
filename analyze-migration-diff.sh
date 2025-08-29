#!/bin/bash

# Critical Analysis Script: workspace-migration-old vs dev
# This script will generate comprehensive reports on all customizations

echo "🚀 Starting Critical Migration Analysis..."
echo "========================================"

# Create analysis directory
mkdir -p migration-analysis-results
cd migration-analysis-results

echo "📊 Step 1: Generating file structure comparisons..."

# Switch to workspace-migration-old and capture structure
echo "Switching to workspace-migration-old branch..."
git checkout workspace-migration-old

echo "Capturing workspace-migration-old file structure..."
find .. -type f -not -path "../.git/*" -not -path "../node_modules/*" -not -path "../target/*" -not -path "../frontend/node_modules/*" -not -path "../frontend/dist/*" | sort > workspace-migration-old-files.txt

# Also capture package.json structures for analysis
cp ../package.json workspace-migration-old-root-package.json 2>/dev/null || echo "No root package.json in workspace-migration-old"
cp ../frontend/package.json workspace-migration-old-frontend-package.json 2>/dev/null || echo "No frontend package.json in workspace-migration-old"
cp ../Cargo.toml workspace-migration-old-cargo.toml 2>/dev/null || echo "No Cargo.toml in workspace-migration-old"

# Switch back to dev branch
echo "Switching back to dev branch..."
git checkout dev

echo "Capturing dev branch file structure..."
find .. -type f -not -path "../.git/*" -not -path "../node_modules/*" -not -path "../target/*" -not -path "../frontend/node_modules/*" -not -path "../frontend/dist/*" | sort > dev-files.txt

# Capture current package.json structures
cp ../package.json dev-root-package.json
cp ../frontend/package.json dev-frontend-package.json
cp ../Cargo.toml dev-cargo.toml

echo "📊 Step 2: Analyzing structural differences..."

# Find new files (in workspace-migration-old but not in dev)
echo "Finding files that exist in workspace-migration-old but NOT in dev..."
comm -23 workspace-migration-old-files.txt dev-files.txt > files-only-in-workspace-migration-old.txt

# Find deleted files (in dev but not in workspace-migration-old)
echo "Finding files that exist in dev but NOT in workspace-migration-old..."
comm -13 workspace-migration-old-files.txt dev-files.txt > files-only-in-dev.txt

# Find common files (exist in both)
echo "Finding files that exist in both branches..."
comm -12 workspace-migration-old-files.txt dev-files.txt > common-files.txt

echo "📊 Step 3: Generating comprehensive diffs..."

# Get overall diff between branches
echo "Generating complete diff between branches..."
git diff dev..workspace-migration-old > complete-branch-diff.txt 2>/dev/null || echo "Error generating complete diff"

# Get list of changed files
echo "Getting list of all modified files..."
git diff --name-only dev..workspace-migration-old > modified-files-list.txt 2>/dev/null || echo "Error getting modified files list"

# Get detailed stats
echo "Getting diff statistics..."
git diff --stat dev..workspace-migration-old > diff-statistics.txt 2>/dev/null || echo "Error getting diff statistics"

echo "📊 Step 4: Analyzing specific file categories..."

# Configuration file diffs
echo "Analyzing configuration files..."
git diff dev..workspace-migration-old -- "*.json" "*.toml" "*.config.*" "*.yml" "*.yaml" > config-files-diff.txt 2>/dev/null

# Package.json specific analysis
echo "Analyzing package.json differences..."
if [ -f workspace-migration-old-root-package.json ] && [ -f dev-root-package.json ]; then
    diff workspace-migration-old-root-package.json dev-root-package.json > root-package-json-diff.txt
fi

if [ -f workspace-migration-old-frontend-package.json ] && [ -f dev-frontend-package.json ]; then
    diff workspace-migration-old-frontend-package.json dev-frontend-package.json > frontend-package-json-diff.txt
fi

if [ -f workspace-migration-old-cargo.toml ] && [ -f dev-cargo.toml ]; then
    diff workspace-migration-old-cargo.toml dev-cargo.toml > cargo-toml-diff.txt
fi

# Frontend specific analysis
echo "Analyzing frontend changes..."
git diff dev..workspace-migration-old -- "frontend/" > frontend-changes.txt 2>/dev/null

# Backend/Rust specific analysis
echo "Analyzing backend/Rust changes..."
git diff dev..workspace-migration-old -- "crates/" "*.rs" "Cargo.toml" "Cargo.lock" > backend-changes.txt 2>/dev/null

# Database migrations analysis
echo "Analyzing database migrations..."
git diff dev..workspace-migration-old -- "crates/db/migrations/" > database-migrations-diff.txt 2>/dev/null

# Scripts and tooling analysis
echo "Analyzing scripts and tooling..."
git diff dev..workspace-migration-old -- "scripts/" "*.sh" "*.js" "*.ts" "*config*" > scripts-tooling-diff.txt 2>/dev/null

echo "📊 Step 5: Generating summary report..."

cat > MIGRATION_ANALYSIS_REPORT.md << 'EOF'
# 🚨 CRITICAL MIGRATION ANALYSIS REPORT
## workspace-migration-old vs dev Branch Comparison

### 📊 EXECUTIVE SUMMARY
This report identifies ALL customizations that exist in `workspace-migration-old` but not in `dev`.

### 📁 FILE STRUCTURE ANALYSIS

#### Files ONLY in workspace-migration-old:
See: `files-only-in-workspace-migration-old.txt`

#### Files ONLY in dev (upstream additions):
See: `files-only-in-dev.txt`

#### Modified Files:
See: `modified-files-list.txt`

### 🔧 CONFIGURATION CHANGES

#### Root Package.json Changes:
See: `root-package-json-diff.txt`

#### Frontend Package.json Changes:
See: `frontend-package-json-diff.txt`

#### Cargo.toml Changes:
See: `cargo-toml-diff.txt`

#### General Configuration Files:
See: `config-files-diff.txt`

### 💻 CODE CHANGES

#### Frontend Customizations:
See: `frontend-changes.txt`

#### Backend/Rust Customizations:
See: `backend-changes.txt`

#### Database Schema Changes:
See: `database-migrations-diff.txt`

#### Scripts & Tooling:
See: `scripts-tooling-diff.txt`

### 📈 DIFF STATISTICS
See: `diff-statistics.txt`

### 🔍 COMPLETE DIFF
See: `complete-branch-diff.txt` (WARNING: This file may be very large)

---

## 🎯 NEXT STEPS FOR RECOVERY

1. **Review each diff file systematically**
2. **Identify critical vs nice-to-have customizations**
3. **Plan phased re-implementation strategy**
4. **Test each recovered feature thoroughly**

### 🚨 CRITICAL FILES TO EXAMINE FIRST:
1. Database migrations (`database-migrations-diff.txt`)
2. Configuration changes (`config-files-diff.txt`)
3. Core backend logic (`backend-changes.txt`)
4. Frontend feature additions (`frontend-changes.txt`)

EOF

# Count lines in each analysis file for quick reference
echo "" >> MIGRATION_ANALYSIS_REPORT.md
echo "### 📊 ANALYSIS FILE SIZES (for prioritization):" >> MIGRATION_ANALYSIS_REPORT.md
for file in *.txt; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        echo "- $file: $lines lines" >> MIGRATION_ANALYSIS_REPORT.md
    fi
done

echo ""
echo "✅ Analysis Complete!"
echo "=================="
echo "📁 All analysis files are in: migration-analysis-results/"
echo "📋 Start with: MIGRATION_ANALYSIS_REPORT.md"
echo ""
echo "🚨 PRIORITY FILES TO EXAMINE:"
echo "1. files-only-in-workspace-migration-old.txt"
echo "2. modified-files-list.txt"
echo "3. diff-statistics.txt"
echo "4. config-files-diff.txt"
echo ""
echo "Happy recovery! 🚀"

cd ..
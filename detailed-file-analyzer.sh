#!/bin/bash

# Detailed File-by-File Analysis Script
# Run this AFTER the main analysis script for deeper insights

echo "🔍 Detailed File-by-File Analysis"
echo "=================================="

if [ ! -d "migration-analysis-results" ]; then
    echo "❌ Please run analyze-migration-diff.sh first!"
    exit 1
fi

cd migration-analysis-results

echo "📊 Analyzing specific file categories in detail..."

# Create detailed analysis directory
mkdir -p detailed-analysis

# Analyze each modified file individually if we have the list
if [ -f "modified-files-list.txt" ]; then
    echo "🔍 Generating individual file diffs..."
    mkdir -p detailed-analysis/individual-files
    
    while read -r file; do
        if [ -n "$file" ]; then
            # Clean filename for use as filename (replace / with _)
            clean_filename=$(echo "$file" | sed 's/\//_/g')
            echo "Analyzing: $file"
            git diff dev..workspace-migration-old -- "$file" > "detailed-analysis/individual-files/${clean_filename}.diff" 2>/dev/null
        fi
    done < modified-files-list.txt
fi

# Analyze new files in workspace-migration-old
echo "📁 Analyzing files unique to workspace-migration-old..."
if [ -f "files-only-in-workspace-migration-old.txt" ]; then
    mkdir -p detailed-analysis/new-files-content
    
    # Switch to workspace-migration-old to examine new files
    git checkout workspace-migration-old
    
    while read -r file; do
        if [ -n "$file" ] && [ -f "$file" ]; then
            # Create directory structure and copy file
            dirname=$(dirname "$file")
            mkdir -p "detailed-analysis/new-files-content/$dirname"
            cp "$file" "detailed-analysis/new-files-content/$file" 2>/dev/null
            
            # Also create a summary of the file
            clean_filename=$(echo "$file" | sed 's/\//_/g' | sed 's/\.\.//')
            echo "FILE: $file" > "detailed-analysis/new-files-content/${clean_filename}.summary.txt"
            echo "SIZE: $(wc -l < "$file" 2>/dev/null || echo '0') lines" >> "detailed-analysis/new-files-content/${clean_filename}.summary.txt"
            echo "TYPE: $(file -b "$file" 2>/dev/null || echo 'unknown')" >> "detailed-analysis/new-files-content/${clean_filename}.summary.txt"
            echo "FIRST 50 LINES:" >> "detailed-analysis/new-files-content/${clean_filename}.summary.txt"
            head -50 "$file" 2>/dev/null >> "detailed-analysis/new-files-content/${clean_filename}.summary.txt"
        fi
    done < files-only-in-workspace-migration-old.txt
    
    # Switch back to dev
    git checkout dev
fi

# Create categorized analysis
echo "📂 Categorizing changes by type..."

mkdir -p detailed-analysis/by-category

# Frontend components
echo "Analyzing frontend components..."
if [ -f "../frontend" ]; then
    git diff dev..workspace-migration-old -- "frontend/src/components/" > detailed-analysis/by-category/frontend-components.diff 2>/dev/null
fi

# Frontend hooks
echo "Analyzing frontend hooks..."
git diff dev..workspace-migration-old -- "frontend/src/hooks/" > detailed-analysis/by-category/frontend-hooks.diff 2>/dev/null

# Frontend pages
echo "Analyzing frontend pages..."
git diff dev..workspace-migration-old -- "frontend/src/pages/" > detailed-analysis/by-category/frontend-pages.diff 2>/dev/null

# Frontend utils
echo "Analyzing frontend utilities..."
git diff dev..workspace-migration-old -- "frontend/src/lib/" "frontend/src/utils/" > detailed-analysis/by-category/frontend-utils.diff 2>/dev/null

# Backend API routes
echo "Analyzing backend API routes..."
git diff dev..workspace-migration-old -- "crates/server/src/routes/" > detailed-analysis/by-category/backend-api-routes.diff 2>/dev/null

# Backend services
echo "Analyzing backend services..."
git diff dev..workspace-migration-old -- "crates/services/" > detailed-analysis/by-category/backend-services.diff 2>/dev/null

# Database models
echo "Analyzing database models..."
git diff dev..workspace-migration-old -- "crates/db/src/models/" > detailed-analysis/by-category/database-models.diff 2>/dev/null

# Executors
echo "Analyzing executors..."
git diff dev..workspace-migration-old -- "crates/executors/" > detailed-analysis/by-category/executors.diff 2>/dev/null

# Create priority report
echo "📋 Creating priority recovery report..."

cat > detailed-analysis/PRIORITY_RECOVERY_PLAN.md << 'EOF'
# 🎯 PRIORITY RECOVERY PLAN

## 🚨 CRITICAL (Must Recover First)
1. **Database Schema Changes**
   - Check: `database-migrations-diff.txt`
   - Risk: Data loss, application crashes
   - Action: Apply missing migrations carefully

2. **Configuration Dependencies**
   - Check: `*package-json-diff.txt`, `cargo-toml-diff.txt`
   - Risk: Build failures, missing features
   - Action: Merge dependency changes

3. **API Route Changes**
   - Check: `by-category/backend-api-routes.diff`
   - Risk: Frontend integration breaks
   - Action: Restore custom endpoints

## ⚠️ HIGH PRIORITY (Core Features)
4. **Backend Services**
   - Check: `by-category/backend-services.diff`
   - Risk: Business logic missing
   - Action: Restore custom services

5. **Frontend Components**
   - Check: `by-category/frontend-components.diff`
   - Risk: UI features missing
   - Action: Restore custom UI components

6. **Database Models**
   - Check: `by-category/database-models.diff`
   - Risk: Data access issues
   - Action: Restore model changes

## 📋 MEDIUM PRIORITY (Enhanced Features)
7. **Frontend Hooks & Utils**
   - Check: `by-category/frontend-hooks.diff`, `by-category/frontend-utils.diff`
   - Risk: Reduced functionality
   - Action: Restore custom hooks and utilities

8. **Executors & Custom Logic**
   - Check: `by-category/executors.diff`
   - Risk: Custom processing missing
   - Action: Restore executor modifications

## 🔧 LOW PRIORITY (Polish & Tooling)
9. **Scripts & Tooling**
   - Check: `scripts-tooling-diff.txt`
   - Risk: Development workflow impact
   - Action: Restore development scripts

10. **Assets & Documentation**
    - Check: New files in `new-files-content/`
    - Risk: Missing resources
    - Action: Add custom assets and docs

## 📝 RECOVERY WORKFLOW
1. **Review each category systematically**
2. **Test in isolation before integration**
3. **Update dependencies incrementally**
4. **Validate with existing tests**
5. **Document what was recovered**

EOF

echo ""
echo "✅ Detailed Analysis Complete!"
echo "=============================="
echo "📁 Detailed results in: migration-analysis-results/detailed-analysis/"
echo "📋 Priority plan: detailed-analysis/PRIORITY_RECOVERY_PLAN.md"
echo ""
echo "🔍 EXAMINE THESE FIRST:"
echo "1. detailed-analysis/PRIORITY_RECOVERY_PLAN.md"
echo "2. detailed-analysis/by-category/ (organized by feature type)"
echo "3. detailed-analysis/individual-files/ (specific file changes)"
echo "4. detailed-analysis/new-files-content/ (completely new files)"

cd ..
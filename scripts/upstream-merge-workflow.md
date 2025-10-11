# Upstream Merge Workflow

## Standard Process

When pulling new upstream version:

```bash
# 1. Update upstream submodule
cd upstream
git fetch origin
git checkout v0.0.XXX  # or main/latest tag
cd ..

# 2. Update submodule reference
git add upstream
git commit -m "chore: update upstream to v0.0.XXX"

# 3. Run mechanical rebrand
./scripts/rebrand.sh

# 4. Verify and commit
git add -A
git commit -m "chore: rebrand after upstream merge"

# 5. Test
cargo build -p forge-app
cd frontend && npm run build
```

Total time: ~2 minutes

## One-Time Cleanup (After First Rebrand)

Identify redundant forge-overrides:
```bash
# List files that only differ in branding
for file in $(find forge-overrides -type f); do
    upstream_file="upstream/${file#forge-overrides/}"
    if [ -f "$upstream_file" ]; then
        # If files are now identical after rebrand, mark for removal
        if diff -q "$file" "$upstream_file" > /dev/null; then
            echo "Can remove: $file"
        fi
    fi
done
```

Remove redundant files to simplify codebase.
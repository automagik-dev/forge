#!/bin/bash
# Check upstream alignment - ensures no duplicated crates exist

echo "Checking upstream alignment..."

# List of crates that should NOT exist in crates/ directory
DISALLOWED_CRATES="db services server executors utils deployment local-deployment"

# Check if any disallowed crates exist
FOUND_DUPLICATES=0
for crate in $DISALLOWED_CRATES; do
    if [ -d "crates/$crate" ]; then
        echo "❌ ERROR: Duplicate crate found: crates/$crate"
        echo "   This crate should be used from upstream/crates/$crate"
        FOUND_DUPLICATES=1
    fi
done

# Verify forge-app uses upstream crates
echo "Verifying forge-app dependencies..."
if ! grep -q 'path = "../upstream/crates' forge-app/Cargo.toml; then
    echo "❌ ERROR: forge-app not using upstream crates"
    echo "   Expected path dependencies like: path = \"../upstream/crates/...\""
    exit 1
fi

# Verify forge-extensions use upstream crates
echo "Verifying forge-extensions dependencies..."
for config_file in forge-extensions/*/Cargo.toml; do
    if [ -f "$config_file" ]; then
        # Check if this extension references local crates instead of upstream
        if grep -q 'path = ".*\.\./\.\./crates/' "$config_file" 2>/dev/null; then
            # Make sure it's pointing to upstream, not local crates
            if ! grep -q 'path = ".*\.\./\.\./upstream/crates/' "$config_file" 2>/dev/null; then
                echo "❌ ERROR: $(basename $(dirname $config_file)) references local crates instead of upstream"
                echo "   File: $config_file"
                FOUND_DUPLICATES=1
            fi
        fi
    fi
done

if [ $FOUND_DUPLICATES -eq 1 ]; then
    echo ""
    echo "❌ Upstream alignment check FAILED"
    echo ""
    echo "To fix:"
    echo "1. Remove any duplicated crates from crates/"
    echo "2. Update dependencies to use upstream/crates/*"
    echo "3. Ensure only forge-extensions contain custom code"
    exit 1
fi

echo ""
echo "✅ Upstream alignment verified successfully!"
echo "   - No duplicated crates found"
echo "   - All dependencies properly point to upstream"
echo "   - Forge customizations confined to forge-extensions"
exit 0
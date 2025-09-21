# Forge Overrides

This directory is reserved for potential future use when conflicts arise that cannot be resolved through composition alone.

## Purpose
Only add crates here when you absolutely need to replace an upstream crate entirely, which should be extremely rare.

## Current Status
Empty - all forge functionality is currently handled through composition in forge-extensions and forge-app.

## Guidelines
Before adding anything here:
1. First attempt to solve through composition in forge-extensions
2. Consider if the feature can be added to upstream instead
3. Only use overrides as a last resort for irreconcilable conflicts
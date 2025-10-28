#!/usr/bin/env bash
set -euo pipefail

# Ensures the ICU crates stay pinned to the thread-safe 2.0.0 release that codex depends on.

expected_version="2.0.0"
packages=(
  icu_decimal
  icu_decimal_data
  icu_provider
  icu_locale
  icu_locale_core
)

cargo metadata --format-version 1 --locked | python3 -c '
import json
import sys

expected = {
    "icu_decimal": "2.0.0",
    "icu_decimal_data": "2.0.0",
    "icu_provider": "2.0.0",
    "icu_locale": "2.0.0",
    "icu_locale_core": "2.0.0",
}

raw = sys.stdin.read()
if raw.startswith("Total output lines:"):
    raw = raw.split("\n", 1)[1]

metadata = json.loads(raw)
versions = {pkg["name"]: pkg["version"] for pkg in metadata["packages"] if pkg["name"] in expected}

missing = []
for name, required in expected.items():
    version = versions.get(name)
    if version != required:
        missing.append(f"{name} (found: {version or 'none'}, expected: {required})")

if missing:
    print("error: ICU crates are not pinned as expected:")
    for item in missing:
        print(f"  - {item}")
    sys.exit(1)

print("ICU crate pins verified at version 2.0.0")
'

#!/bin/bash
set -euo pipefail

# Automagik Forge - Android APK Build Script
# Works in: Termux, GitHub Actions, Linux desktop
# Usage: ./scripts/build-android.sh [--release] [--ci] [--verify]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
BUILD_TYPE="debug"
CI_MODE=false
VERIFY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --release)
      BUILD_TYPE="release"
      shift
      ;;
    --ci)
      CI_MODE=true
      shift
      ;;
    --verify)
      VERIFY=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --release    Build release APK (default: debug)"
      echo "  --ci         CI mode (non-interactive)"
      echo "  --verify     Verify APK contents after build"
      echo "  --help       Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}❌ Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🤖 Automagik Forge - Android APK Builder${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Detect environment
IS_TERMUX=false
IS_CI=false
IS_LINUX=false

if [ -n "${TERMUX_VERSION:-}" ] || [ -n "${ANDROID_ROOT:-}" ]; then
  IS_TERMUX=true
  echo -e "${GREEN}📱 Environment: Termux${NC}"
elif [ -n "${GITHUB_ACTIONS:-}" ]; then
  IS_CI=true
  echo -e "${GREEN}🔧 Environment: GitHub Actions${NC}"
else
  IS_LINUX=true
  echo -e "${GREEN}🐧 Environment: Linux Desktop${NC}"
fi

# Change to repo root
cd "$(dirname "$0")/.."
REPO_ROOT=$(pwd)

echo -e "${BLUE}📂 Repository: $REPO_ROOT${NC}"
echo ""

# Dependency checks
echo -e "${YELLOW}🔍 Checking dependencies...${NC}"

# Check Rust
if ! command -v cargo &> /dev/null; then
  echo -e "${RED}❌ Rust/Cargo not found${NC}"
  if [ "$IS_TERMUX" = true ]; then
    echo "   Install with: pkg install rust"
  else
    echo "   Install from: https://rustup.rs"
  fi
  exit 1
fi
echo -e "${GREEN}✅ Rust $(cargo --version | cut -d' ' -f2)${NC}"

# Check Android target
TARGET_INSTALLED=false
if command -v rustup &> /dev/null; then
  # Desktop: Check via rustup
  if rustup target list --installed 2>/dev/null | grep -q "aarch64-linux-android"; then
    TARGET_INSTALLED=true
  fi
else
  # Termux: Check via pkg or cargo target directory
  if [ -d "/data/data/com.termux/files/usr/lib/rustlib/aarch64-linux-android" ]; then
    TARGET_INSTALLED=true
  fi
fi

if [ "$TARGET_INSTALLED" = false ]; then
  echo -e "${RED}❌ Android target (aarch64-linux-android) not installed${NC}"
  if [ "$IS_TERMUX" = true ]; then
    echo "   Install with: pkg install rust-std-aarch64-linux-android"
  else
    echo "   Install with: rustup target add aarch64-linux-android"
  fi
  exit 1
fi
echo -e "${GREEN}✅ Android target (aarch64-linux-android)${NC}"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
  echo -e "${RED}❌ pnpm not found${NC}"
  echo "   Install with: npm install -g pnpm"
  exit 1
fi
echo -e "${GREEN}✅ pnpm $(pnpm --version)${NC}"

# Check JDK
if ! command -v java &> /dev/null; then
  echo -e "${RED}❌ Java/JDK not found${NC}"
  if [ "$IS_TERMUX" = true ]; then
    echo "   Install with: pkg install openjdk-21"
  else
    echo "   Install JDK 17 or newer from your package manager"
  fi
  exit 1
fi
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
echo -e "${GREEN}✅ Java $JAVA_VERSION${NC}"

echo ""

# Step 1: Build Frontend
echo -e "${YELLOW}📦 Step 1/5: Building frontend...${NC}"
cd "$REPO_ROOT/frontend"
pnpm install --silent
pnpm run build
echo -e "${GREEN}✅ Frontend built${NC}"
echo ""

# Step 2: Copy frontend to upstream (for RustEmbed)
echo -e "${YELLOW}📋 Step 2/5: Copying frontend to upstream...${NC}"
cd "$REPO_ROOT"
mkdir -p upstream/frontend
cp -r frontend/dist upstream/frontend/dist
echo -e "${GREEN}✅ Frontend copied to upstream/frontend/dist${NC}"
echo ""

# Step 3: Build Rust library for Android
echo -e "${YELLOW}🦀 Step 3/5: Building Rust library for Android ARM64...${NC}"

# Set environment variables for Rust build
export SQLX_OFFLINE=true

# In CI, configure NDK toolchain
if [ "$IS_CI" = true ]; then
  if [ -z "${ANDROID_NDK_HOME:-}" ]; then
    echo -e "${RED}❌ ANDROID_NDK_HOME not set (CI mode)${NC}"
    exit 1
  fi

  echo -e "${BLUE}   Configuring NDK toolchain...${NC}"
  mkdir -p ~/.cargo
  cat > ~/.cargo/config.toml <<EOF
[target.aarch64-linux-android]
linker = "$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/aarch64-linux-android30-clang"
ar = "$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/llvm-ar"
rustflags = ["-C", "link-arg=-Wl,-z,max-page-size=16384"]
EOF

  export CC="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/aarch64-linux-android30-clang"
  export AR="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/llvm-ar"
  export RANLIB="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/llvm-ranlib"
  export CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/aarch64-linux-android30-clang"
  export CARGO_TARGET_AARCH64_LINUX_ANDROID_AR="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/llvm-ar"
  export OPENSSL_STATIC=1
  export OPENSSL_VENDORED=1
  export LIBSQLITE3_SYS_BUNDLED=1
  export LIBSQLITE3_SYS_STATIC=1
fi

cd "$REPO_ROOT"
cargo build -p forge-app --release --target aarch64-linux-android --lib --features android

# Verify library was built
RUST_LIB="target/aarch64-linux-android/release/libforge_app.so"
if [ ! -f "$RUST_LIB" ]; then
  echo -e "${RED}❌ Rust library not found: $RUST_LIB${NC}"
  exit 1
fi

LIB_SIZE=$(du -h "$RUST_LIB" | cut -f1)
echo -e "${GREEN}✅ Rust library built: $LIB_SIZE${NC}"
echo ""

# Step 4: Build APK
echo -e "${YELLOW}📱 Step 4/5: Building Android APK...${NC}"
cd "$REPO_ROOT/android"

# Ensure gradlew is executable
chmod +x gradlew

# Build APK
if [ "$BUILD_TYPE" = "release" ]; then
  ./gradlew assembleRelease
  APK_PATH="app/build/outputs/apk/release/app-release.apk"
else
  ./gradlew assembleDebug
  APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
fi

# Verify APK was created
if [ ! -f "$APK_PATH" ]; then
  echo -e "${RED}❌ APK not found: $APK_PATH${NC}"
  exit 1
fi

APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
echo -e "${GREEN}✅ APK built: $APK_SIZE${NC}"
echo ""

# Step 5: Verify APK contents
echo -e "${YELLOW}🔍 Step 5/5: Verifying APK contents...${NC}"

# Check that native library was copied
JNI_LIB="app/src/main/jniLibs/arm64-v8a/libforge_app.so"
if [ -f "$JNI_LIB" ]; then
  JNI_SIZE=$(du -h "$JNI_LIB" | cut -f1)
  echo -e "${GREEN}✅ Native library copied: $JNI_SIZE${NC}"
else
  echo -e "${RED}❌ Native library not copied to jniLibs${NC}"
  exit 1
fi

# Check that frontend assets were copied
ASSETS_DIR="app/src/main/assets/frontend"
if [ -d "$ASSETS_DIR" ] && [ -f "$ASSETS_DIR/index.html" ]; then
  ASSET_COUNT=$(find "$ASSETS_DIR" -type f | wc -l)
  echo -e "${GREEN}✅ Frontend assets copied: $ASSET_COUNT files${NC}"
else
  echo -e "${RED}❌ Frontend assets not copied${NC}"
  exit 1
fi

echo ""

# Optional: Deep verification (unzip APK and check contents)
if [ "$VERIFY" = true ]; then
  echo -e "${YELLOW}🔬 Deep verification: Inspecting APK contents...${NC}"

  VERIFY_DIR="/tmp/apk-verify-$$"
  mkdir -p "$VERIFY_DIR"

  unzip -q "$APK_PATH" -d "$VERIFY_DIR"

  if [ -f "$VERIFY_DIR/lib/arm64-v8a/libforge_app.so" ]; then
    echo -e "${GREEN}✅ libforge_app.so present in APK${NC}"
  else
    echo -e "${RED}❌ libforge_app.so missing from APK${NC}"
    rm -rf "$VERIFY_DIR"
    exit 1
  fi

  if [ -f "$VERIFY_DIR/assets/frontend/index.html" ]; then
    echo -e "${GREEN}✅ Frontend assets present in APK${NC}"
  else
    echo -e "${RED}❌ Frontend assets missing from APK${NC}"
    rm -rf "$VERIFY_DIR"
    exit 1
  fi

  rm -rf "$VERIFY_DIR"
  echo ""
fi

# Success!
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Build complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📦 APK Location:${NC}"
echo -e "   $REPO_ROOT/android/$APK_PATH"
echo ""
echo -e "${BLUE}📊 APK Size: $APK_SIZE${NC}"
echo ""

if [ "$IS_TERMUX" = true ]; then
  echo -e "${YELLOW}📱 Installation:${NC}"
  echo -e "   termux-open $REPO_ROOT/android/$APK_PATH"
  echo ""
fi

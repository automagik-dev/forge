# Automagik Forge - Android APK

This directory contains the Android application wrapper for Automagik Forge.

## Architecture

The Android app consists of:
- **Kotlin Activity**: Launches the Rust server and displays a WebView
- **Rust Library** (`libforge_app.so`): The same Axum backend compiled for Android ARM64
- **Frontend Assets**: The React frontend bundled into the APK

## Quick Start

### Building Locally

Use the unified build script that works on Termux, Linux desktop, and CI:

```bash
# From repository root
./scripts/build-android.sh --release
```

The script will:
1. Build the frontend (React/TypeScript)
2. Build the Rust library for Android ARM64
3. Package everything into an APK
4. Verify that the APK contains all required components

**Output:** `android/app/build/outputs/apk/release/app-release.apk`

### Prerequisites

**On Termux (Android):**
```bash
pkg install rust rust-std-aarch64-linux-android openjdk-21 nodejs
npm install -g pnpm
```

**On Linux Desktop:**
```bash
# Install Rust from https://rustup.rs
rustup target add aarch64-linux-android

# Install JDK 17, Node.js, pnpm from your package manager
# Install Android SDK and NDK (for cross-compilation)
```

### Build Options

```bash
# Debug build (faster, larger APK)
./scripts/build-android.sh

# Release build (optimized)
./scripts/build-android.sh --release

# With verification (checks APK contents)
./scripts/build-android.sh --release --verify

# Help
./scripts/build-android.sh --help
```

## Platform Support

### ✅ Supported Platforms

- **Linux Desktop** - Full APK build support (requires Android SDK + NDK)
- **GitHub Actions** - Automated APK builds on every release
- **macOS** - Full APK build support (requires Android SDK + NDK)

### ⚠️ Termux (Android) Limitations

**Termux can build the Rust library but NOT the final APK** due to Android SDK requirements.

On Termux, the build script will:
- ✅ Build frontend
- ✅ Build Rust library for Android (`libforge_app.so`)
- ❌ Fail at APK packaging (requires Android SDK)

**Recommended for Termux users:**
- Use the build script to validate code compiles: `./scripts/build-android.sh`
- Download pre-built APKs from [GitHub Releases](https://github.com/namastexlabs/automagik-forge/releases)
- Or use the npm package: `npm install -g @automagik/forge`

## GitHub Actions

The APK is automatically built on every release via `.github/workflows/build-android-apk.yml`.

Download from: [GitHub Releases](https://github.com/namastexlabs/automagik-forge/releases)

## Installation

### From APK
1. Download `.apk` from GitHub Releases
2. Enable "Install from Unknown Sources" in Android settings
3. Open the APK file to install

### From Termux (npm)
```bash
pkg install nodejs
npm install -g @automagik/forge
forge
```

## Troubleshooting

### APK is small (< 10 MB) or crashes on launch

The APK is missing components. Ensure you used the build script:
```bash
./scripts/build-android.sh --release
```

Manual `./gradlew assembleRelease` will NOT work - it requires the Rust library and frontend to be built first.

### "aarch64-linux-android target not found"

Install the Android target:
```bash
# Termux
pkg install rust-std-aarch64-linux-android

# Desktop
rustup target add aarch64-linux-android
```

### Build fails during Rust compilation

Ensure you have enough storage space (requires ~5 GB for full build).

### "SDK location not found" (Termux)

This is expected on Termux. See "Platform Support" above - Termux cannot build the final APK without Android SDK.

## License

MIT - See LICENSE file in root directory

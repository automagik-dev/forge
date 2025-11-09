# Automagik Forge - Android APK

This directory contains the Android application wrapper for Automagik Forge.

## Architecture

The Android app consists of:
- **Kotlin Activity**: Launches the Rust server and displays a WebView
- **Rust Library** (`libforge_app.so`): The same Axum backend compiled for Android ARM64
- **Frontend Assets**: The React frontend bundled into the APK

## Building Locally

**Note:** Building Android APK locally requires Android SDK and NDK. For most users, we recommend using GitHub Actions (automatic on every release).

### Prerequisites
- Android SDK (API 34)
- Android NDK (26.1.10909125)
- Rust with `aarch64-linux-android` target
- JDK 17

### Build Steps

1. Build the Rust library:
```bash
cargo build --release --target aarch64-linux-android --lib --features android
```

2. Build the frontend:
```bash
cd frontend && pnpm build
```

3. Build the APK:
```bash
cd android
./gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

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

## License

MIT - See LICENSE file in root directory

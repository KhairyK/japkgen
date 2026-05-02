# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-05-1

### Added
- New **PWA template**
  - Local asset-based WebView using AndroidX WebKit
  - Offline-ready structure (`index.html`, `offline.html`, manifest)
- New **Game templates**
  - `game-java` (SurfaceView game loop scaffold)
  - `game-cpp` (NDK + CMake native starter)
- **Automatic AndroidX dependency injection**
  - Templates now declare required dependencies internally
- **Pull-to-refresh support** for WebView template
- **Progress indicator** for page loading in WebView/PWA templates
- **External URL handling** (open non-http schemes via Intent)
- **CMake integration** for native (C/C++) builds
- **Modular template system**
  - Shared `commonFiles()` generator
- Extended README with:
  - Table of contents
  - Badges
  - Professional structure

### Improved
- Templates now use **AppCompatActivity** instead of raw Activity
- Cleaner **Gradle configuration structure**
- Better **code readability and maintainability**
- Improved **WebView settings**
  - DOM storage enabled
  - Wide viewport support
  - Mixed content handling
- More consistent **project structure across templates**
- Better **error handling** in WebView navigation

### Fixed
- Missing AndroidX dependencies (e.g. `SwipeRefreshLayout`)
- Incorrect Activity base class causing compatibility issues
- Broken namespace handling in AndroidManifest
- Gradle configuration inconsistencies
- Build failures caused by missing dependencies
- JNI naming issues in C++ template
---

## [1.0.0] - 2026-04-27

### Added
- Initial release of **japkgen**
- Basic Android project scaffolding
- Gradle-based build system
- Minimal project templates

---

## Upcoming

### Planned
- Kotlin template support
- Jetpack Compose template
- Plugin system for custom templates
- Better environment auto-detection
- Interactive UI (TUI mode)

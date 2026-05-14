# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] - 2026-05-14

### Added

- Added improved **project preset support** for faster template selection.
- Added **template aliasing** to make CLI commands shorter and easier to use.
- Added **custom output directory** support for generated projects.
- Added **better plugin hooks** for extending generation logic.
- Added more flexible **asset copying** support for web and Android templates.
- Added improved **template metadata** handling for display name, category, and description.
- Added expanded **validation** for config files and CLI input.
- Added more informative **generation summary** output after project creation.
- Added **dependency manager** for deps management.

### Changed

- Improved template resolution to be more predictable across all environments.
- Improved dependency handling for cleaner generated project setup.
- Improved configuration loading order to prioritize explicit project settings.
- Improved CLI prompts and default values for a smoother developer experience.
- Improved README and generated documentation formatting.

### Fixed

- Fixed minor issues in template selection and fallback behavior.
- Fixed inconsistent output paths in some generation flows.
- Fixed config parsing edge cases with missing or partial values.
- Fixed plugin loading behavior in custom project setups.
- Fixed small formatting issues in generated files and logs.

### Security

- Improved input sanitization for template names and file paths.
- Reduced risk of invalid config values affecting generation output.

### Testing

- Added tests for preset resolution and template alias handling.
- Added tests for output path selection and config override behavior.
- Added coverage for plugin hook execution and validation logic.

### Notes

- This release focuses on making JAPKGEN faster to use, easier to extend, and more stable for both standard and custom workflows.

## [2.0.0] - 2026-05-10

### Added

- Added modern frontend templates for:
  - React
  - Vue
  - Angular
  - Preact
- Added C/C++ templates with:
  - CMake
  - Makefile support
- Added **Vite-based bundling** for frontend templates to improve development speed and build performance.
- Added **Google Fonts CDN support** for web templates.
- Added **Tailwind CSS support** for Web APK templates.
- Added **Material UI** and **Material Symbols / Material Icons** support.
- Added **XML to JSON** helper support for Web APK templates.
- Added **Jetpack Compose** template support.
- Added **config file support** for project defaults and template customization.
- Added improved **environment auto-detection** for better host system discovery.
- Added **smart dependency selection** to reduce unnecessary package installation.
- Added optimized **Kotlin templates**.
- Added optimized **game templates** for both Java and native C++ workflows.
- Added stronger project scaffolding for Android, hybrid, and frontend-integrated use cases.
- Added improved generated documentation output.
- Added interactive CLI prompts using `prompts`.

### Changed

- Refactored template generation to support a more modular and maintainable architecture.
- Improved project scaffolding to produce cleaner, more predictable output.
- Improved README generation to create more professional and developer-friendly documentation.
- Improved default project structure for better template separation.
- Improved CLI behavior to better support modern JavaScript and Android workflows.
- Improved logging output for clearer debug information.
- Improved template resolution and dependency handling across all templates.

### Fixed

- Fixed several template-generation edge cases.
- Fixed environment detection issues in mixed development setups.
- Fixed dependency handling so generated projects avoid unnecessary installs where possible.
- Fixed documentation inconsistencies in generated project output.
- Fixed template path and configuration resolution issues.
- Fixed minor syntax and escaping issues in generated files.
- Fixed CMake and Makefile generation edge cases.
- Fixed Web APK asset integration issues.
- Fixed CLI prompt handling for interactive and non-interactive environments.

### Security

- Improved generation safety by reducing unnecessary dependency exposure.
- Improved handling of project configuration and template input validation.

### Documentation

- Rewritten and expanded `README.md` with a more formal and professional tone.
- Added clearer explanations for installation, usage, templates, configuration, and development workflow.
- Improved guidance for contributors and users.

### Testing

- Added and expanded template tests for generator output.
- Added utility tests for helper functions and file generation behavior.
- Added environment and configuration tests for safer scaffolding.

### Notes

- This release represents a major expansion of JAPKGEN’s template system and project generation capabilities.
- Existing workflows remain supported, but projects created with 2.0.0 now include significantly more template options and improved defaults.

---

## [1.2.0] - 2026-05-06

### Added

- New **Create keystore**
- New **Serve mode**
- New **APK analyzer**
- New **Kotlin template**
- New **plugins system** for custom templates and logic

### Changed

- Improved CLI flow and project generation behavior.
- Improved output structure for generated projects.

### Fixed

- Fixed several scaffolding edge cases.
- Fixed template resolution bugs in custom setups.

---

## [1.1.0] - 2026-05-01

### Added

- New **PWA template**
  - Local asset-based WebView using AndroidX WebKit
  - Offline-ready structure (`index.html`, `offline.html`, manifest)
- New **game templates**
  - `game-java` (SurfaceView game loop scaffold)
  - `game-cpp` (NDK + CMake native starter)
- **Automatic AndroidX dependency injection**
  - Templates now declare required dependencies internally
- **Pull-to-refresh support** for WebView template
- **Progress indicator** for page loading in WebView/PWA templates
- **External URL handling** (open non-HTTP schemes via Intent)
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

...

# JAPKGEN

[![npm version](https://img.shields.io/npm/v/japkgen.svg)](https://www.npmjs.com/package/japkgen)
[![npm downloads](https://img.shields.io/npm/dm/japkgen.svg)](https://www.npmjs.com/package/japkgen)
[![license](https://img.shields.io/npm/l/japkgen.svg)](LICENSE)
[![node version](https://img.shields.io/node/v/japkgen.svg)](https://nodejs.org/)
[![module type](https://img.shields.io/badge/module-ESM-blue.svg)](https://nodejs.org/api/esm.html)
[![platform](https://img.shields.io/badge/platform-Android%20CLI-3DDC84.svg)](https://developer.android.com/)
[![made with](https://img.shields.io/badge/made%20with-Node.js-339933.svg)](https://nodejs.org/)
[![contributors welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

JAPKGEN is a modular command-line tool for generating Android application projects with a structured, developer-friendly workflow. It supports project scaffolding, environment diagnostics, WebView applications, smart permission handling, icon generation, release signing setup, and modern frontend templates powered by Vite.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
- [Project Structure](#project-structure)
- [Templates](#templates)
- [Configuration](#configuration)
- [Environment Detection](#environment-detection)
- [Smart Dependencies](#smart-dependencies)
- [Fonts](#fonts)
- [Signing](#signing)
- [Icons](#icons)
- [Development Workflow](#development-workflow)
- [Contributing](#contributing)
- [License](#license)

## Overview

JAPKGEN is designed to simplify Android project generation from the command line. The tool focuses on clear defaults, predictable output, and modular templates so that developers can create, inspect, and extend projects with minimal friction.

It is suitable for developers who want to scaffold:

- WebView-based Android applications
- Native Android applications
- Kotlin-based projects
- Jetpack Compose projects
- Game templates in Java or C++
- Web-based Android experiences using React, Vue, Angular, or Preact
- Signed release-ready project structures
- Projects with automatic environment detection and dependency selection

## Features

- Modular CLI architecture
- WebView template with improved loading and navigation behavior
- Native Android template for minimal application scaffolding
- Kotlin template optimized for practical Android development
- Jetpack Compose template
- Game templates for Java and C++
- React, Vue, Angular, and Preact templates
- Vite-powered frontend scaffolding
- Google Fonts CDN integration
- Smart dependency handling
- Better environment auto-detection
- Config file support
- Android launcher icon generation
- Release signing scaffolding
- Gradle wrapper bootstrapping
- Cross-platform support for common development setups
- Clean output and readable generated project structure

## Requirements

JAPKGEN is intended for Android project scaffolding and expects a working development environment for building and running generated projects.

Recommended requirements:

- Node.js 18 or newer
- Java JDK 17 or newer
- Android SDK
- Gradle or a valid Gradle wrapper setup
- A compatible shell environment for CLI usage

## Installation

Install the package globally:

```bash
npm install -g japkgen
```

Or run it directly through `npx`:

```bash
npx japkgen --help
```

For local development:

```bash
git clone https://github.com/KhairyK/japkgen.git
cd japkgen
npm install
node src/index.js --help
```

## Quick Start

Create a new project:

```bash
japkgen new --name MyApp --package com.example.myapp --template webview --url https://example.com
```

Check your environment:

```bash
japkgen doctor
```

Build an existing project:

```bash
japkgen build MyApp
```

Create a release build:

```bash
japkgen build MyApp --variant release
```

## Commands

### `japkgen new`

Creates a new Android project from a template.

Example:

```bash
japkgen new \
  --name MyApp \
  --package com.example.myapp \
  --template webview \
  --url https://example.com
```

Common options:

* `--name` — project name
* `--package` — Android package name
* `--template` — template identifier
* `--url` — URL for WebView or frontend-based templates
* `--min-sdk` — minimum Android SDK version
* `--target-sdk` — target Android SDK version
* `--compile-sdk` — compile Android SDK version
* `--permissions` — comma-separated permissions list
* `--signing` — enable signing scaffold
* `--icon` — custom app icon path

### `japkgen build [projectDir]`

Builds the project and produces an APK.

Example:

```bash
japkgen build MyApp --variant debug
```

### `japkgen doctor`

Checks whether the local Android development environment is ready.

Example:

```bash
japkgen doctor
```

### `japkgen config`

Reads or applies configuration from a project config file when supported by the current workflow.

Example:

```bash
japkgen config
```

## Project Structure

A typical generated project uses the following structure:

```txt
MyApp/
├─ app/
│  ├─ src/
│  │  └─ main/
│  │     ├─ java/
│  │     ├─ kotlin/
│  │     ├─ res/
│  │     └─ AndroidManifest.xml
│  └─ build.gradle
├─ frontend/
│  ├─ src/
│  ├─ index.html
│  ├─ vite.config.js
│  └─ package.json
├─ gradle/
├─ gradlew
├─ gradlew.bat
├─ build.gradle
├─ settings.gradle
├─ gradle.properties
├─ japkgen.config.json
└─ README.md
```

Not every template generates the same files. WebView, Compose, game, and frontend templates each produce a structure appropriate for the selected target.

## Templates

### WebView

The WebView template is intended for applications that display a website inside a native Android container.

It includes:

* JavaScript support
* DOM storage support
* URL navigation handling
* Basic loading progress feedback
* Pull-to-refresh support
* Sensible default permissions when needed

### Native

The native template is a minimal Android application scaffold with a clean project layout and practical defaults.

### Kotlin

The Kotlin template is optimized for Kotlin-based Android development with a simple and maintainable entry point.

### Jetpack Compose

The Compose template creates a modern UI-first Android application scaffold using Jetpack Compose dependencies and recommended project settings.

### Game (Java)

The Java game template is suitable for basic custom rendering or canvas-based gameplay scaffolding.

### Game (C++)

The C++ game template provides a native foundation for projects that need a CMake-based rendering or game pipeline.

### React

The React template creates a frontend scaffold powered by Vite and prepared for integration with an Android container.

### Vue

The Vue template creates a modern Vite-based Vue frontend scaffold for Android-integrated workflows.

### Angular

The Angular template creates a TypeScript-first frontend scaffold with Vite optimization for Android-centered delivery.

### Preact

The Preact template creates a lightweight Vite-based frontend scaffold for performance-sensitive apps.

### PWA

The PWA template is designed for progressive web app workflows that can be packaged or integrated into Android delivery flows.

## Configuration

JAPKGEN supports configuration files to keep project generation predictable and repeatable.

A configuration file may be placed in the project root:

```txt
japkgen.config.json
```

Example:

```json
{
  "defaults": {
    "name": "MyApp",
    "package": "com.example.myapp",
    "template": "webview",
    "minSdk": 24,
    "targetSdk": 34,
    "compileSdk": 34,
    "url": "https://example.com"
  },
  "templates": {
    "webview": {
      "title": "WebView App"
    }
  }
}
```

Common uses:

* define default project values
* store template-specific configuration
* keep repeated options in one place
* reduce CLI input for regular workflows

## Environment Detection

The environment detection module helps contributors and users understand whether the machine is ready for Android development.

It inspects:

* Operating system
* CPU architecture
* Node.js version
* Java availability
* Gradle availability
* Android SDK discovery
* Platform tools presence
* Build tools presence
* Common package manager support

This makes troubleshooting faster and reduces setup friction.

## Smart Dependencies

JAPKGEN uses smart dependency handling to avoid unnecessary package noise and to choose only what a template actually needs.

This helps with:

* smaller generated projects
* cleaner package graphs
* fewer unused dependencies
* faster installs
* better maintenance clarity

The generator prefers dependency sets that match the selected template and generation mode.

## Fonts

Frontend-based templates can use Google Fonts through CDN links.

This is useful when you want:

* consistent typography
* zero local font asset management
* fast setup
* simple template rendering

Example usage in generated frontend templates:

* Google Fonts CDN
* optimized default font loading
* easy customization in HTML or CSS

## Signing

JAPKGEN supports release signing scaffolding through `keystore.properties`.

When signing is enabled, the generator creates the expected configuration files and integrates them into the Android build setup.

A typical signing setup includes:

* Keystore file path
* Key alias
* Store password
* Key password

Example:

```bash
japkgen new --signing
```

## Icons

JAPKGEN can generate launcher icons in standard Android mipmap densities.

Supported outputs include:

* `mipmap-mdpi`
* `mipmap-hdpi`
* `mipmap-xhdpi`
* `mipmap-xxhdpi`
* `mipmap-xxxhdpi`

If no icon path is supplied, JAPKGEN can generate or provide a fallback launcher icon automatically.

Example:

```bash
japkgen new --icon ./assets/icon.png
```

## Development Workflow

A typical workflow looks like this:

1. Create a project with `japkgen new`
2. Review the generated structure
3. Adjust template-specific settings in `japkgen.config.json`
4. Run `japkgen doctor` to validate the environment
5. Build the project with `japkgen build`
6. Add your application logic or frontend content
7. Sign and release when ready

## Contributing

Contributions are welcome.

Recommended contribution workflow:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Update or add documentation where needed
5. Run tests locally
6. Submit a pull request

Please keep contributions:

* Clear
* Modular
* Well documented
* Consistent with the existing project structure

## Testing

Before submitting changes, run the project tests and ensure the generated templates still behave correctly.

Example:

```bash
npm test
```

If the project includes a CLI test suite, verify:

* template generation
* config loading
* environment detection
* utility functions
* build scaffolding
* README output or generated documentation

## License

This project is licensed under the Apache 2.0 License. See the `LICENSE` file for details.
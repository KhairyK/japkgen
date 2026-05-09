# JAPKGEN

[![npm version](https://img.shields.io/npm/v/japkgen.svg)](https://www.npmjs.com/package/japkgen)
[![npm downloads](https://img.shields.io/npm/dm/japkgen.svg)](https://www.npmjs.com/package/japkgen)
[![license](https://img.shields.io/npm/l/japkgen.svg)](LICENSE)
[![node version](https://img.shields.io/node/v/japkgen.svg)](https://nodejs.org/)
[![platform](https://img.shields.io/badge/platform-Android%20CLI-3DDC84.svg)](https://developer.android.com/)
[![language](https://img.shields.io/badge/language-JavaScript-F7DF1E.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![module type](https://img.shields.io/badge/module-ESM-blue.svg)](https://nodejs.org/api/esm.html)
[![build](https://img.shields.io/badge/build-Gradle-02303A.svg)](https://gradle.org/)
[![android](https://img.shields.io/badge/Android-Supported-3DDC84.svg)](https://www.android.com/)
[![made with](https://img.shields.io/badge/made%20with-Node.js-339933.svg)](https://nodejs.org/)
[![contributors welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![issues](https://img.shields.io/github/issues/KhairyK/japkgen.svg)](https://github.com/KhairyK/japkgen/issues)
[![pull requests](https://img.shields.io/github/issues-pr/KhairyK/japkgen.svg)](https://github.com/KhairyK/japkgen/pulls)

A modular command-line tool for generating Android APK projects with a structured, developer-friendly workflow. JAPKGEN supports project generation, environment diagnostics, Android WebView improvements, smart permissions, icon generation, and release signing scaffolding.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Requirements](#requirements)
- [Commands](#commands)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Templates](#templates)
- [Signing](#signing)
- [Icons](#icons)
- [Doctor](#doctor)
- [Environment Detection](#environment-detection)
- [Smart Permissions](#smart-permissions)
- [Contributing](#contributing)
- [License](#license)

## Overview

JAPKGEN is designed to simplify the creation of Android projects from the command line. It focuses on clarity, modularity, and practical defaults so contributors can understand and extend the codebase with minimal friction.

The tool is suitable for developers who want to scaffold:
- A WebView-based Android application
- A minimal native Android application
- A signed release-ready project structure
- A project with automatic icon generation and environment checks

## Features

- Modular command structure
- WebView template with improved loading and navigation handling
- Native template for minimal Android app scaffolding
- Smart permission generation
- Android launcher icon generation
- Release signing configuration scaffolding
- Environment detection and diagnostics
- Gradle wrapper bootstrapping
- Cross-platform support for common development setups
- JSDoc-friendly code structure for contributor clarity

## Installation

Install the package globally:

```bash
npm install -g japkgen
```

Or run it directly with Node.js after cloning the repository:

```bash
npm install
node src/index.js --help
```

## Requirements

JAPKGEN expects a working Android development environment for builds.

Recommended requirements:
- Node.js 18 or newer
- Java JDK 17
- Android SDK
- Gradle or a valid Gradle wrapper setup

## Commands

### `japkgen new`
Creates a new Android project from a template.

Example:

```bash
japkgen new --name MyApp --package com.example.myapp --template webview --url https://example.com/
```

### `japkgen build [projectDir]`
Builds the Android project and produces an APK.

Example:

```bash
japkgen build MyApp --variant debug
```

### `japkgen doctor`
Checks whether the Android development environment is ready.

Example:

```bash
japkgen doctor
```

## Project Structure

A typical generated project uses the following structure:

```txt
MyApp/
├─ app/
│  ├─ src/main/
│  │  ├─ java/
│  │  ├─ res/
│  │  └─ AndroidManifest.xml
│  └─ build.gradle
├─ gradle/
├─ gradlew
├─ gradlew.bat
├─ build.gradle
├─ settings.gradle
├─ gradle.properties
└─ README.md
```

## Usage

### Create a new project

```bash
japkgen new
```

You may also provide options directly:

```bash
japkgen new \
  --name MyApp \
  --package com.example.myapp \
  --template webview \
  --min-sdk 27 \
  --target-sdk 34 \
  --compile-sdk 34 \
  --url https://example.com \
  --permissions INTERNET,ACCESS_NETWORK_STATE
```

### Build a project

```bash
japkgen build MyApp
```

Release build:

```bash
japkgen build MyApp --variant release
```

### Check the environment

```bash
japkgen doctor
```

## Templates

### WebView

The WebView template is intended for applications that display a website inside a native Android container. It includes:
- JavaScript support
- DOM storage support
- URL navigation handling
- Basic loading progress feedback
- Pull-to-refresh support

### Native

The native template is a minimal Android application scaffold with a simple user interface and a clean project layout.

## Signing

JAPKGEN supports release signing scaffolding through `keystore.properties`.

When signing is enabled, the generator creates the expected configuration files and integrates them into the Android build configuration.

A typical signing setup includes:
- Keystore file path
- Key alias
- Store password
- Key password

Example configuration flow:

```bash
japkgen new --signing
```

## Icons

JAPKGEN can generate launcher icons in standard Android mipmap densities.

Supported outputs include:
- `mipmap-mdpi`
- `mipmap-hdpi`
- `mipmap-xhdpi`
- `mipmap-xxhdpi`
- `mipmap-xxxhdpi`

If no icon path is supplied, JAPKGEN generates a fallback launcher icon automatically.

Example:

```bash
japkgen new --icon ./assets/icon.png
```

## Doctor

The `doctor` command validates the local build environment and reports the status of key dependencies.

It checks:
- Node.js
- Java
- Gradle
- ADB
- Android SDK path
- Platform tools
- Build tools

Example output:

```bash
japkgen doctor
```

## Environment Detection

The environment detection module is intended to help contributors and users understand whether the machine is ready for Android development.

It inspects:
- Operating system
- Architecture
- Java availability
- Gradle availability
- Android SDK discovery
- Platform tools presence
- Build tools presence

This makes troubleshooting faster and significantly reduces setup friction.

## Smart Permissions

JAPKGEN automatically improves permission handling by adding sensible defaults based on the selected template.

For WebView projects, the generator typically includes:
- `INTERNET`
- `ACCESS_NETWORK_STATE` when appropriate

You may still supply additional permissions manually when needed.

## Contributing

Contributions are welcome.

Recommended contribution workflow:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add or update documentation where necessary
5. Test the project locally
6. Submit a pull request

Please keep contributions:
- Clear
- Modular
- Well documented
- Consistent with the existing project structure

## License

This project is licensed under the Apache 2.0 License. See the `LICENSE` file for details.
# japkgen

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![CLI](https://img.shields.io/badge/CLI-Android%20Project%20Generator-5A67D8)](#)
[![Status](https://img.shields.io/badge/Status-Active-success)](#)

**japkgen** is a command-line project generator for Android applications. It creates structured Android project templates with support for both WebView-based applications and native starter projects. It also provides a build command for generating APK artifacts through the Gradle wrapper.

## Overview

`japkgen` is designed to simplify Android application scaffolding from the command line. It generates a complete project structure, including:

- Android manifest files
- Gradle build configuration
- Java source files
- Resource directories
- Gradle wrapper support

The tool is intended for developers who prefer a fast, scriptable workflow for Android project creation.

## Features

- Interactive and argument-based project generation
- WebView template support
- Native Android starter template support
- Permission injection into the Android manifest
- Automatic Gradle wrapper bootstrap
- Build command for debug and release variants
- Clean template-based file generation

## Requirements

- Node.js 18 or newer
- A configured Android SDK
- Java Development Kit 17
- Gradle access for wrapper bootstrap, if the wrapper is not yet available

## Installation

Install the package globally:

```bash
npm install -g japkgen
```

For local development:

```bash
git clone https://github.com/your-username/japkgen.git
cd japkgen
npm install
npm link
```

## Usage

### Create a new project

```bash
japkgen new --name=app --package=com.example.app --template=webview
```

### Build a project

From the project directory:

```bash
japkgen build
```

Or by specifying the project path:

```bash
japkgen build app
```

### Available templates

- `webview`
- `native`

## Example

Generate a WebView project:

```bash
japkgen new --name=MyWebApp --package=com.example.mywebapp --template=webview --permissions=INTERNET
```

Build the generated project:

```bash
cd MyWebApp
japkgen build
```

The resulting APK will be available in the standard Gradle output directory.

## Command Reference

### `japkgen new`

Creates a new Android project from a template.

Options:

- `--name <name>`: Project name
- `--package <package>`: Android package name
- `--template <template>`: Template name (`webview` or `native`)
- `--min-sdk <number>`: Minimum SDK version
- `--target-sdk <number>`: Target SDK version
- `--compile-sdk <number>`: Compile SDK version
- `--url <url>`: WebView URL
- `--permissions <list>`: Comma-separated Android permissions

### `japkgen build`

Builds the current Android project or a project located at the specified path.

Options:

- `--variant <variant>`: Build variant (`debug` or `release`)
- `--gradle-version <version>`: Gradle version used for wrapper bootstrap

## Project Structure

A generated project typically contains the following structure:

```text
app/
├── build.gradle
├── src/
│   └── main/
│       ├── AndroidManifest.xml
│       ├── java/
│       └── res/
├── gradlew
├── gradlew.bat
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── settings.gradle
└── gradle.properties
```

## Supported Templates

### WebView

The WebView template generates an Android application that loads a remote web page inside a native WebView component. It includes JavaScript support and basic navigation handling.

### Native

The Native template generates a minimal Android application with a simple starter activity and user interface.

## Notes

- The generated project expects a valid Android SDK installation.
- The build command relies on the Gradle wrapper.
- If the wrapper is missing, `japkgen` will attempt to bootstrap it automatically.
- WebView applications should preferably use HTTPS URLs for better compatibility and security.

## Contributing

Contributions are welcome. Please keep changes focused, readable, and consistent with the existing project structure.

## License

This project is licensed under the Apache License 2.0.  
See the `LICENSE` file for the full license text.
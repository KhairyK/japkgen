/*
  * JSDOC type definitions for JAPK Generator.
  *
  * These are not actual code, but rather comments that define the expected structure of data and options used in the generator.
  * These are used for type checking and editor IntelliSense, but do not affect runtime.
  * The actual implementation of the functions and logic is in the other source files.
  * 
  * The types defined here include GenerateOptions, SigningOptions, BuildOptions, and EnvironmentInfo, which describe the shape of the data used in the generator.
  * The GenerateOptions type includes fields for app name, package name, template type, SDK versions, URL, permissions, icon, and signing options.
  * The SigningOptions type includes fields for whether signing is enabled, and if so, the keystore path, key alias, store password, and key password.
  * 
  * The BuildOptions type includes fields for the build variant (debug or release) and the Gradle version to use.
  * The EnvironmentInfo type includes fields for platform information, Java and Gradle availability, Android SDK information, and more.
  * These type definitions help ensure that the functions in the generator receive the correct data and can provide better error messages and editor support.
  * 
  * Note that these are just type definitions and do not contain any actual logic or implementation. The logic for generating the project, building it, and checking the environment is in the other source files.
  * Copyright 2026 (C) Sholehuddin Khairy <musickhairy@gmail.com>
*/

/**
 * @typedef {Object} GenerateOptions
 * @property {string} name
 * @property {string} package
 * @property {'webview'|'native'} template
 * @property {number} minSdk
 * @property {number} targetSdk
 * @property {number} compileSdk
 * @property {string} url
 * @property {string} permissions
 * @property {string} icon
 * @property {SigningOptions} signing
 */

/**
 * @typedef {Object} SigningOptions
 * @property {boolean} signingEnabled
 * @property {string} [keystore]
 * @property {string} [keyAlias]
 * @property {string} [storePassword]
 * @property {string} [keyPassword]
 */

/**
 * @typedef {Object} BuildOptions
 * @property {'debug'|'release'} variant
 * @property {string} gradleVersion
 */

/**
 * @typedef {Object} EnvironmentInfo
 * @property {string} platform
 * @property {string} arch
 * @property {string} node
 * @property {string} cwd
 * @property {string} home
 * @property {{ok:boolean, output:string}} java
 * @property {{ok:boolean, output:string}} gradle
 * @property {{ok:boolean, output:string}} adb
 * @property {string|null} sdkRoot
 * @property {boolean} hasSdkRoot
 * @property {boolean} sdkPlatformTools
 * @property {boolean} sdkBuildTools
 */
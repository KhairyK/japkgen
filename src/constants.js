export const DEFAULTS = {
  template: "webview",
  minSdk: 21,
  targetSdk: 34,
  compileSdk: 34,
  agpVersion: "8.8.2",
  gradleVersion: "8.10.2",
  javaVersion: "17",
  kotlinVersion: "2.3.21",
  cmakeVersion: "3.22.1",
  webUrl: "https://example.com",
  appName: "MyApp",
  packageName: "com.example.myapp",
  variant: "debug",
  servePort: 4173,
  keystoreFile: "./release.keystore",
  keystoreAlias: "release",
  keystoreStorePassword: "changeit",
  keystoreKeyPassword: "changeit"
};

export const ANDROIDX = {
  appcompat: "androidx.appcompat:appcompat:1.7.0",
  core: "androidx.core:core:1.13.1",
  coreKtx: "androidx.core:core-ktx:1.13.1",
  swipeRefresh: "androidx.swiperefreshlayout:swiperefreshlayout:1.1.0",
  webkit: "androidx.webkit:webkit:1.11.0"
};

export const SUPPORTED_TEMPLATES = ["webview", "native", "pwa", "game-java", "game-cpp", "kotlin"];

export const PLUGIN_CONFIG_FILES = [
  "japkgen.plugins.mjs",
  "japkgen.plugins.js",
  "japkgen.plugin.mjs",
  "japkgen.plugin.js"
];

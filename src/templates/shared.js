export function joinLines(lines = []) {
  return lines.flat(Infinity).filter(Boolean).join("\n");
}

export function makeReadme({
  appName = "__APP_NAME__",
  templateTitle = "Template",
  summary = "",
  compiler = "",
  highlights = [],
  setup = [],
  notes = [],
} = {}) {
  return `# ${appName}

[![Generated with JAPKGEN](https://img.shields.io/badge/generated%20with-JAPKGEN-3DDC84?style=for-the-badge)](#)
[![Template](https://img.shields.io/badge/template-${encodeURIComponent(templateTitle)}-1f6feb?style=for-the-badge)](#)

${summary}${compiler ? `\n\nCompiler: ${compiler}` : ""}

## Highlights

${highlights.length ? highlights.map((item) => `- ${item}`).join("\n") : "- Clean starter structure"}

## Setup

${setup.length ? setup.map((item) => `- ${item}`).join("\n") : "- Edit the sources and build with your preferred toolchain."}

## Notes

${notes.length ? notes.map((item) => `- ${item}`).join("\n") : "- This template is ready to customize."}
`;
}

export function makeSettingsGradle() {
  return `rootProject.name = '__APP_NAME__'
include ':app'
`;
}

export function makeRootBuildGradle({ includeKotlin = true, includeCompose = false } = {}) {
  const pluginLines = [
    "id 'com.android.application' version '__AGP_VERSION__' apply false",
  ];
  if (includeKotlin) {
    pluginLines.push("id 'org.jetbrains.kotlin.android' version '__KOTLIN_VERSION__' apply false");
  }
  if (includeCompose) {
    pluginLines.push("id 'org.jetbrains.kotlin.plugin.compose' version '__KOTLIN_VERSION__' apply false");
  }
  return `plugins {
    ${pluginLines.join("\n    ")}
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

tasks.register('clean', Delete) {
    delete rootProject.layout.buildDirectory
}
`;
}

export function makeGradleProperties() {
  return `org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`;
}

export function makeAndroidManifest({
  includeInternet = false,
  packageToken = "__PACKAGE__",
  activityName = ".MainActivity",
  labelToken = "__APP_NAME__",
} = {}) {
  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageToken}">
${includeInternet ? '    <uses-permission android:name="android.permission.INTERNET" />\n' : ''}<application
        android:label="${labelToken}"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="true"
        android:supportsRtl="true"
        android:theme="@style/Theme.App">
        <activity
            android:name="${activityName}"
            android:exported="true"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`;
}

export function makeStringsXml() {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">__APP_NAME__</string>
</resources>
`;
}

export function makeThemesXml({ parent = "Theme.Material3.DayNight.NoActionBar" } = {}) {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.App" parent="${parent}">
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:navigationBarColor">@android:color/black</item>
    </style>
</resources>
`;
}

export function makeAndroidAppBuildGradle({
  includeKotlin = true,
  includeWebkit = false,
  includeCompose = false,
  includeActivityCompose = false,
  includeNdk = false,
  extraDependencies = [],
} = {}) {
  const pluginLines = ["id 'com.android.application'"];
  if (includeKotlin) pluginLines.push("id 'org.jetbrains.kotlin.android'");
  if (includeCompose) pluginLines.push("id 'org.jetbrains.kotlin.plugin.compose'");

  const deps = [
    "implementation 'androidx.core:core-ktx:1.13.1'",
    "implementation 'androidx.appcompat:appcompat:1.7.0'",
    "implementation 'com.google.android.material:material:1.12.0'",
  ];
  if (includeWebkit) deps.push("implementation 'androidx.webkit:webkit:1.11.0'");
  if (includeActivityCompose) deps.push("implementation 'androidx.activity:activity-compose:1.9.2'");
  if (includeCompose) {
    deps.push("implementation platform('androidx.compose:compose-bom:2024.10.00')");
    deps.push("implementation 'androidx.compose.ui:ui'");
    deps.push("implementation 'androidx.compose.ui:ui-tooling-preview'");
    deps.push("implementation 'androidx.compose.material3:material3'");
    deps.push("debugImplementation 'androidx.compose.ui:ui-tooling'");
  }
  deps.push(...extraDependencies);

  return `plugins {
    ${pluginLines.join("\n    ")}
}

android {
    namespace "__PACKAGE__"
    compileSdk __COMPILE_SDK__

    defaultConfig {
        applicationId "__PACKAGE__"
        minSdk __MIN_SDK__
        targetSdk __TARGET_SDK__
        versionCode 1
        versionName "1.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }

    ${includeNdk ? `externalNativeBuild {\n        cmake {\n            path file('src/main/cpp/CMakeLists.txt')\n        }\n    }\n\n    ` : ""}compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    ${includeKotlin ? `kotlinOptions {\n        jvmTarget = '17'\n    }\n` : ""}
    ${includeCompose ? `buildFeatures {\n        compose true\n    }\n\n    composeOptions {\n        kotlinCompilerExtensionVersion = '__KOTLIN_VERSION__'\n    }\n` : ""}
}

dependencies {
${deps.map((dep) => `    ${dep}`).join("\n")}
}
`;
}

export function makeJavaMainActivity({
  body = "setContentView(R.layout.activity_main);",
  extendsType = "AppCompatActivity",
} = {}) {
  return `package __PACKAGE__;

import android.os.Bundle;
import androidx.appcompat.app.${extendsType};

public class MainActivity extends ${extendsType} {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        ${body}
    }
}
`;
}

export function makeKotlinMainActivity({
  body = "setContentView(R.layout.activity_main)",
  extendsType = "AppCompatActivity",
} = {}) {
  return `package __PACKAGE__

import android.os.Bundle
import androidx.appcompat.app.${extendsType}

class MainActivity : ${extendsType}() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ${body}
    }
}
`;
}

export function makeComposeMainActivity() {
  return `package __PACKAGE__

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    HomeScreen()
                }
            }
        }
    }
}

@Composable
fun HomeScreen() {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(text = "__APP_NAME__")
        Text(text = "Compose starter for modern Android UI.")
    }
}
`;
}

export function makeWebAssets({
  title = "__APP_NAME__",
  subtitle = "A secure WebView starter for Android.",
  bullets = [
    "Secure WebView defaults",
    "Offline-ready starter assets",
    "Clean HTML, CSS, and JavaScript structure",
  ],
} = {}) {
  return {
    "app/src/main/assets/www/index.html": `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main class="page">
    <p class="eyebrow">JAPKGEN Web Shell</p>
    <h1>${title}</h1>
    <p class="subtitle">${subtitle}</p>
    <section class="card">
      <ul>
        ${bullets.map((item) => `<li>${item}</li>`).join("\n        ")}
      </ul>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>
`,
    "app/src/main/assets/www/styles.css": `:root {
  color-scheme: dark;
  --bg: #0f172a;
  --panel: #111827;
  --text: #e5e7eb;
  --muted: #94a3b8;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at top, #1f2937, var(--bg));
  color: var(--text);
  font-family: Inter, system-ui, sans-serif;
}
.page {
  width: min(720px, calc(100vw - 32px));
  padding: 28px;
}
.eyebrow {
  margin: 0 0 8px;
  color: #22c55e;
  text-transform: uppercase;
  letter-spacing: .2em;
  font-size: .78rem;
}
h1 { margin: 0; font-size: clamp(2rem, 5vw, 4rem); }
.subtitle { color: var(--muted); line-height: 1.7; }
.card {
  margin-top: 18px;
  padding: 20px 22px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 24px;
  background: rgba(17,24,39,.88);
}
.card ul { margin: 0; padding-left: 1rem; line-height: 1.8; }
`,
    "app/src/main/assets/www/app.js": `document.documentElement.dataset.ready = 'true';
`,
  };
}

export function makeFrontendStarter({
  framework = "react",
  displayName = "__APP_NAME__",
} = {}) {
  const lower = framework.toLowerCase();
  const isVue = lower === "vue";
  const isAngular = lower === "angular";
  const srcExt = isVue ? "js" : isAngular ? "ts" : "jsx";

  let appSource = "";
  let mainSource = "";
  if (isVue) {
    appSource = `<template>
  <main class="app-shell">
    <h1>${displayName}</h1>
    <p>Vue starter ready to build.</p>
  </main>
</template>

<script setup>
</script>

<style>
.app-shell {
  min-height: 100vh;
  display: grid;
  place-content: center;
  text-align: center;
}
</style>
`;
    mainSource = `import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
`;
  } else if (isAngular) {
    appSource = `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`<main class="app-shell"><h1>${displayName}</h1><p>Angular starter ready to build.</p></main>\`,
  styles: [\`.app-shell { min-height: 100vh; display: grid; place-content: center; text-align: center; }\`],
})
export class AppComponent {}
`;
    mainSource = `import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './App';

bootstrapApplication(AppComponent);
`;
  } else if (lower === "solidjs") {
    appSource = `export default function App() {
  return (
    <main className="app-shell">
      <h1>${displayName}</h1>
      <p>SolidJS starter ready to build.</p>
    </main>
  );
}
`;
    mainSource = `import { render } from 'solid-js/web';
import App from './App.jsx';

render(() => <App />, document.getElementById('app'));
`;
  } else if (lower === "preact") {
    appSource = `export default function App() {
  return (
    <main className="app-shell">
      <h1>${displayName}</h1>
      <p>Preact starter ready to build.</p>
    </main>
  );
}
`;
    mainSource = `import { render } from 'preact';
import App from './App.jsx';

render(<App />, document.getElementById('app'));
`;
  } else {
    appSource = `export default function App() {
  return (
    <main className="app-shell">
      <h1>${displayName}</h1>
      <p>${framework} starter ready to build.</p>
    </main>
  );
}
`;
    mainSource = `import App from './App.jsx';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('app')).render(<App />);
`;
  }

  return {
    "frontend/package.json": JSON.stringify({
      name: "__PACKAGE__-frontend",
      private: true,
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview",
      },
      dependencies:
        lower === "react"
          ? { react: "^19.0.0", "react-dom": "^19.0.0" }
          : lower === "preact"
          ? { preact: "^10.26.4" }
          : lower === "solidjs"
          ? { "solid-js": "^1.9.4" }
          : lower === "vue"
          ? { vue: "^3.5.13" }
          : lower === "angular"
          ? { "@angular/core": "^19.0.0", "@angular/platform-browser": "^19.0.0" }
          : {},
      devDependencies: { vite: "^6.1.0", typescript: "^5.7.3" },
    }, null, 2) + "\n",
    "frontend/index.html": `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${displayName}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.${isVue ? "js" : isAngular ? "ts" : "jsx"}"></script>
</body>
</html>
`,
    [`frontend/src/App.${isVue ? "vue" : isAngular ? "ts" : "jsx"}`]: appSource,
    [`frontend/src/main.${isVue ? "js" : isAngular ? "ts" : "jsx"}`]: mainSource,
    "frontend/src/styles.css": `body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #0f172a; color: #e5e7eb; }
.app-shell { min-height: 100vh; display: grid; place-content: center; text-align: center; padding: 24px; }
h1 { margin: 0 0 12px; font-size: clamp(2rem, 5vw, 4rem); }
p { margin: 0; color: #94a3b8; }
`,
    "frontend/vite.config.js": `import { defineConfig } from 'vite';

export default defineConfig({
  server: { open: true },
});
`,
  };
}

export function makeToyBoxSources() {
  return {
    "app/src/main/java/__PACKAGE_PATH__/toybox/AppMath.java": `package __PACKAGE__;

public final class AppMath {
    private AppMath() {}

    public static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    public static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
`,
    "app/src/main/java/__PACKAGE_PATH__/toybox/AppLogger.java": `package __PACKAGE__;

import android.util.Log;

public final class AppLogger {
    private AppLogger() {}

    public static void info(String tag, String message) {
        Log.i(tag, message);
    }

    public static void warn(String tag, String message) {
        Log.w(tag, message);
    }
}
`,
    "app/src/main/java/__PACKAGE_PATH__/toybox/AppResult.java": `package __PACKAGE__;

public final class AppResult<T> {
    private final T data;
    private final Throwable error;

    private AppResult(T data, Throwable error) {
        this.data = data;
        this.error = error;
    }

    public static <T> AppResult<T> success(T data) {
        return new AppResult<>(data, null);
    }

    public static <T> AppResult<T> failure(Throwable error) {
        return new AppResult<>(null, error);
    }

    public boolean isSuccess() {
        return error == null;
    }

    public T getData() {
        return data;
    }

    public Throwable getError() {
        return error;
    }
}
`,
  };
}

export function makeNextBoxSources() {
  return {
    "app/src/main/kotlin/__PACKAGE_PATH__/nextbox/UiState.kt": `package __PACKAGE__

sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
}
`,
    "app/src/main/kotlin/__PACKAGE_PATH__/nextbox/StringExt.kt": `package __PACKAGE__

fun String?.orEmptyTrimmed(): String = this?.trim().orEmpty()

fun String?.isBlankSafe(): Boolean = this.isNullOrBlank()
`,
    "app/src/main/kotlin/__PACKAGE_PATH__/nextbox/DispatchersExt.kt": `package __PACKAGE__

import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers

object AppDispatchers {
    val main: CoroutineDispatcher = Dispatchers.Main
    val io: CoroutineDispatcher = Dispatchers.IO
    val default: CoroutineDispatcher = Dispatchers.Default
}
`,
  };
}

export function makeNativeCppSources() {
  return {
    "app/src/main/cpp/CMakeLists.txt": `cmake_minimum_required(VERSION 3.22.1)
project(app)

add_library(native-lib SHARED native-lib.cpp)
find_library(log-lib log)

target_link_libraries(native-lib \${log-lib})
`,
    "app/src/main/cpp/native-lib.cpp": `#include <jni.h>
#include <string>

extern "C"
JNIEXPORT jstring JNICALL
Java___PACKAGE_JNI___NativeBridge_stringFromJNI(JNIEnv* env, jobject /* this */) {
    std::string message = "Hello from C++";
    return env->NewStringUTF(message.c_str());
}
`,
    "app/src/main/java/__PACKAGE_PATH__/NativeBridge.java": `package __PACKAGE__;

public final class NativeBridge {
    static {
        System.loadLibrary("native-lib");
    }

    public native String stringFromJNI();
}
`,
  };
}

export function makeReactNativeScaffold() {
  return {
    "package.json": JSON.stringify({
      name: "__PACKAGE__-react-native",
      private: true,
      scripts: {
        start: "react-native start",
        android: "react-native run-android",
      },
      dependencies: {
        react: "^19.0.0",
        "react-native": "^0.79.0",
      },
    }, null, 2) + "\n",
    "app.json": `{
  "name": "__APP_NAME__",
  "displayName": "__APP_NAME__"
}
`,
    "babel.config.js": `module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
`,
    "index.js": `import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
`,
    "src/App.tsx": `import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>__APP_NAME__</Text>
      <Text style={styles.text}>React Native starter scaffold.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
  },
});
`,
  };
}

export function makeFlutterScaffold() {
  return {
    "pubspec.yaml": `name: __PACKAGE__
description: A Flutter starter generated by JAPKGEN.
publish_to: "none"
version: 1.0.0+1

environment:
  sdk: ">=3.5.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^5.0.0

flutter:
  uses-material-design: true
`,
    "lib/main.dart": `import 'package:flutter/material.dart';

void main() {
  runApp(const JapkgenFlutterApp());
}

class JapkgenFlutterApp extends StatelessWidget {
  const JapkgenFlutterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: '__APP_NAME__',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.green),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Text('__APP_NAME__', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
            SizedBox(height: 12),
            Text('Flutter starter scaffold.'),
          ],
        ),
      ),
    );
  }
}
`,
    "analysis_options.yaml": `include: package:flutter_lints/flutter.yaml
`,
  };
}

export function buildTemplate(spec = {}) {
  const {
    name,
    title,
    summary,
    compiler = "android",
    kind = "android",
    includeInternet = false,
    includeKotlin = true,
    includeCompose = false,
    includeWebkit = false,
    includeActivityCompose = false,
    includeNdk = false,
    deprecated = false,
    rootPrefix = "",
    sourceLanguage = "java",
    webAssets = false,
    frontendFramework = null,
    utilities = null,
    extraFiles = {},
  } = spec;

  const prefix = (rel) => rootPrefix ? `${rootPrefix}${rel}` : rel;
  const files = {
    "README.md": makeReadme({
      templateTitle: title,
      summary,
      compiler,
      highlights: [
        "Production-minded starter files",
        "Clear package layout",
        "Ready-to-edit defaults",
      ],
      setup: [
        "Open the project in Android Studio or your preferred editor.",
        "Update the package name, app name, and permissions as needed.",
      ].concat(
        frontendFramework ? ["Build the frontend workspace before packaging the Android shell."] : [],
        kind === "flutter" ? ["Run the Flutter toolchain to compile the APK."] : [],
        kind === "react-native" ? ["Run the React Native toolchain to build the Android app."] : []
      ),
      notes: [
        "Generated by JAPKGEN.",
        ...(deprecated ? [`${name} Has been deprecated, it will removed on v3.0.0`] : []),
      ],
    }),
    [prefix("settings.gradle")]: makeSettingsGradle(),
    [prefix("build.gradle")]: makeRootBuildGradle({ includeKotlin: true, includeCompose }),
    [prefix("gradle.properties")]: makeGradleProperties(),
    [prefix("app/src/main/AndroidManifest.xml")]: makeAndroidManifest({ includeInternet }),
    [prefix("app/src/main/res/values/strings.xml")]: makeStringsXml(),
    [prefix("app/src/main/res/values/themes.xml")]: makeThemesXml(),
    [prefix("app/build.gradle")]: makeAndroidAppBuildGradle({
      includeKotlin,
      includeWebkit,
      includeCompose,
      includeActivityCompose,
      includeNdk,
    }),
  };

  if (sourceLanguage === "compose") {
    files[prefix("app/src/main/kotlin/__PACKAGE_PATH__/MainActivity.kt")] = makeComposeMainActivity();
  } else if (sourceLanguage === "kotlin") {
    files[prefix("app/src/main/kotlin/__PACKAGE_PATH__/MainActivity.kt")] = makeKotlinMainActivity();
  } else {
    files[prefix("app/src/main/java/__PACKAGE_PATH__/MainActivity.java")] = makeJavaMainActivity();
  }

  if (webAssets) {
    Object.assign(files, makeWebAssets({
      title: "__APP_NAME__",
      subtitle: spec.webSubtitle || "A secure WebView starter for Android.",
      bullets: spec.webBullets || undefined,
    }));
  }

  if (frontendFramework) {
    Object.assign(files, makeFrontendStarter({
      framework: frontendFramework,
      displayName: "__APP_NAME__",
    }));
  }

  if (utilities === "toybox") {
    Object.assign(files, makeToyBoxSources());
  }
  if (utilities === "nextbox") {
    Object.assign(files, makeNextBoxSources());
  }

  if (kind === "ndk") {
    Object.assign(files, makeNativeCppSources());
  }

  if (kind === "react-native") {
    Object.assign(files, {
      ...makeReactNativeScaffold(),
      [prefix("android/build.gradle")]: makeRootBuildGradle({ includeKotlin: true }),
      [prefix("android/gradle.properties")]: makeGradleProperties(),
      [prefix("android/app/src/main/AndroidManifest.xml")]: makeAndroidManifest({ includeInternet: false }),
      [prefix("android/app/src/main/res/values/strings.xml")]: makeStringsXml(),
      [prefix("android/app/src/main/res/values/themes.xml")]: makeThemesXml(),
      [prefix("android/app/build.gradle")]: makeAndroidAppBuildGradle({ includeKotlin: false }),
      [prefix("android/app/src/main/java/__PACKAGE_PATH__/MainActivity.java")]: makeJavaMainActivity(),
    });
  }

  if (kind === "flutter") {
    Object.assign(files, {
      ...makeFlutterScaffold(),
      [prefix("android/settings.gradle")]: makeSettingsGradle(),
      [prefix("android/build.gradle")]: makeRootBuildGradle({ includeKotlin: true }),
      [prefix("android/gradle.properties")]: makeGradleProperties(),
      [prefix("android/app/src/main/AndroidManifest.xml")]: makeAndroidManifest({ includeInternet: false }),
      [prefix("android/app/src/main/res/values/strings.xml")]: makeStringsXml(),
      [prefix("android/app/src/main/res/values/themes.xml")]: makeThemesXml(),
      [prefix("android/app/build.gradle")]: makeAndroidAppBuildGradle({ includeKotlin: true }),
      [prefix("android/app/src/main/kotlin/__PACKAGE_PATH__/MainActivity.kt")]: makeKotlinMainActivity(),
    });
  }

  Object.assign(files, extraFiles);

  return {
    name,
    kind,
    compiler,
    deprecated,
    deprecationMessage: deprecated ? `${name} Has been deprecated, it will removed on v3.0.0` : null,
    files,
  };
}

import { ANDROIDX } from './constants.js';

function makeReadme({
  appName,
  templateName,
  templateTitle,
  templateSummary,
  templateNotes
}) {
  const badgeTemplate = encodeURIComponent(templateTitle);
  const badgeSummary = encodeURIComponent('Android Project');
  const badgeTemplateName = encodeURIComponent(templateName.toUpperCase());

  return `# ${appName}

[![Generated with JAPKGEN](https://img.shields.io/badge/generated%20with-JAPKGEN-3DDC84?style=for-the-badge)](#)
[![Platform](https://img.shields.io/badge/platform-Android-3DDC84?style=for-the-badge)](#)
[![Language](https://img.shields.io/badge/language-Java-ED8B00?style=for-the-badge)](#)
[![Template](https://img.shields.io/badge/template-${badgeTemplateName}-1f6feb?style=for-the-badge)](#)
[![Build Tool](https://img.shields.io/badge/build-Gradle-02303A?style=for-the-badge)](#)
[![AndroidX](https://img.shields.io/badge/androidx-enabled-0F9D58?style=for-the-badge)](#)
[![Target](https://img.shields.io/badge/target-${badgeSummary}-444444?style=for-the-badge)](#)

${templateSummary}

## Table of Contents

- [Overview](#overview)
- [Project Information](#project-information)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Build](#build)
- [Release Build](#release-build)
- [Template Notes](#template-notes)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

This project was generated with JAPKGEN. It follows a modular Android project layout, uses AndroidX dependencies only where needed, and is prepared for standard Gradle-based development workflows.

## Project Information

| Field | Value |
| --- | --- |
| Application Name | ${appName} |
| Template | ${templateTitle} |
| Package Namespace | __PACKAGE__ |
| Min SDK | __MIN_SDK__ |
| Target SDK | __TARGET_SDK__ |
| Compile SDK | __COMPILE_SDK__ |

## Features

- Modular Android project structure
- AndroidX-based UI scaffold
- Gradle wrapper support
- Release signing support
- Launcher icon generation
- Template-specific dependencies
- Clean separation between app logic and build configuration

## Prerequisites

To build this project, you need:

- JDK 17
- Android SDK
- Android platform tools
- A compatible Gradle wrapper setup

## Project Structure

\`\`\`txt
${appName}/
├─ app/
│  ├─ src/main/
│  │  ├─ java/
│  │  ├─ res/
│  │  ├─ AndroidManifest.xml
│  │  └─ assets/ (if the template uses local web assets)
│  └─ build.gradle
├─ build.gradle
├─ settings.gradle
├─ gradle.properties
├─ gradlew
├─ gradlew.bat
└─ README.md
\`\`\`

## Build

Run the debug build:

\`\`\`bash
./gradlew assembleDebug
\`\`\`

## Release Build

Run the release build:

\`\`\`bash
./gradlew assembleRelease
\`\`\`

## Template Notes

${templateNotes}

## Troubleshooting

### Android SDK location is missing
Ensure that \`local.properties\` contains a valid \`sdk.dir\` value, or set \`ANDROID_SDK_ROOT\`.

### Java version mismatch
Use JDK 17 for the Gradle wrapper and Android Gradle Plugin versions used by this project.

### Dependency or manifest merge errors
Verify that the selected template matches the Android SDK levels and dependencies configured by JAPKGEN.

## Contributing

Contributions are welcome. Please keep changes well structured, documented, and aligned with the existing template design.

## License

This project is provided under the MIT License.
`;
}

function commonFiles({
  appName,
  dependenciesBlock,
  extraAndroidBlock,
  layoutXml,
  activityJava,
  extraFiles = {},
  readme
}) {
  return {
    'settings.gradle': `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = '__APP_NAME__'
include(':app')
`,
    'build.gradle': `plugins {
    id 'com.android.application' version '__AGP_VERSION__' apply false
}
`,
    'gradle.properties': `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
`,
    'app/build.gradle': `import java.util.Properties
import java.io.FileInputStream

plugins {
    id 'com.android.application'
}

def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
def hasKeystore = keystorePropertiesFile.exists()

if (hasKeystore) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    namespace '__PACKAGE__'
    compileSdk __COMPILE_SDK__

    defaultConfig {
        applicationId '__PACKAGE__'
        minSdk __MIN_SDK__
        targetSdk __TARGET_SDK__
        versionCode 1
        versionName '1.0'
    }

__EXTRA_ANDROID_BLOCK__
    signingConfigs {
        release {
            if (hasKeystore) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }

    buildTypes {
        debug {
            minifyEnabled false
        }
        release {
            minifyEnabled false
            shrinkResources false
            if (hasKeystore) {
                signingConfig signingConfigs.release
            } else {
                signingConfig signingConfigs.debug
            }
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
__ANDROIDX_DEPENDENCIES__
}
`,
    'app/src/main/AndroidManifest.xml': `<manifest xmlns:android="http://schemas.android.com/apk/res/android">

__PERMISSIONS__

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true"
        android:theme="@style/Theme.AppCompat.Light.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`,
    'app/src/main/res/values/strings.xml': `<resources>
    <string name="app_name">__APP_NAME__</string>
</resources>
`,
    'app/src/main/res/layout/activity_main.xml': layoutXml,
    [`app/src/main/java/__PACKAGE_PATH__/MainActivity.java`]: activityJava,
    'README.md': readme,
    ...extraFiles
  };
}

function webviewTemplate() {
  const dependencies = [
    ANDROIDX.appcompat,
    ANDROIDX.core,
    ANDROIDX.swipeRefresh,
    ANDROIDX.webkit
  ];

  const readme = makeReadme({
    appName: '__APP_NAME__',
    templateName: 'webview',
    templateTitle: 'WebView',
    templateSummary: 'A WebView-based Android application scaffold with pull-to-refresh and external link handling.',
    templateNotes: `- Uses AndroidX AppCompat for the activity base class.
- Includes SwipeRefreshLayout for pull-to-refresh.
- Uses AndroidX WebKit for safer web integration.
- Suitable for wrapping a live website in a native Android shell.`
  });

  return {
    dependencies,
    files: commonFiles({
      appName: '__APP_NAME__',
      dependenciesBlock: '__ANDROIDX_DEPENDENCIES__',
      extraAndroidBlock: '',
      layoutXml: `<androidx.swiperefreshlayout.widget.SwipeRefreshLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/swipeRefresh"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <FrameLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent">

        <WebView
            android:id="@+id/webview"
            android:layout_width="match_parent"
            android:layout_height="match_parent" />

        <ProgressBar
            android:id="@+id/progress"
            style="?android:attr/progressBarStyleLarge"
            android:layout_width="48dp"
            android:layout_height="48dp"
            android:layout_gravity="center"
            android:indeterminate="true"
            android:visibility="gone" />
    </FrameLayout>
</androidx.swiperefreshlayout.widget.SwipeRefreshLayout>
`,
      activityJava: `package __PACKAGE__;

import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;

import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ProgressBar progressBar;
    private SwipeRefreshLayout swipeRefreshLayout;

    private final String homeUrl = "__WEB_URL__";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        progressBar = findViewById(R.id.progress);
        swipeRefreshLayout = findViewById(R.id.swipeRefresh);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setVisibility(newProgress < 100 ? View.VISIBLE : View.GONE);
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUrl(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(Uri.parse(url));
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
                swipeRefreshLayout.setRefreshing(false);
            }
        });

        swipeRefreshLayout.setOnRefreshListener(webView::reload);
        webView.loadUrl(homeUrl);
    }

    private boolean handleUrl(Uri uri) {
        if (uri == null) return false;

        String scheme = uri.getScheme();
        if (scheme == null) return false;

        if (scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https")) {
            return false;
        }

        try {
            startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW, uri));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }
}
`,
      readme
    })
  };
}

function pwaTemplate() {
  const dependencies = [
    ANDROIDX.appcompat,
    ANDROIDX.core,
    ANDROIDX.swipeRefresh,
    ANDROIDX.webkit
  ];

  const readme = makeReadme({
    appName: '__APP_NAME__',
    templateName: 'pwa',
    templateTitle: 'PWA',
    templateSummary: 'A local asset-backed Progressive Web App shell powered by AndroidX WebKit and WebViewAssetLoader.',
    templateNotes: `- Uses WebViewAssetLoader to serve local content through an HTTPS-like origin.
- Includes an offline page and a manifest for a PWA-style shell.
- Suitable for shipping a web app with offline-ready local assets.
- Uses AndroidX WebKit APIs for safer local content loading.`
  });

  return {
    dependencies,
    files: commonFiles({
      appName: '__APP_NAME__',
      dependenciesBlock: '__ANDROIDX_DEPENDENCIES__',
      extraAndroidBlock: '',
      layoutXml: `<androidx.swiperefreshlayout.widget.SwipeRefreshLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/swipeRefresh"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <FrameLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent">

        <WebView
            android:id="@+id/webview"
            android:layout_width="match_parent"
            android:layout_height="match_parent" />

        <ProgressBar
            android:id="@+id/progress"
            style="?android:attr/progressBarStyleLarge"
            android:layout_width="48dp"
            android:layout_height="48dp"
            android:layout_gravity="center"
            android:indeterminate="true"
            android:visibility="gone" />
    </FrameLayout>
</androidx.swiperefreshlayout.widget.SwipeRefreshLayout>
`,
      activityJava: `package __PACKAGE__;

import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;

import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ProgressBar progressBar;
    private SwipeRefreshLayout swipeRefreshLayout;
    private WebViewAssetLoader assetLoader;

    private static final String HOME_URL = "https://appassets.androidplatform.net/assets/www/index.html";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        progressBar = findViewById(R.id.progress);
        swipeRefreshLayout = findViewById(R.id.swipeRefresh);

        assetLoader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setVisibility(newProgress < 100 ? View.VISIBLE : View.GONE);
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
                swipeRefreshLayout.setRefreshing(false);
            }
        });

        swipeRefreshLayout.setOnRefreshListener(webView::reload);
        webView.loadUrl(HOME_URL);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }
}
`,
      extraFiles: {
        'app/src/main/assets/www/index.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>__APP_NAME__ PWA</title>
  <meta name="theme-color" content="#2563eb" />
  <link rel="manifest" href="manifest.webmanifest" />
  <style>
    body {
      margin: 0;
      font-family: system-ui, sans-serif;
      display: grid;
      place-items: center;
      min-height: 100vh;
      background: #0f172a;
      color: white;
      text-align: center;
      padding: 24px;
    }
    .card {
      max-width: 560px;
      width: 100%;
      padding: 24px;
      border-radius: 20px;
      background: rgba(255,255,255,0.06);
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>__APP_NAME__</h1>
    <p>This is the local PWA shell. Replace this starter page with your application shell and assets.</p>
  </div>
</body>
</html>
`,
        'app/src/main/assets/www/offline.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Offline</title>
</head>
<body style="font-family:system-ui,sans-serif;padding:24px;">
  <h1>You are offline</h1>
  <p>The local app shell is available, but the requested content could not be loaded.</p>
</body>
</html>
`,
        'app/src/main/assets/www/manifest.webmanifest': `{
  "name": "__APP_NAME__",
  "short_name": "__APP_NAME__",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#2563eb"
}
`
      },
      readme
    })
  };
}

function nativeTemplate() {
  const dependencies = [
    ANDROIDX.appcompat,
    ANDROIDX.core
  ];

  const readme = makeReadme({
    appName: '__APP_NAME__',
    templateName: 'native',
    templateTitle: 'Native',
    templateSummary: 'A minimal Android application scaffold for standard native UI development.',
    templateNotes: `- Built with AndroidX AppCompat.
- Intended as a clean starting point for traditional Android UI work.
- Suitable for adding your own Activities, Fragments, and application logic.`
  });

  return {
    dependencies,
    files: commonFiles({
      appName: '__APP_NAME__',
      dependenciesBlock: '__ANDROIDX_DEPENDENCIES__',
      extraAndroidBlock: '',
      layoutXml: `<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:gravity="center"
    android:orientation="vertical"
    android:padding="24dp">

    <TextView
        android:id="@+id/message"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Hello from __APP_NAME__!"
        android:textSize="24sp" />
</LinearLayout>
`,
      activityJava: `package __PACKAGE__;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }
}
`,
      readme
    })
  };
}

function gameJavaTemplate() {
  const dependencies = [
    ANDROIDX.appcompat,
    ANDROIDX.core
  ];

  const readme = makeReadme({
    appName: '__APP_NAME__',
    templateName: 'game-java',
    templateTitle: 'Game (Java)',
    templateSummary: 'A simple SurfaceView-based Java game scaffold with a lightweight update and render loop.',
    templateNotes: `- Uses a custom SurfaceView game loop.
- Keeps the screen awake during gameplay.
- Good starting point for arcade, prototype, and learning projects.`
  });

  return {
    dependencies,
    files: commonFiles({
      appName: '__APP_NAME__',
      dependenciesBlock: '__ANDROIDX_DEPENDENCIES__',
      extraAndroidBlock: '',
      layoutXml: `<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <__PACKAGE__.GameView
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</FrameLayout>
`,
      activityJava: `package __PACKAGE__;

import android.os.Bundle;
import android.view.WindowManager;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        setContentView(R.layout.activity_main);
    }
}
`,
      extraFiles: {
        'app/src/main/java/__PACKAGE_PATH__/GameView.java': `package __PACKAGE__;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.view.SurfaceHolder;
import android.view.SurfaceView;

public class GameView extends SurfaceView implements Runnable {

    private Thread thread;
    private volatile boolean running;
    private final SurfaceHolder holder;
    private final Paint paint;

    private float x = 100;
    private float y = 100;
    private float dx = 8;
    private float dy = 6;

    public GameView(Context context) {
        super(context);
        holder = getHolder();
        paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setTextSize(56f);
    }

    @Override
    public void run() {
        while (running) {
            if (!holder.getSurface().isValid()) {
                continue;
            }

            update();

            Canvas canvas = holder.lockCanvas();
            if (canvas != null) {
                try {
                    drawFrame(canvas);
                } finally {
                    holder.unlockCanvasAndPost(canvas);
                }
            }

            try {
                Thread.sleep(16);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
        }
    }

    private void update() {
        x += dx;
        y += dy;

        if (x > getWidth() - 80 || x < 80) dx = -dx;
        if (y > getHeight() - 80 || y < 80) dy = -dy;
    }

    private void drawFrame(Canvas canvas) {
        canvas.drawColor(Color.rgb(15, 23, 42));

        paint.setColor(Color.WHITE);
        canvas.drawText("__APP_NAME__", 48, 96, paint);

        paint.setColor(Color.rgb(37, 99, 235));
        canvas.drawCircle(x, y, 60, paint);
    }

    @Override
    public void surfaceCreated(SurfaceHolder holder) {
        running = true;
        thread = new Thread(this);
        thread.start();
    }

    @Override
    public void surfaceDestroyed(SurfaceHolder holder) {
        running = false;
        if (thread != null) {
            try {
                thread.join();
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
        }
    }
}
`
      },
      readme
    })
  };
}

function gameCppTemplate() {
  const dependencies = [
    ANDROIDX.appcompat,
    ANDROIDX.core
  ];

  const readme = makeReadme({
    appName: '__APP_NAME__',
    templateName: 'game-cpp',
    templateTitle: 'Game (C/C++)',
    templateSummary: 'A native C/C++ game starter using CMake and JNI integration.',
    templateNotes: `- Uses externalNativeBuild with CMake.
- Includes a JNI bridge from Java to native code.
- Intended as a starting point for low-level rendering or engine experimentation.
- Make sure the Android NDK and CMake are installed on the target machine.`
  });

  return {
    dependencies,
    extraAndroidBlock: `    externalNativeBuild {
        cmake {
            path "src/main/cpp/CMakeLists.txt"
            version "3.22.1"
        }
    }`,
    files: commonFiles({
      appName: '__APP_NAME__',
      dependenciesBlock: '__ANDROIDX_DEPENDENCIES__',
      extraAndroidBlock: `    externalNativeBuild {
        cmake {
            path "src/main/cpp/CMakeLists.txt"
            version "3.22.1"
        }
    }`,
      layoutXml: `<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:gravity="center"
    android:orientation="vertical"
    android:padding="24dp">

    <TextView
        android:id="@+id/title"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Loading..."
        android:textSize="28sp"
        android:textStyle="bold" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Native C/C++ starter template"
        android:textSize="16sp" />
</LinearLayout>
`,
      activityJava: `package __PACKAGE__;

import android.os.Bundle;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    static {
        System.loadLibrary("native-lib");
    }

    private native String getNativeTitle();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        TextView title = findViewById(R.id.title);
        title.setText(getNativeTitle());
    }
}
`,
      extraFiles: {
        'app/src/main/cpp/CMakeLists.txt': `cmake_minimum_required(VERSION 3.22.1)

project("japkgen_game")

add_library(native-lib SHARED
        native-lib.cpp)

find_library(log-lib
        log)

target_link_libraries(native-lib
        ${log-lib})
`,
        'app/src/main/cpp/native-lib.cpp': `#include <jni.h>
#include <string>

extern "C"
JNIEXPORT jstring JNICALL
Java___PACKAGE_JNI___MainActivity_getNativeTitle(JNIEnv *env, jobject /* thiz */) {
    std::string title = "__APP_NAME__ Native Engine";
    return env->NewStringUTF(title.c_str());
}
`
      },
      readme
    })
  };
}

export function getTemplate(templateName) {
  switch (String(templateName).toLowerCase()) {
    case 'webview':
      return webviewTemplate();
    case 'pwa':
      return pwaTemplate();
    case 'native':
      return nativeTemplate();
    case 'game-java':
      return gameJavaTemplate();
    case 'game-cpp':
      return gameCppTemplate();
    default:
      return null;
  }
}
import path from "node:path";
import { ANDROIDX, DEFAULTS } from "./constants.js";
import { uniq } from "./utils.js";

function makeReadme({ appName, templateTitle, templateSummary, templateNotes }) {
  return `# ${appName}

[![Generated with JAPKGEN](https://img.shields.io/badge/generated%20with-JAPKGEN-3DDC84?style=for-the-badge)](#)
[![Template](https://img.shields.io/badge/template-${encodeURIComponent(templateTitle)}-1f6feb?style=for-the-badge)](#)
[![Build](https://img.shields.io/badge/build-Gradle-02303A?style=for-the-badge)](#)

${templateSummary}

## What is inside

- AndroidX-based scaffold
- Ready-to-edit source code
- Friendly build layout
- ${templateTitle} template

## Notes

${templateNotes}
`;
}

function commonFiles({
  dependencies,
  layoutXml,
  activityJava,
  sourcePath = "app/src/main/java/__PACKAGE_PATH__/MainActivity.java",
  extraAndroidBlock = "",
  extraFiles = {},
  readme,
  themeName = "Theme.JAPKGEN",
  appPlugins = [],
  appDependencies = []
}) {
  const pluginLines = [
    "    id 'com.android.application'",
    ...appPlugins.map((line) => `    ${line}`)
  ].join("\n");

  const allDependencies = uniq([...dependencies, ...appDependencies]);
  const androidDeps = allDependencies.map((d) => `    implementation '${d}'`).join("\n");

  return {
    "settings.gradle": `pluginManagement {
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
include ':app'
`,
    "build.gradle": `plugins {
${pluginLines}
}

`,
    "gradle.properties": `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
`,
    "app/build.gradle": `import java.util.Properties
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
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
${androidDeps}
}
`,
    "app/src/main/AndroidManifest.xml": `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
__PERMISSIONS__
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true"
        android:theme="@style/${themeName}">
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
    "app/src/main/res/values/strings.xml": `<resources>
    <string name="app_name">__APP_NAME__</string>
</resources>
`,
    "app/src/main/res/values/themes.xml": `<resources>
    <style name="${themeName}" parent="Theme.AppCompat.Light.NoActionBar" />
</resources>
`,
    "app/src/main/res/layout/activity_main.xml": layoutXml,
    [sourcePath]: activityJava,
    "README.md": readme,
    ...extraFiles
  };
}

function webviewTemplate() {
  const dependencies = [ANDROIDX.appcompat, ANDROIDX.core, ANDROIDX.swipeRefresh, ANDROIDX.webkit];
  const readme = makeReadme({
    appName: "__APP_NAME__",
    templateTitle: "WebView",
    templateSummary: "A WebView-based Android application scaffold with pull-to-refresh and external link handling.",
    templateNotes: `- JavaScript support enabled
- DOM storage enabled
- Pull to refresh support
- External links open in the browser`
  });

  return {
    dependencies,
    files: commonFiles({
      dependencies,
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
  const dependencies = [ANDROIDX.appcompat, ANDROIDX.core, ANDROIDX.swipeRefresh, ANDROIDX.webkit];
  const readme = makeReadme({
    appName: "__APP_NAME__",
    templateTitle: "PWA",
    templateSummary: "A local asset-backed Progressive Web App shell powered by AndroidX WebKit and WebViewAssetLoader.",
    templateNotes: `- Local asset shell
- Offline fallback page
- Good for hybrid web apps`
  });

  return {
    dependencies,
    files: commonFiles({
      dependencies,
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
        "app/src/main/assets/www/index.html": `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>__APP_NAME__ PWA</title>
  <meta name="theme-color" content="#2563eb" />
  <link rel="manifest" href="manifest.webmanifest" />
</head>
<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;background:#0f172a;color:#fff;text-align:center;padding:24px;">
  <div style="max-width:560px;padding:24px;border-radius:20px;background:rgba(255,255,255,0.06);">
    <h1>__APP_NAME__</h1>
    <p>This is the local PWA shell.</p>
  </div>
</body>
</html>
`,
        "app/src/main/assets/www/offline.html": `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Offline</title></head>
<body style="font-family:system-ui,sans-serif;padding:24px;">
  <h1>You are offline</h1>
  <p>The local app shell is available, but the requested content could not be loaded.</p>
</body>
</html>
`,
        "app/src/main/assets/www/manifest.webmanifest": `{
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
  const dependencies = [ANDROIDX.appcompat, ANDROIDX.core];
  const readme = makeReadme({
    appName: "__APP_NAME__",
    templateTitle: "Native",
    templateSummary: "A minimal Android application scaffold for standard native UI development.",
    templateNotes: `- Clean starter template
- Great for custom screens
- No extra WebView dependencies`
  });

  return {
    dependencies,
    files: commonFiles({
      dependencies,
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
  const dependencies = [ANDROIDX.appcompat, ANDROIDX.core];
  const readme = makeReadme({
    appName: "__APP_NAME__",
    templateTitle: "Game (Java)",
    templateSummary: "A simple SurfaceView-based Java game scaffold with a lightweight update and render loop.",
    templateNotes: `- Custom game loop
- Keeps the screen awake
- Simple prototype starter`
  });

  return {
    dependencies,
    files: commonFiles({
      dependencies,
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
        "app/src/main/java/__PACKAGE_PATH__/GameView.java": `package __PACKAGE__;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.util.AttributeSet;
import android.view.SurfaceHolder;
import android.view.SurfaceView;

public class GameView extends SurfaceView implements Runnable, SurfaceHolder.Callback {

    private Thread thread;
    private volatile boolean running;
    private final SurfaceHolder holder;
    private final Paint paint;

    private float x = 100f;
    private float y = 100f;
    private float dx = 8f;
    private float dy = 6f;

    public GameView(Context context) {
        this(context, null);
    }

    public GameView(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public GameView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        holder = getHolder();
        holder.addCallback(this);
        paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setTextSize(56f);
        setFocusable(true);
    }

    @Override
    public void run() {
        while (running) {
            if (!holder.getSurface().isValid()) {
                sleepQuietly(16);
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

            sleepQuietly(16);
        }
    }

    private void update() {
        x += dx;
        y += dy;

        int width = getWidth();
        int height = getHeight();

        if (width > 0 && (x > width - 80f || x < 80f)) {
            dx = -dx;
        }

        if (height > 0 && (y > height - 80f || y < 80f)) {
            dy = -dy;
        }
    }

    private void drawFrame(Canvas canvas) {
        canvas.drawColor(Color.rgb(15, 23, 42));
        paint.setColor(Color.WHITE);
        paint.setTextAlign(Paint.Align.CENTER);
        canvas.drawText("__APP_NAME__", getWidth() / 2f, 96f, paint);
        paint.setColor(Color.rgb(37, 99, 235));
        canvas.drawCircle(x, y, 60f, paint);
    }

    private void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }

    @Override
    public void surfaceCreated(SurfaceHolder holder) {
        running = true;
        thread = new Thread(this, "GameViewThread");
        thread.start();
    }

    @Override
    public void surfaceChanged(SurfaceHolder holder, int format, int width, int height) {
        // No-op.
    }

    @Override
    public void surfaceDestroyed(SurfaceHolder holder) {
        running = false;
        if (thread != null) {
            try {
                thread.join(500);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
        }
    }
}
`,
      },
      readme
    })
  };
}

function gameCppTemplate() {
  const dependencies = [ANDROIDX.appcompat, ANDROIDX.core];
  const readme = makeReadme({
    appName: "__APP_NAME__",
    templateTitle: "Game (C/C++)",
    templateSummary: "A native C/C++ game starter using CMake and JNI integration.",
    templateNotes: `- JNI bridge included
- Native CMake support
- Good for engine experiments`
  });

  return {
    dependencies,
    files: commonFiles({
      dependencies,
      extraAndroidBlock: `    externalNativeBuild {
        cmake {
            path "src/main/cpp/CMakeLists.txt"
            version "__CMAKE_VERSION__"
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
        "app/src/main/cpp/CMakeLists.txt": `cmake_minimum_required(VERSION __CMAKE_VERSION__)

project("japkgen_game")

add_library(native-lib SHARED
        native-lib.cpp)

find_library(log-lib
        log)

target_link_libraries(native-lib
        ${log-lib})
`,
        "app/src/main/cpp/native-lib.cpp": `#include <jni.h>
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

function kotlinTemplate() {
  const dependencies = [ANDROIDX.appcompat, ANDROIDX.coreKtx];
  const readme = makeReadme({
    appName: "__APP_NAME__",
    templateTitle: "Kotlin",
    templateSummary: "A modern Android starter template written in Kotlin with a clean AppCompat activity.",
    templateNotes: `- Kotlin source file
- Kotlin Android plugin enabled
- Good base for modern Android apps`
  });

  const files = commonFiles({
    dependencies,
    readme,
    appPlugins: [
      "id 'org.jetbrains.kotlin.android'"
    ],
    appDependencies: [
      "org.jetbrains.kotlin:kotlin-stdlib:__KOTLIN_VERSION__"
    ],
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
    sourcePath: "app/src/main/java/__PACKAGE_PATH__/MainActivity.java"
  });

  delete files["app/src/main/java/__PACKAGE_PATH__/MainActivity.java"];
  files["app/src/main/kotlin/__PACKAGE_PATH__/MainActivity.kt"] = `package __PACKAGE__

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }
}
`;
  files["app/build.gradle"] = `import java.util.Properties
import java.io.FileInputStream

plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
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
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'androidx.core:core-ktx:1.13.1'
    implementation 'org.jetbrains.kotlin:kotlin-stdlib:__KOTLIN_VERSION__'
}
`;
  files["build.gradle"] = `plugins {
    id 'com.android.application' version '__AGP_VERSION__' apply false
    id 'org.jetbrains.kotlin.android' version '__KOTLIN_VERSION__' apply false
}
`;
  return {
    dependencies,
    files
  };
}

const BUILTIN_TEMPLATES = {
  webview: webviewTemplate,
  native: nativeTemplate,
  pwa: pwaTemplate,
  "game-java": gameJavaTemplate,
  "game-cpp": gameCppTemplate,
  kotlin: kotlinTemplate
};

export function getTemplate(templateName, registry = BUILTIN_TEMPLATES) {
  const key = String(templateName).toLowerCase();
  const templateFactory = registry[key];
  if (!templateFactory) return null;
  const template = typeof templateFactory === "function" ? templateFactory() : templateFactory;
  return template || null;
}

export function templateNames(registry = BUILTIN_TEMPLATES) {
  return Object.keys(registry).sort();
}

export { BUILTIN_TEMPLATES, commonFiles, makeReadme };

import path from "node:path";
import { ANDROIDX, COMPOSE, DEFAULTS } from "./constants.js";
import { uniq } from "./utils.js";

function joinLines(lines = []) {
  return lines.filter(Boolean).join("\n");
}

function makeReadme({ appName, templateTitle, templateSummary, templateNotes, setupNotes = [] }) {
  return `# ${appName}

[![Generated with JAPKGEN](https://img.shields.io/badge/generated%20with-JAPKGEN-3DDC84?style=for-the-badge)](#)
[![Template](https://img.shields.io/badge/template-${encodeURIComponent(templateTitle)}-1f6feb?style=for-the-badge)](#)
[![Build](https://img.shields.io/badge/build-Gradle-02303A?style=for-the-badge)](#)

${templateSummary}

## Included

- Android application scaffold
- Clean source layout
- Ready-to-edit resources
- ${templateTitle} starter structure

## Notes

${templateNotes}
${setupNotes.length ? `\n## Setup\n\n${setupNotes.map((line) => `- ${line}`).join("\n")}\n` : ""}`;
}

function frameworkReadme({ appName, frameworkName, summary, setupSteps, notes }) {
  return `# ${appName}

[![Generated with JAPKGEN](https://img.shields.io/badge/generated%20with-JAPKGEN-3DDC84?style=for-the-badge)](#)
[![Framework](https://img.shields.io/badge/framework-${encodeURIComponent(frameworkName)}-0f172a?style=for-the-badge)](#)
[![Bundler](https://img.shields.io/badge/bundler-Vite-646cff?style=for-the-badge)](#)

${summary}

## Project layout

- \`app/\` contains the Android shell
- \`frontend/\` contains the Vite application
- \`frontend/dist\` is emitted into \`app/src/main/assets/www\` during production builds

## Setup

${setupSteps.map((step) => `1. ${step}`).join("\n")}

## Notes

${notes}
`;
}

function buildRootBuildGradle({ includeCompose = false } = {}) {
  const plugins = [
    "    id 'com.android.application' version '__AGP_VERSION__' apply false",
    "    id 'org.jetbrains.kotlin.android' version '__KOTLIN_VERSION__' apply false"
  ];

  if (includeCompose) {
    plugins.push("    id 'org.jetbrains.kotlin.plugin.compose' version '__KOTLIN_VERSION__' apply false");
  }

  return `plugins {
${plugins.join("\n")}
}
`;
}

function buildSettingsGradle() {
  return `pluginManagement {
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
`;
}

function buildGradleProperties() {
  return `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
`;
}

function buildAppGradle({
  dependencies,
  appPlugins = [],
  extraAndroidBlock = "",
  buildFeaturesBlock = "",
  composeBlock = "",
  allowCleartextTraffic = true
}) {
  const plugins = [
    "    id 'com.android.application'",
    ...appPlugins.map((line) => `    ${line}`)
  ].join("\n");

  const depLines = uniq(dependencies).map((d) => `    implementation '${d}'`).join("\n");
  const cleartextLine = allowCleartextTraffic ? "        android:usesCleartextTraffic=\"true\"" : "";

  return `import java.util.Properties
import java.io.FileInputStream

plugins {
${plugins}
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

${extraAndroidBlock ? `${extraAndroidBlock}\n` : ""}${buildFeaturesBlock ? `${buildFeaturesBlock}\n` : ""}${composeBlock ? `${composeBlock}\n` : ""}    signingConfigs {
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
${depLines}
}
`;
}

function buildAndroidManifest({ themeName = "Theme.JAPKGEN", allowCleartextTraffic = true, permissions = "__PERMISSIONS__" } = {}) {
  const cleartextLine = allowCleartextTraffic ? '        android:usesCleartextTraffic="true"' : "";
  return `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
${permissions}
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:label="@string/app_name"
        android:supportsRtl="true"${cleartextLine ? `\n${cleartextLine}` : ""}
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
`;
}

function buildStringsXml(appName = "__APP_NAME__") {
  return `<resources>
    <string name="app_name">${appName}</string>
</resources>
`;
}

function buildThemeXml(themeName = "Theme.JAPKGEN", parent = "Theme.AppCompat.DayNight.NoActionBar") {
  return `<resources>
    <style name="${themeName}" parent="${parent}" />
</resources>
`;
}

function buildComposeThemeXml(themeName = "Theme.JAPKGEN") {
  return `<resources>
    <style name="${themeName}" parent="Theme.Material3.DayNight.NoActionBar" />
</resources>
`;
}

function buildAssetShell({ title, appName, subtitle }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    :root { color-scheme: dark; }
    html, body { margin: 0; min-height: 100%; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: radial-gradient(circle at top, #1d4ed8 0%, #020617 60%);
      color: #e2e8f0;
      padding: 24px;
      box-sizing: border-box;
    }
    .card {
      width: min(640px, 100%);
      padding: 32px;
      border-radius: 28px;
      background: rgba(15, 23, 42, 0.82);
      border: 1px solid rgba(148, 163, 184, 0.18);
      box-shadow: 0 24px 72px rgba(2, 6, 23, 0.45);
    }
    h1 { margin: 0 0 12px; font-size: 2.4rem; }
    p { margin: 0 0 12px; line-height: 1.7; color: #cbd5e1; }
    code { background: rgba(148, 163, 184, 0.14); padding: 2px 6px; border-radius: 8px; }
  </style>
</head>
<body>
  <main class="card">
    <h1>${appName}</h1>
    <p>${subtitle}</p>
    <p>This asset shell is replaced when the Vite bundle is built into <code>app/src/main/assets/www</code>.</p>
  </main>
</body>
</html>
`;
}


function buildTailwindConfig() {
  return `module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx,vue}'
  ],
  theme: {
    extend: {
      colors: {
        brand: '#2563eb',
        surface: '#0f172a'
      }
    }
  },
  plugins: []
};
`;
}

function buildPostcssConfig() {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
`;
}

function buildXml2JsonHelper() {
  return `function normalizeValue(value) {
  const trimmed = String(value ?? '').trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed !== '' && !Number.isNaN(Number(trimmed))) return Number(trimmed);
  return trimmed;
}

function walkNode(node) {
  const result = {};

  if (node.nodeType === Node.TEXT_NODE) {
    return normalizeValue(node.textContent);
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  for (const attr of Array.from(node.attributes || [])) {
    result[\`@\${attr.name}\`] = normalizeValue(attr.value);
  }

  const children = Array.from(node.children || []);
  if (!children.length) {
    const text = normalizeValue(node.textContent);
    if (Object.keys(result).length === 0) {
      return text;
    }
    if (text !== '') {
      result['#text'] = text;
    }
    return result;
  }

  for (const child of children) {
    const value = walkNode(child);
    if (value === null || value === undefined) continue;
    const key = child.tagName;
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const current = result[key];
      result[key] = Array.isArray(current) ? [...current, value] : [current, value];
    } else {
      result[key] = value;
    }
  }

  return result;
}

export function xmlToJson(xmlString = '') {
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(xmlString), 'application/xml');
  const error = doc.querySelector('parsererror');
  if (error) {
    throw new Error('Invalid XML: ' + error.textContent.replace(/\s+/g, ' ').trim());
  }

  const root = doc.documentElement;
  if (!root) {
    return {};
  }

  return { [root.tagName]: walkNode(root) };
}

export function prettyXmlJson(xmlString = '') {
  return JSON.stringify(xmlToJson(xmlString), null, 2);
}
`;
}

function buildWebStyles() {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
  font-family: 'Inter', system-ui, sans-serif;
  background: #020617;
}

* { box-sizing: border-box; }
html, body, #app { margin: 0; min-height: 100%; }
body {
  background:
    radial-gradient(circle at top, rgba(37, 99, 235, 0.45) 0%, rgba(2, 6, 23, 0) 40%),
    linear-gradient(180deg, #020617 0%, #0f172a 100%);
  color: #e2e8f0;
}
.shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}
.card {
  width: min(840px, 100%);
  border-radius: 28px;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 24px 72px rgba(2, 6, 23, 0.45);
  backdrop-filter: blur(14px);
}
.eyebrow {
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #93c5fd;
  font-size: 0.78rem;
}
.hero-title {
  margin: 0 0 12px;
  font-size: clamp(2.4rem, 6vw, 4rem);
  line-height: 1.02;
}
.lead {
  margin: 0;
  line-height: 1.8;
  color: #cbd5e1;
}
.panel {
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.65);
}
.code {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.82rem;
}
`;
}

function buildMaterialIconLink() {
  return `  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />\n`;
}

function buildVitePackageJson({ name, framework, dependencies, devDependencies }) {
  return JSON.stringify(
    {
      name,
      private: true,
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview"
      },
      dependencies,
      devDependencies
    },
    null,
    2
  ) + "\n";
}

function buildViteConfig({ framework, outDir = "../app/src/main/assets/www" }) {
  if (framework === "react") {
    return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: '${outDir}',
    emptyOutDir: true,
  },
});
`;
  }

  if (framework === "vue") {
    return `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    outDir: '${outDir}',
    emptyOutDir: true,
  },
});
`;
  }

  if (framework === "preact") {
    return `import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  base: './',
  plugins: [preact()],
  build: {
    outDir: '${outDir}',
    emptyOutDir: true,
  },
});
`;
  }

  return `import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  base: './',
  plugins: [angular()],
  build: {
    outDir: '${outDir}',
    emptyOutDir: true,
  },
});
`;
}

function buildWebActivity({ homeUrl, allowCleartextTraffic = true }) {
  return `package __PACKAGE__;

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
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ProgressBar progressBar;
    private SwipeRefreshLayout swipeRefreshLayout;
    private WebViewAssetLoader assetLoader;

    private static final String HOME_URL = "${homeUrl}";

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
            public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                if (scheme != null && (scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
                    return false;
                }

                try {
                    startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW, uri));
                    return true;
                } catch (Exception ignored) {
                    return false;
                }
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
`;
}

function baseCommonFiles({
  dependencies,
  layoutXml,
  activitySource,
  sourcePath = "app/src/main/java/__PACKAGE_PATH__/MainActivity.java",
  extraAndroidBlock = "",
  extraFiles = {},
  readme,
  themeName = "Theme.JAPKGEN",
  appPlugins = [],
  appDependencies = [],
  allowCleartextTraffic = true,
  rootBuildGradle = null,
  appBuildGradle = null,
  rootIncludeCompose = false,
  buildFeaturesBlock = "",
  composeBlock = ""
}) {
  const allDependencies = uniq([...dependencies, ...appDependencies]);

  return {
    "settings.gradle": buildSettingsGradle(),
    "build.gradle": rootBuildGradle || buildRootBuildGradle({ includeCompose: rootIncludeCompose }),
    "gradle.properties": buildGradleProperties(),
    "app/build.gradle": appBuildGradle || buildAppGradle({
      dependencies: allDependencies,
      appPlugins,
      extraAndroidBlock,
      buildFeaturesBlock,
      composeBlock,
      allowCleartextTraffic
    }),
    "app/src/main/AndroidManifest.xml": buildAndroidManifest({ themeName, allowCleartextTraffic }),
    "app/src/main/res/values/strings.xml": buildStringsXml(),
    "app/src/main/res/values/themes.xml": buildThemeXml(themeName),
    "app/src/main/res/layout/activity_main.xml": layoutXml,
    [sourcePath]: activitySource,
    "README.md": readme,
    ...extraFiles
  };
}


function webTemplate({
  title,
  framework,
  appName = "__APP_NAME__",
  summary,
  notes,
  dependencies,
  packageJson,
  extraSourceFiles,
  mainSource,
  appPlugins = []
}) {
  const commonDeps = [ANDROIDX.appcompat, ANDROIDX.core, ANDROIDX.swipeRefresh, ANDROIDX.webkit];
  const readme = frameworkReadme({
    appName,
    frameworkName: title,
    summary,
    setupSteps: [
      "Install the frontend dependencies inside the `frontend/` directory.",
      "Run `npm run build` from `frontend/` to emit the Vite bundle into `app/src/main/assets/www`.",
      "Open the Android project in Android Studio or build it with `japkgen build`.",
    ],
    notes
  });

  return {
    dependencies: commonDeps,
    files: baseCommonFiles({
      dependencies: commonDeps,
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
      activitySource: buildWebActivity({ homeUrl: "https://appassets.androidplatform.net/assets/www/index.html" }),
      extraFiles: {
        "app/src/main/assets/www/index.html": buildAssetShell({
          title: `${appName} • ${title}`,
          appName,
          subtitle: summary
        }),
        "frontend/package.json": packageJson,
        "frontend/vite.config.js": buildViteConfig({ framework }),
        "frontend/tailwind.config.cjs": buildTailwindConfig(),
        "frontend/postcss.config.cjs": buildPostcssConfig(),
        "frontend/src/xml2json.js": buildXml2JsonHelper(),
        "frontend/src/styles.css": buildWebStyles(),
        "frontend/index.html": `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#0f172a" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
${buildMaterialIconLink()}  <title>${appName}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.${framework === "vue" ? "js" : framework === "angular" ? "ts" : "jsx"}"></script>
</body>
</html>
`,
        ...extraSourceFiles
      },
      readme,
      appPlugins,
      appBuildGradle: null,
      rootBuildGradle: buildRootBuildGradle(),
      allowCleartextTraffic: true
    })
  };
}

function reactTemplate() {
  const packageJson = buildVitePackageJson({
    name: "__PACKAGE_PATH__-react",
    framework: "react",
    dependencies: {
      react: "^19.0.0",
      "react-dom": "^19.0.0",
      "@mui/material": "^6.1.9",
      "@mui/icons-material": "^6.1.9",
      "@emotion/react": "^11.14.0",
      "@emotion/styled": "^11.14.0"
    },
    devDependencies: {
      vite: "^6.0.0",
      "@vitejs/plugin-react": "^4.3.0",
      tailwindcss: "^3.4.14",
      postcss: "^8.4.49",
      autoprefixer: "^10.4.20"
    }
  });

  return webTemplate({
    title: "React",
    framework: "react",
    summary: "A React starter packaged with Tailwind CSS, Material UI, XML-to-JSON previewing, and an Android WebView shell.",
    notes: `- Tailwind CSS ships with PostCSS and a ready-to-use config
- Google Fonts and Material Symbols are wired into the starter HTML
- Material UI is included for the React starter
- XML2JSON helper is included for quick data inspection in the web APK`,
    packageJson,
    extraSourceFiles: {
      "frontend/src/main.jsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
      "frontend/src/App.jsx": `import { useMemo } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { prettyXmlJson } from './xml2json';

const sampleXml = ` + "`" + `<profile id="7" enabled="true">
  <name>__APP_NAME__</name>
  <role>Web APK</role>
  <tags>
    <tag>Tailwind</tag>
    <tag>Material UI</tag>
  </tags>
</profile>` + "`" + `;

export default function App() {
  const jsonPreview = useMemo(() => prettyXmlJson(sampleXml), []);

  return (
    <main className="shell">
      <Card className="card">
        <CardContent>
          <Stack spacing={3}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip label="React + Vite" color="primary" />
              <Chip label="Tailwind CSS" variant="outlined" />
              <Chip label="XML2JSON" variant="outlined" />
            </Stack>

            <Box>
              <Typography variant="overline" className="eyebrow">
                Web APK starter
              </Typography>
              <Typography variant="h2" component="h1" className="hero-title">
                __APP_NAME__
              </Typography>
              <Typography variant="body1" className="lead">
                A polished hybrid starter with Material UI components, Material Symbols, and a
                built-in XML-to-JSON preview.
              </Typography>
            </Box>

            <Alert icon={<AutoAwesomeIcon fontSize="inherit" />} severity="info">
              Build the frontend, then ship it through the Android WebView shell.
            </Alert>

            <Stack direction="row" spacing={1} alignItems="center">
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
                stars
              </span>
              <Typography variant="body2">
                Material Symbols are loaded from Google Fonts.
              </Typography>
            </Stack>

            <Button variant="contained">Open app preview</Button>

            <section className="panel p-4">
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                XML → JSON preview
              </Typography>
              <pre className="code">{jsonPreview}</pre>
            </section>
          </Stack>
        </CardContent>
      </Card>
    </main>
  );
}
`,
      "frontend/src/styles.css": buildWebStyles()
    }
  });
}

function vueTemplate() {
  const packageJson = buildVitePackageJson({
    name: "__PACKAGE_PATH__-vue",
    framework: "vue",
    dependencies: {
      vue: "^3.5.0"
    },
    devDependencies: {
      vite: "^6.0.0",
      "@vitejs/plugin-vue": "^5.0.0"
    }
  });

  return webTemplate({
    title: "Vue",
    framework: "vue",
    summary: "A Vue starter with Vite-powered asset output and a secure Android WebView container.",
    notes: `- Single-file components are included for a familiar Vue workflow
- The Android shell reads the generated production bundle from app assets
- Google Fonts CDN is configured in the starter HTML`,
    packageJson,
    extraSourceFiles: {
      "frontend/src/main.js": `import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';

createApp(App).mount('#app');
`,
      "frontend/src/App.vue": `<template>
  <main class="shell">
    <section class="card">
      <p class="eyebrow">Vue + Vite</p>
      <h1>__APP_NAME__</h1>
      <p>
        A polished starter for hybrid mobile delivery with a deliberately small and readable
        frontend surface.
      </p>
    </section>
  </main>
</template>

<style src="./styles.css"></style>
`,
      "frontend/src/styles.css": `:root {
  color-scheme: dark;
  font-family: 'Inter', system-ui, sans-serif;
  background: #020617;
}
* { box-sizing: border-box; }
html, body, #app { margin: 0; min-height: 100%; }
body {
  background: radial-gradient(circle at top, #1d4ed8 0%, #020617 58%);
  color: #e2e8f0;
}
.shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}
.card {
  width: min(640px, 100%);
  padding: 32px;
  border-radius: 28px;
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 24px 72px rgba(2, 6, 23, 0.45);
}
.eyebrow {
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #93c5fd;
  font-size: 0.78rem;
}
h1 {
  margin: 0 0 12px;
  font-size: clamp(2.4rem, 6vw, 4rem);
}
p { margin: 0; line-height: 1.7; color: #cbd5e1; }
`
    }
  });
}

function preactTemplate() {
  const packageJson = buildVitePackageJson({
    name: "__PACKAGE_PATH__-preact",
    framework: "preact",
    dependencies: {
      preact: "^10.25.0"
    },
    devDependencies: {
      vite: "^6.0.0",
      "@preact/preset-vite": "^2.9.0"
    }
  });

  return webTemplate({
    title: "Preact",
    framework: "preact",
    summary: "A lightweight Preact starter that keeps the Vite workflow simple and fast.",
    notes: `- Small bundle surface for performance-sensitive mobile shells
- Uses the same Vite output path as the other frontend templates
- Google Fonts CDN is included in the HTML entry file`,
    packageJson,
    extraSourceFiles: {
      "frontend/src/main.jsx": `import { render } from 'preact';
import App from './App.jsx';
import './styles.css';

render(<App />, document.getElementById('app'));
`,
      "frontend/src/App.jsx": `export default function App() {
  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Preact + Vite</p>
        <h1>__APP_NAME__</h1>
        <p>
          A compact starter focused on speed, clean structure, and predictable Android asset
          delivery.
        </p>
      </section>
    </main>
  );
}
`,
      "frontend/src/styles.css": `:root {
  color-scheme: dark;
  font-family: 'Inter', system-ui, sans-serif;
  background: #020617;
}
* { box-sizing: border-box; }
html, body, #app { margin: 0; min-height: 100%; }
body {
  background: radial-gradient(circle at top, #1d4ed8 0%, #020617 58%);
  color: #e2e8f0;
}
.shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}
.card {
  width: min(640px, 100%);
  padding: 32px;
  border-radius: 28px;
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 24px 72px rgba(2, 6, 23, 0.45);
}
.eyebrow {
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #93c5fd;
  font-size: 0.78rem;
}
h1 {
  margin: 0 0 12px;
  font-size: clamp(2.4rem, 6vw, 4rem);
}
p { margin: 0; line-height: 1.7; color: #cbd5e1; }
`
    }
  });
}

function angularTemplate() {
  const packageJson = JSON.stringify(
    {
      name: "__PACKAGE_PATH__-angular",
      private: true,
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview"
      },
      dependencies: {
        "@angular/core": "^20.0.0",
        "@angular/common": "^20.0.0",
        "@angular/platform-browser": "^20.0.0",
        "rxjs": "^7.8.0",
        "zone.js": "^0.14.0"
      },
      devDependencies: {
        vite: "^6.0.0",
        typescript: "^5.8.0",
        "@analogjs/vite-plugin-angular": "^2.0.0"
      }
    },
    null,
    2
  ) + "\n";

  return webTemplate({
    title: "Angular",
    framework: "angular",
    summary: "A streamlined Angular starter with Vite as the bundler and Android as the delivery shell.",
    notes: `- Uses standalone Angular bootstrap files
- The Vite output directory is wired directly into Android assets
- Google Fonts CDN is included in the entry HTML`,
    packageJson,
    extraSourceFiles: {
      "frontend/src/main.ts": `import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent).catch((error) => console.error(error));
`,
      "frontend/src/app/app.component.ts": `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {}
`,
      "frontend/src/app/app.component.html": `<main class="shell">
  <section class="card">
    <p class="eyebrow">Angular + Vite</p>
    <h1>__APP_NAME__</h1>
    <p>
      A concise starter for teams that want Angular structure while keeping the Android asset
      pipeline easy to understand.
    </p>
  </section>
</main>
`,
      "frontend/src/app/app.component.css": `:host {
  display: block;
  min-height: 100vh;
}
:host, :host * {
  box-sizing: border-box;
}
.shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  font-family: 'Inter', system-ui, sans-serif;
  color: #e2e8f0;
  background: radial-gradient(circle at top, #1d4ed8 0%, #020617 58%);
}
.card {
  width: min(640px, 100%);
  padding: 32px;
  border-radius: 28px;
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 24px 72px rgba(2, 6, 23, 0.45);
}
.eyebrow {
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #93c5fd;
  font-size: 0.78rem;
}
h1 {
  margin: 0 0 12px;
  font-size: clamp(2.4rem, 6vw, 4rem);
}
p { margin: 0; line-height: 1.7; color: #cbd5e1; }
`,
      "frontend/src/index.html": `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#0f172a" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <title>__APP_NAME__</title>
</head>
<body>
  <app-root></app-root>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
`,
      "frontend/tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "ESNext",
            moduleResolution: "Bundler",
            strict: true,
            lib: ["ES2022", "DOM"],
            skipLibCheck: true,
            noEmit: true,
            baseUrl: ".",
            paths: {}
          },
          include: ["src/**/*.ts"],
          angularCompilerOptions: {
            strictTemplates: true
          }
        },
        null,
        2
      ) + "\n",
      "frontend/vite.config.ts": buildViteConfig({ framework: "angular" })
    }
  });
}

function nativeTemplate() {
  const dependencies = [ANDROIDX.appcompat, ANDROIDX.core];
  const readme = makeReadme({
    appName: "__APP_NAME__",
    templateTitle: "Native",
    templateSummary: "A minimal Android application scaffold for standard native UI development.",
    templateNotes: `- Clean starter template
- Straightforward screen hierarchy
- Lightweight dependency surface`
  });

  return {
    dependencies,
    files: baseCommonFiles({
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
      activitySource: `package __PACKAGE__;

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
      readme,
      allowCleartextTraffic: false
    })
  };
}

function kotlinTemplate() {
  const dependencies = [ANDROIDX.appcompat, ANDROIDX.coreKtx];
  const readme = makeReadme({
    appName: "__APP_NAME__",
    templateTitle: "Kotlin",
    templateSummary: "A modern Android starter template written in Kotlin with a concise AppCompat activity.",
    templateNotes: `- Kotlin source file included
- Uses the AndroidX Kotlin extensions package
- Suitable as a compact app starting point`
  });

  return {
    dependencies,
    files: baseCommonFiles({
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
      activitySource: `package __PACKAGE__

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }
}
`,
      sourcePath: "app/src/main/kotlin/__PACKAGE_PATH__/MainActivity.kt",
      appPlugins: ["id 'org.jetbrains.kotlin.android'"],
      appDependencies: ["org.jetbrains.kotlin:kotlin-stdlib:__KOTLIN_VERSION__"],
      readme,
      allowCleartextTraffic: false,
      rootBuildGradle: buildRootBuildGradle({ includeCompose: false })
    })
  };
}

function composeTemplate() {
  const dependencies = [
    ANDROIDX.activityCompose,
    ANDROIDX.appcompat,
    ANDROIDX.coreKtx
  ];

  const readme = makeReadme({
    appName: "__APP_NAME__",
    templateTitle: "Jetpack Compose",
    templateSummary: "A Jetpack Compose starter for modern Android UI development with a minimal Kotlin entry point.",
    templateNotes: `- Compose is enabled in the Gradle build
- Material 3 is included for a modern default surface
- The project keeps the Android shell intentionally small`
  });

  const appBuildGradle = `import java.util.Properties
import java.io.FileInputStream

plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
    id 'org.jetbrains.kotlin.plugin.compose'
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

    buildFeatures {
        compose true
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
    implementation platform('androidx.compose:compose-bom:${COMPOSE.bom}')
    implementation 'androidx.activity:activity-compose:1.9.2'
    implementation 'androidx.compose.ui:ui'
    implementation 'androidx.compose.ui:ui-tooling-preview'
    implementation 'androidx.compose.material3:material3'
    implementation 'androidx.compose.foundation:foundation'
    debugImplementation 'androidx.compose.ui:ui-tooling'
}
`;

  return {
    dependencies,
    files: baseCommonFiles({
      dependencies,
      layoutXml: `<androidx.compose.ui.platform.ComposeView xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/composeView"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />
`,
      activitySource: `package __PACKAGE__

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
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ComposeApp()
        }
    }
}

@Composable
private fun ComposeApp() {
    MaterialTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.Center
            ) {
                Text(text = "__APP_NAME__", style = MaterialTheme.typography.headlineLarge)
                Text(text = "Jetpack Compose starter template")
            }
        }
    }
}
`,
      sourcePath: "app/src/main/kotlin/__PACKAGE_PATH__/MainActivity.kt",
      readme,
      allowCleartextTraffic: false,
      rootBuildGradle: buildRootBuildGradle({ includeCompose: true }),
      appBuildGradle,
      extraFiles: {
        "app/src/main/res/values/themes.xml": buildComposeThemeXml()
      }
    })
  };
}

function gameJavaTemplate() {
  const dependencies = [ANDROIDX.appcompat, ANDROIDX.core];
  const readme = makeReadme({
    appName: "__APP_NAME__",
    templateTitle: "Game (Java)",
    templateSummary: "A SurfaceView-based Java game starter with a lightweight update and render loop.",
    templateNotes: `- Self-contained game loop
- Keeps the screen awake while running
- Suitable for quick gameplay prototypes`
  });

  return {
    dependencies,
    files: baseCommonFiles({
      dependencies,
      layoutXml: `<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <__PACKAGE__.GameView
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</FrameLayout>
`,
      activitySource: `package __PACKAGE__;

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
`
      },
      readme,
      allowCleartextTraffic: false
    })
  };
}

function gameCppTemplate() {
  const dependencies = [ANDROIDX.appcompat, ANDROIDX.core];

  const readme = makeReadme({
    appName: "__APP_NAME__",
    templateTitle: "Game (C/C++)",
    templateSummary:
      "A native C/C++ game starter with a safe JNI bridge, fixed-step update loop, and CMake integration.",
    templateNotes: `- C++17 baseline with guarded JNI entry points
- Fixed-timestep game loop for stable updates
- ASCII renderer included for quick validation
- Clean structure for future OpenGL ES or SDL integration`
  });

  return {
    dependencies,
    files: baseCommonFiles({
      dependencies,
      extraAndroidBlock: `    externalNativeBuild {
        cmake {
            path "src/main/cpp/CMakeLists.txt"
        }
    }`,
      layoutXml: `<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:fillViewport="true"
    android:padding="16dp">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical">

        <TextView
            android:id="@+id/title"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:fontFamily="monospace"
            android:text="Loading..."
            android:textSize="14sp"
            android:textIsSelectable="true" />

        <TextView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="12dp"
            android:text="Controls: DPAD / Arrow Keys. This template renders a native ASCII game loop."
            android:textSize="14sp" />
    </LinearLayout>
</ScrollView>
`,
      activitySource: `package __PACKAGE__;

import android.os.Bundle;
import android.os.SystemClock;
import android.view.KeyEvent;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private static final int DIR_UP = 0;
    private static final int DIR_DOWN = 1;
    private static final int DIR_LEFT = 2;
    private static final int DIR_RIGHT = 3;

    static {
        System.loadLibrary("native-lib");
    }

    private TextView titleView;
    private boolean running = false;
    private long lastFrameMs = 0L;

    private final Runnable frameTicker = new Runnable() {
        @Override
        public void run() {
            if (!running) {
                return;
            }

            long now = SystemClock.uptimeMillis();
            float deltaSeconds = lastFrameMs == 0L ? 0.0f : (now - lastFrameMs) / 1000.0f;
            lastFrameMs = now;

            nativeUpdate(deltaSeconds);
            if (titleView != null) {
                titleView.setText(nativeRender());
            }

            if (nativeIsGameOver()) {
                running = false;
                return;
            }

            titleView.postDelayed(this, 16L);
        }
    };

    private native void nativeInit(int width, int height, int seed);
    private native void nativeReset();
    private native void nativeSetDirection(int direction);
    private native void nativeUpdate(float deltaSeconds);
    private native String nativeRender();
    private native boolean nativeIsGameOver();
    private native int nativeGetScore();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        titleView = findViewById(R.id.title);

        nativeInit(24, 18, (int) SystemClock.uptimeMillis());
        titleView.setText(nativeRender());
    }

    @Override
    protected void onResume() {
        super.onResume();
        startLoop();
    }

    @Override
    protected void onPause() {
        stopLoop();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        stopLoop();
        nativeReset();
        super.onDestroy();
    }

    private void startLoop() {
        if (running) {
            return;
        }
        running = true;
        lastFrameMs = 0L;
        titleView.removeCallbacks(frameTicker);
        titleView.post(frameTicker);
    }

    private void stopLoop() {
        running = false;
        if (titleView != null) {
            titleView.removeCallbacks(frameTicker);
        }
    }

    private void restartGame() {
        nativeReset();
        if (titleView != null) {
            titleView.setText(nativeRender());
        }
        startLoop();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        switch (keyCode) {
            case KeyEvent.KEYCODE_DPAD_UP:
            case KeyEvent.KEYCODE_W:
                nativeSetDirection(DIR_UP);
                return true;

            case KeyEvent.KEYCODE_DPAD_DOWN:
            case KeyEvent.KEYCODE_S:
                nativeSetDirection(DIR_DOWN);
                return true;

            case KeyEvent.KEYCODE_DPAD_LEFT:
            case KeyEvent.KEYCODE_A:
                nativeSetDirection(DIR_LEFT);
                return true;

            case KeyEvent.KEYCODE_DPAD_RIGHT:
            case KeyEvent.KEYCODE_D:
                nativeSetDirection(DIR_RIGHT);
                return true;

            case KeyEvent.KEYCODE_ENTER:
            case KeyEvent.KEYCODE_SPACE:
                if (nativeIsGameOver()) {
                    restartGame();
                    return true;
                }
                return super.onKeyDown(keyCode, event);

            default:
                return super.onKeyDown(keyCode, event);
        }
    }
}
`,
      extraFiles: {
        "app/src/main/cpp/CMakeLists.txt": `cmake_minimum_required(VERSION __CMAKE_VERSION__)

project("japkgen_game" LANGUAGES CXX)

add_library(native-lib SHARED
        native-lib.cpp)

target_compile_features(native-lib PRIVATE cxx_std_17)

target_compile_options(native-lib PRIVATE
        -Wall
        -Wextra
        -Wpedantic)

find_library(log_lib log)

target_link_libraries(native-lib
        \${log_lib})
`,
        "app/src/main/cpp/native-lib.cpp": `#include <jni.h>

#include <algorithm>
#include <cstdint>
#include <deque>
#include <memory>
#include <mutex>
#include <random>
#include <string>
#include <vector>

#ifdef __ANDROID__
#include <android/log.h>
#define LOG_TAG "JAPKGEN_GAME"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)
#else
#define LOGE(...)
#endif

namespace nativegame {

enum class Direction : std::uint8_t {
    Up = 0,
    Down = 1,
    Left = 2,
    Right = 3
};

struct Point {
    int x = 0;
    int y = 0;

    friend bool operator==(const Point& a, const Point& b) noexcept {
        return a.x == b.x && a.y == b.y;
    }
};

class SnakeGame final {
public:
    SnakeGame(int width, int height, std::uint32_t seed)
        : width_(clampSize(width)),
          height_(clampSize(height)),
          rng_(seed ? seed : std::random_device{}()) {
        reset();
    }

    void reset() {
        std::lock_guard<std::mutex> lock(mutex_);
        gameOver_ = false;
        score_ = 0;
        direction_ = Direction::Right;
        nextDirection_ = Direction::Right;
        accumulator_ = 0.0f;
        snake_.clear();

        const int cx = width_ / 2;
        const int cy = height_ / 2;

        snake_.push_back({cx - 1, cy});
        snake_.push_back({cx, cy});
        snake_.push_back({cx + 1, cy});

        spawnFoodLocked();
    }

    bool setDirection(Direction dir) {
        std::lock_guard<std::mutex> lock(mutex_);
        if (gameOver_) {
            return false;
        }

        if (isReverse(direction_, dir)) {
            return false;
        }

        nextDirection_ = dir;
        return true;
    }

    void update(float deltaSeconds) {
        if (deltaSeconds <= 0.0f) {
            return;
        }

        std::lock_guard<std::mutex> lock(mutex_);
        if (gameOver_) {
            return;
        }

        accumulator_ += deltaSeconds;

        constexpr float stepTime = 0.14f;
        constexpr int maxStepsPerFrame = 4;

        int steps = 0;
        while (accumulator_ >= stepTime && steps < maxStepsPerFrame) {
            accumulator_ -= stepTime;
            stepLocked();
            ++steps;

            if (gameOver_) {
                break;
            }
        }
    }

    bool isGameOver() const {
        std::lock_guard<std::mutex> lock(mutex_);
        return gameOver_;
    }

    int score() const {
        std::lock_guard<std::mutex> lock(mutex_);
        return score_;
    }

    std::string renderText() const {
        std::lock_guard<std::mutex> lock(mutex_);

        std::string out;
        out.reserve(static_cast<std::size_t>((width_ + 2) * (height_ + 4)));

        out += "SCORE: ";
        out += std::to_string(score_);
        if (gameOver_) {
            out += "   GAME OVER";
        }
        out += "\\n";

        out += '+';
        for (int x = 0; x < width_; ++x) {
            out += '-';
        }
        out += "+\\n";

        for (int y = 0; y < height_; ++y) {
            out += '|';
            for (int x = 0; x < width_; ++x) {
                const Point p{x, y};

                if (p == food_) {
                    out += '*';
                } else if (p == snake_.front()) {
                    out += '@';
                } else if (containsSnakeLocked(p)) {
                    out += 'o';
                } else {
                    out += ' ';
                }
            }
            out += "|\\n";
        }

        out += '+';
        for (int x = 0; x < width_; ++x) {
            out += '-';
        }
        out += "+\\n";
        out += "Use DPAD / Arrow Keys. Press Enter or Space to restart after game over.\\n";

        return out;
    }

private:
    static int clampSize(int v) noexcept {
        if (v < 8) return 8;
        if (v > 64) return 64;
        return v;
    }

    static bool isReverse(Direction a, Direction b) noexcept {
        return (a == Direction::Up && b == Direction::Down) ||
               (a == Direction::Down && b == Direction::Up) ||
               (a == Direction::Left && b == Direction::Right) ||
               (a == Direction::Right && b == Direction::Left);
    }

    Point nextHeadLocked() const noexcept {
        Point head = snake_.front();
        switch (nextDirection_) {
            case Direction::Up:    --head.y; break;
            case Direction::Down:  ++head.y; break;
            case Direction::Left:  --head.x; break;
            case Direction::Right: ++head.x; break;
        }
        return head;
    }

    bool inBounds(const Point& p) const noexcept {
        return p.x >= 0 && p.y >= 0 && p.x < width_ && p.y < height_;
    }

    bool containsSnakeLocked(const Point& p) const noexcept {
        for (const auto& part : snake_) {
            if (part == p) {
                return true;
            }
        }
        return false;
    }

    void spawnFoodLocked() {
        std::vector<Point> empty;
        empty.reserve(static_cast<std::size_t>(width_ * height_));

        for (int y = 0; y < height_; ++y) {
            for (int x = 0; x < width_; ++x) {
                Point p{x, y};
                if (!containsSnakeLocked(p)) {
                    empty.push_back(p);
                }
            }
        }

        if (empty.empty()) {
            gameOver_ = true;
            return;
        }

        std::uniform_int_distribution<std::size_t> dist(0, empty.size() - 1);
        food_ = empty[dist(rng_)];
    }

    void stepLocked() {
        direction_ = nextDirection_;

        const Point newHead = nextHeadLocked();

        if (!inBounds(newHead)) {
            gameOver_ = true;
            return;
        }

        const bool willGrow = (newHead == food_);
        const Point tail = snake_.back();

        for (std::size_t i = 0; i < snake_.size(); ++i) {
            if (snake_[i] == newHead) {
                if (!willGrow && i == snake_.size() - 1 && snake_[i] == tail) {
                    continue;
                }
                gameOver_ = true;
                return;
            }
        }

        snake_.push_front(newHead);

        if (willGrow) {
            ++score_;
            spawnFoodLocked();
        } else {
            snake_.pop_back();
        }
    }

private:
    int width_ = 24;
    int height_ = 18;

    mutable std::mutex mutex_;
    std::deque<Point> snake_;
    Point food_{};

    Direction direction_ = Direction::Right;
    Direction nextDirection_ = Direction::Right;

    bool gameOver_ = false;
    int score_ = 0;
    float accumulator_ = 0.0f;

    std::mt19937 rng_;
};

} // namespace nativegame

namespace {
std::mutex g_mutex;
std::unique_ptr<nativegame::SnakeGame> g_game;

nativegame::Direction fromInt(int value) {
    switch (value) {
        case 0: return nativegame::Direction::Up;
        case 1: return nativegame::Direction::Down;
        case 2: return nativegame::Direction::Left;
        case 3: return nativegame::Direction::Right;
        default: return nativegame::Direction::Right;
    }
}

} // namespace

extern "C" JNIEXPORT void JNICALL
Java___PACKAGE_JNI___MainActivity_nativeInit(JNIEnv*, jobject, jint width, jint height, jint seed) {
    try {
        std::lock_guard<std::mutex> lock(g_mutex);
        g_game = std::make_unique<nativegame::SnakeGame>(
            static_cast<int>(width),
            static_cast<int>(height),
            static_cast<std::uint32_t>(seed)
        );
    } catch (...) {
        LOGE("nativeInit failed");
    }
}

extern "C" JNIEXPORT void JNICALL
Java___PACKAGE_JNI___MainActivity_nativeReset(JNIEnv*, jobject) {
    try {
        std::lock_guard<std::mutex> lock(g_mutex);
        if (g_game) {
            g_game->reset();
        }
    } catch (...) {
        LOGE("nativeReset failed");
    }
}

extern "C" JNIEXPORT void JNICALL
Java___PACKAGE_JNI___MainActivity_nativeSetDirection(JNIEnv*, jobject, jint direction) {
    try {
        std::lock_guard<std::mutex> lock(g_mutex);
        if (g_game) {
            g_game->setDirection(fromInt(direction));
        }
    } catch (...) {
        LOGE("nativeSetDirection failed");
    }
}

extern "C" JNIEXPORT void JNICALL
Java___PACKAGE_JNI___MainActivity_nativeUpdate(JNIEnv*, jobject, jfloat deltaSeconds) {
    try {
        std::lock_guard<std::mutex> lock(g_mutex);
        if (g_game) {
            g_game->update(static_cast<float>(deltaSeconds));
        }
    } catch (...) {
        LOGE("nativeUpdate failed");
    }
}

extern "C" JNIEXPORT jstring JNICALL
Java___PACKAGE_JNI___MainActivity_nativeRender(JNIEnv* env, jobject) {
    try {
        std::lock_guard<std::mutex> lock(g_mutex);
        if (!g_game) {
            return env->NewStringUTF("Game not initialized.\\n");
        }

        const std::string frame = g_game->renderText();
        return env->NewStringUTF(frame.c_str());
    } catch (...) {
        LOGE("nativeRender failed");
        return env->NewStringUTF("Render error.\\n");
    }
}

extern "C" JNIEXPORT jboolean JNICALL
Java___PACKAGE_JNI___MainActivity_nativeIsGameOver(JNIEnv*, jobject) {
    try {
        std::lock_guard<std::mutex> lock(g_mutex);
        return (g_game && g_game->isGameOver()) ? JNI_TRUE : JNI_FALSE;
    } catch (...) {
        LOGE("nativeIsGameOver failed");
        return JNI_TRUE;
    }
}

extern "C" JNIEXPORT jint JNICALL
Java___PACKAGE_JNI___MainActivity_nativeGetScore(JNIEnv*, jobject) {
    try {
        std::lock_guard<std::mutex> lock(g_mutex);
        return g_game ? g_game->score() : 0;
    } catch (...) {
        LOGE("nativeGetScore failed");
        return 0;
    }
}
`
      },
      readme,
      allowCleartextTraffic: false
    })
  };
}


function nativeCCommonReadme(title, summary, notes) {
  return makeReadme({
    appName: "__APP_NAME__",
    templateTitle: title,
    templateSummary: summary,
    templateNotes: notes,
    setupNotes: [
      "The Android shell loads a small native library through JNI.",
      "CMake and Make scaffolding are included for local experimentation.",
      "The starter is intentionally small so you can swap in your own native code fast."
    ]
  });
}

function nativeCActivity(bodyLabel = "Hello from native C!") {
  return `package __PACKAGE__;

import android.os.Bundle;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    static {
        System.loadLibrary("native-lib");
    }

    private native String nativeBanner();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        TextView textView = new TextView(this);
        textView.setPadding(48, 48, 48, 48);
        textView.setTextSize(18f);
        textView.setText(nativeBanner());
        setContentView(textView);
    }

    @Override
    protected void onResume() {
        super.onResume();
    }
}
`;
}

function cTemplate() {
  const dependencies = [ANDROIDX.appcompat, ANDROIDX.core];
  const readme = nativeCCommonReadme(
    "C",
    "A compact Android starter that demonstrates a C JNI bridge with both CMake and Make scaffolding.",
    `- Native code lives in app/src/main/cpp
- Includes a CMakeLists.txt file for Android Studio
- Includes a Makefile for local experiments and quick references`
  );

  return {
    dependencies,
    files: baseCommonFiles({
      dependencies,
      layoutXml: `<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:padding="24dp">

    <TextView
        android:id="@+id/message"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:gravity="center"
        android:text="Loading native C..."
        android:textSize="20sp" />
</FrameLayout>
`,
      activitySource: `package __PACKAGE__;

import android.os.Bundle;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    static {
        System.loadLibrary("native-lib");
    }

    private native String nativeBanner();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        TextView view = new TextView(this);
        view.setPadding(48, 48, 48, 48);
        view.setTextSize(18f);
        view.setText(nativeBanner());
        setContentView(view);
    }
}
`,
      extraAndroidBlock: `    externalNativeBuild {
        cmake {
            path "src/main/cpp/CMakeLists.txt"
        }
    }`,
      extraFiles: {
        "app/src/main/cpp/CMakeLists.txt": `cmake_minimum_required(VERSION 3.22)

project(japkgen_native_c LANGUAGES C)

add_library(native-lib SHARED native-lib.c)

find_library(log-lib log)

target_link_libraries(native-lib \${log-lib})
`,
        "app/src/main/cpp/native-lib.c": `#include <jni.h>

#ifdef __ANDROID__
#include <android/log.h>
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, "JAPKGEN_C", __VA_ARGS__)
#else
#define LOGE(...)
#endif

JNIEXPORT jstring JNICALL
Java___PACKAGE_JNI___MainActivity_nativeBanner(JNIEnv *env, jobject thiz) {
    (void)thiz;
    const char *message = "Hello from native C!\n\nCMake and Make files are ready.\n";
    return (*env)->NewStringUTF(env, message);
}
`,
        "Makefile": `APP_NAME ?= japkgen-native-c
BUILD_DIR ?= build
CC ?= cc
CFLAGS ?= -O2 -Wall -Wextra -pedantic

all: help

help:
	@echo "Targets:"
	@echo "  make demo   - build a tiny host-side demo"
	@echo "  make clean  - remove build outputs"

$(BUILD_DIR):
	@mkdir -p $(BUILD_DIR)

demo: $(BUILD_DIR)
	$(CC) $(CFLAGS) -x c -o $(BUILD_DIR)/$(APP_NAME) - <<'EOF'
#include <stdio.h>
int main(void) {
    puts("Hello from the JAPKGEN C template.");
    return 0;
}
EOF
	@echo "Built $(BUILD_DIR)/$(APP_NAME)"

clean:
	rm -rf $(BUILD_DIR)

.PHONY: all help demo clean
`
      },
      readme,
      allowCleartextTraffic: false
    })
  };
}

function cppTemplate() {
  const dependencies = [ANDROIDX.appcompat, ANDROIDX.core];
  const readme = nativeCCommonReadme(
    "C++",
    "A compact Android starter that demonstrates a C++ JNI bridge with both CMake and Make scaffolding.",
    `- Native code lives in app/src/main/cpp
- Includes a CMakeLists.txt file for Android Studio
- Includes a Makefile for local experiments and quick references`
  );

  return {
    dependencies,
    files: baseCommonFiles({
      dependencies,
      layoutXml: `<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:padding="24dp">

    <TextView
        android:id="@+id/message"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:gravity="center"
        android:text="Loading native C++..."
        android:textSize="20sp" />
</FrameLayout>
`,
      activitySource: `package __PACKAGE__;

import android.os.Bundle;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    static {
        System.loadLibrary("native-lib");
    }

    private native String nativeBanner();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        TextView view = new TextView(this);
        view.setPadding(48, 48, 48, 48);
        view.setTextSize(18f);
        view.setText(nativeBanner());
        setContentView(view);
    }
}
`,
      extraAndroidBlock: `    externalNativeBuild {
        cmake {
            path "src/main/cpp/CMakeLists.txt"
        }
    }`,
      extraFiles: {
        "app/src/main/cpp/CMakeLists.txt": `cmake_minimum_required(VERSION 3.22)

project(japkgen_native_cpp LANGUAGES CXX)

add_library(native-lib SHARED native-lib.cpp)

target_compile_features(native-lib PRIVATE cxx_std_17)

find_library(log-lib log)

target_link_libraries(native-lib \${log-lib})
`,
        "app/src/main/cpp/native-lib.cpp": `#include <jni.h>

#include <string>

#ifdef __ANDROID__
#include <android/log.h>
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, "JAPKGEN_CPP", __VA_ARGS__)
#else
#define LOGE(...)
#endif

extern "C" JNIEXPORT jstring JNICALL
Java___PACKAGE_JNI___MainActivity_nativeBanner(JNIEnv *env, jobject thiz) {
    (void)thiz;
    const std::string message = "Hello from native C++!\n\nCMake and Make files are ready.\n";
    return env->NewStringUTF(message.c_str());
}
`,
        "Makefile": `APP_NAME ?= japkgen-native-cpp
BUILD_DIR ?= build
CXX ?= c++
CXXFLAGS ?= -O2 -Wall -Wextra -pedantic -std=c++17

all: help

help:
	@echo "Targets:"
	@echo "  make demo   - build a tiny host-side demo"
	@echo "  make clean  - remove build outputs"

$(BUILD_DIR):
	@mkdir -p $(BUILD_DIR)

demo: $(BUILD_DIR)
	$(CXX) $(CXXFLAGS) -x c++ -o $(BUILD_DIR)/$(APP_NAME) - <<'EOF'
#include <iostream>
int main() {
    std::cout << "Hello from the JAPKGEN C++ template.\n";
    return 0;
}
EOF
	@echo "Built $(BUILD_DIR)/$(APP_NAME)"

clean:
	rm -rf $(BUILD_DIR)

.PHONY: all help demo clean
`
      },
      readme,
      allowCleartextTraffic: false
    })
  };
}

const BUILTIN_TEMPLATES = {
  webview: () => {
    const dependencies = [ANDROIDX.appcompat, ANDROIDX.core, ANDROIDX.swipeRefresh, ANDROIDX.webkit];
    const readme = makeReadme({
      appName: "__APP_NAME__",
      templateTitle: "WebView",
      templateSummary: "A WebView-based Android application scaffold with pull-to-refresh and external link handling.",
      templateNotes: `- JavaScript support enabled
- DOM storage support enabled
- Pull-to-refresh support included
- External links open in the browser`
    });

    return {
      dependencies,
      files: baseCommonFiles({
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
        activitySource: buildWebActivity({ homeUrl: "https://example.com" }),
        readme
      })
    };
  },
  pwa: () => {
    const dependencies = [ANDROIDX.appcompat, ANDROIDX.core, ANDROIDX.swipeRefresh, ANDROIDX.webkit];
    const readme = makeReadme({
      appName: "__APP_NAME__",
      templateTitle: "PWA",
      templateSummary: "A local asset-backed Progressive Web App shell powered by AndroidX WebKit and WebViewAssetLoader.",
      templateNotes: `- Local asset shell
- Offline fallback page
- Good for hybrid web applications`
    });

    return {
      dependencies,
      files: baseCommonFiles({
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
        activitySource: `package __PACKAGE__;

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
          "app/src/main/assets/www/index.html": buildAssetShell({
            title: "__APP_NAME__ PWA",
            appName: "__APP_NAME__",
            subtitle: "This local shell is ready for offline usage and production asset hosting."
          }),
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
  },
  react: reactTemplate,
  vue: vueTemplate,
  angular: angularTemplate,
  preact: preactTemplate,
  native: nativeTemplate,
  compose: composeTemplate,
  kotlin: kotlinTemplate,
  c: cTemplate,
  cpp: cppTemplate,
  cmake: cppTemplate,
  make: cTemplate,
  "game-java": gameJavaTemplate,
  "game-cpp": gameCppTemplate
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

export { BUILTIN_TEMPLATES, baseCommonFiles, makeReadme };

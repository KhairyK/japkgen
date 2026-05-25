import path from "node:path";
import { fileExists, findFiles, readText, hasHttpUrl, readJson } from "./utils.js";
import { logger } from "./logger.js";

function check(ok, label, details = "") {
  if (ok) {
    logger.success(label);
  } else {
    logger.warn(`${label}${details ? ` — ${details}` : ""}`);
  }
  return ok;
}

async function readProjectMeta(projectDir) {
  const metaPath = path.join(projectDir, "japkgen.meta.json");
  if (!(await fileExists(metaPath))) return null;
  return readJson(metaPath, null);
}

async function hasAndroidSource(projectDir) {
  const sourceFiles = await findFiles(
    path.join(projectDir, "app", "src", "main"),
    (abs, rel) => /\.(kt|java)$/i.test(rel)
  );
  return sourceFiles.length > 0;
}

async function hasNativeFiles(projectDir) {
  const nativeFiles = await findFiles(
    projectDir,
    (abs, rel) =>
      /(^|\/)cpp\//i.test(rel) ||
      /CMakeLists\.txt$/i.test(rel) ||
      /\.(c|cc|cpp|h|hpp|mk)$/i.test(rel)
  );
  return nativeFiles.length > 0;
}


function expectedMainSource(projectDir) {
  return [
    path.join(projectDir, "app", "src", "main", "java"),
    path.join(projectDir, "app", "src", "main", "kotlin"),
    path.join(projectDir, "app", "src", "main"),
    path.join(projectDir, "src", "main", "java"),
    path.join(projectDir, "src", "main", "kotlin"),
  ];
}

async function hasWebFiles(projectDir) {
  const webFiles = await findFiles(
    projectDir,
    (abs, rel) => /\.(html|htm|js|jsx|ts|tsx|css|json|vue)$/i.test(rel)
  );
  return webFiles.length > 0;
}

export async function runProjectTests(projectDirArg = process.cwd()) {
  const projectDir = path.resolve(projectDirArg);
  const meta = await readProjectMeta(projectDir);

  const report = {
    projectDir,
    ok: true,
    checks: [],
  };

  logger.title("JAPKGEN Test");
  if (meta?.templateName) {
    logger.info(`Template: ${meta.templateName}`);
  }

  const templateKind = String(meta?.templateKind || "android").toLowerCase();

  if (templateKind === "flutter") {
    const mustHave = [
      path.join(projectDir, "pubspec.yaml"),
      path.join(projectDir, "lib", "main.dart"),
      path.join(projectDir, "android", "app", "src", "main", "AndroidManifest.xml"),
      path.join(projectDir, "android", "app", "build.gradle"),
      path.join(projectDir, "android", "settings.gradle"),
    ];
    for (const file of mustHave) {
      const ok = await fileExists(file);
      report.checks.push({ file, ok });
      report.ok = report.ok && ok;
      check(ok, path.relative(projectDir, file));
    }
    const dartSource = await findFiles(path.join(projectDir, "lib"), (abs, rel) => rel.endsWith(".dart"), { maxDepth: 4 });
    check(dartSource.length > 0, "Dart source files detected");
    report.checks.push({ file: "dart-source", ok: dartSource.length > 0 });
  } else if (templateKind === "react-native") {
    const mustHave = [
      path.join(projectDir, "package.json"),
      path.join(projectDir, "index.js"),
      path.join(projectDir, "src", "App.tsx"),
      path.join(projectDir, "android", "app", "src", "main", "AndroidManifest.xml"),
      path.join(projectDir, "android", "app", "build.gradle"),
    ];
    for (const file of mustHave) {
      const ok = await fileExists(file);
      report.checks.push({ file, ok });
      report.ok = report.ok && ok;
      check(ok, path.relative(projectDir, file));
    }
    const jsSource = await findFiles(projectDir, (abs, rel) => /\.(js|jsx|ts|tsx)$/i.test(rel), { maxDepth: 4 });
    check(jsSource.length > 0, "JavaScript/TypeScript source files detected");
    report.checks.push({ file: "js-source", ok: jsSource.length > 0 });
  } else {
    const mustHave = [
      path.join(projectDir, "app", "src", "main", "AndroidManifest.xml"),
      path.join(projectDir, "app", "build.gradle"),
      path.join(projectDir, "settings.gradle"),
    ];
    for (const file of mustHave) {
      const ok = await fileExists(file);
      report.checks.push({ file, ok });
      report.ok = report.ok && ok;
      check(ok, path.relative(projectDir, file));
    }

    const manifests = await findFiles(
      path.join(projectDir, "app", "src", "main"),
      (abs, rel) => rel.endsWith("AndroidManifest.xml"),
      { maxDepth: 4 }
    );
    if (manifests.length) {
      const manifest = await readText(manifests[0].abs);
      check(manifest.includes("<application"), "Manifest structure");
      report.checks.push({ file: manifests[0].rel, ok: true });
      if (manifest.includes("android.permission.INTERNET")) {
        logger.info("Internet permission detected in manifest.");
      }
    }

    let sourceCount = 0;
    for (const root of expectedMainSource(projectDir)) {
      const files = await findFiles(
        root,
        (abs, rel) => rel.endsWith(".java") || rel.endsWith(".kt"),
        { maxDepth: 8 }
      );
      sourceCount += files.length;
      if (files.length) {
        logger.info(
          `Source files detected in ${path.relative(projectDir, root)}: ${files.length}`
        );
      }
    }
    check(sourceCount > 0, "Source files detected", "MainActivity is missing?");
    report.checks.push({ file: "source-files", ok: sourceCount > 0 });

    const assetFiles = await findFiles(
      path.join(projectDir, "app", "src", "main", "assets"),
      (abs, rel) => /\.(html|js|css)$/i.test(rel),
      { maxDepth: 8 }
    );
    if (assetFiles.length) {
      logger.info(`Assets detected: ${assetFiles.length} file(s)`);
      const hasHttpUrlLike = (await readText(assetFiles[0].abs)).match(/https?:\/\//i);
      if (hasHttpUrlLike) {
        logger.note("A URL was detected inside the asset shell.");
      }
    }

    const webSourceCount = await hasWebFiles(projectDir);
    if (webSourceCount) {
      logger.info("Web sources detected.");
    }

    const readmeExists = await fileExists(path.join(projectDir, "README.md"));
    check(readmeExists, "README.md");
  }

  const readmeExists = await fileExists(path.join(projectDir, "README.md"));
  report.checks.push({ file: "README.md", ok: readmeExists });
  report.ok = report.ok && readmeExists;
  check(readmeExists, "README.md");

  logger.plain("");
  logger.box("Summary", [
    `Project: ${projectDir}`,
    `Status: ${report.ok ? "READY" : "INCOMPLETE"}`,
  ]);

  return report;
}

export function isLikelyWebUrl(url = "") {
  return hasHttpUrl(url);
}

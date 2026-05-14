import path from "node:path";
import { fileExists, findFiles, readText, hasHttpUrl } from "./utils.js";
import { logger } from "./logger.js";

function check(ok, label, details = "") {
  if (ok) {
    logger.success(label);
  } else {
    logger.warn(`${label}${details ? ` — ${details}` : ""}`);
  }
  return ok;
}

function expectedMainSource(projectDir) {
  return [
    path.join(projectDir, "app", "src", "main", "java"),
    path.join(projectDir, "app", "src", "main", "kotlin"),
  ];
}

export async function runProjectTests(projectDirArg = process.cwd()) {
  const projectDir = path.resolve(projectDirArg);
  const report = {
    projectDir,
    ok: true,
    checks: [],
  };

  logger.title("JAPKGEN Test");

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
    (abs, rel) =>
      rel.endsWith(".html") || rel.endsWith(".js") || rel.endsWith(".css"),
    { maxDepth: 8 }
  );
  if (assetFiles.length) {
    logger.info(`Assets detected: ${assetFiles.length} file(s)`);
    const hasHttpUrlLike = (await readText(assetFiles[0].abs)).match(
      /https?:\/\//i
    );
    if (hasHttpUrlLike)
      logger.note("A URL was detected inside the asset shell.");
  }

  const readmeExists = await fileExists(path.join(projectDir, "README.md"));
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

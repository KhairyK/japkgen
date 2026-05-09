import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { applyTemplate, parsePermissions, toPackagePath, toJniPackage, humanBytes } from "../src/utils.js";
import { analyzeApk } from "../src/analyze.js";
import { runProjectTests } from "../src/test.js";

test("utils template and permissions helpers work", () => {
  assert.equal(applyTemplate("Hello __NAME__", { NAME: "World" }), "Hello World");
  assert.deepEqual(parsePermissions("INTERNET,android.permission.CAMERA"), [
    "android.permission.INTERNET",
    "android.permission.CAMERA"
  ]);
  assert.equal(toPackagePath("com.example.app"), "com/example/app");
  assert.equal(toJniPackage("com.example.app"), "com_example_app");
  assert.equal(humanBytes(1536), "1.5 KB");
});

test("analyzeApk reads a small fake apk", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "japkgen-test-"));
  const apkPath = path.join(dir, "sample.apk");

  await fs.writeFile(path.join(dir, "AndroidManifest.xml"), "<manifest/>");
  await fs.writeFile(path.join(dir, "classes.dex"), "dex\n");
  await fs.writeFile(path.join(dir, "res.txt"), "hello");
  const { execFile } = await import("node:child_process");
  await new Promise((resolve, reject) => {
    execFile("zip", ["-q", "-j", apkPath, path.join(dir, "AndroidManifest.xml"), path.join(dir, "classes.dex"), path.join(dir, "res.txt")], (err) => {
      if (err) reject(err); else resolve();
    });
  });

  const report = await analyzeApk(apkPath);
  assert.ok(report.summary.count >= 3);
  assert.ok(report.summary.hasManifest);
  assert.equal(report.summary.dexCount, 1);
});

test("runProjectTests accepts a minimal generated structure", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "japkgen-proj-"));
  const appMain = path.join(dir, "app", "src", "main");
  await fs.mkdir(path.join(appMain, "java", "com", "example", "app"), { recursive: true });
  await fs.mkdir(path.join(appMain, "res", "layout"), { recursive: true });
  await fs.writeFile(path.join(appMain, "AndroidManifest.xml"), "<manifest/>");
  await fs.writeFile(path.join(dir, "app", "build.gradle"), "apply plugin:'com.android.application'");
  await fs.writeFile(path.join(dir, "settings.gradle"), "rootProject.name='x'");
  await fs.writeFile(path.join(appMain, "java", "com", "example", "app", "MainActivity.java"), "class MainActivity{}");

  const report = await runProjectTests(dir);
  assert.ok(report.ok);
});

import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import fs from 'fs-extra';
import ora from 'ora';
import pc from 'picocolors';
import prompts from 'prompts';
import { execa } from 'execa';

import { DEFAULTS } from './constants.js';
import { getTemplate } from './templates.js';
import {
  applyTemplate,
  hasHttpUrl,
  normalizePathValue,
  parsePermissions,
  toJniPackage,
  toPackagePath,
  uniq,
  writeFileEnsured,
  templateExists
} from './utils.js';
import { pickSigningOptions, writeSigningFiles } from './signing.js';
import { generateIcons } from './icons.js';

async function bootstrapGradleWrapper(projectDir, gradleVersion) {
  if (await templateExists(projectDir)) return;

  const gradleBin = process.platform === 'win32' ? 'gradle.bat' : 'gradle';
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'japkgen-wrapper-'));
  const spinner = ora(`Bootstrapping Gradle wrapper ${gradleVersion}`).start();

  try {
    await writeFileEnsured(
      path.join(tempDir, 'settings.gradle'),
      `rootProject.name = 'wrapper-bootstrap'\n`
    );
    await writeFileEnsured(path.join(tempDir, 'build.gradle'), `\n`);

    await execa(
      gradleBin,
      ['wrapper', '--gradle-version', String(gradleVersion), '--distribution-type', 'bin'],
      {
        cwd: tempDir,
        stdio: 'inherit'
      }
    );

    await fs.ensureDir(path.join(projectDir, 'gradle', 'wrapper'));

    const copies = [
      ['gradlew', 'gradlew'],
      ['gradlew.bat', 'gradlew.bat'],
      ['gradle/wrapper/gradle-wrapper.jar', 'gradle/wrapper/gradle-wrapper.jar'],
      ['gradle/wrapper/gradle-wrapper.properties', 'gradle/wrapper/gradle-wrapper.properties']
    ];

    for (const [srcRel, dstRel] of copies) {
      await fs.copy(path.join(tempDir, srcRel), path.join(projectDir, dstRel), { overwrite: true });
    }

    if (process.platform !== 'win32') {
      await fs.chmod(path.join(projectDir, 'gradlew'), 0o755);
    }

    spinner.succeed('Gradle wrapper ready');
  } catch (error) {
    spinner.fail('Failed to bootstrap Gradle wrapper');
    throw error;
  } finally {
    await fs.remove(tempDir);
  }
}

async function ensureLocalProperties(projectDir) {
  const androidSdkRoot = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
  if (!androidSdkRoot) return;

  const localPropsPath = path.join(projectDir, 'local.properties');
  const content = `sdk.dir=${normalizePathValue(androidSdkRoot)}\n`;
  await writeFileEnsured(localPropsPath, content);
}

async function writeTemplateProject(projectDir, template, vars) {
  for (const [rawRelativePath, rawContent] of Object.entries(template.files)) {
    const relativePath = applyTemplate(rawRelativePath, vars);
    const outputPath = path.join(projectDir, relativePath);
    const outputContent = applyTemplate(rawContent, vars);
    await writeFileEnsured(outputPath, outputContent);
  }
}

function smartPermissions({ templateName, url, permissions }) {
  const list = parsePermissions(permissions);

  if (templateName === 'webview') {
    list.push('android.permission.INTERNET');
    if (hasHttpUrl(url)) {
      list.push('android.permission.ACCESS_NETWORK_STATE');
    }
  }

  if (templateName === 'pwa' && hasHttpUrl(url)) {
    list.push('android.permission.INTERNET');
  }

  return uniq(list);
}

async function pickGenerateOptions(cliOptions) {
  let selectedTemplate = cliOptions.template;

  if (!selectedTemplate) {
    const templateAnswer = await prompts(
      {
        type: 'select',
        name: 'template',
        message: 'Template',
        choices: [
          { title: 'WebView', value: 'webview' },
          { title: 'PWA', value: 'pwa' },
          { title: 'Native', value: 'native' },
          { title: 'Game Java', value: 'game-java' },
          { title: 'Game C++', value: 'game-cpp' }
        ],
        initial: 0
      },
      { onCancel: () => process.exit(1) }
    );

    selectedTemplate = templateAnswer.template;
  }

  const questions = [];

  if (!cliOptions.name) {
    questions.push({
      type: 'text',
      name: 'name',
      message: 'App name',
      initial: DEFAULTS.appName
    });
  }

  if (!cliOptions.package) {
    questions.push({
      type: 'text',
      name: 'package',
      message: 'Package name',
      initial: DEFAULTS.packageName
    });
  }

  if (cliOptions.minSdk == null) {
    questions.push({
      type: 'number',
      name: 'minSdk',
      message: 'Min SDK',
      initial: DEFAULTS.minSdk
    });
  }

  if (cliOptions.targetSdk == null) {
    questions.push({
      type: 'number',
      name: 'targetSdk',
      message: 'Target SDK',
      initial: DEFAULTS.targetSdk
    });
  }

  if (cliOptions.compileSdk == null) {
    questions.push({
      type: 'number',
      name: 'compileSdk',
      message: 'Compile SDK',
      initial: DEFAULTS.compileSdk
    });
  }

  if (selectedTemplate === 'webview' && !cliOptions.url) {
    questions.push({
      type: 'text',
      name: 'url',
      message: 'WebView URL',
      initial: DEFAULTS.webUrl
    });
  }

  if (!cliOptions.permissions) {
    questions.push({
      type: 'text',
      name: 'permissions',
      message: 'Permissions (comma separated)',
      initial: selectedTemplate === 'webview' ? 'INTERNET' : ''
    });
  }

  if (!cliOptions.icon) {
    questions.push({
      type: 'text',
      name: 'icon',
      message: 'Icon path (leave empty for generated icon)',
      initial: ''
    });
  }

  const signingChoice = await pickSigningOptions(cliOptions);

  const result = questions.length
    ? await prompts(questions, {
        onCancel: () => process.exit(1)
      })
    : {};

  return {
    name: cliOptions.name || result.name,
    package: cliOptions.package || result.package,
    template: selectedTemplate,
    minSdk: Number(cliOptions.minSdk ?? result.minSdk ?? DEFAULTS.minSdk),
    targetSdk: Number(cliOptions.targetSdk ?? result.targetSdk ?? DEFAULTS.targetSdk),
    compileSdk: Number(cliOptions.compileSdk ?? result.compileSdk ?? DEFAULTS.compileSdk),
    url: cliOptions.url || result.url || DEFAULTS.webUrl,
    permissions: cliOptions.permissions || result.permissions || '',
    icon: cliOptions.icon || result.icon || '',
    signing: signingChoice
  };
}

export async function generateProject(cliOptions) {
  const opts = await pickGenerateOptions(cliOptions);

  const projectName = String(opts.name).trim();
  const packageName = String(opts.package).trim();
  const templateName = String(opts.template).trim().toLowerCase();

  if (!projectName) throw new Error('App name is required.');
  if (!packageName) throw new Error('Package name is required.');

  const template = getTemplate(templateName);
  if (!template) {
    throw new Error(
      `Unknown template "${templateName}". Use webview, pwa, native, game-java, or game-cpp.`
    );
  }

  const projectDir = path.resolve(process.cwd(), projectName);

  if (await fs.pathExists(projectDir)) {
    const items = await fs.readdir(projectDir);
    if (items.length > 0) {
      throw new Error(`Target directory is not empty: ${projectDir}`);
    }
  }

  await fs.ensureDir(projectDir);

  const permissions = smartPermissions({
    templateName,
    url: opts.url,
    permissions: opts.permissions
  });

  const permissionLines = permissions
    .map((perm) => `    <uses-permission android:name="${perm}" />`)
    .join('\n');

  const dependencyLines = uniq(template.dependencies || [])
    .map((dep) => `    implementation '${dep}'`)
    .join('\n');

  const vars = {
    APP_NAME: projectName,
    PACKAGE: packageName,
    PACKAGE_PATH: toPackagePath(packageName),
    PACKAGE_JNI: toJniPackage(packageName),
    MIN_SDK: opts.minSdk,
    TARGET_SDK: opts.targetSdk,
    COMPILE_SDK: opts.compileSdk,
    AGP_VERSION: DEFAULTS.agpVersion,
    GRADLE_VERSION: DEFAULTS.gradleVersion,
    JAVA_VERSION: DEFAULTS.javaVersion,
    WEB_URL: opts.url,
    PERMISSIONS: permissionLines,
    ANDROIDX_DEPENDENCIES: dependencyLines,
    EXTRA_ANDROID_BLOCK: template.extraAndroidBlock || ''
  };

  const spinner = ora(`Generating ${projectName}`).start();

  try {
    await writeTemplateProject(projectDir, template, vars);
    await ensureLocalProperties(projectDir);

    await generateIcons({
      projectDir,
      appName: projectName,
      iconPath: opts.icon || ''
    });

    await writeSigningFiles(projectDir, opts.signing);

    try {
      await bootstrapGradleWrapper(projectDir, DEFAULTS.gradleVersion);
    } catch (error) {
      console.warn(
        pc.yellow(
          '\nWrapper bootstrap skipped or failed. Project is generated, but build command may need system Gradle the first time.\n'
        )
      );
    }

    spinner.succeed(`Project created at ${projectDir}`);
    console.log(pc.cyan(`Template: ${templateName}`));
    console.log(pc.green(`Next: cd ${projectName}`));
    console.log(pc.green(`Build: japkgen build ${projectName}`));
  } catch (error) {
    spinner.fail('Generation failed');
    throw error;
  }
}
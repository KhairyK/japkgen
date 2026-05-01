import pc from 'picocolors';
import { detectEnvironment } from './environment.js';

function tick(ok) {
  return ok ? pc.green('✔') : pc.red('✖');
}

/**
 * Run doctor to check the environment
 *
 * @returns {Promise<void>}
 *
 * @example
 * japkgen doctor
 */
export async function runDoctor() {
  const env = await detectEnvironment();

  console.log(pc.bold('\nJAPKGEN Doctor\n'));

  console.log(`${tick(true)} Platform: ${env.platform} (${env.arch})`);
  console.log(`${tick(true)} Node: ${env.node}`);

  console.log(`${tick(env.java.ok)} Java: ${env.java.ok ? 'found' : 'missing'}`);
  if (env.java.output) console.log(pc.dim(env.java.output.split('\n')[0] || ''));

  console.log(`${tick(env.gradle.ok)} Gradle: ${env.gradle.ok ? 'found' : 'missing'}`);
  if (env.gradle.output) console.log(pc.dim(env.gradle.output.split('\n')[0] || ''));

  console.log(`${tick(env.adb.ok)} ADB: ${env.adb.ok ? 'found' : 'missing'}`);

  console.log(`${tick(Boolean(env.sdkRoot))} Android SDK: ${env.sdkRoot || 'not found'}`);
  console.log(`${tick(Boolean(env.sdkPlatformTools))} platform-tools: ${env.sdkPlatformTools ? 'ok' : 'missing'}`);
  console.log(`${tick(Boolean(env.sdkBuildTools))} build-tools: ${env.sdkBuildTools ? 'ok' : 'missing'}`);

  console.log('');
  if (!env.sdkRoot) {
    console.log(pc.yellow('Android SDK not found yet. Set ANDROID_SDK_ROOT or ANDROID_HOME.'));
  }
  if (!env.java.ok) {
    console.log(pc.yellow('Java not found. Use JDK 17 for best compatibility.'));
  }
  if (!env.gradle.ok) {
    console.log(pc.yellow('Gradle global not found. Project can still be built if the wrapper is present.'));
  }

  return env;
}
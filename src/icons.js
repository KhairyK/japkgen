import path from 'node:path';
import fs from 'fs-extra';
import sharp from 'sharp';
import { writeFileEnsured } from './utils.js';

const ICON_SIZES = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 }
];

/**
 * Escape XML special characters
 * @param {*} text 
 * @returns 
 */
function escapeXml(text = '') {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/**
 * Create a fallback SVG for the app icon
 * @param {*} appName 
 * @returns 
 */
function makeFallbackSvg(appName = 'App') {
  const label = escapeXml(String(appName).trim().slice(0, 2).toUpperCase() || 'A');
  return `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="120" fill="#2563eb"/>
    <circle cx="256" cy="256" r="160" fill="#1d4ed8"/>
    <text x="256" y="305" text-anchor="middle" font-size="180" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#ffffff">${label}</text>
  </svg>`;
}

/**
 * Generate Android launcher icons from image
 *
 * @param {Object} options
 * @param {string} options.projectDir
 * @param {string} options.appName
 * @param {string} [options.iconPath]
 *
 * @returns {Promise<void>}
 *
 * @throws {Error} if icon file not found or generation fails
 */
export async function generateIcons({ projectDir, appName, iconPath }) {
  const baseResDir = path.join(projectDir, 'app', 'src', 'main', 'res');

  let sourceBuffer;
  if (iconPath) {
    const resolved = path.isAbsolute(iconPath) ? iconPath : path.resolve(projectDir, iconPath);
    if (!(await fs.pathExists(resolved))) {
      throw new Error(`Icon file not found: ${resolved}`);
    }
    sourceBuffer = await fs.readFile(resolved);
  } else {
    sourceBuffer = Buffer.from(makeFallbackSvg(appName));
  }

  for (const item of ICON_SIZES) {
    const outDir = path.join(baseResDir, item.dir);
    const outFile = path.join(outDir, 'ic_launcher.png');
    const outFileRound = path.join(outDir, 'ic_launcher_round.png');

    await fs.ensureDir(outDir);

    const image = sharp(sourceBuffer).resize(item.size, item.size, { fit: 'cover' }).png();
    await image.toFile(outFile);
    await sharp(sourceBuffer)
      .resize(item.size, item.size, { fit: 'cover' })
      .png()
      .toFile(outFileRound);
  }
}
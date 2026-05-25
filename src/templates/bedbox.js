import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "BedBox",
  "summary": "A utility-focused Web APK template with a stronger bridge, safer defaults, and richer starter assets.",
  "compiler": "android",
  "kind": "android",
  "includeInternet": true,
  "includeWebkit": true,
  "sourceLanguage": "java",
  "webAssets": true,
  "webSubtitle": "A practical web-to-APK utility shell."
});
}

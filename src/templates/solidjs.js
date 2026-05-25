import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "SolidJS",
  "summary": "A SolidJS starter with a clean frontend workspace and Android packaging assets.",
  "compiler": "android + vite",
  "kind": "android",
  "includeInternet": true,
  "includeWebkit": true,
  "sourceLanguage": "java",
  "webAssets": true,
  "frontendFramework": "solidjs",
  "webSubtitle": "SolidJS starter scaffold embedded in Android packaging assets."
});
}

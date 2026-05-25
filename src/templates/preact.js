import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "Preact",
  "summary": "A lightweight Preact starter for compact frontend bundles and fast iteration.",
  "compiler": "android + vite",
  "kind": "android",
  "includeInternet": true,
  "includeWebkit": true,
  "sourceLanguage": "java",
  "webAssets": true,
  "frontendFramework": "preact",
  "webSubtitle": "Preact starter scaffold embedded in Android packaging assets."
});
}

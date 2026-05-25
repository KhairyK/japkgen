import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "Vue",
  "summary": "A Vue starter with a focused frontend workspace and a native packaging shell.",
  "compiler": "android + vite",
  "kind": "android",
  "includeInternet": true,
  "includeWebkit": true,
  "sourceLanguage": "java",
  "webAssets": true,
  "frontendFramework": "vue",
  "webSubtitle": "Vue starter scaffold embedded in Android packaging assets."
});
}

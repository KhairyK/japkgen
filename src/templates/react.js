import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "React",
  "summary": "A React-based app shell with a Vite frontend workspace and a WebView wrapper for Android packaging.",
  "compiler": "android + vite",
  "kind": "android",
  "includeInternet": true,
  "includeWebkit": true,
  "sourceLanguage": "java",
  "webAssets": true,
  "frontendFramework": "react",
  "webSubtitle": "React starter scaffold embedded in Android packaging assets."
});
}

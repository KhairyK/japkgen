import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "Angular",
  "summary": "An Angular starter with a structured frontend workspace and Android shell assets.",
  "compiler": "android + vite",
  "kind": "android",
  "includeInternet": true,
  "includeWebkit": true,
  "sourceLanguage": "java",
  "webAssets": true,
  "frontendFramework": "angular",
  "webSubtitle": "Angular starter scaffold embedded in Android packaging assets."
});
}

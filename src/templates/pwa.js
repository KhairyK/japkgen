import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "PWA",
  "summary": "A progressive web app shell with offline-friendly assets and a polished launcher experience.",
  "compiler": "android",
  "kind": "android",
  "includeInternet": true,
  "includeWebkit": true,
  "sourceLanguage": "java",
  "webAssets": true,
  "webSubtitle": "Offline-friendly PWA starter content."
});
}

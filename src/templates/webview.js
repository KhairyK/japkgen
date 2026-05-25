import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "WebView",
  "summary": "A secure Android WebView starter for shipping web apps inside a native shell.",
  "compiler": "android",
  "kind": "android",
  "includeInternet": true,
  "includeWebkit": true,
  "sourceLanguage": "java",
  "webAssets": true,
  "webSubtitle": "Secure defaults for a WebView-based Android shell."
});
}

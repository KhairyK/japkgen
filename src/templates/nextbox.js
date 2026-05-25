import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "NextBox",
  "summary": "A Kotlin utility box with modern app helpers, state holders, and extension functions.",
  "compiler": "android",
  "kind": "android",
  "includeInternet": false,
  "sourceLanguage": "kotlin",
  "utilities": "nextbox"
});
}

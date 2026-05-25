import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "Native",
  "summary": "A plain Android application starter for developers who want a small, direct, and reliable baseline.",
  "compiler": "android",
  "kind": "android",
  "includeInternet": false,
  "sourceLanguage": "java"
});
}

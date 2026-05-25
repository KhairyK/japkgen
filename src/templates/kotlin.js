import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "Kotlin",
  "summary": "A Kotlin application starter with a straightforward XML-based Android structure.",
  "compiler": "android",
  "kind": "android",
  "includeInternet": false,
  "sourceLanguage": "kotlin"
});
}

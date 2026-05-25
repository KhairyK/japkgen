import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "Flutter",
  "summary": "A Flutter starter scaffold with a clean Dart entry point and modern Material 3 defaults.",
  "compiler": "flutter cli",
  "kind": "flutter",
  "includeInternet": false,
  "rootPrefix": "",
  "sourceLanguage": "kotlin"
});
}

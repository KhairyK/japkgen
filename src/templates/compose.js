import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "Compose",
  "summary": "A modern Jetpack Compose starter with a clean Material 3 UI and a strong Kotlin baseline.",
  "compiler": "android",
  "kind": "android",
  "includeInternet": false,
  "sourceLanguage": "compose",
  "includeCompose": true,
  "includeActivityCompose": true
});
}

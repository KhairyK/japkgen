import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "Make",
  "summary": "A legacy Make-based native starter, kept for compatibility and gradually phased out.",
  "compiler": "android ndk",
  "kind": "ndk",
  "includeInternet": false,
  "includeNdk": true,
  "sourceLanguage": "java",
  "deprecated": true
});
}

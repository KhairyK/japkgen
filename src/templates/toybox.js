import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "ToyBox",
  "summary": "A Java utility box packed with reusable helpers for real application development.",
  "compiler": "android",
  "kind": "android",
  "includeInternet": false,
  "sourceLanguage": "java",
  "utilities": "toybox"
});
}

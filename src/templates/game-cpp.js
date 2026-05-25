import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "Game C++",
  "summary": "A C++ Android game starter with native rendering and JNI wiring.",
  "compiler": "android ndk",
  "kind": "ndk",
  "includeInternet": false,
  "includeNdk": true,
  "sourceLanguage": "java"
});
}

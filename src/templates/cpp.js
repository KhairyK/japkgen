import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "C++",
  "summary": "A compact Android NDK starter for C++ native code.",
  "compiler": "android ndk",
  "kind": "ndk",
  "includeInternet": false,
  "includeNdk": true,
  "sourceLanguage": "java"
});
}

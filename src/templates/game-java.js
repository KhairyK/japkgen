import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "Game Java",
  "summary": "A Java-based Android game starter with a simple loop and a strong baseline structure.",
  "compiler": "android",
  "kind": "android",
  "includeInternet": false,
  "sourceLanguage": "java"
});
}

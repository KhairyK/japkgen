import { buildTemplate } from './shared.js';

export default function createTemplate() {
  return buildTemplate({
  "title": "React Native",
  "summary": "A React Native starter scaffold with a practical JS entry point and Android packaging workspace.",
  "compiler": "react-native cli",
  "kind": "react-native",
  "includeInternet": false,
  "rootPrefix": "",
  "sourceLanguage": "java"
});
}

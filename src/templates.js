import webview from './templates/webview.js';
import pwa from './templates/pwa.js';
import bedbox from './templates/bedbox.js';
import react from './templates/react.js';
import solidjs from './templates/solidjs.js';
import vue from './templates/vue.js';
import angular from './templates/angular.js';
import preact from './templates/preact.js';
import native from './templates/native.js';
import toybox from './templates/toybox.js';
import compose from './templates/compose.js';
import kotlin from './templates/kotlin.js';
import nextbox from './templates/nextbox.js';
import c from './templates/c.js';
import cpp from './templates/cpp.js';
import cmake from './templates/cmake.js';
import make from './templates/make.js';
import gameJava from './templates/game-java.js';
import gameCpp from './templates/game-cpp.js';
import reactNative from './templates/react-native.js';
import flutter from './templates/flutter.js';

export const BUILTIN_TEMPLATES = {
  webview,
  pwa,
  bedbox,
  react,
  solidjs,
  vue,
  angular,
  preact,
  native,
  toybox,
  compose,
  kotlin,
  nextbox,
  c,
  cpp,
  cmake,
  make,
  'game-java': gameJava,
  'game-cpp': gameCpp,
  'react-native': reactNative,
  flutter,
};

export function getTemplate(templateName, registry = BUILTIN_TEMPLATES) {
  const key = String(templateName).toLowerCase();
  const templateFactory = registry[key];
  if (!templateFactory) return null;
  const template = typeof templateFactory === 'function' ? templateFactory() : templateFactory;
  return template || null;
}

export function templateNames(registry = BUILTIN_TEMPLATES) {
  return Object.keys(registry).sort();
}

export { webview, pwa, bedbox, react, solidjs, vue, angular, preact, native, toybox, compose, kotlin, nextbox, c, cpp, cmake, make, gameJava, gameCpp, reactNative, flutter };

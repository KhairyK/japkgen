# DocifyJS

AI-powered JSDoc generator for JavaScript and TypeScript using [Recast](https://github.com/benjamn/recast).

DocifyJS automatically generates clean JSDoc comments for:

* Functions
* Arrow functions
* Class methods
* Object methods
* Exported declarations
* TypeScript code

It supports:

* Recursive AST walking
* AI-generated descriptions
* Cloudflare Workers AI
* Plugin system
* Recast AST printing
* Multi-file CLI
* JS + TS parsing

---

# Features

* ⚡ Fast AST-based parser
* 🧠 AI-powered descriptions
* 🛠 TypeScript support
* 📦 Plugin system
* 🎨 Colored CLI output
* 🧩 Recast-based formatting
* 🔁 Recursive AST walker
* 📴 Local AI fallback
* 📄 Multi-file support

---

# Installation

```bash
npm install -g docifyjs
```

Or locally:

```bash
npm install
```

---

# Usage

## Generate docs

```bash
docify src/index.js
```

## Write changes

```bash
docify src/index.js --write
```

## Multiple files

```bash
docify src/*.js --write
```

## Dry run

```bash
docify src/index.js --dry-run
```

## Enable AI

```bash
docify src/*.js --write --ai
```

---

# TypeScript Support

DocifyJS understands TypeScript syntax using [@babel/parser](https://babeljs.io/docs/babel-parser).

## Example

```ts
export function add(a: number, b: number): number {
  return a + b;
}
```

Generated:

```ts
/**
 * Adds a value.
 * 
 * @param {number} a
 * @param {number} b
 * 
 * @returns {number}
 */
export function add(a: number, b: number): number {
  return a + b;
}
```

---

# License

Apache-2.0

---

# Author

Created by OpenDN Foundation
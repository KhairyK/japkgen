# Contributing to japkgen

First of all, thank you for considering contributing to **japkgen** 🚀  
We welcome contributions of all kinds — from bug fixes and new features to documentation improvements.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Contribution Types](#contribution-types)
- [JSDoc Contributions](#jsdoc-contributions)
- [Coding Guidelines](#coding-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

---

## Getting Started

1. Fork the repository
2. Clone your fork:

```bash
git clone https://github.com/KhairyK/japkgen.git
cd japkgen
```

3. Install dependencies:

```bash
npm install
```

---

## Development Setup

To test the CLI locally:

```bash
npm link
```

Then run:

```bash
japkgen --help
```

---

## Project Structure

```
src
├── build.js
├── constants.js
├── doctor.js
├── environment.js
├── generator.js
├── icons.js
├── index.js
├── signing.js
├── templates.js
├── types.js
└── utils.js
```

---

## Contribution Types

You can contribute in several ways:

- 🐛 Bug fixes
- ✨ New features
- 📄 Documentation improvements
- ⚡ Performance improvements
- 🧩 Template enhancements

---

## JSDoc Contributions

We are actively looking for contributors to improve **JSDoc documentation** across the codebase.

### Why JSDoc?

- Improves code readability
- Helps contributors understand APIs faster
- Enables better IDE support (autocomplete, hints)
- Makes the project more maintainable

### What to Document

Please add JSDoc to:

- Functions
- Classes
- Template generators
- Utility modules

### Example

```js
/**
 * Generate common Android project files.
 *
 * @param {Object} options
 * @param {string} options.appName - Application name
 * @param {string} options.packageName - Java package name
 * @param {string} options.permissionsBlock - Android permissions XML
 * @param {string} options.layoutXml - Layout XML string
 * @param {string} options.activityJava - MainActivity source code
 * @returns {Object<string, string>} Generated file map
 */
function commonFiles(options) {
  // ...
}
```

### Guidelines

- Use clear and concise descriptions
- Always document parameters and return values
- Prefer explicit types
- Keep comments updated with code changes

---

## Coding Guidelines

- Use modern JavaScript (ES Modules)
- Keep code modular and readable
- Avoid unnecessary dependencies
- Follow existing project structure
- Write descriptive variable and function names

---

## Commit Guidelines

We recommend using **Conventional Commits**:

```
feat: add new PWA template
fix: resolve WebView crash on redirect
docs: add JSDoc for template generator
refactor: simplify dependency injection logic
```

---

## Pull Request Process

1. Create a new branch:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes

3. Commit your work:

```bash
git commit -m "docs: add JSDoc for templates"
```

4. Push to your fork:

```bash
git push origin feature/your-feature-name
```

5. Open a Pull Request

---

## Before Submitting

Please make sure:

- Code builds successfully
- No breaking changes (unless discussed)
- JSDoc is added or updated (if applicable)
- Code is clean and readable

---

## Need Help?

If you’re unsure where to start, feel free to:

- Open an issue
- Ask questions in discussions
- Start with JSDoc (great first contribution!)

---

## Final Notes

Every contribution matters ❤️  
Even small improvements like adding JSDoc can significantly improve the developer experience.

Happy coding 🚀

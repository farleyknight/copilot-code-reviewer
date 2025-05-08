# Mistakes and Lessons Learned

## Attempted ESM Migration for VSCode Extension Tests

### What was attempted
- Migrated the extension and tests to ECMAScript Modules (ESM) using `"type": "module"` in `package.json` and `"module": "NodeNext"` in `tsconfig.json`.
- Updated all import paths to include `.js` extensions for ESM compatibility.
- Used dynamic imports for ESM-only dependencies (e.g., `chai`).

### Why it failed
- The VSCode test runner and Mocha (as used in VSCode extension testing) expect CommonJS modules and use `require()` to load test files.
- When test files are ESM, Mocha cannot load them via `require()` and throws `Error [ERR_REQUIRE_ESM]: require() of ES Module ... not supported.`
- The `chai` library is now ESM-only, so trying to `require('chai')` in CommonJS test files also fails.

### Resolution
- Reverted the project to CommonJS (`"module": "CommonJS"`, removed `"type": "module"`).
- Reverted all import paths to omit `.js` extensions and use CommonJS-compatible imports.
- For ESM-only dependencies like `chai`, use dynamic `import('chai')` in async setup hooks, even in CommonJS test files.
- This allows the extension and tests to run under the VSCode test runner while still supporting ESM-only dependencies.

### Lesson
- For VSCode extensions, prefer CommonJS for maximum compatibility with the VSCode test runner and Mocha, but use dynamic import for ESM-only dependencies in tests.

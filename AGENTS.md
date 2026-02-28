# Open MCT — Agent Development Guide

## Project Overview

Open MCT (Open Mission Control Technologies) is a NASA-developed, open-source mission control framework for visualization of telemetry data on desktop and mobile devices. It is built as a plugin-based platform using Vue 3, webpack, and vanilla JavaScript.

- **Version**: 4.3.0-rc1
- **License**: Apache-2.0
- **Homepage**: https://nasa.github.io/openmct/
- **Source**: https://github.com/nasa/openmct

---

## Node.js Setup

This project uses [nvm](https://github.com/nvm-sh/nvm). The required Node version is pinned in `.nvmrc` (currently Node 22).

**Always activate nvm before running any commands:**

```bash
source ~/.nvm/nvm.sh && nvm use
```

Supported Node range: `>=18.14.2 <23`

---

## Installing Dependencies

```bash
source ~/.nvm/nvm.sh && nvm use
npm install
```

`npm install` automatically runs the `prepare` script, which executes `build:prod` and `tsc` (TypeScript declaration generation).

---

## Project Structure

```
openmct/
├── src/                    # All application source code
│   ├── api/                # Core Open MCT API modules
│   │   ├── actions/        # Action API
│   │   ├── annotation/     # Annotation API
│   │   ├── composition/    # Composition (parent/child object) API
│   │   ├── forms/          # Form API
│   │   ├── indicators/     # Status bar indicators API
│   │   ├── menu/           # Context menu API
│   │   ├── notifications/  # Notification API
│   │   ├── objects/        # Object API (domain objects)
│   │   ├── overlays/       # Modal/overlay API
│   │   ├── status/         # Status API
│   │   ├── telemetry/      # Telemetry API
│   │   ├── time/           # Time API (time conductor)
│   │   ├── tooltips/       # Tooltip API
│   │   └── types/          # Type registry API
│   ├── plugins/            # 69 built-in plugins (e.g. plot, notebook, imagery, timeConductor, etc.)
│   ├── ui/                 # Core UI components (layout, toolbar, inspector, etc.)
│   ├── styles/             # Global SCSS styles
│   ├── utils/              # Shared utility functions
│   ├── MCT.js              # Main MCT class
│   └── MCTSpec.js          # Spec for MCT class
├── example/                # Example plugins / data generators used for dev server
│   ├── generator/          # Synthetic telemetry generator
│   ├── imagery/            # Example imagery plugin
│   ├── eventGenerator/     # Example event generator
│   └── ...
├── e2e/                    # End-to-end tests (Playwright) — separate npm workspace
│   ├── tests/              # Playwright test files
│   ├── playwright-*.config.js  # Various Playwright configurations
│   └── package.json        # e2e workspace package
├── .webpack/               # Webpack configuration files
│   ├── webpack.dev.mjs     # Dev build config
│   ├── webpack.prod.mjs    # Production build config
│   └── webpack.coverage.mjs # Coverage build config
├── dist/                   # Build output (generated)
│   ├── openmct.js          # Main bundle
│   ├── types/index.d.ts    # TypeScript declarations
│   └── *.css               # Theme stylesheets
├── openmct.js              # Library entry point (sets webpack public path)
├── karma.conf.cjs          # Karma unit test configuration
├── index-test.cjs          # Unit test entry point
├── tsconfig.json           # TypeScript config (declaration generation only)
├── index.html              # Dev server HTML entry
└── package.json
```

### Key Source Directories

| Path | Purpose |
|------|---------|
| `src/api/` | Public API surface — telemetry, objects, time, composition, etc. |
| `src/plugins/` | 69 bundled plugins (charts, notebook, imagery, timelines, etc.) |
| `src/ui/` | Core layout and UI components (Vue 3 SFCs) |
| `example/` | Example plugins used only in the dev server |
| `e2e/` | Playwright end-to-end tests (separate npm workspace) |

---

## Build Commands

All commands require nvm to be active first (`source ~/.nvm/nvm.sh && nvm use`).

| Command | Description |
|---------|-------------|
| `npm run build:prod` | Production build (minified) → `dist/` |
| `npm run build:dev` | Development build (source maps, no minification) → `dist/` |
| `npm run build:coverage` | Coverage-instrumented build → `dist/` |
| `npm run build:watch` | Dev build in watch mode |
| `npx tsc` | Generate TypeScript declarations → `dist/types/index.d.ts` |

The production build takes ~30 seconds; the dev build takes ~7 seconds.

---

## Development Server

```bash
npm start
```

Starts webpack-dev-server at **http://localhost:8080/** using the dev config. The dev server includes example plugins (synthetic telemetry generator, imagery, etc.) for interactive development.

```bash
npm run start:prod   # Serve production build
npm run start:coverage  # Serve coverage-instrumented build
```

---

## Testing

### Unit Tests (Karma + Jasmine)

Unit tests use Karma with ChromeHeadless. **Chrome must be available.**

Chrome is not installed system-wide on this machine. Use the downloaded binary:

```bash
CHROME_BIN=/tmp/chrome-for-testing/chrome/linux-146.0.7680.31/chrome-linux64/chrome npm test
```

To download Chrome for testing if needed:
```bash
npx @puppeteer/browsers install chrome@stable --path /tmp/chrome-for-testing
```

| Command | Description |
|---------|-------------|
| `npm test` | Run full unit test suite (ChromeHeadless, single run) |
| `npm run test:debug` | Run tests with `KARMA_DEBUG=true` (opens Chrome for debugging) |

**Results**: 980 tests pass, 67 skipped (as of Feb 2026).

Unit test specs live **alongside their source files** (e.g. `src/api/time/TimeAPISpec.js`, `src/plugins/plot/pluginSpec.js`). The test entry point is `index-test.cjs`.

### End-to-End Tests (Playwright)

E2e tests live in the `e2e/` workspace and use Playwright. They require the dev server to be running.

```bash
npm run test:e2e:local    # Run locally with Chrome
npm run test:e2e:ci       # CI mode (excludes @couchdb and @generatedata)
npm run test:e2e          # Default e2e run
```

See `e2e/README.md` for full e2e documentation and configuration options.

### Linting

```bash
npm run lint          # Run all linters in parallel
npm run lint:js       # ESLint on JS files
npm run lint:vue      # ESLint on Vue files
npm run lint:spelling # cspell spell checker
npm run lint:fix      # Auto-fix lint issues
```

---

## TypeScript

Open MCT is written in JavaScript but generates TypeScript declaration files for IDE support. The `tsconfig.json` only covers `src/api/**/*.js` (excludes `*Spec.js`) and emits to `dist/types/index.d.ts`.

TypeScript type checking (`checkJs`) is **disabled** — the project does not enforce strict TS types. The declarations are for IDE Intellisense only.

---

## Plugin Architecture

Open MCT is extended via plugins. A plugin is a function that receives the `openmct` instance:

```js
function MyPlugin() {
  return function install(openmct) {
    openmct.types.addType('my.type', { ... });
    openmct.objectViews.addProvider({ ... });
  };
}
openmct.install(MyPlugin());
```

All 69 built-in plugins are in `src/plugins/`. They are registered in `src/plugins/plugins.js`.

---

## Code Conventions

- Vue 3 Single File Components (`.vue`) for UI
- ES Modules throughout (`import`/`export`)
- Jasmine for unit tests; test files named `*Spec.js` alongside source
- No TypeScript enforcement — JS with JSDoc types
- ESLint + Prettier for formatting
- SCSS for styles

# CSES Finder

A Chrome extension built with React and TypeScript that adds a sidebar to [CSES](https://cses.fi/) for tracking your solved problems and picking random unsolved problems.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm
- Google Chrome (or any Chromium-based browser)

## Running Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Build the extension

For development (rebuilds automatically on file changes):

```bash
npm run dev
```

For a one-time production build:

```bash
npm run build
```

Both commands output the built extension to the `dist/` directory.

### 3. Load the extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `dist/` directory from this project

The extension will now be active. Visit [cses.fi](https://cses.fi/) to use it.

### 4. Reloading after changes

When running `npm run dev`, Vite rebuilds automatically on file changes. After each rebuild, go to `chrome://extensions` and click the refresh icon on the extension card to apply the latest changes.

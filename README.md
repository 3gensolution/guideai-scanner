# @guideai/scanner

A scanner for GuideAI that detects your web app framework, extracts routes and interactive UI elements, and uploads a knowledge base to GuideAI.

## Install

```bash
npm install @guideai/scanner
```

## CLI Usage

The package exposes the `guideai-scan` CLI.

```bash
npx guideai-scan --key sk_live_YOUR_API_KEY
```

### Options

- `--key <key>` (required) — your GuideAI site API key. Must start with `sk_live_`
- `--dir <dir>` — project root to scan (default: current working directory)
- `--api-url <url>` — GuideAI API URL (default: `https://api.guideai.io`)
- `--dry-run` — do not upload; print the scan result instead

### Example

```bash
npx guideai-scan --key sk_live_example --dir ./my-app --dry-run
```

This prints scan progress and, when `--dry-run` is enabled, the full JSON result.

## Programmatic Usage

Use the scanner directly from code if you want to integrate it into a script or build process.

```ts
import { scan } from '@guideai/scanner';

async function runScan() {
  const result = await scan({
    key: 'sk_live_example',
    dir: process.cwd(),
    apiUrl: 'https://api.guideai.io',
    dryRun: true,
  });

  console.log('Framework:', result.framework);
  console.log('Routes:', result.routes.length);
  console.log('Elements:', result.elements.length);
}

runScan().catch(console.error);
```

### ScanResult

The `scan()` function returns a `ScanResult` object with:

- `framework` — detected framework type
- `routes` — discovered app routes
- `elements` — scanned interactive UI elements
- `ui_map` — generated UI map for LLM context
- `duration_ms` — elapsed scan time

## Vite Plugin

The package also exports a Vite plugin at `@guideai/scanner/vite`.

```ts
import { defineConfig } from 'vite';
import { guideai } from '@guideai/scanner/vite';

export default defineConfig({
  plugins: [
    guideai({
      siteId: 'your-site-id',
      apiKey: process.env.GUIDEAI_API_KEY,
      only: ['production'],
    }),
  ],
});
```

If `apiKey` is not provided, the plugin reads from `process.env.GUIDEAI_API_KEY`.

## Webpack Plugin

Use the Webpack plugin from `@guideai/scanner/webpack`.

```js
const { GuideAIWebpackPlugin } = require('@guideai/scanner/webpack');

module.exports = {
  plugins: [
    new GuideAIWebpackPlugin({
      siteId: 'your-site-id',
      apiKey: process.env.GUIDEAI_API_KEY,
      only: ['production'],
    }),
  ],
};
```

## Supported Frameworks

The scanner detects and supports several frameworks, including:

- Next.js app router
- Next.js pages router
- React Router
- Angular
- Vue Router / Nuxt
- Remix
- SvelteKit
- Plain HTML

## Notes

- When `--dry-run` is used, the scanner does not upload to GuideAI.
- Without `--dry-run`, scan results are uploaded to the configured GuideAI API endpoint.
- The CLI validates the API key prefix and exits if it is not `sk_live_...`.

# GuideAI Scanner - Installation & Usage Guide

GuideAI Scanner automatically scans your web application, detects your framework, extracts routes and interactive elements, and builds a comprehensive knowledge base for AI-powered guidance.

## Installation

Install the scanner as a dev dependency in your project:

```bash
npm i @guideai/scanner
```

Or globally:

```bash
npm i -g @guideai/scanner
```

## Quick Start

### Dry Run (No Upload)

Test the scanner without uploading by using the `--dry-run` flag:

```bash
npx guideai-scan --dry-run
```

This will output a JSON preview of what would be scanned.

### Scan & Upload

To scan your code and automatically upload the knowledge base to GuideAI:

```bash
npx guideai-scan --key sk_live_xxxxx
```

## How It Works

The scanner performs these steps automatically:

1. **Framework Detection** - Identifies your framework (Next.js, React, Vue, Angular, Remix, Svelte, or plain HTML)
2. **Route Extraction** - Maps all routes based on your framework's routing conventions
3. **Element Extraction** - Finds interactive elements (buttons, forms, inputs, links, etc.) on each route
4. **Fingerprinting** - Analyzes element properties (text, labels, IDs, accessibility attributes, role, etc.)
5. **UI Mapping** - Builds a hierarchical structure for LLM context
6. **Upload** - Sends the knowledge base to GuideAI (unless using `--dry-run`)

## Supported Frameworks

- **Next.js** (App Router & Pages Router)
- **React Router**
- **Vue Router / Nuxt**
- **Angular**
- **Remix**
- **SvelteKit**
- **Plain HTML**

## Command-Line Options

| Option      | Description                   | Default                    | Required                       |
| ----------- | ----------------------------- | -------------------------- | ------------------------------ |
| `--dry-run` | Output JSON without uploading | `false`                    | No                             |
| `--dir`     | Project root directory        | Current working directory  | No                             |
| `--output`  | Save scan result to JSON file | —                          | No                             |
| `--api-url` | GuideAI API endpoint          | `https://api.3guideai.com` | No                             |
| `--key`     | Site API key for uploads      | —                          | Yes (unless using `--dry-run`) |

## Common Usage Patterns

### 1. Preview Your Scan Results

Dry-run mode shows you exactly what will be scanned without making any uploads:

```bash
npx guideai-scan --dry-run
```

Output includes:

- Detected framework
- Number of routes found
- Number of interactive elements found
- Scan duration

### 2. Save Results to a File (for inspection)

```bash
npx guideai-scan --dry-run --output scan-results.json
```

This creates a `scan-results.json` file with the full knowledge base structure including routes, elements, and the UI map.

### 3. Upload Knowledge Base

Once you're satisfied with the scan results:

```bash
npx guideai-scan --key sk_live_your_api_key
```

The scanner will:

- Run the full scan
- Upload the knowledge base to GuideAI
- Confirm successful upload
- Display summary (routes count, elements count, duration)

### 4. Scan a Specific Directory

```bash
npx guideai-scan --dir /path/to/project --dry-run
```

### 5. Combine Options

Scan, save results AND upload:

```bash
npx guideai-scan --key sk_live_your_api_key --output scan-results.json
```

## Knowledge Base Output Structure

When using `--dry-run --output file.json`, the generated JSON contains:

```json
{
  "framework": "nextjs-app-router",
  "routes": [
    {
      "path": "/",
      "component_name": "Home",
      "source_file": "app/page.tsx",
      "dynamic_segments": [],
      "auth_required": false,
      "headings": ["Welcome to our app"]
    }
  ],
  "elements": [
    {
      "id": "element_abc123",
      "route_path": "/",
      "tag": "button",
      "text": "Sign Up",
      "dom_id": "signup-btn",
      "aria_label": "Sign up for an account",
      "fingerprint": {
        "has_text": true,
        "has_id": true,
        "has_label": true
      }
    }
  ],
  "ui_map": {
    "root": { ... },
    "route_count": 42,
    "element_count": 187
  },
  "duration_ms": 1234
}
```

### Key Fields Explained

**Routes:**

- `path` - Route path (e.g., `/dashboard`, `/users/:id`)
- `component_name` - Component that renders this route
- `source_file` - Source code file location
- `dynamic_segments` - Parameters in the route (e.g., `["id"]` for `/users/:id`)
- `auth_required` - Whether authentication is needed
- `headings` - Page headings extracted from source

**Elements:**

- `tag` - HTML tag type (button, input, link, etc.)
- `text` - Display text (for buttons, links)
- `dom_id` - HTML id attribute
- `aria_label` - Accessibility label
- `placeholder` - Input placeholder text
- `fingerprint` - Properties that identify the element for LLM context

**UI Map:**

- Hierarchical tree structure of your application
- Shows relationships between routes, components, sections, and elements
- Used by AI for accurate context and guidance

## Scanned Data Details

The scanner captures:

| Category                 | What's Captured                                   | Why It Matters                           |
| ------------------------ | ------------------------------------------------- | ---------------------------------------- |
| **Routes**               | Paths, components, source files, dynamic segments | Identifies all pages and their locations |
| **Interactive Elements** | Buttons, forms, inputs, links, etc.               | Finds actionable items for user guidance |
| **Element Properties**   | Text, IDs, labels, accessibility attributes       | Helps AI identify specific elements      |
| **Accessibility**        | ARIA labels, roles, semantic HTML                 | Ensures guidance works for all users     |
| **Framework Info**       | Routing system, conventions                       | Adapts guidance to framework patterns    |

## Troubleshooting

### "Error: --key is required unless --dry-run is enabled"

You're trying to upload without providing an API key. Either:

- Add `--key sk_live_xxxxx` to your command
- Use `--dry-run` to test without uploading

### "Error: API key must start with sk*live*"

Invalid API key format. API keys must be in the format `sk_live_xxxxx`. Check your key is correct.

### Scanner Takes Too Long

The scanner can take longer on large projects. Common causes:

- **Large component directory** - Reduce custom component paths if needed
- **Many routes** - Projects with 100+ routes take proportionally longer

To speed up:

```bash
npx guideai-scan --dir ./packages/core --dry-run
```

### "No routes detected"

Framework detection may have failed. Check:

- Is your project in one of the supported frameworks?
- Is your project root directory correct? (use `--dir` if needed)
- Do you have a standard routing structure?

Try:

```bash
npx guideai-scan --dry-run --output debug.json
```

And check the `framework` field in the output.

## Integration with Build Tools

### As an npm Script

Add to your `package.json`:

```json
{
  "scripts": {
    "scan:preview": "guideai-scan --dry-run",
    "scan:upload": "guideai-scan --key sk_live_xxxxx",
    "scan:save": "guideai-scan --dry-run --output ./scan-results.json"
  }
}
```

Then run:

```bash
npm run scan:upload
```

### In CI/CD

Upload knowledge base automatically when code changes:

```yaml
# GitHub Actions example
- name: Scan and upload to GuideAI
  run: npx guideai-scan --key ${{ secrets.GUIDEAI_API_KEY }}
```

### Using the Programmatic API

Import directly in your code:

```typescript
import { scan } from "@guideai/scanner";

const result = await scan({
  key: "sk_live_xxxxx",
  dir: "./src",
  dryRun: false,
});

console.log(`Scanned ${result.routes.length} routes`);
console.log(`Found ${result.elements.length} elements`);
```

Options:

- `key` - API key for uploads (optional for dry-run)
- `dir` - Project directory (defaults to current directory)
- `dryRun` - Skip upload (defaults to false)
- `apiUrl` - Custom API endpoint

## Next Steps

1. **Install** the scanner in your project
2. **Run** `npx guideai-scan --dry-run` to preview what will be scanned
3. **Review** the output to ensure routes and elements are detected correctly
4. **Upload** with `npx guideai-scan --key sk_live_xxxxx`
5. **Monitor** your GuideAI dashboard to see the knowledge base and enable AI guidance

## Support

For issues or questions:

- Check the troubleshooting section above
- Review scan preview output with `--dry-run --output debug.json`
- Ensure your project matches one of the supported frameworks

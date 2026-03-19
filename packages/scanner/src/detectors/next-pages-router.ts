import * as path from 'path';
import fg from 'fast-glob';
import type { Route } from '../types';

/** Files/directories to skip in the pages directory. */
const SKIP_FILES = new Set(['_app', '_document', '_error', '404', '500']);
const SKIP_DIRS = new Set(['api']);

/** Supported page extensions. */
const PAGE_EXTENSIONS = '{tsx,jsx,ts,js}';

/**
 * Extract routes from a Next.js Pages Router project.
 *
 * Rules:
 * - index.tsx => /
 * - about.tsx => /about
 * - blog/[slug].tsx => /blog/:slug
 * - [...slug].tsx => /:slug*
 * - [[...slug]].tsx => /:slug*
 * - Skip _app, _document, _error files
 * - Skip api/ directory
 */
export async function extractNextPagesRoutes(rootDir: string): Promise<Route[]> {
  const pagesDirs = ['pages', 'src/pages'];
  let pagesDir: string | null = null;

  for (const candidate of pagesDirs) {
    const fullPath = path.join(rootDir, candidate);
    const entries = await fg(fullPath, { onlyDirectories: true, absolute: true }).catch(() => []);
    if (entries.length > 0) {
      pagesDir = fullPath;
      break;
    }
  }

  if (!pagesDir) {
    return [];
  }

  const pageFiles = await fg(
    path.join(pagesDir, `**/*.${PAGE_EXTENSIONS}`).replace(/\\/g, '/'),
    { absolute: true },
  );

  const routes: Route[] = [];

  for (const pageFile of pageFiles) {
    const relativePath = path.relative(pagesDir, pageFile);
    const parsed = path.parse(relativePath);
    const dirSegments = parsed.dir ? parsed.dir.split(path.sep) : [];
    const fileName = parsed.name;

    // Skip special files
    if (SKIP_FILES.has(fileName)) {
      continue;
    }

    // Skip api/ directory
    if (dirSegments.length > 0 && SKIP_DIRS.has(dirSegments[0])) {
      continue;
    }

    const routePath = buildPagesRouterPath(dirSegments, fileName);
    const dynamicSegments = extractDynamicSegments(routePath);

    routes.push({
      path: routePath,
      component_name: inferComponentName(fileName, dirSegments),
      source_file: path.relative(rootDir, pageFile),
      dynamic_segments: dynamicSegments,
      auth_required: false,
      headings: [],
    });
  }

  routes.sort((a, b) => a.path.localeCompare(b.path));
  return routes;
}

/**
 * Build a route path from directory segments and file name.
 */
function buildPagesRouterPath(dirSegments: string[], fileName: string): string {
  const allSegments = [...dirSegments];

  // index files map to the directory path, not /index
  if (fileName !== 'index') {
    allSegments.push(fileName);
  }

  if (allSegments.length === 0) {
    return '/';
  }

  const routeSegments = allSegments.map(convertSegment);
  return '/' + routeSegments.join('/');
}

/**
 * Convert a path segment to a route segment.
 */
function convertSegment(segment: string): string {
  // Optional catch-all: [[...param]]
  const optionalCatchAll = segment.match(/^\[\[\.\.\.(\w+)\]\]$/);
  if (optionalCatchAll) {
    return `:${optionalCatchAll[1]}*`;
  }

  // Catch-all: [...param]
  const catchAll = segment.match(/^\[\.\.\.(\w+)\]$/);
  if (catchAll) {
    return `:${catchAll[1]}*`;
  }

  // Dynamic segment: [param]
  const dynamic = segment.match(/^\[(\w+)\]$/);
  if (dynamic) {
    return `:${dynamic[1]}`;
  }

  return segment;
}

/**
 * Extract dynamic segment names from a route path.
 */
function extractDynamicSegments(routePath: string): string[] {
  const segments: string[] = [];
  const matches = routePath.matchAll(/:(\w+)\*?/g);
  for (const match of matches) {
    segments.push(match[1]);
  }
  return segments;
}

/**
 * Infer a component name from the file name and directory.
 */
function inferComponentName(fileName: string, dirSegments: string[]): string {
  const base = fileName === 'index'
    ? (dirSegments.length > 0 ? dirSegments[dirSegments.length - 1] : 'Home')
    : fileName;

  const cleaned = base
    .replace(/\[\.\.\.(\w+)\]/, '$1')
    .replace(/\[\[\.\.\.(\w+)\]\]/, '$1')
    .replace(/\[(\w+)\]/, '$1');

  return cleaned
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') + 'Page';
}

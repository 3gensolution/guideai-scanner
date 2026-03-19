import * as path from 'path';
import fg from 'fast-glob';
import type { Route } from '../types';

/** Page file patterns recognized by Next.js App Router. */
const PAGE_FILE_PATTERN = 'page.{tsx,jsx,ts,js}';

/**
 * Extract routes from a Next.js App Router project by scanning the app/ directory.
 *
 * Rules:
 * - Each folder containing a page.tsx/jsx/ts/js produces a route
 * - Dynamic segments [param] are converted to :param
 * - Catch-all segments [...slug] become :slug*
 * - Optional catch-all [[...slug]] become :slug*
 * - Route groups (parenthesized folders) are excluded from the path
 * - Parallel routes @folder are excluded from the path
 */
export async function extractNextAppRoutes(rootDir: string): Promise<Route[]> {
  const appDirs = ['app', 'src/app'];
  let appDir: string | null = null;

  for (const candidate of appDirs) {
    const fullPath = path.join(rootDir, candidate);
    const entries = await fg(fullPath, { onlyDirectories: true, absolute: true }).catch(() => []);
    if (entries.length > 0) {
      appDir = fullPath;
      break;
    }
  }

  if (!appDir) {
    return [];
  }

  // Find all page files recursively
  const pageFiles = await fg(
    path.join(appDir, '**', PAGE_FILE_PATTERN).replace(/\\/g, '/'),
    { absolute: true },
  );

  const routes: Route[] = [];

  for (const pageFile of pageFiles) {
    const relativePath = path.relative(appDir, path.dirname(pageFile));
    const routePath = buildAppRouterPath(relativePath);
    const dynamicSegments = extractDynamicSegments(routePath);

    routes.push({
      path: routePath,
      component_name: inferComponentFromDir(relativePath),
      source_file: path.relative(rootDir, pageFile),
      dynamic_segments: dynamicSegments,
      auth_required: false,
      headings: [],
    });
  }

  // Sort routes for deterministic output
  routes.sort((a, b) => a.path.localeCompare(b.path));

  return routes;
}

/**
 * Convert a relative directory path to a URL route path.
 *
 * Examples:
 *   '' => '/'
 *   'about' => '/about'
 *   'dashboard/settings' => '/dashboard/settings'
 *   '[id]' => '/:id'
 *   '(marketing)/pricing' => '/pricing'
 *   '@modal/login' => '/login'  (parallel routes excluded from path)
 *   '[...slug]' => '/:slug*'
 */
function buildAppRouterPath(relativePath: string): string {
  if (!relativePath || relativePath === '.') {
    return '/';
  }

  const segments = relativePath.split(path.sep);
  const routeSegments: string[] = [];

  for (const segment of segments) {
    // Skip route groups: (groupName)
    if (segment.startsWith('(') && segment.endsWith(')')) {
      continue;
    }

    // Skip parallel routes: @folderName
    if (segment.startsWith('@')) {
      continue;
    }

    // Optional catch-all: [[...param]]
    const optionalCatchAll = segment.match(/^\[\[\.\.\.(\w+)\]\]$/);
    if (optionalCatchAll) {
      routeSegments.push(`:${optionalCatchAll[1]}*`);
      continue;
    }

    // Catch-all: [...param]
    const catchAll = segment.match(/^\[\.\.\.(\w+)\]$/);
    if (catchAll) {
      routeSegments.push(`:${catchAll[1]}*`);
      continue;
    }

    // Dynamic segment: [param]
    const dynamic = segment.match(/^\[(\w+)\]$/);
    if (dynamic) {
      routeSegments.push(`:${dynamic[1]}`);
      continue;
    }

    routeSegments.push(segment);
  }

  const routePath = '/' + routeSegments.join('/');
  return routePath === '/' ? '/' : routePath;
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
 * Infer a component name from the directory path.
 */
function inferComponentFromDir(relativePath: string): string {
  if (!relativePath || relativePath === '.') {
    return 'HomePage';
  }

  const segments = relativePath.split(path.sep);
  const last = segments[segments.length - 1];

  // Remove brackets and dots for dynamic segments
  const cleaned = last
    .replace(/\[\.\.\.(\w+)\]/, '$1')
    .replace(/\[\[\.\.\.(\w+)\]\]/, '$1')
    .replace(/\[(\w+)\]/, '$1')
    .replace(/[()@]/g, '');

  // PascalCase the result
  return cleaned
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') + 'Page';
}

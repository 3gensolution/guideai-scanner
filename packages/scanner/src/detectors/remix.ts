import * as path from 'path';
import fg from 'fast-glob';
import type { Route } from '../types';

/**
 * Extract routes from a Remix project using the v2 flat-routes convention.
 *
 * Conventions:
 *   app/routes/_index.tsx        → /
 *   app/routes/about.tsx         → /about
 *   app/routes/dashboard.settings.tsx → /dashboard/settings
 *   app/routes/$id.tsx           → /:id
 *   app/routes/$.tsx             → catch-all (skipped)
 *   app/routes/_layout.tsx       → layout (skipped)
 */
export async function extractRemixRoutes(rootDir: string): Promise<Route[]> {
  const routeDir = path.join(rootDir, 'app/routes');
  const pattern = path
    .join(routeDir, '**/*.{tsx,jsx,ts,js}')
    .replace(/\\/g, '/');

  const files = await fg(pattern, {
    ignore: ['**/node_modules/**'],
    absolute: true,
  });

  const routes: Route[] = [];
  const seen = new Set<string>();

  for (const filePath of files) {
    const relativePath = path.relative(routeDir, filePath);
    const routePath = remixFileToRoute(relativePath);

    if (!routePath || seen.has(routePath)) continue;
    seen.add(routePath);

    const dynamicSegments = extractDynamicSegments(routePath);

    routes.push({
      path: routePath,
      component_name: inferComponentFromFile(relativePath),
      source_file: path.relative(rootDir, filePath),
      dynamic_segments: dynamicSegments,
      auth_required: false,
      headings: [],
    });
  }

  return routes;
}

function remixFileToRoute(relativePath: string): string | null {
  // Remove extension
  let name = relativePath.replace(/\.(tsx?|jsx?)$/, '');
  // Normalize separators
  name = name.replace(/\\/g, '/');

  // Skip layout files
  if (name === '_layout' || name.endsWith('/_layout')) return null;
  // Skip catch-all route
  if (name === '$' || name.endsWith('/$')) return null;

  // _index → /
  if (name === '_index') return '/';
  // Nested _index
  if (name.endsWith('/_index')) {
    name = name.replace(/\/_index$/, '');
  }

  // Convert dots to slashes (flat routes convention)
  name = name.replace(/\./g, '/');

  // Convert $param to :param
  name = name.replace(/\$(\w+)/g, ':$1');

  // Remove leading underscores (pathless layout segments)
  const segments = name.split('/').filter((s) => !s.startsWith('_'));
  const routePath = '/' + segments.join('/');

  return routePath === '/' ? '/' : routePath.replace(/\/+$/, '');
}

function extractDynamicSegments(routePath: string): string[] {
  const matches = routePath.matchAll(/:(\w+)/g);
  return Array.from(matches, (m) => m[1]);
}

function inferComponentFromFile(relativePath: string): string {
  const name = path.basename(relativePath, path.extname(relativePath));
  return (
    name
      .split(/[.\-_]/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('') + 'Page'
  );
}

import * as path from 'path';
import fg from 'fast-glob';
import type { Route } from '../types';

/**
 * Extract routes from a SvelteKit project.
 *
 * Conventions:
 *   src/routes/+page.svelte              → /
 *   src/routes/about/+page.svelte        → /about
 *   src/routes/[id]/+page.svelte         → /:id
 *   src/routes/[...rest]/+page.svelte    → /:rest*
 *   src/routes/(group)/+page.svelte      → / (group excluded)
 */
export async function extractSvelteKitRoutes(
  rootDir: string,
): Promise<Route[]> {
  const routeDir = path.join(rootDir, 'src/routes');
  const pattern = path
    .join(routeDir, '**', '+page.svelte')
    .replace(/\\/g, '/');

  const files = await fg(pattern, {
    ignore: ['**/node_modules/**'],
    absolute: true,
  });

  const routes: Route[] = [];
  const seen = new Set<string>();

  for (const filePath of files) {
    const relativePath = path.relative(routeDir, filePath);
    const routePath = svelteKitFileToRoute(relativePath);

    if (seen.has(routePath)) continue;
    seen.add(routePath);

    const dynamicSegments = extractDynamicSegments(routePath);

    routes.push({
      path: routePath,
      component_name: inferComponentFromDir(relativePath),
      source_file: path.relative(rootDir, filePath),
      dynamic_segments: dynamicSegments,
      auth_required: false,
      headings: [],
    });
  }

  return routes;
}

function svelteKitFileToRoute(relativePath: string): string {
  // Remove +page.svelte filename
  let dir = path.dirname(relativePath);
  if (dir === '.') return '/';

  // Normalize separators
  dir = dir.replace(/\\/g, '/');

  const segments = dir
    .split('/')
    .map((segment) => {
      // Remove group prefixes (parenthetical segments like (marketing))
      if (segment.startsWith('(') && segment.endsWith(')')) return '';

      // Convert [...rest] to :rest*
      if (segment.startsWith('[...') && segment.endsWith(']')) {
        const param = segment.slice(4, -1);
        return `:${param}*`;
      }

      // Convert [[optional]] to :optional
      if (segment.startsWith('[[') && segment.endsWith(']]')) {
        const param = segment.slice(2, -2);
        return `:${param}`;
      }

      // Convert [param] to :param
      if (segment.startsWith('[') && segment.endsWith(']')) {
        const param = segment.slice(1, -1);
        return `:${param}`;
      }

      return segment;
    })
    .filter(Boolean);

  return '/' + segments.join('/') || '/';
}

function extractDynamicSegments(routePath: string): string[] {
  const matches = routePath.matchAll(/:(\w+)\*?/g);
  return Array.from(matches, (m) => m[1]);
}

function inferComponentFromDir(relativePath: string): string {
  const dir = path.dirname(relativePath);
  if (dir === '.') return 'IndexPage';

  const segments = dir.replace(/\\/g, '/').split('/');
  const lastSegment = segments[segments.length - 1]
    .replace(/[[\]().]/g, '')
    .replace(/^\.+/, '');

  if (!lastSegment) return 'Page';

  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1) + 'Page';
}

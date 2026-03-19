import * as fs from 'fs';
import * as path from 'path';
import fg from 'fast-glob';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import type { Route } from '../types';

// Handle both ESM default and CJS module.exports
const traverse = (typeof _traverse === 'function' ? _traverse : (_traverse as { default: typeof _traverse }).default) as typeof _traverse;

/** Common Vue Router config file patterns. */
const ROUTER_FILE_PATTERNS = [
  'router/index.ts',
  'router/index.js',
  'src/router/index.ts',
  'src/router/index.js',
  'src/router.ts',
  'src/router.js',
];

/**
 * Extract routes from a Vue Router or Nuxt project.
 *
 * Strategy:
 * 1. Check for router config file (Vue Router) and parse route definitions
 * 2. Check for pages/ directory (Nuxt file-based routing)
 */
export async function extractVueRoutes(rootDir: string): Promise<Route[]> {
  // Strategy 1: Parse Vue Router config files
  const configRoutes = await extractFromRouterConfig(rootDir);
  if (configRoutes.length > 0) {
    return configRoutes;
  }

  // Strategy 2: Nuxt file-based routing from pages/ directory
  const nuxtRoutes = await extractNuxtFileRoutes(rootDir);
  return nuxtRoutes;
}

/**
 * Extract routes from Vue Router configuration files.
 */
async function extractFromRouterConfig(rootDir: string): Promise<Route[]> {
  let routerFile: string | null = null;

  for (const pattern of ROUTER_FILE_PATTERNS) {
    const fullPath = path.join(rootDir, pattern);
    try {
      await fs.promises.access(fullPath, fs.constants.R_OK);
      routerFile = fullPath;
      break;
    } catch {
      // File does not exist, continue
    }
  }

  if (!routerFile) {
    return [];
  }

  const source = await fs.promises.readFile(routerFile, 'utf-8');

  try {
    return parseVueRouterConfig(source, routerFile, rootDir);
  } catch {
    return [];
  }
}

/**
 * Parse a Vue Router config file and extract route definitions.
 */
function parseVueRouterConfig(
  source: string,
  filePath: string,
  rootDir: string,
): Route[] {
  const isTypeScript = filePath.endsWith('.ts');

  const ast = parse(source, {
    sourceType: 'module',
    plugins: isTypeScript ? ['typescript'] : [],
    errorRecovery: true,
  });

  const routes: Route[] = [];

  traverse(ast, {
    // Look for: const routes = [...]
    // or: routes: [...]
    VariableDeclarator(nodePath) {
      const id = nodePath.node.id;
      if (id.type !== 'Identifier') return;

      const name = id.name.toLowerCase();
      if (!name.includes('route')) return;

      const init = nodePath.node.init;
      if (!init || init.type !== 'ArrayExpression') return;

      extractRoutesFromArray(init, '', routes, filePath, rootDir);
    },

    // Handle createRouter({ routes: [...] })
    CallExpression(nodePath) {
      const callee = nodePath.node.callee;
      let calleeName = '';

      if (callee.type === 'Identifier') {
        calleeName = callee.name;
      }

      if (calleeName !== 'createRouter') return;

      const args = nodePath.node.arguments;
      if (args.length === 0 || args[0].type !== 'ObjectExpression') return;

      const configObj = args[0];
      for (const prop of configObj.properties) {
        if (
          prop.type === 'ObjectProperty' &&
          prop.key.type === 'Identifier' &&
          prop.key.name === 'routes' &&
          prop.value.type === 'ArrayExpression'
        ) {
          extractRoutesFromArray(prop.value, '', routes, filePath, rootDir);
        }
      }
    },
  });

  return routes;
}

/**
 * Recursively extract routes from a Vue Router routes array AST node.
 */
function extractRoutesFromArray(
  arrayNode: { type: string; elements: Array<unknown> },
  parentPath: string,
  routes: Route[],
  filePath: string,
  rootDir: string,
): void {
  for (const element of arrayNode.elements) {
    if (!element || (element as { type: string }).type !== 'ObjectExpression') {
      continue;
    }

    const obj = element as {
      type: string;
      properties: Array<{
        type: string;
        key: { type: string; name?: string; value?: string };
        value: {
          type: string;
          value?: string;
          elements?: Array<unknown>;
        };
      }>;
    };

    let routePath = '';
    let routeName = '';
    let childrenNode: { type: string; elements: Array<unknown> } | null = null;
    let hasBeforeEnter = false;
    let hasMeta = false;
    let metaRequiresAuth = false;

    for (const prop of obj.properties) {
      if (prop.type !== 'ObjectProperty') continue;

      const keyName =
        prop.key.type === 'Identifier'
          ? prop.key.name
          : prop.key.type === 'StringLiteral'
            ? prop.key.value
            : '';

      if (keyName === 'path' && prop.value.type === 'StringLiteral') {
        routePath = prop.value.value || '';
      }

      if (keyName === 'name' && prop.value.type === 'StringLiteral') {
        routeName = prop.value.value || '';
      }

      if (keyName === 'children' && prop.value.type === 'ArrayExpression') {
        childrenNode = prop.value as { type: string; elements: Array<unknown> };
      }

      if (keyName === 'beforeEnter') {
        hasBeforeEnter = true;
      }

      if (keyName === 'meta' && prop.value.type === 'ObjectExpression') {
        hasMeta = true;
        const metaObj = prop.value as {
          properties: Array<{
            type: string;
            key: { type: string; name?: string; value?: string };
            value: { type: string; value?: boolean };
          }>;
        };

        for (const metaProp of metaObj.properties) {
          if (metaProp.type !== 'ObjectProperty') continue;
          const metaKey =
            metaProp.key.type === 'Identifier'
              ? metaProp.key.name
              : metaProp.key.type === 'StringLiteral'
                ? metaProp.key.value
                : '';

          if (
            (metaKey === 'requiresAuth' || metaKey === 'auth') &&
            metaProp.value.type === 'BooleanLiteral' &&
            metaProp.value.value === true
          ) {
            metaRequiresAuth = true;
          }
        }
      }
    }

    // Build the full path
    const fullPath = buildFullPath(parentPath, routePath);

    // Only add non-wildcard routes with a path
    if (routePath !== '' && routePath !== '*' && !routePath.startsWith('/:pathMatch')) {
      const dynamicSegments = extractDynamicSegments(fullPath);

      routes.push({
        path: fullPath,
        component_name: routeName
          ? routeName.charAt(0).toUpperCase() + routeName.slice(1)
          : undefined,
        source_file: path.relative(rootDir, filePath),
        dynamic_segments: dynamicSegments,
        auth_required: hasBeforeEnter || (hasMeta && metaRequiresAuth),
        headings: [],
      });
    }

    if (childrenNode) {
      extractRoutesFromArray(childrenNode, fullPath, routes, filePath, rootDir);
    }
  }
}

/**
 * Extract routes from Nuxt file-based routing (pages/ directory).
 */
async function extractNuxtFileRoutes(rootDir: string): Promise<Route[]> {
  const pagesDirs = ['pages', 'src/pages'];
  let pagesDir: string | null = null;

  for (const candidate of pagesDirs) {
    const fullPath = path.join(rootDir, candidate);
    try {
      const stat = await fs.promises.stat(fullPath);
      if (stat.isDirectory()) {
        pagesDir = fullPath;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!pagesDir) {
    return [];
  }

  const pageFiles = await fg(
    path.join(pagesDir, '**/*.{vue,tsx,jsx,ts,js}').replace(/\\/g, '/'),
    { absolute: true },
  );

  const routes: Route[] = [];

  for (const pageFile of pageFiles) {
    const relativePath = path.relative(pagesDir, pageFile);
    const parsed = path.parse(relativePath);
    const dirSegments = parsed.dir ? parsed.dir.split(path.sep) : [];
    const fileName = parsed.name;

    const routePath = buildNuxtRoutePath(dirSegments, fileName);
    const dynamicSegments = extractDynamicSegments(routePath);

    routes.push({
      path: routePath,
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
 * Build a Nuxt file-based route path.
 *
 * Nuxt conventions:
 * - index.vue => /
 * - about.vue => /about
 * - [id].vue => /:id
 * - [...slug].vue => /:slug*
 */
function buildNuxtRoutePath(dirSegments: string[], fileName: string): string {
  const allSegments = [...dirSegments];
  if (fileName !== 'index') {
    allSegments.push(fileName);
  }

  if (allSegments.length === 0) {
    return '/';
  }

  const routeSegments = allSegments.map(convertNuxtSegment);
  return '/' + routeSegments.join('/');
}

/**
 * Convert a Nuxt directory/file segment to a route segment.
 */
function convertNuxtSegment(segment: string): string {
  // Catch-all: [...slug]
  const catchAll = segment.match(/^\[\.\.\.(\w+)\]$/);
  if (catchAll) {
    return `:${catchAll[1]}*`;
  }

  // Dynamic: [param]
  const dynamic = segment.match(/^\[(\w+)\]$/);
  if (dynamic) {
    return `:${dynamic[1]}`;
  }

  return segment;
}

/**
 * Build a full path from parent and current segments.
 */
function buildFullPath(parentPath: string, currentPath: string): string {
  // Absolute paths start fresh
  if (currentPath.startsWith('/')) {
    return normalizePath(currentPath);
  }

  const base = parentPath || '';
  const full = base + '/' + currentPath;
  return normalizePath(full);
}

/**
 * Normalize a route path.
 */
function normalizePath(p: string): string {
  let normalized = p.replace(/\/+/g, '/');
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

/**
 * Extract dynamic segment parameter names from a route path.
 */
function extractDynamicSegments(routePath: string): string[] {
  const segments: string[] = [];
  const matches = routePath.matchAll(/:(\w+)\*?/g);
  for (const match of matches) {
    segments.push(match[1]);
  }
  return segments;
}

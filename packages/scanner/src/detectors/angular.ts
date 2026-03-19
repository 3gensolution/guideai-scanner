import * as fs from 'fs';
import * as path from 'path';
import fg from 'fast-glob';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import type { Route } from '../types';

// Handle both ESM default and CJS module.exports
const traverse = (typeof _traverse === 'function' ? _traverse : (_traverse as { default: typeof _traverse }).default) as typeof _traverse;

/** Common Angular routing file patterns. */
const ROUTING_FILE_PATTERNS = [
  '**/app-routing.module.ts',
  '**/app.routes.ts',
  '**/*-routing.module.ts',
  '**/*.routes.ts',
];

/**
 * Extract routes from an Angular project by parsing routing module files.
 *
 * Parses route config arrays to extract:
 * - path properties
 * - canActivate guards (flags routes as auth_required)
 * - child routes (resolved to full paths)
 */
export async function extractAngularRoutes(rootDir: string): Promise<Route[]> {
  const routingFiles = await fg(
    ROUTING_FILE_PATTERNS.map((p) => path.join(rootDir, 'src', p).replace(/\\/g, '/')),
    {
      ignore: ['**/node_modules/**'],
      absolute: true,
    },
  );

  // Also check root-level routing files
  const rootRoutingFiles = await fg(
    ROUTING_FILE_PATTERNS.map((p) => path.join(rootDir, p).replace(/\\/g, '/')),
    {
      ignore: ['**/node_modules/**'],
      absolute: true,
    },
  );

  const allFiles = [...new Set([...routingFiles, ...rootRoutingFiles])];
  const routes: Route[] = [];

  for (const filePath of allFiles) {
    const source = await fs.promises.readFile(filePath, 'utf-8');

    try {
      const fileRoutes = parseAngularRoutes(source, filePath, rootDir);
      routes.push(...fileRoutes);
    } catch {
      // Skip files that fail to parse
    }
  }

  // Deduplicate by path
  const seen = new Set<string>();
  const uniqueRoutes = routes.filter((route) => {
    if (seen.has(route.path)) return false;
    seen.add(route.path);
    return true;
  });

  uniqueRoutes.sort((a, b) => a.path.localeCompare(b.path));
  return uniqueRoutes;
}

/**
 * Parse an Angular routing file and extract route configurations.
 */
function parseAngularRoutes(
  source: string,
  filePath: string,
  rootDir: string,
): Route[] {
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript', 'decorators-legacy'],
    errorRecovery: true,
  });

  const routes: Route[] = [];

  traverse(ast, {
    // Look for: const routes: Routes = [...]
    // or: export const routes = [...]
    VariableDeclarator(nodePath) {
      const id = nodePath.node.id;
      if (id.type !== 'Identifier') return;

      const name = id.name.toLowerCase();
      // Heuristic: variable name contains 'route'
      if (!name.includes('route')) return;

      const init = nodePath.node.init;
      if (!init || init.type !== 'ArrayExpression') return;

      extractRoutesFromArray(init, '', routes, filePath, rootDir);
    },

    // Also handle RouterModule.forRoot([...]) and RouterModule.forChild([...])
    CallExpression(nodePath) {
      const callee = nodePath.node.callee;

      if (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'RouterModule' &&
        callee.property.type === 'Identifier' &&
        (callee.property.name === 'forRoot' || callee.property.name === 'forChild')
      ) {
        const args = nodePath.node.arguments;
        if (args.length > 0 && args[0].type === 'ArrayExpression') {
          extractRoutesFromArray(args[0], '', routes, filePath, rootDir);
        }
      }
    },
  });

  return routes;
}

/**
 * Recursively extract routes from an Angular route config array AST node.
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
          properties?: Array<unknown>;
        };
      }>;
    };

    let routePath = '';
    let hasGuard = false;
    let childrenNode: { type: string; elements: Array<unknown> } | null = null;

    for (const prop of obj.properties) {
      if (prop.type !== 'ObjectProperty' && prop.type !== 'Property') continue;

      const keyName = getPropertyKeyName(prop.key);

      if (keyName === 'path' && prop.value.type === 'StringLiteral') {
        routePath = prop.value.value || '';
      }

      // canActivate indicates auth-required route
      if (keyName === 'canActivate' || keyName === 'canActivateChild') {
        hasGuard = true;
      }

      if (keyName === 'children' && prop.value.type === 'ArrayExpression') {
        childrenNode = prop.value as { type: string; elements: Array<unknown> };
      }
    }

    // Convert Angular's :id syntax
    const normalizedPath = normalizeAngularPath(routePath);
    const fullPath = buildFullPath(parentPath, normalizedPath);

    if (routePath !== '' && routePath !== '**') {
      const dynamicSegments = extractDynamicSegments(fullPath);

      routes.push({
        path: fullPath,
        source_file: path.relative(rootDir, filePath),
        dynamic_segments: dynamicSegments,
        auth_required: hasGuard,
        headings: [],
      });
    }

    if (childrenNode) {
      extractRoutesFromArray(childrenNode, fullPath, routes, filePath, rootDir);
    }
  }
}

/**
 * Get the string name of an object property key.
 */
function getPropertyKeyName(key: { type: string; name?: string; value?: string }): string {
  if (key.type === 'Identifier') return key.name || '';
  if (key.type === 'StringLiteral') return key.value || '';
  return '';
}

/**
 * Normalize Angular route path syntax to our standard :param format.
 * Angular uses :param natively, so mostly just ensure leading slash consistency.
 */
function normalizeAngularPath(routePath: string): string {
  // Angular wildcard route
  if (routePath === '**') return '';

  return routePath;
}

/**
 * Build the full path from parent and current path segments.
 */
function buildFullPath(parentPath: string, currentPath: string): string {
  if (!currentPath) {
    return parentPath || '/';
  }

  const base = parentPath || '';
  const full = base + '/' + currentPath;
  let normalized = full.replace(/\/+/g, '/');

  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  // Remove trailing slash unless root
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
  const matches = routePath.matchAll(/:(\w+)/g);
  for (const match of matches) {
    segments.push(match[1]);
  }
  return segments;
}

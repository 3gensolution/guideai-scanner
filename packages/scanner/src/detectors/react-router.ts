import * as fs from 'fs';
import * as path from 'path';
import fg from 'fast-glob';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import type { Route } from '../types';

// Handle both ESM default and CJS module.exports
const traverse = (typeof _traverse === 'function' ? _traverse : (_traverse as { default: typeof _traverse }).default) as typeof _traverse;

/**
 * Extract routes from a React Router project by finding and parsing
 * files that import from react-router-dom.
 */
export async function extractReactRouterRoutes(rootDir: string): Promise<Route[]> {
  // Find all JSX/TSX source files, excluding node_modules
  const sourceFiles = await fg(
    [
      path.join(rootDir, 'src/**/*.{tsx,jsx,ts,js}').replace(/\\/g, '/'),
      path.join(rootDir, 'app/**/*.{tsx,jsx,ts,js}').replace(/\\/g, '/'),
    ],
    {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      absolute: true,
    },
  );

  const routes: Route[] = [];

  for (const filePath of sourceFiles) {
    const source = await fs.promises.readFile(filePath, 'utf-8');

    // Quick check: skip files that don't reference Route
    if (!source.includes('Route') && !source.includes('createBrowserRouter')) {
      continue;
    }

    try {
      const fileRoutes = parseRoutesFromFile(source, filePath, rootDir);
      routes.push(...fileRoutes);
    } catch {
      // Skip files that fail to parse — they may not be valid JSX/TSX
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
 * Parse a single source file and extract <Route path="..."> elements,
 * including support for nested routes.
 */
function parseRoutesFromFile(
  source: string,
  filePath: string,
  rootDir: string,
): Route[] {
  const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
  const isJSX = filePath.endsWith('.jsx') || filePath.endsWith('.tsx');

  const plugins: Array<'jsx' | 'typescript' | 'decorators-legacy'> = [];
  if (isJSX || source.includes('jsx')) {
    plugins.push('jsx');
  }
  if (isTypeScript) {
    plugins.push('typescript');
  }

  const ast = parse(source, {
    sourceType: 'module',
    plugins,
    errorRecovery: true,
  });

  const routes: Route[] = [];

  // Track parent-child route nesting via a stack
  const pathStack: string[] = [];

  traverse(ast, {
    JSXOpeningElement: {
      enter(nodePath) {
        const nameNode = nodePath.node.name;
        let tagName = '';

        if (nameNode.type === 'JSXIdentifier') {
          tagName = nameNode.name;
        } else if (nameNode.type === 'JSXMemberExpression') {
          tagName = nameNode.property.name;
        }

        if (tagName !== 'Route') {
          return;
        }

        const pathAttr = nodePath.node.attributes.find(
          (attr) =>
            attr.type === 'JSXAttribute' &&
            attr.name.type === 'JSXIdentifier' &&
            attr.name.name === 'path',
        );

        if (
          !pathAttr ||
          pathAttr.type !== 'JSXAttribute' ||
          !pathAttr.value
        ) {
          return;
        }

        let routePath = '';
        if (pathAttr.value.type === 'StringLiteral') {
          routePath = pathAttr.value.value;
        } else if (
          pathAttr.value.type === 'JSXExpressionContainer' &&
          pathAttr.value.expression.type === 'StringLiteral'
        ) {
          routePath = pathAttr.value.expression.value;
        }

        if (!routePath) return;

        // Resolve the full path from the nesting stack
        const fullPath = resolveNestedPath(pathStack, routePath);
        pathStack.push(routePath);

        const dynamicSegments = extractDynamicSegments(fullPath);

        routes.push({
          path: fullPath,
          source_file: path.relative(rootDir, filePath),
          dynamic_segments: dynamicSegments,
          auth_required: false,
          headings: [],
        });
      },
      exit(nodePath) {
        const nameNode = nodePath.node.name;
        let tagName = '';
        if (nameNode.type === 'JSXIdentifier') {
          tagName = nameNode.name;
        } else if (nameNode.type === 'JSXMemberExpression') {
          tagName = nameNode.property.name;
        }

        if (tagName === 'Route') {
          // Check if this Route had a path attribute
          const pathAttr = nodePath.node.attributes.find(
            (attr) =>
              attr.type === 'JSXAttribute' &&
              attr.name.type === 'JSXIdentifier' &&
              attr.name.name === 'path',
          );
          if (pathAttr) {
            pathStack.pop();
          }
        }
      },
    },
  });

  // Also check for createBrowserRouter / createRoutesFromElements patterns
  // by looking for route config objects
  traverse(ast, {
    CallExpression(nodePath) {
      const callee = nodePath.node.callee;
      let calleeName = '';

      if (callee.type === 'Identifier') {
        calleeName = callee.name;
      }

      if (
        calleeName !== 'createBrowserRouter' &&
        calleeName !== 'createHashRouter' &&
        calleeName !== 'createMemoryRouter'
      ) {
        return;
      }

      const args = nodePath.node.arguments;
      if (args.length === 0 || args[0].type !== 'ArrayExpression') {
        return;
      }

      extractRoutesFromConfigArray(args[0], '', routes, filePath, rootDir);
    },
  });

  return routes;
}

/**
 * Recursively extract routes from a route config array
 * (used with createBrowserRouter).
 */
function extractRoutesFromConfigArray(
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
        value: { type: string; value?: string; elements?: Array<unknown> };
      }>;
    };

    let routePath = '';
    let hasChildren = false;
    let childrenNode: { type: string; elements: Array<unknown> } | null = null;

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

      if (keyName === 'children' && prop.value.type === 'ArrayExpression') {
        hasChildren = true;
        childrenNode = prop.value as { type: string; elements: Array<unknown> };
      }
    }

    if (routePath) {
      const fullPath = resolveNestedPath(
        parentPath ? [parentPath] : [],
        routePath,
      );
      const dynamicSegments = extractDynamicSegments(fullPath);

      routes.push({
        path: fullPath,
        source_file: path.relative(rootDir, filePath),
        dynamic_segments: dynamicSegments,
        auth_required: false,
        headings: [],
      });

      if (hasChildren && childrenNode) {
        extractRoutesFromConfigArray(
          childrenNode,
          fullPath,
          routes,
          filePath,
          rootDir,
        );
      }
    } else if (hasChildren && childrenNode) {
      // Layout route without path
      extractRoutesFromConfigArray(
        childrenNode,
        parentPath,
        routes,
        filePath,
        rootDir,
      );
    }
  }
}

/**
 * Resolve a nested route path against its parent path stack.
 */
function resolveNestedPath(parentPaths: string[], currentPath: string): string {
  // Absolute paths start fresh
  if (currentPath.startsWith('/')) {
    return normalizePath(currentPath);
  }

  const base = parentPaths.length > 0 ? parentPaths[parentPaths.length - 1] : '';
  if (!base || base === '/') {
    return normalizePath('/' + currentPath);
  }

  return normalizePath(base + '/' + currentPath);
}

/**
 * Normalize a route path (remove double slashes, ensure leading slash).
 */
function normalizePath(p: string): string {
  let normalized = p.replace(/\/+/g, '/');
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
 * Handles both :param and :param* patterns.
 */
function extractDynamicSegments(routePath: string): string[] {
  const segments: string[] = [];
  const matches = routePath.matchAll(/:(\w+)\*?/g);
  for (const match of matches) {
    segments.push(match[1]);
  }
  return segments;
}

import * as fs from 'fs';
import * as path from 'path';
import fg from 'fast-glob';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import type { Route } from '../types';
import { neutralizeDuplicateBindings, resolveSourceImport } from '../source-relationships';

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
  neutralizeDuplicateBindings(ast);

  const routes: Route[] = [];
  const imports = new Map<string, string>();
  traverse(ast, { ImportDeclaration(p) {
    const resolved = resolveSourceImport(filePath, p.node.source.value, rootDir);
    if (resolved) for (const spec of p.node.specifiers) imports.set(spec.local.name, resolved);
  } });
  function renderedComponent(node: any): { source_file: string; component_name: string } | undefined {
    if (!node) return undefined;
    if (node.type === 'JSXElement') {
      for (const child of node.children || []) {
        const found = renderedComponent(child);
        if (found) return found;
      }
      const name = node.openingElement.name.name;
      const resolved = imports.get(name);
      if (resolved) return { source_file: path.relative(rootDir, resolved), component_name: name };
    }
    if (node.type === 'JSXExpressionContainer') return renderedComponent(node.expression);
    if (node.type === 'ConditionalExpression') return renderedComponent(node.consequent) || renderedComponent(node.alternate);
    if (node.type === 'LogicalExpression') return renderedComponent(node.right);
    return undefined;
  }

  // Track parent-child route nesting via a stack
  const pathStack: string[] = [];

  traverse(ast, {
    JSXElement: {
      enter(nodePath) {
        const nameNode = nodePath.node.openingElement.name;
        let tagName = '';

        if (nameNode.type === 'JSXIdentifier') {
          tagName = nameNode.name;
        } else if (nameNode.type === 'JSXMemberExpression') {
          tagName = nameNode.property.name;
        }

        if (tagName !== 'Route') {
          return;
        }

        const pathAttr = nodePath.node.openingElement.attributes.find(
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
        pathStack.push(fullPath);

        const dynamicSegments = extractDynamicSegments(fullPath);

        const elementAttr: any = nodePath.node.openingElement.attributes.find(
          (attr: any) => attr.type === 'JSXAttribute' && attr.name.name === 'element',
        );
        const component = renderedComponent(elementAttr?.value);
        routes.push({
          path: fullPath,
          source_file: path.relative(rootDir, filePath),
          ...component,
          dynamic_segments: dynamicSegments,
          auth_required: false,
          headings: [],
        });
      },
      exit(nodePath) {
        const nameNode = nodePath.node.openingElement.name;
        let tagName = '';
        if (nameNode.type === 'JSXIdentifier') {
          tagName = nameNode.name;
        } else if (nameNode.type === 'JSXMemberExpression') {
          tagName = nameNode.property.name;
        }

        if (tagName === 'Route') {
          // Check if this Route had a path attribute
          const pathAttr = nodePath.node.openingElement.attributes.find(
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
      if (args.length === 0) {
        return;
      }

      if (args[0].type === 'ArrayExpression') {
        extractRoutesFromConfigArray(args[0], '', routes, filePath, rootDir);
        return;
      }

      // The array is not written inline. Splitting the route tree into its own
      // module — `createBrowserRouter(getRoutes())`, or passing an imported
      // `RouteObject[]` — is the ordinary data-router idiom, so resolve the
      // argument back to the array literal it stands for. Falls back to doing
      // nothing, exactly as before, when it cannot be traced.
      for (const array of resolveToRouteArrays(args[0], ast, filePath, rootDir)) {
        extractRoutesFromConfigArray(
          array.node,
          '',
          routes,
          array.filePath,
          rootDir,
        );
      }
    },
  });

  // Exported `RouteObject[]` arrays that no traceable createBrowserRouter call
  // reaches from this file — a product-per-file route tree, say, selected at
  // runtime. Scanning them directly is what makes those projects visible at
  // all; `seen` keeps a tree already collected above from being counted twice.
  const seen = new Set(routes.map((route) => route.path));
  for (const array of findRouteObjectArrays(ast)) {
    const collected: Route[] = [];
    extractRoutesFromConfigArray(array, '', collected, filePath, rootDir);
    for (const route of collected) {
      if (seen.has(route.path)) continue;
      seen.add(route.path);
      routes.push(route);
    }
  }

  return routes;
}

/** An array literal plus the file it was found in. */
interface ResolvedRouteArray {
  node: { type: string; elements: Array<unknown> };
  filePath: string;
}

/** Strip TS wrappers (`as const`, `satisfies`, `!`) to reach the real node. */
function unwrapTs(node: any): any {
  if (
    node &&
    ['TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression'].includes(
      node.type,
    )
  ) {
    return unwrapTs(node.expression);
  }
  return node;
}

/**
 * Does this array literal look like a route tree?
 *
 * Deliberately strict: every element must be an object, and at least one must
 * carry a route-shaped key. A loose test here would sweep up unrelated config
 * arrays and invent routes that do not exist.
 */
function looksLikeRouteArray(node: any): boolean {
  if (!node || node.type !== 'ArrayExpression') return false;
  const elements = (node.elements || []).filter(Boolean);
  if (elements.length === 0) return false;

  let routeShaped = 0;
  for (const element of elements as any[]) {
    if (element.type !== 'ObjectExpression') return false;
    const keys = (element.properties || [])
      .filter((prop: any) => prop.type === 'ObjectProperty')
      .map((prop: any) =>
        prop.key.type === 'Identifier'
          ? prop.key.name
          : prop.key.type === 'StringLiteral'
            ? prop.key.value
            : '',
      );
    const hasLocation = keys.includes('path') || keys.includes('index');
    const hasRender =
      keys.includes('element') ||
      keys.includes('children') ||
      keys.includes('Component') ||
      keys.includes('lazy');
    if (hasLocation && hasRender) routeShaped += 1;
  }
  return routeShaped > 0;
}

/** Every `RouteObject[]`-shaped array literal declared in one AST. */
function findRouteObjectArrays(ast: any): Array<{ type: string; elements: Array<unknown> }> {
  const found: Array<{ type: string; elements: Array<unknown> }> = [];
  traverse(ast, {
    VariableDeclarator(p) {
      const init = unwrapTs(p.node.init);
      if (looksLikeRouteArray(init)) found.push(init);
    },
  });
  return found;
}

/**
 * Trace a non-literal `createBrowserRouter` argument back to route arrays.
 *
 * Handles the two shapes that actually appear: a bare identifier holding the
 * array, and a zero-argument factory returning one (often via a `switch`, so
 * every `return` is followed, not just the first). Both are resolved across
 * files, because the route tree usually lives in its own module.
 */
function resolveToRouteArrays(
  argument: any,
  ast: any,
  filePath: string,
  rootDir: string,
  depth = 0,
): ResolvedRouteArray[] {
  if (depth > 3) return [];

  const node = unwrapTs(argument);
  if (!node) return [];

  if (node.type === 'ArrayExpression') {
    return looksLikeRouteArray(node) ? [{ node, filePath }] : [];
  }

  // `createBrowserRouter(routes)`
  if (node.type === 'Identifier') {
    return resolveBindingToArrays(node.name, ast, filePath, rootDir, depth);
  }

  // `createBrowserRouter(getRoutes())`
  if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
    return resolveBindingToArrays(
      node.callee.name,
      ast,
      filePath,
      rootDir,
      depth,
      true,
    );
  }

  return [];
}

/**
 * Resolve one binding name — local first, then through its import — to the
 * route arrays it stands for.
 */
function resolveBindingToArrays(
  name: string,
  ast: any,
  filePath: string,
  rootDir: string,
  depth: number,
  callReturns = false,
): ResolvedRouteArray[] {
  const results: ResolvedRouteArray[] = [];

  traverse(ast, {
    VariableDeclarator(p) {
      if (p.node.id.type !== 'Identifier' || p.node.id.name !== name) return;
      const init = unwrapTs(p.node.init);
      if (!init) return;
      if (callReturns) {
        // `const getRoutes = () => …` / `= function () { … }`
        if (
          init.type === 'ArrowFunctionExpression' ||
          init.type === 'FunctionExpression'
        ) {
          results.push(
            ...arraysFromFunctionBody(init, ast, filePath, rootDir, depth),
          );
        }
        return;
      }
      results.push(...resolveToRouteArrays(init, ast, filePath, rootDir, depth + 1));
    },
    FunctionDeclaration(p) {
      if (!callReturns || p.node.id?.name !== name) return;
      results.push(...arraysFromFunctionBody(p.node, ast, filePath, rootDir, depth));
    },
  });

  if (results.length > 0) return results;

  // Not defined here — follow the import to the file that owns it.
  let importedFrom: string | undefined;
  let importedName = name;
  traverse(ast, {
    ImportDeclaration(p) {
      for (const spec of p.node.specifiers) {
        if (spec.local.name !== name) continue;
        importedFrom = p.node.source.value;
        if (spec.type === 'ImportSpecifier' && spec.imported.type === 'Identifier') {
          importedName = spec.imported.name;
        }
      }
    },
  });

  if (!importedFrom) return results;

  const resolved = resolveSourceImport(filePath, importedFrom, rootDir);
  if (!resolved) return results;

  const imported = parseFileToAst(resolved);
  if (!imported) return results;

  return resolveBindingToArrays(
    importedName,
    imported,
    resolved,
    rootDir,
    depth + 1,
    callReturns,
  );
}

/** Route arrays returned from a function body, following every `return`. */
function arraysFromFunctionBody(
  fn: any,
  ast: any,
  filePath: string,
  rootDir: string,
  depth: number,
): ResolvedRouteArray[] {
  const results: ResolvedRouteArray[] = [];

  // Concise arrow body: `() => guideosRoutes`
  if (fn.body && fn.body.type !== 'BlockStatement') {
    return resolveToRouteArrays(fn.body, ast, filePath, rootDir, depth + 1);
  }

  const visit = (node: any): void => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'ReturnStatement' && node.argument) {
      results.push(
        ...resolveToRouteArrays(node.argument, ast, filePath, rootDir, depth + 1),
      );
      return;
    }
    // Don't descend into nested functions — their returns are not this one's.
    if (
      node !== fn &&
      ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(
        node.type,
      )
    ) {
      return;
    }
    for (const key of Object.keys(node)) {
      const child = (node as any)[key];
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child.type === 'string') visit(child);
    }
  };
  visit(fn.body);

  return results;
}

/** Parse a file for cross-file resolution. Returns null if unreadable. */
function parseFileToAst(filePath: string): any | null {
  try {
    const source = fs.readFileSync(filePath, 'utf-8');
    const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
    const isJSX = filePath.endsWith('.jsx') || filePath.endsWith('.tsx');
    const plugins: Array<'jsx' | 'typescript'> = [];
    if (isJSX) plugins.push('jsx');
    if (isTypeScript) plugins.push('typescript');
    const parsed = parse(source, { sourceType: 'module', plugins, errorRecovery: true });
    neutralizeDuplicateBindings(parsed);
    return parsed;
  } catch {
    return null;
  }
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
    // `{ index: true }` is the section's own landing page. It carries no path
    // of its own — it resolves to the parent's — so without this the landing
    // page of every section is silently dropped while its siblings survive.
    let isIndex = false;

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

      if (
        keyName === 'index' &&
        (prop.value as { type: string; value?: unknown }).type === 'BooleanLiteral' &&
        (prop.value as { type: string; value?: unknown }).value === true
      ) {
        isIndex = true;
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
    } else if (isIndex) {
      // Index route: the parent's own path. At the top level the parent is
      // the router root, so it is "/".
      const fullPath = normalizePath(parentPath || '/');
      if (!routes.some((route) => route.path === fullPath)) {
        routes.push({
          path: fullPath,
          source_file: path.relative(rootDir, filePath),
          dynamic_segments: extractDynamicSegments(fullPath),
          auth_required: false,
          headings: [],
        });
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

import * as fs from 'fs';
import * as path from 'path';
import fg from 'fast-glob';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import type { Route } from '../types';
import { resolveSourceImport } from '../source-relationships';

// Handle both ESM default and CJS module.exports
const traverse = (typeof _traverse === 'function' ? _traverse : (_traverse as { default: typeof _traverse }).default) as typeof _traverse;

/**
 * Browser APIs that yield the current location. A value read from one of these
 * is a router path by definition, whatever the surrounding code calls it.
 */
const LOCATION_PROPERTIES = new Set(['pathname', 'hash', 'href', 'search']);

/**
 * Extract routes from a project that dispatches on the current path itself,
 * rather than declaring routes through a routing library.
 *
 *   if (path === '/settings') return <SettingsPage />;
 *   if (path.startsWith('/orders/')) return <OrderDetailPage />;
 *   switch (route) { case '/inbox': return <InboxPage />; }
 *
 * Such projects have no routing dependency and no route declarations, so the
 * library detectors find nothing.
 *
 * The difficulty is that a rooted string literal is not on its own evidence of
 * a route — `mime === '/image/png'` and `file.startsWith('/usr/local')` look
 * identical to a naive matcher. So this detector never trusts the literal. It
 * first identifies which local bindings actually hold the current location
 * (tracing them back to `window.location` or to a hook that returns it), and
 * only reads paths out of comparisons against those bindings.
 */
export async function extractCustomRouterRoutes(rootDir: string): Promise<Route[]> {
  const sourceFiles = await fg(
    [
      // .ts/.js are included because router hooks are routinely defined in a
      // plain module, separate from the JSX that dispatches on them.
      path.join(rootDir, 'src/**/*.{tsx,jsx,ts,js}').replace(/\\/g, '/'),
      path.join(rootDir, 'app/**/*.{tsx,jsx,ts,js}').replace(/\\/g, '/'),
    ],
    {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/*.stories.*',
      ],
      absolute: true,
    },
  );

  // A hook such as `useRouter()` is usually defined in one module and consumed
  // in another, so learn which exported functions return a location before
  // deciding what counts as a path binding at each call site.
  const locationHooks = new Set<string>();
  const parsedFiles: Array<{ filePath: string; ast: ReturnType<typeof parse> }> = [];

  for (const filePath of sourceFiles) {
    let source: string;
    try {
      source = await fs.promises.readFile(filePath, 'utf-8');
    } catch {
      continue;
    }

    // A routing module must mention a rooted literal or read the location.
    if (!/['"]\/[^'"]*['"]/.test(source) && !source.includes('location')) continue;

    try {
      const ast = parse(source, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
        errorRecovery: true,
      });
      parsedFiles.push({ filePath, ast });
      collectLocationHooks(ast, locationHooks);
    } catch {
      // Skip files that fail to parse
    }
  }

  const routes: Route[] = [];
  for (const { filePath, ast } of parsedFiles) {
    try {
      routes.push(...parseRoutesFromFile(ast, filePath, rootDir, locationHooks));
    } catch {
      // Skip files that fail to traverse
    }
  }

  // Deduplicate by path, preferring entries that resolved a component
  const byPath = new Map<string, Route>();
  for (const route of routes) {
    const existing = byPath.get(route.path);
    if (!existing || (!existing.source_file && route.source_file)) {
      byPath.set(route.path, route);
    }
  }

  return Array.from(byPath.values()).sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Record functions whose return value derives from the browser location, so
 * their call sites can be recognised as producing a path.
 */
function collectLocationHooks(ast: any, into: Set<string>): void {
  // Two passes: a helper such as `getPath()` must be known before the hook that
  // wraps it can be recognised.
  for (let pass = 0; pass < 2; pass += 1) {
    collectLocationHooksPass(ast, into);
  }
}

function collectLocationHooksPass(ast: any, into: Set<string>): void {
  traverse(ast, {
    ReturnStatement(nodePath: any) {
      const argument = nodePath.node.argument;
      if (!argument) return;
      // A hook usually stores the location in a local first and returns that
      // local (often via state), so resolve identifiers through their binding.
      if (
        !readsLocation(argument, 0, into)
        && !returnsLocationBinding(argument, nodePath, 0, into)
      ) return;
      const fn = nodePath.getFunctionParent();
      const name = functionName(fn);
      if (name) into.add(name);
    },
  });
}

/**
 * Does a returned value resolve to the location once local bindings are
 * followed? Covers `return path` and `return { path }` where `path` was
 * initialised from the location, including through a state hook.
 */
function returnsLocationBinding(
  node: any,
  nodePath: any,
  depth = 0,
  knownHooks?: Set<string>,
): boolean {
  if (!node || depth > 4) return false;

  if (node.type === 'Identifier') {
    const binding = nodePath.scope.getBinding(node.name);
    const bindingNode = binding?.path?.node;
    if (!bindingNode) return false;
    // const path = <location>  /  const [path] = useState(<location>)
    if (bindingNode.init && readsLocation(bindingNode.init, 0, knownHooks)) return true;
    const parentInit = binding.path.parentPath?.node?.init;
    if (parentInit && readsLocation(parentInit, 0, knownHooks)) return true;
    return false;
  }

  if (node.type === 'ObjectExpression') {
    return (node.properties || []).some((property: any) =>
      returnsLocationBinding(property.value, nodePath, depth + 1, knownHooks));
  }
  if (node.type === 'ArrayExpression') {
    return (node.elements || []).some((element: any) =>
      returnsLocationBinding(element, nodePath, depth + 1, knownHooks));
  }

  return false;
}

/** Name of a function declaration, or of the variable an arrow is assigned to. */
function functionName(fnPath: any): string | undefined {
  if (!fnPath) return undefined;
  if (fnPath.node?.id?.name) return fnPath.node.id.name;
  // const useRouter = () => { ... }
  const parent = fnPath.parentPath?.node;
  if (parent?.type === 'VariableDeclarator' && parent.id?.type === 'Identifier') {
    return parent.id.name;
  }
  return undefined;
}

/** Does this expression read from `window.location` / `location` / `document.location`? */
function readsLocation(node: any, depth = 0, knownHooks?: Set<string>): boolean {
  if (!node || depth > 8) return false;

  if (node.type === 'MemberExpression') {
    const property = node.property?.name;
    if (property && LOCATION_PROPERTIES.has(property)) {
      const objectName = node.object?.name
        || node.object?.property?.name
        || node.object?.object?.name;
      if (objectName === 'location') return true;
    }
    return readsLocation(node.object, depth + 1, knownHooks);
  }

  if (node.type === 'CallExpression') {
    // A call to a helper already proven to return the location, e.g.
    // useState(() => getPath()).
    const calleeName = node.callee?.name || node.callee?.property?.name;
    if (calleeName && knownHooks?.has(calleeName)) return true;
    return readsLocation(node.callee, depth + 1, knownHooks)
      || (node.arguments || []).some((arg: any) => readsLocation(arg, depth + 1, knownHooks));
  }
  if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
    return readsLocation(node.body, depth + 1, knownHooks);
  }
  if (node.type === 'BlockStatement') {
    return (node.body || []).some((statement: any) => readsLocation(statement, depth + 1, knownHooks));
  }
  if (node.type === 'ReturnStatement') {
    return readsLocation(node.argument, depth + 1, knownHooks);
  }
  if (node.type === 'ObjectExpression') {
    return (node.properties || []).some((property: any) => readsLocation(property.value, depth + 1, knownHooks));
  }
  if (node.type === 'ConditionalExpression') {
    return readsLocation(node.consequent, depth + 1, knownHooks) || readsLocation(node.alternate, depth + 1, knownHooks);
  }
  if (node.type === 'LogicalExpression' || node.type === 'BinaryExpression') {
    return readsLocation(node.left, depth + 1, knownHooks) || readsLocation(node.right, depth + 1, knownHooks);
  }
  if (node.type === 'Identifier') return node.name === 'location';

  return false;
}

/**
 * Identify local bindings that hold the current path, by tracing each one back
 * to the browser location or to a known location hook.
 */
function collectPathBindings(ast: any, locationHooks: Set<string>): Set<string> {
  const bindings = new Set<string>();

  const isLocationSource = (init: any): boolean => {
    if (!init) return false;
    if (readsLocation(init)) return true;
    // const { path } = useRouter();  /  const path = useRouter().path;
    const callee = init.type === 'CallExpression' ? init.callee
      : init.type === 'MemberExpression' && init.object?.type === 'CallExpression' ? init.object.callee
      : undefined;
    const calleeName = callee?.name || callee?.property?.name;
    return Boolean(calleeName && locationHooks.has(calleeName));
  };

  traverse(ast, {
    VariableDeclarator(nodePath: any) {
      const { id, init } = nodePath.node;
      if (!isLocationSource(init)) return;

      if (id.type === 'Identifier') {
        bindings.add(id.name);
        return;
      }
      // const { path, navigate } = useRouter();
      if (id.type === 'ObjectPattern') {
        for (const property of id.properties || []) {
          if (property.type === 'ObjectProperty' && property.value?.type === 'Identifier') {
            bindings.add(property.value.name);
          }
        }
      }
    },
  });

  // The path is commonly handed to a helper that does the dispatching, e.g.
  // `renderRoute(path, navigate)` or `<Screen route={path} />`. Follow it to
  // the receiving parameter so that function's comparisons are recognised too.
  // This propagates by position through real call sites rather than by name,
  // so it does not depend on any particular naming convention.
  for (let pass = 0; pass < 3; pass += 1) {
    const before = bindings.size;

    traverse(ast, {
      CallExpression(nodePath: any) {
        const args: any[] = nodePath.node.arguments || [];
        const indices = args
          .map((arg, index) => (arg?.type === 'Identifier' && bindings.has(arg.name) ? index : -1))
          .filter((index) => index >= 0);
        if (indices.length === 0) return;

        const calleeName = nodePath.node.callee?.name;
        if (!calleeName) return;
        const target = nodePath.scope.getBinding(calleeName)?.path?.node;
        const fn = target?.type === 'VariableDeclarator' ? target.init : target;
        if (!fn?.params) return;

        for (const index of indices) {
          const param = fn.params[index];
          if (param?.type === 'Identifier') bindings.add(param.name);
        }
      },
      // <Screen route={path} /> — the prop name becomes a binding in the callee.
      JSXAttribute(nodePath: any) {
        const value = nodePath.node.value;
        if (value?.type !== 'JSXExpressionContainer') return;
        if (value.expression?.type !== 'Identifier') return;
        if (!bindings.has(value.expression.name)) return;
        const propName = nodePath.node.name?.name;
        if (propName) bindings.add(propName);
      },
    });

    if (bindings.size === before) break;
  }

  return bindings;
}

function parseRoutesFromFile(
  ast: any,
  filePath: string,
  rootDir: string,
  locationHooks: Set<string>,
): Route[] {
  const pathBindings = collectPathBindings(ast, locationHooks);

  // Without a binding that provably holds the location, nothing in this file
  // can be shown to be a route.
  if (pathBindings.size === 0) return [];

  // Map locally-bound component names to the file they came from
  const imports = new Map<string, string>();
  traverse(ast, {
    ImportDeclaration(p: any) {
      const resolved = resolveSourceImport(filePath, p.node.source.value, rootDir);
      if (!resolved) return;
      for (const spec of p.node.specifiers) imports.set(spec.local.name, resolved);
    },
  });

  const routes: Route[] = [];
  const seen = new Set<string>();

  const record = (rawPath: string, branch: unknown, isPrefix: boolean) => {
    const routePath = normalizePath(rawPath, isPrefix);
    if (!routePath || seen.has(routePath)) return;
    seen.add(routePath);

    const rendered = renderedComponent(branch, imports, rootDir);
    routes.push({
      path: routePath,
      component_name: rendered?.component_name,
      source_file: rendered?.source_file,
      dynamic_segments: dynamicSegmentsFor(routePath),
      auth_required: false,
      headings: [],
    });
  };

  const recordAll = (test: any, branch: unknown) => {
    for (const match of pathComparisons(test, pathBindings)) {
      record(match.value, branch, match.isPrefix);
    }
  };

  traverse(ast, {
    IfStatement(nodePath: any) {
      recordAll(nodePath.node.test, nodePath.node.consequent);
    },
    ConditionalExpression(nodePath: any) {
      recordAll(nodePath.node.test, nodePath.node.consequent);
    },
    SwitchStatement(nodePath: any) {
      // Only a switch over the path itself contributes routes.
      if (!isPathExpression(nodePath.node.discriminant, pathBindings)) return;
      for (const switchCase of nodePath.node.cases || []) {
        const test = switchCase.test;
        if (test?.type === 'StringLiteral' && test.value.startsWith('/')) {
          record(test.value, switchCase.consequent, false);
        }
      }
    },
  });

  return routes;
}

/** Is this expression the router path (or a normalisation of it)? */
function isPathExpression(node: any, pathBindings: Set<string>, depth = 0): boolean {
  if (!node || depth > 6) return false;

  if (node.type === 'Identifier') return pathBindings.has(node.name);
  if (readsLocation(node)) return true;

  // Tolerate the usual reshaping: path.toLowerCase(), path.replace(...),
  // location.pathname.split('?')[0], router.path, etc.
  if (node.type === 'MemberExpression') {
    return isPathExpression(node.object, pathBindings, depth + 1)
      || (node.property?.type === 'Identifier' && pathBindings.has(node.property.name));
  }
  if (node.type === 'CallExpression') {
    return isPathExpression(node.callee, pathBindings, depth + 1);
  }
  if (node.type === 'TSNonNullExpression' || node.type === 'TSAsExpression') {
    return isPathExpression(node.expression, pathBindings, depth + 1);
  }

  return false;
}

interface PathComparison {
  value: string;
  /** A prefix/pattern match implies a dynamic child segment. */
  isPrefix: boolean;
}

/**
 * Collect route paths from comparisons against a known path binding.
 *
 * Recognises `path === '/a'`, `'/a' === path`, `path.startsWith('/a/')`, and
 * the `||`/`&&` combinations these are written in. A literal is only taken when
 * the other side of the comparison is provably the router path.
 */
function pathComparisons(node: any, pathBindings: Set<string>): PathComparison[] {
  if (!node) return [];

  if (node.type === 'LogicalExpression') {
    return [
      ...pathComparisons(node.left, pathBindings),
      ...pathComparisons(node.right, pathBindings),
    ];
  }

  if (node.type === 'BinaryExpression' && (node.operator === '===' || node.operator === '==')) {
    const { left, right } = node;
    if (left?.type === 'StringLiteral' && isPathExpression(right, pathBindings)) {
      return [{ value: left.value, isPrefix: false }];
    }
    if (right?.type === 'StringLiteral' && isPathExpression(left, pathBindings)) {
      return [{ value: right.value, isPrefix: false }];
    }
    return [];
  }

  if (node.type === 'CallExpression' && node.callee?.type === 'MemberExpression') {
    const method = node.callee.property?.name;
    // `includes` is deliberately excluded: a substring test is not a route
    // declaration, and accepting it invents routes from API and asset URLs.
    if (method !== 'startsWith') return [];
    if (!isPathExpression(node.callee.object, pathBindings)) return [];

    const arg = node.arguments?.[0];
    if (arg?.type === 'StringLiteral' && arg.value.startsWith('/')) {
      return [{ value: arg.value, isPrefix: true }];
    }
  }

  return [];
}

/**
 * Normalize a matched literal into a route path.
 *
 * A prefix match denotes a dynamic child route, so `/orders/` becomes
 * `/orders/:id`. An exact prefix without a trailing slash is the parent route
 * itself and is left alone.
 */
function normalizePath(raw: string, isPrefix: boolean): string | undefined {
  if (!raw.startsWith('/')) return undefined;

  let routePath = raw.split('?')[0].split('#')[0];

  if (routePath.length > 1 && routePath.endsWith('/')) {
    routePath = isPrefix ? `${routePath}:id` : routePath.slice(0, -1);
  }

  return routePath;
}

/**
 * Find the first imported component rendered inside a branch, so the route can
 * be attributed to the file that actually defines the page.
 */
function renderedComponent(
  node: any,
  imports: Map<string, string>,
  rootDir: string,
  depth = 0,
): { source_file: string; component_name: string } | undefined {
  if (!node || depth > 12) return undefined;

  if (Array.isArray(node)) {
    for (const child of node) {
      const found = renderedComponent(child, imports, rootDir, depth + 1);
      if (found) return found;
    }
    return undefined;
  }

  if (node.type === 'JSXElement') {
    const nameNode = node.openingElement?.name;
    const name = nameNode?.type === 'JSXIdentifier' ? nameNode.name : undefined;
    if (name && imports.has(name)) {
      return {
        source_file: path.relative(rootDir, imports.get(name)!),
        component_name: name,
      };
    }
    // Fall back to a wrapped child, e.g. <Layout><LeadsPage /></Layout>
    return renderedComponent(node.children, imports, rootDir, depth + 1);
  }

  switch (node.type) {
    case 'ReturnStatement':
      return renderedComponent(node.argument, imports, rootDir, depth + 1);
    case 'BlockStatement':
      return renderedComponent(node.body, imports, rootDir, depth + 1);
    case 'JSXExpressionContainer':
      return renderedComponent(node.expression, imports, rootDir, depth + 1);
    case 'ConditionalExpression':
      return (
        renderedComponent(node.consequent, imports, rootDir, depth + 1)
        || renderedComponent(node.alternate, imports, rootDir, depth + 1)
      );
    case 'LogicalExpression':
      return renderedComponent(node.right, imports, rootDir, depth + 1);
    case 'ExpressionStatement':
      return renderedComponent(node.expression, imports, rootDir, depth + 1);
    case 'JSXFragment':
      return renderedComponent(node.children, imports, rootDir, depth + 1);
    default:
      return undefined;
  }
}

function dynamicSegmentsFor(routePath: string): string[] {
  return routePath
    .split('/')
    .filter((segment) => segment.startsWith(':'))
    .map((segment) => segment.slice(1));
}

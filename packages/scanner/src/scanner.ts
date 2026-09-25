import * as path from 'path';
import fg from 'fast-glob';
import type { ScanOptions, ScanResult, Route, ScannedElement, FrameworkType } from './types';
import {
  detectFramework,
  extractNextAppRoutes,
  extractNextPagesRoutes,
  extractReactRouterRoutes,
  extractAngularRoutes,
  extractVueRoutes,
  extractHtmlRoutes,
  extractRemixRoutes,
  extractSvelteKitRoutes,
  extractCustomRouterRoutes,
} from './detectors';
import { extractElements } from './extractors';
import { uploadKnowledgeBase } from './uploader';
import { buildUIMap, resolveToggleRelationships } from './ui-map';
import { buildProductGraph } from './product-graph';
import { renderedSourceImports, type TabOwner } from './source-relationships';
import { bestMatchingRoutePath } from './route-match';

/**
 * Extract one file's elements, never letting that file take the scan down.
 *
 * Parsing somebody else's repository is an inherently partial job: a file can
 * use a syntax this parser has not learned, or trip a Babel invariant that
 * `errorRecovery` does not cover. Losing one file's buttons is a small,
 * local loss. Losing the whole scan — after every route has already been
 * found — is the difference between a product that works on a customer's
 * codebase and one that does not, so the failure is contained here and
 * reported rather than thrown.
 */
async function extractElementsSafely(
  filePath: string,
  routePath: string,
  scopeComponent?: string,
): Promise<ScannedElement[]> {
  try {
    return await extractElements(filePath, routePath, scopeComponent);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[GuideAI] Skipped ${filePath}: ${reason}`);
    return [];
  }
}

/**
 * Run the full GuideAI scanning pipeline:
 *
 * 1. Detect framework
 * 2. Extract routes based on framework
 * 3. For each route's source files, extract interactive elements
 * 4. Build fingerprints for each element
 * 5. Upload to backend (unless dryRun)
 * 6. Return ScanResult with timing
 */
export async function scan(options: ScanOptions): Promise<ScanResult> {
  const start = Date.now();
  const rootDir = path.resolve(options.dir || process.cwd());
  const apiUrl = options.apiUrl || 'https://cdn.3guideai.com';

  // Step 1: Detect framework
  console.log('[GuideAI] Detecting framework...');
  const framework = await detectFramework(rootDir);
  console.log(`[GuideAI] Framework detected: ${framework}`);

  // Step 2: Extract routes
  console.log('[GuideAI] Extracting routes...');
  const routes = await extractRoutes(framework, rootDir);
  console.log(`[GuideAI] Found ${routes.length} routes`);

  // Step 3: Extract elements from each route's source files
  console.log('[GuideAI] Extracting elements...');
  const elements = await extractAllElements(routes, rootDir, framework);
  console.log(`[GuideAI] Found ${elements.length} interactive elements`);

  // Step 3.5: Resolve toggle → hidden element relationships
  resolveToggleRelationships(elements);

  // Step 4: Build a route/component/section tree for LLM context
  const uiMap = buildUIMap(framework, routes, elements);
  console.log(`[GuideAI] Built UI map (${uiMap.route_count} routes, ${uiMap.element_count} elements)`);
  const productGraph = buildProductGraph(framework, routes, elements, uiMap);
  console.log(
    `[GuideAI] Built product graph (${productGraph.application.type}, confidence ${productGraph.application.confidence.toFixed(2)})`,
  );

  const result: ScanResult = {
    framework,
    routes,
    elements,
    ui_map: uiMap,
    product_graph: productGraph,
    duration_ms: Date.now() - start,
  };

  // Step 5: Upload to backend (unless dry run)
  if (!options.dryRun) {
    if (!options.key) {
      throw new Error('A site API key is required for uploads. Pass --key sk_live_... or use dry-run mode.');
    }

    console.log('[GuideAI] Uploading knowledge base...');
    try {
      await uploadKnowledgeBase(apiUrl, options.key, result);
      console.log('[GuideAI] Knowledge base uploaded successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[GuideAI] Upload failed: ${message}`);
      throw error;
    }
  }

  result.duration_ms = Date.now() - start;
  return result;
}

/**
 * Extract routes based on the detected framework.
 */
async function extractRoutes(
  framework: FrameworkType,
  rootDir: string,
): Promise<Route[]> {
  switch (framework) {
    case 'nextjs-app-router':
      return extractNextAppRoutes(rootDir);

    case 'nextjs-pages-router':
      return extractNextPagesRoutes(rootDir);

    case 'react-router':
      return extractReactRouterRoutes(rootDir);

    case 'angular':
      return extractAngularRoutes(rootDir);

    case 'vue-router':
    case 'nuxt':
      return extractVueRoutes(rootDir);

    case 'remix':
      return extractRemixRoutes(rootDir);

    case 'sveltekit':
      return extractSvelteKitRoutes(rootDir);

    case 'react-spa':
      return extractCustomRouterRoutes(rootDir);

    case 'plain-html':
      return extractHtmlRoutes(rootDir);

    default: {
      // Exhaustive check
      const _exhaustive: never = framework;
      console.warn(`[GuideAI] Unknown framework: ${_exhaustive}`);
      return [];
    }
  }
}

/**
 * Extract interactive elements from all routes' source files.
 *
 * For file-based routing frameworks, the source file is known per route.
 * For code-based routing, we scan the src/ directory for component files.
 */
async function extractAllElements(
  routes: Route[],
  rootDir: string,
  framework: FrameworkType,
): Promise<ScannedElement[]> {
  const allElements: ScannedElement[] = [];
  const processedFiles = new Set<string>();

  // Follow rendered imports from explicit route entry components. A shared
  // component may appear on several routes (or tabs), so dedupe by context.
  const visitedContexts = new Set<string>();
  async function visit(
    file: string,
    route: string,
    owner?: TabOwner,
    ancestry = new Set<string>(),
    // Set only for a route's entry file when that file also defines other
    // routes' components; imports reached from it are scanned in full.
    scopeComponent?: string,
  ): Promise<void> {
    const key = `${file}|${route}|${owner?.tab_group || ''}|${owner?.tab || ''}`;
    if (visitedContexts.has(key) || ancestry.has(file)) return;
    visitedContexts.add(key);
    processedFiles.add(file);
    const elements = await extractElementsSafely(file, route, scopeComponent);
    allElements.push(...elements.map(element => owner && !element.tab ? { ...element, ...owner } : element));
    const nextAncestry = new Set(ancestry).add(file);
    for (const imported of renderedSourceImports(file, route, rootDir)) {
      // Another route entry isn't owned by this screen merely because a
      // router/layout imports it. Route declarations are scanned separately.
      if (routes.some(r => r.source_file && path.resolve(rootDir, r.source_file) === imported.file && r.path !== route)) continue;
      await visit(imported.file, route, imported.owner || owner, nextAncestry);
    }
  }
  // Barrel modules export many page components from one file. Group routes by
  // source file so a shared file is split per component instead of being
  // claimed whole by whichever route reached it first.
  const routesPerFile = new Map<string, number>();
  for (const route of routes) {
    if (!route.source_file) continue;
    const absolutePath = path.resolve(rootDir, route.source_file);
    routesPerFile.set(absolutePath, (routesPerFile.get(absolutePath) || 0) + 1);
  }

  for (const route of routes) {
    if (!route.source_file) continue;
    const absolutePath = path.resolve(rootDir, route.source_file);

    // When several routes share one module, limit each to its own component so
    // siblings do not absorb each other's elements.
    const scope = (routesPerFile.get(absolutePath) || 0) > 1
      ? route.component_name
      : undefined;

    if (route.component_name) {
      await visit(absolutePath, route.path, undefined, new Set<string>(), scope);
    } else if (!processedFiles.has(absolutePath)) {
      processedFiles.add(absolutePath);
      allElements.push(...await extractElementsSafely(absolutePath, route.path));
    }
  }

  // For SPA frameworks, also scan common component directories
  if (shouldScanComponents(framework)) {
    const componentFiles = await findComponentFiles(rootDir, routes, framework);

    for (const filePath of componentFiles) {
      if (processedFiles.has(filePath)) continue;
      processedFiles.add(filePath);

      // Associate components with the closest route or use '/' as fallback
      const routePath = inferRouteForComponent(filePath, routes, rootDir, framework);
      const elements = await extractElementsSafely(filePath, routePath);
      allElements.push(...elements);
    }
  }

  return dropAmbiguousSelectors(deduplicateElements(allElements));
}

/**
 * Clear the selector on elements that do not own it uniquely.
 *
 * ``buildSourceSelector`` works one element at a time, so it cannot tell that
 * a sidebar "Overview" link, a header "Home" link and a logo all render as
 * ``a[href="/"]``. The player resolves a selector with ``querySelector``,
 * which returns the first match — so a shared selector silently highlights
 * whichever of them happens to come first in the DOM.
 *
 * The elements themselves are kept: they are genuinely distinct controls, and
 * their fingerprints carry the text that tells them apart. Only the selector
 * is dropped, which moves them onto the player's fingerprint tier rather than
 * leaving them pointing at a sibling.
 *
 * Scoped per route, since two routes each having their own "Save" is not a
 * collision — only one of those pages is ever on screen.
 */
export function dropAmbiguousSelectors(elements: ScannedElement[]): ScannedElement[] {
  const counts = new Map<string, number>();
  for (const el of elements) {
    if (!el.selector) continue;
    const key = `${el.route_path}|${el.selector}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  if (![...counts.values()].some((count) => count > 1)) return elements;

  return elements.map((el) => {
    if (!el.selector) return el;
    if ((counts.get(`${el.route_path}|${el.selector}`) || 0) < 2) return el;
    const { selector: _dropped, ...rest } = el;
    return rest as ScannedElement;
  });
}

/**
 * Determine if we should scan additional component directories
 * beyond the route source files.
 */
function shouldScanComponents(framework: FrameworkType): boolean {
  return framework !== 'plain-html';
}

/**
 * Find component files in common directories.
 */
async function findComponentFiles(
  rootDir: string,
  routes: Route[],
  framework: FrameworkType,
): Promise<string[]> {
  const searchRoots = discoverComponentSearchRoots(rootDir, routes, framework);
  const patterns = Array.from(searchRoots).map((searchRoot) =>
    path.join(searchRoot, '**/*.{tsx,jsx,ts,js,vue,svelte}').replace(/\\/g, '/'),
  );

  const files = await fg(patterns, {
    ignore: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.stories.*',
      '**/__tests__/**',
      '**/__mocks__/**',
    ],
    absolute: true,
  });

  return files.filter(isLikelyUiComponentFile);
}

function discoverComponentSearchRoots(
  rootDir: string,
  routes: Route[],
  framework: FrameworkType,
): Set<string> {
  const roots = new Set<string>();

  for (const route of routes) {
    if (!route.source_file) continue;
    const relativePath = path.isAbsolute(route.source_file)
      ? path.relative(rootDir, route.source_file)
      : route.source_file;
    const sourceRoot = inferSourceRoot(relativePath);
    if (sourceRoot) {
      roots.add(path.join(rootDir, sourceRoot));
    }
  }

  if (roots.size === 0) {
    if (framework === 'nextjs-app-router' || framework === 'nextjs-pages-router') {
      roots.add(path.join(rootDir, 'src'));
      roots.add(path.join(rootDir, 'app'));
      roots.add(path.join(rootDir, 'pages'));
    } else {
      roots.add(path.join(rootDir, 'src'));
    }
  }

  return new Set(
    Array.from(roots).filter((candidate) => {
      const relative = path.relative(rootDir, candidate);
      return !relative.startsWith('..') && !path.isAbsolute(relative);
    }),
  );
}

function inferSourceRoot(relativeFilePath: string): string | undefined {
  const normalized = relativeFilePath.replace(/\\/g, '/');
  const markers = ['/app/', '/pages/', '/routes/'];

  for (const marker of markers) {
    const index = normalized.indexOf(marker);
    if (index > 0) {
      return normalized.slice(0, index);
    }
    if (normalized.startsWith(marker.slice(1))) {
      return marker.slice(1, -1);
    }
  }

  if (normalized.startsWith('src/')) {
    return 'src';
  }

  const firstSegment = normalized.split('/')[0];
  return firstSegment || undefined;
}

function isLikelyUiComponentFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  const extension = path.extname(normalized);

  if (['.tsx', '.jsx', '.vue', '.svelte'].includes(extension)) {
    return true;
  }

  if (!['.ts', '.js'].includes(extension)) {
    return false;
  }

  return /(^|\/)(app|pages|routes|components|component|layouts?|views|screens|ui|modules|widgets|features|partials)\//.test(normalized) ||
    /(layout|page|route|nav|menu|sidebar|header|footer|breadcrumb|drawer|dialog|modal|accordion|tabs?)/.test(normalized);
}

/**
 * Try to infer which route a component file belongs to based on
 * directory structure and naming conventions.
 */
function inferRouteForComponent(
  filePath: string,
  routes: Route[],
  rootDir: string,
  framework: FrameworkType,
): string {
  const fileBasedRoute = inferFileBasedRoute(filePath, routes, rootDir, framework);
  if (fileBasedRoute) {
    return fileBasedRoute;
  }

  const relativePath = path.relative(rootDir, filePath).toLowerCase();
  const fileName = path
    .basename(filePath, path.extname(filePath))
    .toLowerCase();

  // Strategy 1: Match by component name
  for (const route of routes) {
    if (
      route.component_name &&
      fileName.includes(route.component_name.toLowerCase())
    ) {
      return route.path;
    }
  }

  // Strategy 2: Weighted multi-segment matching
  let bestRoute = '/';
  let bestScore = 0;
  for (const route of routes) {
    const routeSegments = route.path
      .split('/')
      .filter(Boolean)
      .filter((s) => !s.startsWith(':'));

    let score = 0;
    for (const segment of routeSegments) {
      if (relativePath.includes(segment.toLowerCase())) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestRoute = route.path;
    }
  }

  return bestRoute;
}

function inferFileBasedRoute(
  filePath: string,
  routes: Route[],
  rootDir: string,
  framework: FrameworkType,
): string | undefined {
  if (framework === 'nextjs-app-router') {
    const appRelative = relativeFromKnownRoot(filePath, rootDir, ['src/app', 'app']);
    if (!appRelative) return undefined;
    const candidate = inferAppDirectoryRoute(appRelative);
    return matchExistingRoute(candidate, routes);
  }

  if (framework === 'nextjs-pages-router') {
    const pagesRelative = relativeFromKnownRoot(filePath, rootDir, ['src/pages', 'pages']);
    if (!pagesRelative) return undefined;
    const candidate = inferPagesDirectoryRoute(pagesRelative);
    return matchExistingRoute(candidate, routes);
  }

  return undefined;
}

function relativeFromKnownRoot(
  filePath: string,
  rootDir: string,
  roots: string[],
): string | undefined {
  for (const root of roots) {
    const absoluteRoot = path.join(rootDir, root);
    const relative = path.relative(absoluteRoot, filePath);
    if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
      return relative;
    }
  }
  return undefined;
}

function inferAppDirectoryRoute(relativePath: string): string {
  const directory = path.dirname(relativePath);
  const fileName = path.basename(relativePath, path.extname(relativePath)).toLowerCase();
  const routeFileNames = new Set(['page', 'layout', 'template', 'loading', 'error', 'default', 'not-found']);
  const nonRouteSegments = new Set(['components', 'component', 'ui', 'lib', 'hooks', 'providers', 'context']);
  const sourceSegments = directory === '.' ? [] : directory.split(path.sep);
  const routeSegments: string[] = [];

  for (const segment of sourceSegments) {
    const lower = segment.toLowerCase();
    if (nonRouteSegments.has(lower)) break;
    if (lower.startsWith('@')) continue;
    if (lower.startsWith('(') && lower.endsWith(')')) continue;
    routeSegments.push(normalizeFileRouteSegment(segment));
  }

  if (!routeFileNames.has(fileName) && fileName !== 'index') {
    const normalizedFileName = normalizeFileRouteSegment(fileName);
    if (normalizedFileName) {
      routeSegments.push(normalizedFileName);
    }
  }

  return segmentsToRoutePath(routeSegments);
}

function inferPagesDirectoryRoute(relativePath: string): string {
  const directory = path.dirname(relativePath);
  const fileName = path.basename(relativePath, path.extname(relativePath)).toLowerCase();
  const routeSegments = directory === '.' ? [] : directory.split(path.sep).map(normalizeFileRouteSegment);

  if (fileName !== 'index') {
    const normalizedFileName = normalizeFileRouteSegment(fileName);
    if (normalizedFileName) {
      routeSegments.push(normalizedFileName);
    }
  }

  return segmentsToRoutePath(routeSegments);
}

function normalizeFileRouteSegment(segment: string): string {
  const optionalCatchAll = segment.match(/^\[\[\.\.\.(\w+)\]\]$/);
  if (optionalCatchAll) return `:${optionalCatchAll[1]}*`;

  const catchAll = segment.match(/^\[\.\.\.(\w+)\]$/);
  if (catchAll) return `:${catchAll[1]}*`;

  const dynamic = segment.match(/^\[(\w+)\]$/);
  if (dynamic) return `:${dynamic[1]}`;

  return segment.replace(/[()@]/g, '');
}

function segmentsToRoutePath(segments: string[]): string {
  const cleaned = segments.filter(Boolean);
  return cleaned.length ? `/${cleaned.join('/')}` : '/';
}

function matchExistingRoute(candidatePath: string, routes: Route[]): string {
  return bestMatchingRoutePath(candidatePath, routes);
}

/**
 * Deduplicate elements by stable signals, keeping the highest-scored version.
 */
function deduplicateElements(elements: ScannedElement[]): ScannedElement[] {
  const seen = new Map<string, ScannedElement>();

  for (const el of elements) {
    const key = [
      el.data_guideai || '',
      el.data_testid || '',
      el.dom_id || '',
      el.tag,
      el.role || '',
      el.text || '',
      el.aria_label || '',
      el.name || '',
      el.route_path,
      el.tab_group || '',
      el.tab || '',
      el.source_file || '',
      el.container || '',
    ].join('|');

    const existing = seen.get(key);
    if (
      !existing ||
      el.fingerprint.total_score > existing.fingerprint.total_score
    ) {
      seen.set(key, el);
    }
  }

  return Array.from(seen.values());
}

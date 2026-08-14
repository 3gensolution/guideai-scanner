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
} from './detectors';
import { extractElements } from './extractors';
import { uploadKnowledgeBase } from './uploader';
import { buildUIMap, resolveToggleRelationships } from './ui-map';
import { buildProductGraph } from './product-graph';

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

  // Process routes with known source files
  for (const route of routes) {
    if (!route.source_file) continue;

    const absolutePath = path.isAbsolute(route.source_file)
      ? route.source_file
      : path.join(rootDir, route.source_file);

    if (processedFiles.has(absolutePath)) continue;
    processedFiles.add(absolutePath);

    const elements = await extractElements(absolutePath, route.path);
    allElements.push(...elements);
  }

  // For SPA frameworks, also scan common component directories
  if (shouldScanComponents(framework)) {
    const componentFiles = await findComponentFiles(rootDir, routes, framework);

    for (const filePath of componentFiles) {
      if (processedFiles.has(filePath)) continue;
      processedFiles.add(filePath);

      // Associate components with the closest route or use '/' as fallback
      const routePath = inferRouteForComponent(filePath, routes, rootDir, framework);
      const elements = await extractElements(filePath, routePath);
      allElements.push(...elements);
    }
  }

  return deduplicateElements(allElements);
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
  const normalizedCandidate = normalizeRoutePath(candidatePath);
  const exact = routes.find((route) => normalizeRoutePath(route.path) === normalizedCandidate);
  if (exact) return exact.path;

  let bestRoute = '/';
  let bestScore = -1;

  for (const route of routes) {
    const normalizedRoute = normalizeRoutePath(route.path);
    if (
      normalizedCandidate === normalizedRoute ||
      normalizedCandidate.startsWith(`${normalizedRoute}/`) ||
      normalizedRoute.startsWith(`${normalizedCandidate}/`)
    ) {
      const score = normalizedRoute.split('/').filter(Boolean).length;
      if (score > bestScore) {
        bestScore = score;
        bestRoute = route.path;
      }
    }
  }

  return bestRoute;
}

function normalizeRoutePath(routePath: string): string {
  return routePath.replace(/\/+$/, '') || '/';
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

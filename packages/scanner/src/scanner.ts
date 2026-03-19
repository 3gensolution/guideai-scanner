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
} from './detectors';
import { extractElements } from './extractors';
import { uploadKnowledgeBase } from './uploader';

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
  const apiUrl = options.apiUrl || 'https://api.guideai.io';

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

  const result: ScanResult = {
    framework,
    routes,
    elements,
    duration_ms: Date.now() - start,
  };

  // Step 4: Upload to backend (unless dry run)
  if (!options.dryRun) {
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
    const componentFiles = await findComponentFiles(rootDir);

    for (const filePath of componentFiles) {
      if (processedFiles.has(filePath)) continue;
      processedFiles.add(filePath);

      // Associate components with the closest route or use '/' as fallback
      const routePath = inferRouteForComponent(filePath, routes, rootDir);
      const elements = await extractElements(filePath, routePath);
      allElements.push(...elements);
    }
  }

  return allElements;
}

/**
 * Determine if we should scan additional component directories
 * beyond the route source files.
 */
function shouldScanComponents(framework: FrameworkType): boolean {
  return ['react-router', 'angular', 'vue-router'].includes(framework);
}

/**
 * Find component files in common directories.
 */
async function findComponentFiles(rootDir: string): Promise<string[]> {
  const patterns = [
    'src/components/**/*.{tsx,jsx,ts,js,vue}',
    'src/views/**/*.{tsx,jsx,ts,js,vue}',
    'src/pages/**/*.{tsx,jsx,ts,js,vue}',
    'app/components/**/*.{tsx,jsx,ts,js}',
  ].map((p) => path.join(rootDir, p).replace(/\\/g, '/'));

  return fg(patterns, {
    ignore: [
      '**/node_modules/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.stories.*',
      '**/__tests__/**',
      '**/__mocks__/**',
    ],
    absolute: true,
  });
}

/**
 * Try to infer which route a component file belongs to based on
 * directory structure and naming conventions.
 */
function inferRouteForComponent(
  filePath: string,
  routes: Route[],
  rootDir: string,
): string {
  const relativePath = path.relative(rootDir, filePath).toLowerCase();

  // Try to match by directory name similarity
  for (const route of routes) {
    const routeSegments = route.path
      .split('/')
      .filter(Boolean)
      .filter((s) => !s.startsWith(':'));

    for (const segment of routeSegments) {
      if (relativePath.includes(segment.toLowerCase())) {
        return route.path;
      }
    }
  }

  // Default to root route
  return '/';
}

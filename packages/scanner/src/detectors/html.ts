import * as fs from 'fs';
import * as path from 'path';
import fg from 'fast-glob';
import type { Route } from '../types';

/**
 * Extract routes from a plain HTML project.
 *
 * Strategy:
 * 1. Parse sitemap.xml if it exists
 * 2. Scan for .html files in the project
 * 3. For each HTML file, extract page title, headings, and internal links
 */
export async function extractHtmlRoutes(rootDir: string): Promise<Route[]> {
  const routes: Route[] = [];
  const discoveredPaths = new Set<string>();

  // Strategy 1: Parse sitemap.xml
  const sitemapRoutes = await parseSitemap(rootDir);
  for (const route of sitemapRoutes) {
    discoveredPaths.add(route.path);
    routes.push(route);
  }

  // Strategy 2: Scan for HTML files
  const htmlFiles = await fg(
    path.join(rootDir, '**/*.html').replace(/\\/g, '/'),
    {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
      absolute: true,
    },
  );

  for (const htmlFile of htmlFiles) {
    const relativePath = path.relative(rootDir, htmlFile);
    const routePath = htmlFileToRoutePath(relativePath);

    if (discoveredPaths.has(routePath)) {
      // Enrich existing route with page content
      const existing = routes.find((r) => r.path === routePath);
      if (existing) {
        const content = await parseHtmlFile(htmlFile);
        existing.page_title = existing.page_title || content.title;
        existing.headings = content.headings;
        existing.source_file = relativePath;
      }
      continue;
    }

    discoveredPaths.add(routePath);
    const content = await parseHtmlFile(htmlFile);

    routes.push({
      path: routePath,
      page_title: content.title,
      source_file: relativePath,
      dynamic_segments: [],
      auth_required: false,
      headings: content.headings,
    });

    // Discover linked pages
    for (const link of content.internalLinks) {
      if (!discoveredPaths.has(link)) {
        discoveredPaths.add(link);
        routes.push({
          path: link,
          dynamic_segments: [],
          auth_required: false,
          headings: [],
        });
      }
    }
  }

  routes.sort((a, b) => a.path.localeCompare(b.path));
  return routes;
}

/**
 * Parse sitemap.xml and extract URL paths.
 */
async function parseSitemap(rootDir: string): Promise<Route[]> {
  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  const routes: Route[] = [];

  try {
    const content = await fs.promises.readFile(sitemapPath, 'utf-8');

    // Extract <loc> elements from sitemap XML using regex
    const locPattern = /<loc>\s*(.*?)\s*<\/loc>/gi;
    let match: RegExpExecArray | null;

    while ((match = locPattern.exec(content)) !== null) {
      const url = match[1].trim();
      const routePath = urlToPath(url);

      if (routePath) {
        routes.push({
          path: routePath,
          dynamic_segments: [],
          auth_required: false,
          headings: [],
        });
      }
    }
  } catch {
    // sitemap.xml does not exist or is unreadable
  }

  return routes;
}

/**
 * Convert a full URL to a route path.
 */
function urlToPath(url: string): string {
  try {
    const parsed = new URL(url);
    let pathname = parsed.pathname;

    // Remove trailing slash unless root
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // Remove .html extension
    if (pathname.endsWith('.html')) {
      pathname = pathname.slice(0, -5);
    }

    return pathname || '/';
  } catch {
    // If it's not a full URL, treat as a path
    let pathname = url;
    if (pathname.endsWith('.html')) {
      pathname = pathname.slice(0, -5);
    }
    if (!pathname.startsWith('/')) {
      pathname = '/' + pathname;
    }
    return pathname;
  }
}

/**
 * Convert an HTML file's relative path to a route path.
 */
function htmlFileToRoutePath(relativePath: string): string {
  // Normalize separators
  let routePath = relativePath.replace(/\\/g, '/');

  // Remove .html extension
  if (routePath.endsWith('.html')) {
    routePath = routePath.slice(0, -5);
  }

  // index files map to directory path
  if (routePath.endsWith('/index') || routePath === 'index') {
    routePath = routePath.replace(/\/?index$/, '');
  }

  // Ensure leading slash
  if (!routePath.startsWith('/')) {
    routePath = '/' + routePath;
  }

  // Root
  if (routePath === '/' || routePath === '') {
    return '/';
  }

  // Remove trailing slash
  if (routePath.length > 1 && routePath.endsWith('/')) {
    routePath = routePath.slice(0, -1);
  }

  return routePath;
}

interface HtmlContent {
  title: string | undefined;
  headings: string[];
  internalLinks: string[];
}

/**
 * Parse an HTML file and extract title, headings, and internal links.
 */
async function parseHtmlFile(filePath: string): Promise<HtmlContent> {
  let source: string;
  try {
    source = await fs.promises.readFile(filePath, 'utf-8');
  } catch {
    return { title: undefined, headings: [], internalLinks: [] };
  }

  // Extract <title>
  const titleMatch = source.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? stripHtmlTags(titleMatch[1]).trim() : undefined;

  // Extract headings (h1-h6)
  const headings: string[] = [];
  const headingPattern = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi;
  let headingMatch: RegExpExecArray | null;
  while ((headingMatch = headingPattern.exec(source)) !== null) {
    const text = stripHtmlTags(headingMatch[1]).trim();
    if (text) {
      headings.push(text);
    }
  }

  // Extract internal <a href="..."> links
  const internalLinks: string[] = [];
  const linkPattern = /<a\s+[^>]*href\s*=\s*["'](.*?)["'][^>]*>/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkPattern.exec(source)) !== null) {
    const href = linkMatch[1].trim();

    // Skip external links, anchors, mailto, tel, javascript
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('//') ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:')
    ) {
      continue;
    }

    let linkPath = href;

    // Remove .html extension
    if (linkPath.endsWith('.html')) {
      linkPath = linkPath.slice(0, -5);
    }

    // Remove anchors
    const hashIndex = linkPath.indexOf('#');
    if (hashIndex !== -1) {
      linkPath = linkPath.slice(0, hashIndex);
    }

    // Remove query strings
    const queryIndex = linkPath.indexOf('?');
    if (queryIndex !== -1) {
      linkPath = linkPath.slice(0, queryIndex);
    }

    if (!linkPath) continue;

    // Ensure leading slash
    if (!linkPath.startsWith('/')) {
      linkPath = '/' + linkPath;
    }

    // Remove trailing slash unless root
    if (linkPath.length > 1 && linkPath.endsWith('/')) {
      linkPath = linkPath.slice(0, -1);
    }

    internalLinks.push(linkPath);
  }

  return {
    title,
    headings,
    internalLinks: [...new Set(internalLinks)],
  };
}

/**
 * Strip HTML tags from a string.
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

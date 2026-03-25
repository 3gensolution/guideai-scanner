import * as fs from 'fs';
import * as path from 'path';
import type { FrameworkType } from '../types';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * Detect the framework used in a project by inspecting package.json
 * dependencies and directory structure.
 */
export async function detectFramework(rootDir: string): Promise<FrameworkType> {
  const pkgPath = path.join(rootDir, 'package.json');
  let pkg: PackageJson = {};

  try {
    const raw = await fs.promises.readFile(pkgPath, 'utf-8');
    pkg = JSON.parse(raw) as PackageJson;
  } catch {
    // No package.json — likely plain HTML
    return 'plain-html';
  }

  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  // Next.js detection — differentiate App Router vs Pages Router
  if (allDeps['next']) {
    const hasAppDir = await directoryExists(rootDir, [
      'app',
      'src/app',
    ]);
    const hasPagesDir = await directoryExists(rootDir, [
      'pages',
      'src/pages',
    ]);

    // Prefer App Router if the app/ directory exists
    if (hasAppDir) {
      return 'nextjs-app-router';
    }
    if (hasPagesDir) {
      return 'nextjs-pages-router';
    }
    // Default to App Router for Next.js 13+ projects without clear signals
    return 'nextjs-app-router';
  }

  // Remix detection
  if (allDeps['@remix-run/react'] || allDeps['@remix-run/node'] || allDeps['remix']) {
    return 'remix';
  }

  // SvelteKit detection
  if (allDeps['@sveltejs/kit']) {
    return 'sveltekit';
  }

  // Nuxt detection (must come before generic Vue check)
  if (allDeps['nuxt'] || allDeps['nuxt3']) {
    return 'nuxt';
  }

  // Angular detection
  if (allDeps['@angular/core']) {
    return 'angular';
  }

  // Vue Router detection
  if (allDeps['vue-router'] || allDeps['vue']) {
    return 'vue-router';
  }

  // React Router detection
  if (allDeps['react-router-dom'] || allDeps['react-router']) {
    return 'react-router';
  }

  return 'plain-html';
}

/**
 * Check whether any of the candidate directories exist under rootDir.
 */
async function directoryExists(
  rootDir: string,
  candidates: string[],
): Promise<boolean> {
  for (const candidate of candidates) {
    const fullPath = path.join(rootDir, candidate);
    try {
      const stat = await fs.promises.stat(fullPath);
      if (stat.isDirectory()) {
        return true;
      }
    } catch {
      // Directory does not exist, continue
    }
  }
  return false;
}

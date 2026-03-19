import type { KnowledgeBase, Route, ScannedElement, FrameworkType } from '@guideai/shared';

export interface ScanOptions {
  key: string;
  dir?: string;
  apiUrl?: string;
  output?: string;
  dryRun?: boolean;
}

export interface ScanResult {
  framework: FrameworkType;
  routes: Route[];
  elements: ScannedElement[];
  duration_ms: number;
}

export interface ScanContext {
  rootDir: string;
  framework: FrameworkType;
  sourceFiles: string[];
}

export type { KnowledgeBase, Route, ScannedElement, FrameworkType };

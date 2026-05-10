import type {
  Route,
  ScannedElement,
  FrameworkType,
  UIMap,
} from './shared-types';

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
  ui_map?: UIMap;
  duration_ms: number;
}

export interface ScanContext {
  rootDir: string;
  framework: FrameworkType;
  sourceFiles: string[];
}

export type {
  KnowledgeBase,
  Route,
  ScannedElement,
  FrameworkType,
  UIMap,
  UIMapNode,
  UIMapNodeKind,
  FingerprintSignals,
} from './shared-types';

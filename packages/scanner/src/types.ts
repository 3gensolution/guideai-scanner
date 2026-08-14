import type {
  Route,
  ScannedElement,
  FrameworkType,
  UIMap,
  ProductGraph,
} from './shared-types';

export interface ScanOptions {
  key?: string;
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
  product_graph?: ProductGraph;
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
  ProductGraph,
  ProductGraphNode,
  ProductGraphNodeKind,
  ProductGraphConnection,
  ProductGraphConnectionKind,
  ProductGraphApplication,
  ProductGraphLayout,
  FingerprintSignals,
  Confidence,
  ConfidenceLevel,
  Evidence,
  ProductGraphModule,
  ProductGraphSection,
  ProductGraphStateFlow,
  ProductGraphState,
  ProductGraphStateTransition,
  ProductGraphUserJourney,
  ProductGraphJourneyStep,
} from './shared-types';

export { confidenceFromScore } from './shared-types';

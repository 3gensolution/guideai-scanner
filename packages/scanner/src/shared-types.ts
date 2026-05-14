// ============================================================
// Types inlined from @guideai/shared
// ============================================================
// These types are copied from the shared package so that the
// scanner can operate independently without workspace dependencies.
// ============================================================

export interface KnowledgeBase {
  id: string;
  site_id: string;
  version: number;
  framework: FrameworkType;
  routes: Route[];
  elements: ScannedElement[];
  ui_map?: UIMap;
  scanned_at: string;
}

export type FrameworkType =
  | 'nextjs-app-router'
  | 'nextjs-pages-router'
  | 'react-router'
  | 'angular'
  | 'vue-router'
  | 'nuxt'
  | 'remix'
  | 'sveltekit'
  | 'plain-html';

export interface Route {
  path: string;
  origin?: string;
  host?: string;
  url?: string;
  page_title?: string;
  component_name?: string;
  source_file?: string;
  dynamic_segments: string[];
  auth_required: boolean;
  headings: string[];
}

export interface ScannedElement {
  id: string;
  route_path: string;
  route_origin?: string;
  route_host?: string;
  route_url?: string;
  tag: string;
  dom_id?: string;
  text?: string;
  aria_label?: string;
  placeholder?: string;
  name?: string;
  data_guideai?: string;
  data_testid?: string;
  component_name?: string;
  source_file?: string;
  form_label?: string;
  fingerprint: FingerprintSignals;
  type?: string;
  href?: string;
  role?: string;
  action_type?: string;
  text_features?: string;
}

export type UIMapNodeKind =
  | 'app'
  | 'domain'
  | 'route'
  | 'layout'
  | 'section'
  | 'component'
  | 'form'
  | 'navigation'
  | 'dialog'
  | 'list'
  | 'element';

export interface UIMapNode {
  id: string;
  kind: UIMapNodeKind;
  label: string;
  route_path?: string;
  route_origin?: string;
  route_host?: string;
  route_url?: string;
  component_name?: string;
  source_file?: string;
  selector?: string;
  element_id?: string;
  action_type?: string;
  text?: string;
  metadata?: Record<string, unknown>;
  children: UIMapNode[];
}

export interface UIMapRouteConnection {
  from_route_path: string;
  from_route_origin?: string;
  from_route_url?: string;
  to_route_path: string;
  to_route_origin?: string;
  to_route_url?: string;
  label?: string;
  selector?: string;
}

export interface UIMap {
  version: 1;
  framework: FrameworkType;
  root: UIMapNode;
  route_count: number;
  element_count: number;
  connections?: UIMapRouteConnection[];
  generated_at: string;
}

// --- Fingerprinting ---

export interface FingerprintSignals {
  tier1_stable: Tier1Signals;
  tier2_text: Tier2Signals;
  tier3_structural: Tier3Signals;
  tier4_context: Tier4Signals;
  tier5_position: Tier5Signals;
  tier6_visual?: Tier6Signals;
  total_score: number;
}

export interface Tier1Signals {
  data_guideai?: string;
  data_testid?: string;
  aria_label?: string;
  name?: string;
  id?: string;
  score: number;
}

export interface Tier2Signals {
  text_content?: string;
  placeholder?: string;
  label?: string;
  variants: string[];
  score: number;
}

export interface Tier3Signals {
  tag: string;
  role?: string;
  css_path?: string;
  xpath?: string;
  dom_depth: number;
  score: number;
}

export interface Tier4Signals {
  parent_text?: string;
  form_context?: string;
  nearest_heading?: string;
  visual_zone?: string;
  score: number;
}

export interface Tier5Signals {
  bounding_rect?: { x: number; y: number; width: number; height: number };
  relative_position?: string;
  score: number;
}

export interface Tier6Signals {
  style_hash: string;
  style_vector: number[];
  canvas_hash?: string;
  score: number;
}

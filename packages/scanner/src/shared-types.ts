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
  product_graph?: ProductGraph;
  public_data?: Record<string, unknown> | null;
  scanned_at: string;
  created_at?: string | null;
}

export interface KnowledgeBaseVersionSummary {
  id: string;
  site_id: string;
  version: number;
  framework?: FrameworkType | null;
  route_count: number;
  element_count: number;
  ui_map_version?: number | null;
  product_graph_version?: number | null;
  scanned_at?: string | null;
  created_at?: string | null;
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
  aria_controls?: string;
  aria_expanded?: string;
  aria_haspopup?: string;
  /** True when the element is inside a collapsed/conditional-render container. */
  hidden?: boolean;
  /** Label of the container that hides this element (e.g. accordion section name). */
  container?: string;
  /** State of the container when scanned (e.g. "collapsed"). */
  containerState?: string;
  /** Element ID of the toggle that controls visibility of this element. */
  container_toggle_id?: string;
  /** CSS selector of the toggle element (for LLM guide steps). */
  container_toggle_selector?: string;
  /** Human-readable label of the toggle element (e.g. "Open menu"). */
  container_toggle_label?: string;
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
  | 'tabs'
  | 'accordion'
  | 'dropdown'
  | 'dialog'
  | 'drawer'
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
  from_route_path?: string;
  from_route_origin?: string;
  from_route_url?: string;
  to_route_path?: string;
  to_route_origin?: string;
  to_route_url?: string;
  from_node_id?: string;
  from_node_kind?: UIMapNodeKind;
  to_node_id?: string;
  to_node_kind?: UIMapNodeKind;
  kind?: 'navigates_to' | 'opens' | 'reveals' | 'submits_to';
  scope?: 'route' | 'layout' | 'component';
  label?: string;
  selector?: string;
  metadata?: Record<string, unknown>;
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

export type ProductGraphNodeKind =
  | 'app'
  | 'domain'
  | 'route'
  | 'layout'
  | 'screen'
  | 'section'
  | 'component'
  | 'navigation'
  | 'dropdown'
  | 'accordion'
  | 'tabs'
  | 'form'
  | 'overlay'
  | 'dialog'
  | 'drawer'
  | 'list'
  | 'table'
  | 'row'
  | 'column'
  | 'breadcrumb'
  | 'stepper'
  | 'wizard'
  | 'cta'
  | 'element'
  | 'action'
  | 'state'
  | 'api'
  | 'journey'
  // NEW for Milestone 1
  | 'module' // Business domain cluster
  | 'stateFlow' // UI state machine
  | 'userJourney'; // Multi-screen path

export interface ProductGraphNode {
  id: string;
  kind: ProductGraphNodeKind;
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
  confidence?: Confidence;
  evidence?: Evidence[];
  children: ProductGraphNode[];
}

export type ProductGraphConnectionKind =
  | 'contains'
  | 'contains_route'
  | 'navigates_to'
  | 'opens'
  | 'reveals'
  | 'submits_to'
  | 'updates'
  // NEW for Milestone 1 - State transitions
  | 'toggles' // State toggle
  | 'selects' // Selection
  | 'switches_tab' // Tab switch
  | 'expands' // Expand accordion/details
  | 'collapses' // Collapse accordion/details
  | 'shows' // Show hidden content
  | 'hides'; // Hide visible content

export interface ProductGraphConnection {
  from: string;
  to: string;
  kind: ProductGraphConnectionKind;
  label?: string;
  metadata?: Record<string, unknown>;
  confidence?: Confidence;
  evidence?: Evidence[];
}

export interface ProductGraphApplication {
  type: string;
  confidence: number;
  signals: string[];
}

export interface ProductGraphLayout {
  hasNavbar: boolean;
  hasSidebar: boolean;
  hasTopbar: boolean;
  hasFooter: boolean;
  hasTabs: boolean;
  hasDropdowns: boolean;
  hasAccordions: boolean;
  hasDialogs: boolean;
  hasForms: boolean;
}

export interface ProductGraph {
  version: 1;
  framework: FrameworkType;
  application: ProductGraphApplication;
  layout: ProductGraphLayout;
  root: ProductGraphNode;
  route_count: number;
  element_count: number;
  connections: ProductGraphConnection[];
  generated_at: string;
  modules?: ProductGraphModule[];
  sections?: ProductGraphSection[];
  stateFlows?: ProductGraphStateFlow[];
  userJourneys?: ProductGraphUserJourney[];
}

// --- Confidence & Evidence System ---

/**
 * Three-tier confidence level for facts vs inferences
 * - confirmed (0.90-1.00): Direct code evidence, high fingerprint scores
 * - likely (0.70-0.89): Strong inference from patterns, medium fingerprints
 * - candidate (<0.70): Speculative hypothesis, low fingerprints
 */
export type ConfidenceLevel = 'confirmed' | 'likely' | 'candidate';

export interface Confidence {
  level: ConfidenceLevel;
  score: number; // 0.0-1.0
}

/** Convert numeric score to confidence level */
export function confidenceFromScore(score: number): Confidence {
  if (score >= 0.90) return { level: 'confirmed', score };
  if (score >= 0.70) return { level: 'likely', score };
  return { level: 'candidate', score };
}

/**
 * Evidence trail for derived facts
 * Every inferred node/edge should cite the frontend code that supports it
 */
export interface Evidence {
  // Source code location
  element_id?: string;
  source_file?: string;
  route_path?: string;
  route_origin?: string;
  route_url?: string;

  // DOM selector
  selector?: string;

  // Fingerprint quality (reuses existing 0-143 scoring system)
  fingerprint_score?: number;

  // Confidence in this evidence
  confidence: Confidence;

  // Human-readable explanation
  reason?: string;

  // Evidence type classifier
  evidence_type?:
    | 'code_pattern'
    | 'element_attribute'
    | 'text_content'
    | 'structure'
    | 'behavior'
    | 'inferred';
}

// --- Product Knowledge Graph Types ---

/**
 * Module: Business domain clustering
 * Groups screens by business area (Auth, Shopping, Checkout, Admin, etc.)
 */
export interface ProductGraphModule {
  id: string;
  name: string; // "Authentication", "Shopping Cart", "Checkout"
  description?: string;

  screen_ids: string[]; // References to screen nodes

  confidence: Confidence;
  evidence: Evidence[];

  metadata?: {
    domain_type?:
      | 'auth'
      | 'commerce'
      | 'admin'
      | 'content'
      | 'communication'
      | 'analytics'
      | 'settings'
      | 'workflow';
    entry_screen_ids?: string[];
    capabilities?: string[];
  };
}

/**
 * Section: Semantic page subdivision
 * Divides a screen into regions (hero, header, form area, etc.)
 */
export interface ProductGraphSection {
  id: string;
  name: string; // "Hero", "Header", "Order Summary"

  screen_id: string; // Parent screen
  route_path?: string;

  element_ids: string[]; // Elements in this section

  section_type:
    | 'hero'
    | 'header'
    | 'footer'
    | 'navigation'
    | 'sidebar'
    | 'content'
    | 'form'
    | 'list'
    | 'grid'
    | 'summary'
    | 'toolbar'
    | 'filter'
    | 'other';

  visual_zone?: 'top' | 'middle' | 'bottom' | 'left' | 'right' | 'center' | 'modal';

  confidence: Confidence;
  evidence: Evidence[];

  metadata?: {
    heading?: string;
    component_name?: string;
    source_file?: string;
  };
}

/**
 * State Flow: UI state machine
 * Models UI transitions (dialog open/close, tab switching, etc.)
 */
export interface ProductGraphStateFlow {
  id: string;
  name: string; // "User Menu Dropdown", "Checkout Steps"

  screen_id?: string;
  route_path?: string;

  states: ProductGraphState[];
  transitions: ProductGraphStateTransition[];

  initial_state_id: string;

  flow_type:
    | 'dialog'
    | 'drawer'
    | 'dropdown'
    | 'accordion'
    | 'tabs'
    | 'stepper'
    | 'wizard'
    | 'toggle'
    | 'multiselect'
    | 'other';

  confidence: Confidence;
  evidence: Evidence[];

  metadata?: {
    trigger_element_ids?: string[];
    global_scope?: boolean;
  };
}

export interface ProductGraphState {
  id: string;
  name: string; // "Open", "Closed", "Step 1"

  visible_element_ids: string[];
  hidden_element_ids?: string[];

  metadata?: {
    is_initial?: boolean;
    is_final?: boolean;
    css_classes?: string[];
  };
}

export interface ProductGraphStateTransition {
  id: string;
  from_state_id: string;
  to_state_id: string;

  trigger_element_id?: string;
  trigger_action?: string; // 'click', 'submit', 'keypress'

  connection_id?: string; // Reference to ProductGraphConnection

  confidence: Confidence;
  evidence: Evidence[];

  metadata?: {
    label?: string;
    reversible?: boolean;
  };
}

/**
 * User Journey: End-to-end multi-screen path
 * Models user flows (checkout, registration, etc.)
 */
export interface ProductGraphUserJourney {
  id: string;
  name: string; // "Guest Checkout", "User Registration"
  description?: string;

  steps: ProductGraphJourneyStep[];

  journey_type:
    | 'onboarding'
    | 'purchase'
    | 'registration'
    | 'workflow'
    | 'exploration'
    | 'support'
    | 'other';

  goal?: string; // "Complete order", "Create account"

  confidence: Confidence;
  evidence: Evidence[];

  metadata?: {
    module_id?: string;
    typical_steps?: number;
    conversion_points?: string[];
  };
}

export interface ProductGraphJourneyStep {
  id: string;
  step_number: number; // 1, 2, 3...

  screen_id: string;
  route_path?: string;

  name: string; // "Browse products", "Enter shipping"

  action_element_ids?: string[];

  next_step_trigger?: string;
  next_step_connection_id?: string;

  confidence: Confidence;
  evidence: Evidence[];

  metadata?: {
    is_optional?: boolean;
    is_decision_point?: boolean;
    alternative_paths?: string[];
  };
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

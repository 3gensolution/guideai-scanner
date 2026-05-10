// ============================================================
// Canonical Fingerprint Scoring — inlined from @guideai/shared
// ============================================================
//
// Unified scoring weights used by both the CLI scanner and the
// Chrome extension. Ensures the same element gets the same
// fingerprint score regardless of which tool captured it.
// ============================================================

/** Input signals used to compute fingerprint tier scores. */
export interface ScoringInput {
  // Tier 1: stable identifiers
  data_guideai?: string;
  data_testid?: string;
  aria_label?: string;
  name?: string;
  id?: string;
  // Tier 2: text content
  text_content?: string;
  placeholder?: string;
  label?: string;
  // Tier 3: structural
  tag?: string;
  role?: string;
  css_path?: string;
  xpath?: string;
  dom_depth?: number;
  // Tier 4: context
  parent_text?: string;
  form_context?: string;
  nearest_heading?: string;
  visual_zone?: string;
  // Tier 5: position
  bounding_rect?: { x: number; y: number; width: number; height: number };
  relative_position?: string;
  // Tier 6: visual
  style_hash?: string;
  style_vector?: number[];
  canvas_hash?: string;
}

export interface ScoringResult {
  tier1: number;
  tier2: number;
  tier3: number;
  tier4: number;
  tier5: number;
  tier6: number;
  total: number;
}

/**
 * Compute canonical fingerprint scores from signal inputs.
 *
 * Tier caps:
 *   Tier 1: max 40  (stable developer identifiers)
 *   Tier 2: max 35  (text content)
 *   Tier 3: max 25  (structural)
 *   Tier 4: max 15  (context)
 *   Tier 5: max 8   (position)
 *   Tier 6: max 20  (visual)
 *   Total:  max 143
 */
export function computeFingerprintScore(input: ScoringInput): ScoringResult {
  let t1 = 0;
  if (input.data_guideai) t1 += 40;
  if (input.data_testid) t1 += 38;
  if (input.aria_label) t1 += 36;
  if (input.name) t1 += 35;
  if (input.id) t1 += 35;
  const tier1 = Math.min(t1, 40);

  let t2 = 0;
  if (input.text_content) t2 += 30;
  if (input.placeholder) t2 += 28;
  if (input.label) t2 += 25;
  const tier2 = Math.min(t2, 35);

  let t3 = 0;
  if (input.tag && input.tag !== 'unknown') t3 += 15;
  if (input.role) t3 += 20;
  if (input.css_path) t3 += 25;
  const tier3 = Math.min(t3, 25);

  let t4 = 0;
  if (input.parent_text) t4 += 10;
  if (input.form_context) t4 += 12;
  if (input.nearest_heading) t4 += 15;
  if (input.visual_zone) t4 += 8;
  const tier4 = Math.min(t4, 15);

  let t5 = 0;
  if (input.bounding_rect) t5 += 5;
  if (input.relative_position) t5 += 3;
  const tier5 = Math.min(t5, 8);

  let t6 = 0;
  if (input.style_hash) t6 += 12;
  if (input.style_vector && input.style_vector.length > 0) t6 += 15;
  if (input.canvas_hash) t6 += 18;
  const tier6 = Math.min(t6, 20);

  return {
    tier1,
    tier2,
    tier3,
    tier4,
    tier5,
    tier6,
    total: tier1 + tier2 + tier3 + tier4 + tier5 + tier6,
  };
}

import type { FingerprintSignals, ScannedElement } from '../types';

/**
 * Build a FingerprintSignals object from scanned element data.
 *
 * Scoring tiers:
 *   Tier 1 (35-40 pts): data-guideai, data-testid, aria-label, name, id
 *   Tier 2 (25-35 pts): text content, placeholder, label, variants
 *   Tier 3 (15-25 pts): tag, role, CSS path estimate
 *   Tier 4 (8-15 pts):  parent text, form context, nearest heading
 *   Tier 5 (3-8 pts):   position estimates
 */
export function buildFingerprint(
  element: Partial<ScannedElement>,
): FingerprintSignals {
  const tier1 = buildTier1(element);
  const tier2 = buildTier2(element);
  const tier3 = buildTier3(element);
  const tier4 = buildTier4(element);
  const tier5 = buildTier5(element);

  const totalScore =
    tier1.score + tier2.score + tier3.score + tier4.score + tier5.score;

  return {
    tier1_stable: tier1,
    tier2_text: tier2,
    tier3_structural: tier3,
    tier4_context: tier4,
    tier5_position: tier5,
    total_score: totalScore,
  };
}

/**
 * Tier 1: Stable developer-defined identifiers (35-40 points).
 *
 * These are the most reliable signals for element matching as they
 * are explicitly set by developers and rarely change.
 */
function buildTier1(element: Partial<ScannedElement>) {
  let score = 0;

  const data_guideai = element.data_guideai || undefined;
  const data_testid = element.data_testid || undefined;
  const aria_label = element.aria_label || undefined;
  const name = element.name || undefined;
  const id = element.fingerprint?.tier1_stable?.id || undefined;

  // data-guideai is the strongest signal (40 points)
  if (data_guideai) score += 40;
  // data-testid is very stable (38 points)
  if (data_testid) score += 38;
  // aria-label is accessibility-driven, usually stable (36 points)
  if (aria_label) score += 36;
  // name attribute is form-stable (35 points)
  if (name) score += 35;
  // id attribute (35 points)
  if (id) score += 35;

  return {
    data_guideai,
    data_testid,
    aria_label,
    name,
    id,
    score: Math.min(score, 40),
  };
}

/**
 * Tier 2: Text-based signals (25-35 points).
 *
 * Text content is human-readable and usually stable across deployments,
 * but may change with i18n or copy updates.
 */
function buildTier2(element: Partial<ScannedElement>) {
  let score = 0;

  const text_content = element.text || undefined;
  const placeholder = element.placeholder || undefined;
  const label = element.form_label || undefined;

  // Build text variants for fuzzy matching
  const variants: string[] = [];
  if (text_content) {
    variants.push(text_content);
    // Add normalized version (lowercase, trimmed)
    const normalized = text_content.toLowerCase().trim();
    if (normalized !== text_content) {
      variants.push(normalized);
    }
    score += 30;
  }
  if (placeholder) {
    variants.push(placeholder);
    score += 28;
  }
  if (label) {
    variants.push(label);
    score += 25;
  }

  return {
    text_content,
    placeholder,
    label,
    variants,
    score: Math.min(score, 35),
  };
}

/**
 * Tier 3: Structural signals (15-25 points).
 *
 * Tag names, roles, and DOM structure provide structural context
 * for element identification.
 */
function buildTier3(element: Partial<ScannedElement>) {
  let score = 0;

  const tag = element.tag || 'unknown';
  const role = element.fingerprint?.tier3_structural?.role || inferRole(tag);
  const css_path = element.fingerprint?.tier3_structural?.css_path || undefined;
  const xpath = element.fingerprint?.tier3_structural?.xpath || undefined;
  const dom_depth = element.fingerprint?.tier3_structural?.dom_depth || 0;

  // Tag is always available (15 points)
  if (tag && tag !== 'unknown') score += 15;
  // Role provides semantic context (20 points)
  if (role) score += 20;
  // CSS path adds specificity (25 points)
  if (css_path) score += 25;

  return {
    tag,
    role,
    css_path,
    xpath,
    dom_depth,
    score: Math.min(score, 25),
  };
}

/**
 * Tier 4: Contextual signals (8-15 points).
 *
 * Context from surrounding elements, forms, and headings provides
 * additional disambiguation.
 */
function buildTier4(element: Partial<ScannedElement>) {
  let score = 0;

  const parent_text =
    element.fingerprint?.tier4_context?.parent_text || undefined;
  const form_context =
    element.fingerprint?.tier4_context?.form_context ||
    element.form_label ||
    undefined;
  const nearest_heading =
    element.fingerprint?.tier4_context?.nearest_heading || undefined;
  const visual_zone =
    element.fingerprint?.tier4_context?.visual_zone || undefined;

  if (parent_text) score += 10;
  if (form_context) score += 12;
  if (nearest_heading) score += 15;
  if (visual_zone) score += 8;

  return {
    parent_text,
    form_context,
    nearest_heading,
    visual_zone,
    score: Math.min(score, 15),
  };
}

/**
 * Tier 5: Positional signals (3-8 points).
 *
 * Position-based signals are the least stable as they change with
 * layout modifications, but can help as a last resort.
 */
function buildTier5(element: Partial<ScannedElement>) {
  let score = 0;

  const bounding_rect =
    element.fingerprint?.tier5_position?.bounding_rect || undefined;
  const relative_position =
    element.fingerprint?.tier5_position?.relative_position || undefined;

  if (bounding_rect) score += 5;
  if (relative_position) score += 3;

  return {
    bounding_rect,
    relative_position,
    score: Math.min(score, 8),
  };
}

/**
 * Infer an ARIA role from the tag name.
 */
function inferRole(tag: string): string | undefined {
  const roleMap: Record<string, string> = {
    button: 'button',
    a: 'link',
    input: 'textbox',
    select: 'combobox',
    textarea: 'textbox',
    nav: 'navigation',
    main: 'main',
    header: 'banner',
    footer: 'contentinfo',
    form: 'form',
    dialog: 'dialog',
    img: 'img',
    table: 'table',
  };

  return roleMap[tag.toLowerCase()];
}

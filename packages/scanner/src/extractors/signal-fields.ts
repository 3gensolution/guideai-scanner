import type { FingerprintSignals, ScannedElement } from '../types';
import { computeFingerprintScore, type ScoringInput } from '../fingerprint-scoring';

/**
 * Build a FingerprintSignals object from scanned element data.
 *
 * Uses the canonical scoring function from @guideai/shared to ensure
 * consistent scores between the scanner and the Chrome extension.
 */
export function buildFingerprint(
  element: Partial<ScannedElement>,
): FingerprintSignals {
  // Gather all signals from the element
  const input: ScoringInput = {
    data_guideai: element.data_guideai || undefined,
    data_testid: element.data_testid || undefined,
    aria_label: element.aria_label || undefined,
    name: element.name || undefined,
    id: element.dom_id || element.fingerprint?.tier1_stable?.id || undefined,
    text_content: element.text || undefined,
    placeholder: element.placeholder || undefined,
    label: element.form_label || undefined,
    tag: element.tag || 'unknown',
    role:
      element.role ||
      element.fingerprint?.tier3_structural?.role ||
      inferRole(element.tag || ''),
    css_path: element.fingerprint?.tier3_structural?.css_path || undefined,
    xpath: element.fingerprint?.tier3_structural?.xpath || undefined,
    dom_depth: element.fingerprint?.tier3_structural?.dom_depth,
    parent_text: element.fingerprint?.tier4_context?.parent_text || undefined,
    form_context:
      element.fingerprint?.tier4_context?.form_context ||
      element.form_label ||
      undefined,
    nearest_heading:
      element.fingerprint?.tier4_context?.nearest_heading || undefined,
    visual_zone: element.fingerprint?.tier4_context?.visual_zone || undefined,
    bounding_rect:
      element.fingerprint?.tier5_position?.bounding_rect || undefined,
    relative_position:
      element.fingerprint?.tier5_position?.relative_position || undefined,
  };

  const scores = computeFingerprintScore(input);

  // Build text variants for fuzzy matching
  const variants: string[] = [];
  if (input.text_content) {
    variants.push(input.text_content);
    const normalized = input.text_content.toLowerCase().trim();
    if (normalized !== input.text_content) variants.push(normalized);
  }
  if (input.placeholder) variants.push(input.placeholder);
  if (input.label) variants.push(input.label);

  return {
    tier1_stable: {
      data_guideai: input.data_guideai,
      data_testid: input.data_testid,
      aria_label: input.aria_label,
      name: input.name,
      id: input.id,
      score: scores.tier1,
    },
    tier2_text: {
      text_content: input.text_content,
      placeholder: input.placeholder,
      label: input.label,
      variants,
      score: scores.tier2,
    },
    tier3_structural: {
      tag: input.tag || 'unknown',
      role: input.role,
      css_path: input.css_path,
      xpath: input.xpath,
      dom_depth: input.dom_depth || 0,
      score: scores.tier3,
    },
    tier4_context: {
      parent_text: input.parent_text,
      form_context: input.form_context,
      nearest_heading: input.nearest_heading,
      visual_zone: input.visual_zone,
      score: scores.tier4,
    },
    tier5_position: {
      bounding_rect: input.bounding_rect,
      relative_position: input.relative_position,
      score: scores.tier5,
    },
    total_score: scores.total,
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
    details: 'group',
    summary: 'button',
  };

  return roleMap[tag.toLowerCase()];
}

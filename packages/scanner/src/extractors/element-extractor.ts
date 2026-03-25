import * as fs from 'fs';
import * as path from 'path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import type { Node } from '@babel/types';
import { randomUUID } from 'crypto';
import type { ScannedElement } from '../types';
import { inferComponentName } from './component-name';
import { buildFingerprint } from './signal-fields';

// Handle both ESM default and CJS module.exports
const traverse = (typeof _traverse === 'function' ? _traverse : (_traverse as { default: typeof _traverse }).default) as typeof _traverse;

/** Tags we want to extract as interactive elements. */
const INTERACTIVE_TAGS = new Set([
  'button', 'a', 'input', 'select', 'textarea',
  'details', 'summary', 'dialog',
]);

const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
  'checkbox', 'radio', 'switch', 'combobox', 'slider', 'spinbutton',
  'searchbox', 'textbox', 'dialog', 'alertdialog', 'tabpanel',
]);

/**
 * Extract interactive elements from a source file.
 *
 * For JSX/TSX files: Uses @babel/parser with jsx/typescript plugins
 * and traverses the AST to find interactive elements.
 *
 * For HTML files: Uses regex patterns to find elements.
 */
export async function extractElements(
  filePath: string,
  routePath: string,
): Promise<ScannedElement[]> {
  const ext = path.extname(filePath).toLowerCase();

  let source: string;
  try {
    source = await fs.promises.readFile(filePath, 'utf-8');
  } catch {
    return [];
  }

  if (ext === '.html' || ext === '.htm') {
    return extractHtmlElements(source, filePath, routePath);
  }

  if (['.tsx', '.jsx', '.ts', '.js'].includes(ext)) {
    return extractJsxElements(source, filePath, routePath);
  }

  if (ext === '.svelte') {
    // Strip script and style blocks, then extract from template (HTML-like)
    const templateSource = source
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    return extractHtmlElements(templateSource, filePath, routePath);
  }

  return [];
}

/**
 * Extract interactive elements from JSX/TSX source code using AST parsing.
 */
function extractJsxElements(
  source: string,
  filePath: string,
  routePath: string,
): ScannedElement[] {
  const isTypeScript =
    filePath.endsWith('.ts') || filePath.endsWith('.tsx');
  const isJSX =
    filePath.endsWith('.jsx') || filePath.endsWith('.tsx');

  const plugins: Array<'jsx' | 'typescript' | 'decorators-legacy'> = [];
  if (isJSX || source.includes('jsx') || source.includes('<')) {
    plugins.push('jsx');
  }
  if (isTypeScript) {
    plugins.push('typescript');
  }

  let ast;
  try {
    ast = parse(source, {
      sourceType: 'module',
      plugins,
      errorRecovery: true,
    });
  } catch {
    return [];
  }

  const componentName = inferComponentName(filePath, source);
  const elements: ScannedElement[] = [];

  // Track the nearest heading for context
  let nearestHeading: string | undefined;
  // Track the nearest form label for context
  let currentFormLabel: string | undefined;

  traverse(ast, {
    JSXOpeningElement(nodePath) {
      const nameNode = nodePath.node.name;
      let tagName = '';

      if (nameNode.type === 'JSXIdentifier') {
        tagName = nameNode.name.toLowerCase();
      }

      // Track headings for context
      if (/^h[1-6]$/.test(tagName)) {
        const parentElement = nodePath.parentPath;
        if (parentElement && parentElement.node.type === 'JSXElement') {
          nearestHeading = extractJsxChildrenText(parentElement.node as JsxElementNode);
        }
        return;
      }

      // Track label elements for form context
      if (tagName === 'label') {
        const parentElement = nodePath.parentPath;
        if (parentElement && parentElement.node.type === 'JSXElement') {
          currentFormLabel = extractJsxChildrenText(parentElement.node as JsxElementNode);
        }
        return;
      }

      const attributes = extractJsxAttributes(nodePath.node.attributes);

      // Check if element is interactive by tag, role, or event handler
      const role = attributes['role'];
      const hasEventHandler = nodePath.node.attributes.some(
        (attr: any) =>
          attr.type === 'JSXAttribute' &&
          attr.name?.type === 'JSXIdentifier' &&
          /^on[A-Z]/.test(attr.name.name),
      );
      const isInteractive =
        INTERACTIVE_TAGS.has(tagName) ||
        (role != null && INTERACTIVE_ROLES.has(role)) ||
        hasEventHandler;
      if (!isInteractive) return;

      // Get text content from children
      let textContent: string | undefined;
      const parentElement = nodePath.parentPath;
      if (parentElement && parentElement.node.type === 'JSXElement') {
        textContent = extractJsxChildrenText(parentElement.node as JsxElementNode);
      }

      const partialElement: Partial<ScannedElement> = {
        id: randomUUID(),
        route_path: routePath,
        tag: tagName,
        text: textContent || undefined,
        aria_label: attributes['aria-label'] || undefined,
        placeholder: attributes['placeholder'] || undefined,
        name: attributes['name'] || undefined,
        data_guideai: attributes['data-guideai'] || undefined,
        data_testid:
          attributes['data-testid'] || attributes['data-test-id'] || undefined,
        component_name: componentName,
        source_file: filePath,
        form_label: currentFormLabel || findNearestLabel(attributes, source),
        type: tagName === 'input' ? (attributes['type'] || 'text') : undefined,
        href: tagName === 'a' ? (attributes['href'] || undefined) : undefined,
        role: attributes['role'] || undefined,
      };

      const fingerprint = buildFingerprint(partialElement);

      // Enrich tier4 with heading context
      if (nearestHeading) {
        fingerprint.tier4_context.nearest_heading = nearestHeading;
        if (!fingerprint.tier4_context.score) {
          fingerprint.tier4_context.score = 0;
        }
        fingerprint.tier4_context.score = Math.min(
          fingerprint.tier4_context.score + 15,
          15,
        );
        fingerprint.total_score = Math.min(
          fingerprint.tier1_stable.score +
            fingerprint.tier2_text.score +
            fingerprint.tier3_structural.score +
            fingerprint.tier4_context.score +
            fingerprint.tier5_position.score,
          143,
        );
      }

      elements.push({
        ...partialElement,
        id: partialElement.id!,
        route_path: routePath,
        tag: tagName,
        fingerprint,
      } as ScannedElement);

      // Reset form label after consuming it for an input
      if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
        currentFormLabel = undefined;
      }
    },
  });

  return elements;
}

/**
 * Extract interactive elements from HTML source using regex patterns.
 */
function extractHtmlElements(
  source: string,
  filePath: string,
  routePath: string,
): ScannedElement[] {
  const elements: ScannedElement[] = [];

  // Match opening tags for interactive elements
  const tagPattern =
    /<(button|a|input|select|textarea|details|summary|dialog)\b([^>]*)(?:>([\s\S]*?)<\/\1>|\s*\/?>)/gi;
  let match: RegExpExecArray | null;

  // Track nearest heading
  let nearestHeading: string | undefined;
  const headingPattern = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi;
  const headings: Array<{ text: string; index: number }> = [];
  let headingMatch: RegExpExecArray | null;
  while ((headingMatch = headingPattern.exec(source)) !== null) {
    headings.push({
      text: stripHtmlTags(headingMatch[1]).trim(),
      index: headingMatch.index,
    });
  }

  while ((match = tagPattern.exec(source)) !== null) {
    const tagName = match[1].toLowerCase();
    const attributesStr = match[2] || '';
    const innerHTML = match[3] || '';

    const attributes = parseHtmlAttributes(attributesStr);
    const textContent = stripHtmlTags(innerHTML).trim() || undefined;

    // Find the nearest preceding heading
    nearestHeading = undefined;
    for (const heading of headings) {
      if (heading.index < match.index) {
        nearestHeading = heading.text;
      } else {
        break;
      }
    }

    // Find preceding <label>
    const formLabel = findPrecedingLabel(source, match.index);

    const inputType = tagName === 'input' ? (attributes['type'] || 'text') : undefined;
    const href = tagName === 'a' ? (attributes['href'] || undefined) : undefined;

    const partialElement: Partial<ScannedElement> = {
      id: randomUUID(),
      route_path: routePath,
      tag: tagName,
      text: textContent,
      aria_label: attributes['aria-label'] || undefined,
      placeholder: attributes['placeholder'] || undefined,
      name: attributes['name'] || undefined,
      data_guideai: attributes['data-guideai'] || undefined,
      data_testid:
        attributes['data-testid'] || attributes['data-test-id'] || undefined,
      source_file: filePath,
      form_label: formLabel,
      type: inputType,
      href: href,
      role: attributes['role'] || undefined,
    };

    const fingerprint = buildFingerprint(partialElement);

    if (nearestHeading) {
      fingerprint.tier4_context.nearest_heading = nearestHeading;
      fingerprint.tier4_context.score = Math.min(
        fingerprint.tier4_context.score + 15,
        15,
      );
      fingerprint.total_score =
        fingerprint.tier1_stable.score +
        fingerprint.tier2_text.score +
        fingerprint.tier3_structural.score +
        fingerprint.tier4_context.score +
        fingerprint.tier5_position.score;
    }

    elements.push({
      ...partialElement,
      id: partialElement.id!,
      route_path: routePath,
      tag: tagName,
      fingerprint,
    } as ScannedElement);
  }

  return elements;
}

// ── Helpers ──────────────────────────────────────────────

/**
 * Type for JSX Element nodes used in children text extraction.
 */
interface JsxElementNode {
  type: string;
  children: Array<{
    type: string;
    value?: string;
    expression?: { type: string; value?: string };
    children?: JsxElementNode['children'];
  }>;
}

/**
 * Extract text content from JSX element children.
 */
function extractJsxChildrenText(element: JsxElementNode): string | undefined {
  const textParts: string[] = [];

  if (!element.children) return undefined;

  for (const child of element.children) {
    if (child.type === 'JSXText') {
      const trimmed = (child.value || '').trim();
      if (trimmed) textParts.push(trimmed);
    } else if (child.type === 'JSXExpressionContainer') {
      const expr = child.expression;
      if (!expr) continue;
      if (expr.type === 'StringLiteral') {
        const val = (expr as { value: string }).value || '';
        if (val.trim()) textParts.push(val.trim());
      } else if (expr.type === 'TemplateLiteral') {
        const quasis = (expr as { quasis: Array<{ value: { raw: string } }> }).quasis || [];
        const text = quasis.map((q) => q.value.raw).join('...');
        if (text.trim()) textParts.push(text.trim());
      } else if (expr.type === 'ConditionalExpression') {
        const consequent = (expr as any).consequent;
        const alternate = (expr as any).alternate;
        if (consequent?.type === 'StringLiteral' && consequent.value) {
          textParts.push(consequent.value);
        }
        if (alternate?.type === 'StringLiteral' && alternate.value) {
          if (!textParts.includes(alternate.value)) {
            textParts.push(alternate.value);
          }
        }
      }
    }
    // Recursively handle nested JSX elements
    if (child.type === 'JSXElement' && child.children) {
      const nestedText = extractJsxChildrenText(
        child as unknown as JsxElementNode,
      );
      if (nestedText) textParts.push(nestedText);
    }
  }

  const combined = textParts.join(' ').trim();
  return combined || undefined;
}

/**
 * Extract attribute key-value pairs from JSX opening element attributes.
 */
function extractJsxAttributes(
  attributes: Array<{
    type: string;
    name?: { type: string; name?: string; namespace?: { name: string }; name_name?: string };
    value?: Node | null;
  }>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const attr of attributes) {
    if (attr.type !== 'JSXAttribute' || !attr.name) continue;

    let attrName = '';
    if (attr.name.type === 'JSXIdentifier') {
      attrName = (attr.name as { name: string }).name;
    } else if (attr.name.type === 'JSXNamespacedName') {
      const ns = attr.name as { namespace: { name: string }; name: { name: string } };
      attrName = `${ns.namespace.name}:${ns.name.name}`;
    }

    if (!attrName) continue;

    if (!attr.value) {
      // Boolean attribute (e.g., disabled)
      result[attrName] = 'true';
      continue;
    }

    if (attr.value.type === 'StringLiteral') {
      result[attrName] = (attr.value as { value: string }).value;
    } else if (attr.value.type === 'JSXExpressionContainer') {
      const expr = (attr.value as { expression: Node }).expression;
      if (expr.type === 'StringLiteral') {
        result[attrName] = (expr as { value: string }).value;
      } else if (expr.type === 'TemplateLiteral') {
        // Extract static parts of template literals
        const quasis = (expr as { quasis: Array<{ value: { raw: string } }> }).quasis;
        result[attrName] = quasis.map((q) => q.value.raw).join('...');
      }
    }
  }

  return result;
}

/**
 * Parse HTML attributes from an attribute string.
 */
function parseHtmlAttributes(attrStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  const attrPattern = /([\w-]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attrPattern.exec(attrStr)) !== null) {
    const name = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? 'true';
    result[name] = value;
  }

  return result;
}

/**
 * Strip HTML tags from a string.
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Find a label associated with an input element by its 'for'/'id' attributes
 * or by proximity in the source code.
 */
function findNearestLabel(
  attributes: Record<string, string>,
  source: string,
): string | undefined {
  const id = attributes['id'];
  if (!id) return undefined;

  // Look for <label htmlFor="id"> or <label for="id">
  const labelPattern = new RegExp(
    `<label[^>]*(?:htmlFor|for)\\s*=\\s*["']${escapeRegExp(id)}["'][^>]*>([^<]+)`,
    'i',
  );
  const match = source.match(labelPattern);
  if (match) {
    return match[1].trim();
  }

  return undefined;
}

/**
 * Find a label element that precedes the current element position in HTML.
 */
function findPrecedingLabel(source: string, elementIndex: number): string | undefined {
  // Look for the nearest preceding label tag
  const precedingSource = source.slice(Math.max(0, elementIndex - 500), elementIndex);
  const labelPattern = /<label[^>]*>(.*?)<\/label>/gi;
  let lastLabel: string | undefined;
  let match: RegExpExecArray | null;

  while ((match = labelPattern.exec(precedingSource)) !== null) {
    lastLabel = stripHtmlTags(match[1]).trim();
  }

  return lastLabel;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

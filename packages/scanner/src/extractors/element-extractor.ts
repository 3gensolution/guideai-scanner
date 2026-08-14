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

/** Tags we want to extract as interactive elements (lowercased). */
const INTERACTIVE_TAGS = new Set([
  'button', 'a', 'input', 'select', 'textarea',
  'details', 'summary', 'dialog',
  // Common framework navigation components
  'link', 'navlink', 'routerlink',
]);

const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
  'checkbox', 'radio', 'switch', 'combobox', 'slider', 'spinbutton',
  'searchbox', 'textbox', 'dialog', 'alertdialog', 'tabpanel',
]);

/** Component names (lowercased) that represent collapsible/hidden containers. */
const COLLAPSIBLE_COMPONENTS = new Set([
  'accordion', 'accordionitem', 'accordionpanel', 'accordioncontent',
  'collapse', 'collapsible', 'collapsiblecontent',
  'dropdown', 'dropdownmenu', 'dropdowncontent',
  'drawer', 'drawercontent',
  'popover', 'popovercontent',
  'menu', 'menucontent', 'menulist',
  'offcanvas',
  'tabpanel', 'tabscontent',
]);

/** State variable patterns that typically gate conditional rendering. */
const CONDITIONAL_STATE_RE = /^(is)?_?(open|show|visible|expanded|active|collapsed|toggled|hidden|closed)/i;

interface HiddenContainerInfo {
  hidden: true;
  container: string;
  containerState: string;
}

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
  const functionMap = collectFunctionNodes(ast as unknown as Node);
  const staticCollections = collectStaticObjectCollections(ast as unknown as Node);

  // Track the nearest heading for context
  let nearestHeading: string | undefined;
  // Track the nearest form label for context
  let currentFormLabel: string | undefined;

  traverse(ast, {
    JSXOpeningElement(nodePath) {
      const nameNode = nodePath.node.name;
      const tagName = getJsxTagName(nameNode);

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

      const mappedCollection = findMappedStaticCollection(nodePath, staticCollections);
      const repetitions = mappedCollection
        ? mappedCollection.items.map((values) => ({
            bindingName: mappedCollection.bindingName,
            collectionName: mappedCollection.collectionName,
            values,
          }))
        : [undefined];
      const baseAttributes = extractJsxAttributes(nodePath.node.attributes);

      // Components such as <Tabs tabs={[...]} /> describe their rendered tab
      // buttons at the call site. Expand those static definitions here so the
      // resulting elements retain the route and page context of the caller.
      // This is intentionally convention-based and framework-agnostic; it does
      // not depend on any application-specific component or label.
      const componentTabs = extractStaticTabComponentItems(
        tagName,
        nodePath.node.attributes,
        staticCollections,
      );
      if (componentTabs.length > 0) {
        const groupName = `${componentName || 'Page'}:${tagName}:${componentTabs[0].collectionName}`;
        for (const tab of componentTabs) {
          const partialElement: Partial<ScannedElement> = {
            id: randomUUID(),
            route_path: routePath,
            tag: 'button',
            text: tab.label,
            role: 'tab',
            action_type: 'click',
            component_name: componentName,
            source_file: filePath,
            container: groupName,
          };
          const fingerprint = buildFingerprint(partialElement);
          if (nearestHeading) {
            enrichFingerprintWithHeading(fingerprint, nearestHeading);
          }
          elements.push({
            ...partialElement,
            id: partialElement.id!,
            route_path: routePath,
            tag: 'button',
            fingerprint,
          } as ScannedElement);
        }
      }

      const navigationTarget = extractNavigationTargetFromJsxAttributes(
        nodePath.node.attributes,
        functionMap,
      );

      // Check if element is interactive by tag, role, or event handler
      const hasEventHandler = nodePath.node.attributes.some(
        (attr: any) =>
          attr.type === 'JSXAttribute' &&
          attr.name?.type === 'JSXIdentifier' &&
          /^on[A-Z]/.test(attr.name.name),
      );
      const role = baseAttributes['role'];
      const hasHrefLikeAttribute = Boolean(baseAttributes['href'] || baseAttributes['to']);
      const hasControlledContainerSignals = isControlledContainer(tagName, baseAttributes);
      const isInteractive =
        INTERACTIVE_TAGS.has(tagName) ||
        (role != null && INTERACTIVE_ROLES.has(role)) ||
        hasEventHandler ||
        hasHrefLikeAttribute ||
        Boolean(navigationTarget) ||
        hasControlledContainerSignals;
      if (!isInteractive) return;

      // Detect if this element is inside a hidden/collapsed container
      const hiddenInfo = detectHiddenContainer(nodePath);
      const parentElement = nodePath.parentPath;

      for (const repetition of repetitions) {
        const attributes = extractJsxAttributes(
          nodePath.node.attributes,
          repetition
            ? { name: repetition.bindingName, values: repetition.values }
            : undefined,
        );
        const textContent =
          parentElement && parentElement.node.type === 'JSXElement'
            ? extractJsxChildrenText(
                parentElement.node as JsxElementNode,
                repetition
                  ? { name: repetition.bindingName, values: repetition.values }
                  : undefined,
              )
            : undefined;
        const selfHidden = Object.prototype.hasOwnProperty.call(attributes, 'hidden');
        const mappedTabContainer =
          repetition && attributes['role'] === 'tab'
            ? `${componentName || 'Page'}:${repetition.collectionName}`
            : undefined;
        const partialElement: Partial<ScannedElement> = {
          id: randomUUID(),
          route_path: routePath,
          tag: tagName,
          dom_id: attributes['id'] || undefined,
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
          href:
            attributes['href'] ||
            attributes['to'] ||
            navigationTarget ||
            undefined,
          role: attributes['role'] || undefined,
          aria_controls: attributes['aria-controls'] || undefined,
          aria_expanded: attributes['aria-expanded'] || undefined,
          aria_haspopup: attributes['aria-haspopup'] || undefined,
          ...(selfHidden ? { hidden: true } : {}),
          ...(mappedTabContainer ? { container: mappedTabContainer } : {}),
          ...(hiddenInfo ? { hidden: true, container: hiddenInfo.container, containerState: hiddenInfo.containerState } : {}),
        };

        const fingerprint = buildFingerprint(partialElement);
        if (nearestHeading) {
          enrichFingerprintWithHeading(fingerprint, nearestHeading);
        }

        elements.push({
          ...partialElement,
          id: partialElement.id!,
          route_path: routePath,
          tag: tagName,
          fingerprint,
        } as ScannedElement);
      }

      // Reset form label after consuming it for an input
      if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
        currentFormLabel = undefined;
      }
    },
  });

  elements.push(
    ...extractNavigationConfigElements(ast, filePath, routePath, componentName),
  );

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
      dom_id: attributes['id'] || undefined,
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

    // Detect if this element is inside a <details> block (HTML collapsible)
    const detailsInfo = detectHtmlDetailsContainer(source, match.index);

    elements.push({
      ...partialElement,
      id: partialElement.id!,
      route_path: routePath,
      tag: tagName,
      fingerprint,
      ...(detailsInfo ? { hidden: true, container: detailsInfo.container, containerState: detailsInfo.containerState } : {}),
    } as ScannedElement);
  }

  return elements;
}

/**
 * Detect if an HTML element at a given position is inside a <details> block
 * that doesn't have the `open` attribute.
 */
function detectHtmlDetailsContainer(source: string, elementIndex: number): HiddenContainerInfo | null {
  const before = source.slice(0, elementIndex);
  // Count unclosed <details> tags before this element
  const openDetails = (before.match(/<details\b[^>]*>/gi) || []);
  const closeDetails = (before.match(/<\/details>/gi) || []);

  if (openDetails.length > closeDetails.length) {
    // Check if the last unclosed <details> has the `open` attribute
    const lastOpen = openDetails[openDetails.length - 1];
    if (!/\bopen\b/i.test(lastOpen)) {
      // Extract the summary text as the container name
      const afterDetails = source.slice(source.lastIndexOf(lastOpen, elementIndex));
      const summaryMatch = afterDetails.match(/<summary[^>]*>(.*?)<\/summary>/i);
      const containerName = summaryMatch ? stripHtmlTags(summaryMatch[1]).trim() : 'details';
      return {
        hidden: true,
        container: containerName || 'details',
        containerState: 'collapsed',
      };
    }
  }

  return null;
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
    expression?: any;
    children?: JsxElementNode['children'];
  }>;
}

interface StaticBinding {
  name: string;
  values: Record<string, string>;
}

interface MappedStaticCollection {
  bindingName: string;
  collectionName: string;
  items: Array<Record<string, string>>;
}

function getJsxTagName(nameNode: any): string {
  if (!nameNode) return '';
  if (nameNode.type === 'JSXIdentifier') {
    return nameNode.name.toLowerCase();
  }
  if (nameNode.type === 'JSXMemberExpression') {
    return `${getJsxTagName(nameNode.object)}.${getJsxTagName(nameNode.property)}`;
  }
  if (nameNode.type === 'JSXNamespacedName') {
    return `${nameNode.namespace.name}:${nameNode.name.name}`.toLowerCase();
  }
  return '';
}

/**
 * Extract text content from JSX element children.
 */
function extractJsxChildrenText(
  element: JsxElementNode,
  binding?: StaticBinding,
): string | undefined {
  const textParts: string[] = [];

  if (!element.children) return undefined;

  for (const child of element.children) {
    if (child.type === 'JSXText') {
      const trimmed = (child.value || '').trim();
      if (trimmed) textParts.push(trimmed);
    } else if (child.type === 'JSXExpressionContainer') {
      const expr = child.expression;
      if (!expr) continue;
      const resolved = resolveStaticExpression(expr, binding);
      if (resolved && resolved !== 'expression' && resolved !== '...') {
        textParts.push(resolved.trim());
      } else if (expr.type === 'StringLiteral') {
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
        binding,
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
  binding?: StaticBinding,
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
      const resolved = resolveStaticExpression(expr, binding);
      if (resolved !== undefined) {
        result[attrName] = resolved;
      } else if (expr.type === 'StringLiteral') {
        result[attrName] = (expr as { value: string }).value;
      } else if (expr.type === 'TemplateLiteral') {
        // Extract static parts of template literals
        const quasis = (expr as { quasis: Array<{ value: { raw: string } }> }).quasis;
        result[attrName] = quasis.map((q) => q.value.raw).join('...');
      } else if (expr.type === 'BooleanLiteral') {
        result[attrName] = expr.value ? 'true' : 'false';
      } else if (expr.type === 'ConditionalExpression') {
        // Ternary: condition ? consequent : alternate
        // Prefer the alternate (falsy) branch — it represents the default/initial
        // state label (e.g. `isOpen ? 'Close menu' : 'Open menu'` → "Open menu").
        const ternary = expr as { consequent: Node; alternate: Node };
        const consequent = ternary.consequent;
        const alternate = ternary.alternate;
        if (alternate.type === 'StringLiteral') {
          result[attrName] = (alternate as { value: string }).value;
        } else if (consequent.type === 'StringLiteral') {
          result[attrName] = (consequent as { value: string }).value;
        } else {
          result[attrName] = 'expression';
        }
      } else {
        result[attrName] = 'expression';
      }
    }
  }

  return result;
}

function extractNavigationTargetFromJsxAttributes(
  attributes: Array<{
    type: string;
    name?: { type: string; name?: string };
    value?: Node | null;
  }>,
  functionMap: Map<string, Node>,
): string | undefined {
  for (const attr of attributes) {
    if (
      attr.type !== 'JSXAttribute' ||
      attr.name?.type !== 'JSXIdentifier' ||
      !attr.name.name ||
      !/^on[A-Z]/.test(attr.name.name) ||
      !attr.value ||
      attr.value.type !== 'JSXExpressionContainer'
    ) {
      continue;
    }

    const target = extractNavigationTargetFromNode(
      (attr.value as { expression: Node }).expression,
      functionMap,
      new Set<string>(),
    );
    if (target) return target;
  }

  return undefined;
}

function extractNavigationTargetFromNode(
  node: Node | null | undefined,
  functionMap: Map<string, Node>,
  visited: Set<string>,
): string | undefined {
  if (!node) return undefined;

  switch (node.type) {
    case 'StringLiteral':
      return node.value;
    case 'TemplateLiteral':
      return templateLiteralToRoute(node as any);
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
      return extractNavigationTargetFromNode((node as any).body, functionMap, visited);
    case 'BlockStatement':
      for (const statement of (node as any).body) {
        const target = extractNavigationTargetFromNode(statement, functionMap, visited);
        if (target) return target;
      }
      return undefined;
    case 'ExpressionStatement':
      return extractNavigationTargetFromNode((node as any).expression, functionMap, visited);
    case 'ReturnStatement':
      return extractNavigationTargetFromNode((node as any).argument, functionMap, visited);
    case 'Identifier': {
      const identifier = node as any;
      const name = identifier.name;
      if (!name || visited.has(name)) return undefined;
      const targetNode = functionMap.get(name);
      if (!targetNode) return undefined;
      visited.add(name);
      return extractNavigationTargetFromNode(targetNode, functionMap, visited);
    }
    case 'CallExpression': {
      const call = node as any;
      const callee = call.callee;
      if (isNavigationCallee(callee)) {
        return extractRouteLiteral(call.arguments?.[0]);
      }
      for (const arg of call.arguments ?? []) {
        if (
          arg?.type !== 'ArrowFunctionExpression' &&
          arg?.type !== 'FunctionExpression'
        ) {
          continue;
        }
        const target = extractNavigationTargetFromNode(arg, functionMap, visited);
        if (target) return target;
      }
      return undefined;
    }
    case 'IfStatement':
      return (
        extractNavigationTargetFromNode((node as any).consequent, functionMap, visited) ||
        extractNavigationTargetFromNode((node as any).alternate, functionMap, visited)
      );
    case 'ConditionalExpression':
      return (
        extractNavigationTargetFromNode((node as any).consequent, functionMap, visited) ||
        extractNavigationTargetFromNode((node as any).alternate, functionMap, visited)
      );
    case 'LogicalExpression':
      return (
        extractNavigationTargetFromNode((node as any).left, functionMap, visited) ||
        extractNavigationTargetFromNode((node as any).right, functionMap, visited)
      );
    case 'SequenceExpression':
      for (const expression of (node as any).expressions ?? []) {
        const target = extractNavigationTargetFromNode(expression, functionMap, visited);
        if (target) return target;
      }
      return undefined;
    case 'AssignmentExpression': {
      const assignment = node as any;
      if (isLocationHrefAssignment(assignment.left)) {
        return extractRouteLiteral(assignment.right);
      }
      return extractNavigationTargetFromNode(assignment.right, functionMap, visited);
    }
    default:
      return undefined;
  }
}

function collectFunctionNodes(ast: Node): Map<string, Node> {
  const functionMap = new Map<string, Node>();

  traverse(ast as any, {
    FunctionDeclaration(path) {
      const name = path.node.id?.name;
      if (!name) return;
      functionMap.set(name, path.node);
    },
    VariableDeclarator(path) {
      if (path.node.id.type !== 'Identifier' || !path.node.init) return;
      const init = path.node.init;
      if (
        init.type === 'ArrowFunctionExpression' ||
        init.type === 'FunctionExpression'
      ) {
        functionMap.set(path.node.id.name, init);
      }
    },
  });

  return functionMap;
}

/**
 * Collect arrays of static object literals so JSX rendered through `.map()`
 * can be represented as the individual elements that appear in the DOM.
 */
function collectStaticObjectCollections(
  ast: Node,
): Map<string, Array<Record<string, string>>> {
  const collections = new Map<string, Array<Record<string, string>>>();

  traverse(ast as any, {
    VariableDeclarator(path) {
      if (path.node.id.type !== 'Identifier' || !path.node.init) return;
      const items = extractStaticObjectArray(path.node.init);
      if (items.length > 0) {
        collections.set(path.node.id.name, items);
      }
    },
  });

  return collections;
}

function findMappedStaticCollection(
  nodePath: any,
  collections: Map<string, Array<Record<string, string>>>,
): MappedStaticCollection | undefined {
  let current = nodePath.parentPath;

  while (current) {
    const node = current.node;
    if (
      node?.type === 'CallExpression' &&
      node.callee?.type === 'MemberExpression' &&
      getMemberPropertyName(node.callee) === 'map'
    ) {
      const callback = node.arguments?.[0];
      const bindingName = callback?.params?.[0]?.type === 'Identifier'
        ? callback.params[0].name
        : undefined;
      const collectionNode = unwrapStaticExpression(node.callee.object);
      const collectionName = collectionNode?.type === 'Identifier'
        ? collectionNode.name
        : 'inline-items';
      const items = collectionNode?.type === 'Identifier'
        ? collections.get(collectionNode.name) || []
        : extractStaticObjectArray(collectionNode);

      if (bindingName && items.length > 0) {
        return { bindingName, collectionName, items };
      }
    }
    current = current.parentPath;
  }

  return undefined;
}

function extractStaticTabComponentItems(
  tagName: string,
  attributes: Array<any>,
  collections: Map<string, Array<Record<string, string>>>,
): Array<{ label: string; collectionName: string }> {
  const normalizedTag = tagName.split('.').pop() || tagName;
  if (!/(^tabs?$|tabgroup$|tablist$)/i.test(normalizedTag)) return [];

  for (const attribute of attributes) {
    if (
      attribute.type !== 'JSXAttribute' ||
      attribute.name?.type !== 'JSXIdentifier' ||
      !['tabs', 'items', 'options'].includes(attribute.name.name) ||
      attribute.value?.type !== 'JSXExpressionContainer'
    ) {
      continue;
    }

    const expression = unwrapStaticExpression(attribute.value.expression);
    const collectionName = expression?.type === 'Identifier'
      ? expression.name
      : attribute.name.name;
    const items = expression?.type === 'Identifier'
      ? collections.get(expression.name) || []
      : extractStaticObjectArray(expression);
    const tabs = items
      .map((item) => item.label || item.text || item.title || item.name)
      .filter((label): label is string => Boolean(label))
      .map((label) => ({ label, collectionName }));

    if (tabs.length > 0) return tabs;
  }

  return [];
}

function extractStaticObjectArray(node: any): Array<Record<string, string>> {
  const expression = unwrapStaticExpression(node);
  if (expression?.type !== 'ArrayExpression') return [];

  return (expression.elements || [])
    .map((element: any) => extractStaticObject(element))
    .filter((item: Record<string, string> | undefined): item is Record<string, string> => Boolean(item));
}

function extractStaticObject(node: any): Record<string, string> | undefined {
  const expression = unwrapStaticExpression(node);
  if (expression?.type !== 'ObjectExpression') return undefined;

  const result: Record<string, string> = {};
  for (const property of expression.properties || []) {
    if (property.type !== 'ObjectProperty' && property.type !== 'Property') continue;
    const key = getObjectPropertyKeyName(property.key);
    const value = resolveStaticExpression(property.value);
    if (key && value !== undefined) result[key] = value;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function unwrapStaticExpression(node: any): any {
  let current = node;
  while (
    current &&
    ['TSAsExpression', 'TSSatisfiesExpression', 'TypeCastExpression', 'ParenthesizedExpression'].includes(current.type)
  ) {
    current = current.expression;
  }
  return current;
}

function resolveStaticExpression(
  node: any,
  binding?: StaticBinding,
): string | undefined {
  const expression = unwrapStaticExpression(node);
  if (!expression) return undefined;

  if (expression.type === 'StringLiteral' || expression.type === 'NumericLiteral') {
    return String(expression.value);
  }
  if (expression.type === 'BooleanLiteral') {
    return expression.value ? 'true' : 'false';
  }
  if (expression.type === 'MemberExpression' && binding) {
    const object = unwrapStaticExpression(expression.object);
    const propertyName = getMemberPropertyName(expression);
    if (object?.type === 'Identifier' && object.name === binding.name && propertyName) {
      return binding.values[propertyName];
    }
  }
  if (expression.type === 'TemplateLiteral') {
    let value = '';
    for (let index = 0; index < expression.quasis.length; index++) {
      value += expression.quasis[index].value.cooked ?? expression.quasis[index].value.raw ?? '';
      if (index < expression.expressions.length) {
        value += resolveStaticExpression(expression.expressions[index], binding) ?? '...';
      }
    }
    return value;
  }
  return undefined;
}

function getMemberPropertyName(member: any): string | undefined {
  if (!member?.property) return undefined;
  if (member.property.type === 'Identifier' && !member.computed) {
    return member.property.name;
  }
  if (member.property.type === 'StringLiteral') {
    return member.property.value;
  }
  return undefined;
}

function enrichFingerprintWithHeading(
  fingerprint: ReturnType<typeof buildFingerprint>,
  heading: string,
): void {
  fingerprint.tier4_context.nearest_heading = heading;
  fingerprint.tier4_context.score = Math.min(
    (fingerprint.tier4_context.score || 0) + 15,
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

function isControlledContainer(
  tagName: string,
  attributes: Record<string, string>,
): boolean {
  const role = (attributes['role'] || '').toLowerCase();
  const hasId = Boolean(attributes['id']);
  const hasHiddenAttribute = Object.prototype.hasOwnProperty.call(attributes, 'hidden');

  if (tagName === 'dialog') return true;
  if (hasId && hasHiddenAttribute) return true;
  if (['menu', 'tabpanel', 'dialog', 'alertdialog'].includes(role)) return true;
  if (tagName === 'aside' && (hasHiddenAttribute || Boolean(attributes['aria-label']))) return true;
  return false;
}

function isNavigationCallee(callee: any): boolean {
  if (!callee) return false;
  if (callee.type === 'Identifier') {
    return ['navigate', 'push', 'replace'].includes(callee.name);
  }
  if (callee.type === 'MemberExpression') {
    const propertyName =
      callee.property?.type === 'Identifier'
        ? callee.property.name
        : callee.property?.type === 'StringLiteral'
          ? callee.property.value
          : '';
    return ['push', 'replace', 'prefetch'].includes(propertyName);
  }
  return false;
}

function isLocationHrefAssignment(left: any): boolean {
  if (!left || left.type !== 'MemberExpression') return false;
  const propertyName =
    left.property?.type === 'Identifier'
      ? left.property.name
      : left.property?.type === 'StringLiteral'
        ? left.property.value
        : '';
  return propertyName === 'href';
}

function extractRouteLiteral(node: any): string | undefined {
  if (!node) return undefined;
  if (node.type === 'StringLiteral') {
    return node.value;
  }
  if (node.type === 'TemplateLiteral') {
    return templateLiteralToRoute(node);
  }
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    const left = extractRouteLiteral(node.left);
    const right = extractRouteLiteral(node.right);
    if (left && right) return `${left}${right}`;
    if (left) return `${left}:param`;
    if (right) return `:param${right}`;
  }
  return undefined;
}

function templateLiteralToRoute(node: {
  quasis: Array<{ value: { cooked?: string | null } }>;
}): string | undefined {
  if (!node.quasis?.length) return undefined;
  let result = '';
  node.quasis.forEach((quasi, index) => {
    result += quasi.value.cooked ?? '';
    if (index < node.quasis.length - 1) {
      result += ':param';
    }
  });
  return result || undefined;
}

function extractNavigationConfigElements(
  ast: Node,
  filePath: string,
  routePath: string,
  componentName: string | undefined,
): ScannedElement[] {
  const descriptor = `${filePath} ${componentName ?? ''}`.toLowerCase();
  if (!/(sidebar|sidenav|menu|nav|breadcrumb)/.test(descriptor)) {
    return [];
  }

  const elements: ScannedElement[] = [];

  traverse(ast as any, {
    ObjectExpression(path) {
      const navItem = extractNavItemFromObjectExpression(path.node as any);
      if (!navItem?.href) return;

      const partialElement: Partial<ScannedElement> = {
        id: randomUUID(),
        route_path: routePath,
        tag: 'link',
        text: navItem.text,
        href: navItem.href,
        component_name: componentName,
        source_file: filePath,
        role: 'link',
        ...(navItem.container
          ? {
              hidden: true,
              container: navItem.container,
              containerState: 'collapsed',
            }
          : {}),
      };

      elements.push({
        ...partialElement,
        id: partialElement.id!,
        route_path: routePath,
        tag: 'link',
        fingerprint: buildFingerprint(partialElement),
      } as ScannedElement);
    },
  });

  return elements;
}

function extractNavItemFromObjectExpression(node: {
  properties?: Array<any>;
}): { text?: string; href?: string; container?: string } | undefined {
  if (!node.properties?.length) return undefined;

  let text: string | undefined;
  let href: string | undefined;
  let container: string | undefined;

  for (const property of node.properties) {
    if (property.type !== 'ObjectProperty' && property.type !== 'Property') continue;
    const keyName = getObjectPropertyKeyName(property.key);
    if (!keyName) continue;

    if (keyName === 'text' || keyName === 'label' || keyName === 'title') {
      text = extractStaticValue(property.value) ?? text;
    } else if (keyName === 'link' || keyName === 'href' || keyName === 'to') {
      href = extractStaticValue(property.value) ?? href;
    } else if (keyName === 'dropdown' || keyName === 'items' || keyName === 'children') {
      container = text ?? container;
    }
  }

  if (!href) return undefined;
  if (!href.startsWith('/')) return undefined;

  return { text, href, container };
}

function getObjectPropertyKeyName(key: any): string | undefined {
  if (!key) return undefined;
  if (key.type === 'Identifier') return key.name;
  if (key.type === 'StringLiteral') return key.value;
  return undefined;
}

function extractStaticValue(node: any): string | undefined {
  if (!node) return undefined;
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'TemplateLiteral') return templateLiteralToRoute(node);
  return undefined;
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
 * Walk up the AST from a JSXOpeningElement to detect if it's inside a
 * hidden/collapsed container. Detects three patterns:
 *
 * 1. Conditional rendering:  {open && <div>...</div>}
 *    or {isOpen ? <div>...</div> : null}
 * 2. Known collapsible component:  <Accordion>, <Collapse>, <Dropdown>, etc.
 * 3. HTML <details> element without open attribute
 */
function detectHiddenContainer(nodePath: any): HiddenContainerInfo | null {
  let current = nodePath.parentPath;

  while (current) {
    const node = current.node;

    // Pattern 1: Inside a LogicalExpression like {open && <JSX>}
    if (node.type === 'LogicalExpression' && node.operator === '&&') {
      const conditionName = extractConditionName(node.left);
      if (conditionName && CONDITIONAL_STATE_RE.test(conditionName)) {
        return {
          hidden: true,
          container: conditionName,
          containerState: 'collapsed',
        };
      }
    }

    // Pattern 1b: Inside a ConditionalExpression like {isOpen ? <JSX> : null}
    if (node.type === 'ConditionalExpression') {
      const conditionName = extractConditionName(node.test);
      if (conditionName && CONDITIONAL_STATE_RE.test(conditionName)) {
        return {
          hidden: true,
          container: conditionName,
          containerState: 'collapsed',
        };
      }
    }

    // Pattern 2: Inside a JSXElement whose tag is a known collapsible component
    if (node.type === 'JSXElement') {
      const opening = node.openingElement;
      if (opening?.name?.type === 'JSXIdentifier') {
        const compName = opening.name.name;
        if (COLLAPSIBLE_COMPONENTS.has(compName.toLowerCase())) {
          return {
            hidden: true,
            container: compName,
            containerState: 'collapsed',
          };
        }
      }
      // Also check for JSXMemberExpression like Accordion.Panel
      if (opening?.name?.type === 'JSXMemberExpression') {
        const obj = opening.name.object;
        const prop = opening.name.property;
        if (obj?.name && prop?.name) {
          const fullName = `${obj.name}${prop.name}`.toLowerCase();
          if (COLLAPSIBLE_COMPONENTS.has(fullName)) {
            return {
              hidden: true,
              container: `${obj.name}.${prop.name}`,
              containerState: 'collapsed',
            };
          }
        }
      }
    }

    // Pattern 3: Inside a <details> element (native HTML collapsible)
    if (node.type === 'JSXElement') {
      const opening = node.openingElement;
      if (
        opening?.name?.type === 'JSXIdentifier' &&
        opening.name.name === 'details'
      ) {
        // Check if it has an `open` attribute — if so, it's expanded by default
        const hasOpen = opening.attributes?.some(
          (attr: any) =>
            attr.type === 'JSXAttribute' &&
            attr.name?.type === 'JSXIdentifier' &&
            attr.name.name === 'open',
        );
        if (!hasOpen) {
          return {
            hidden: true,
            container: 'details',
            containerState: 'collapsed',
          };
        }
      }
    }

    current = current.parentPath;
  }

  return null;
}

/**
 * Extract a readable identifier name from an AST condition node.
 * Handles: Identifier (open), MemberExpression (state.open),
 * UnaryExpression (!closed), and CallExpression (isOpen()).
 */
function extractConditionName(node: any): string | null {
  if (!node) return null;

  if (node.type === 'Identifier') {
    return node.name;
  }

  if (node.type === 'MemberExpression' && node.property) {
    const prop = node.property;
    if (prop.type === 'Identifier') return prop.name;
  }

  if (node.type === 'UnaryExpression' && node.operator === '!') {
    return extractConditionName(node.argument);
  }

  if (node.type === 'CallExpression' && node.callee) {
    return extractConditionName(node.callee);
  }

  return null;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

import type { FrameworkType, Route, ScannedElement, UIMap, UIMapNode, UIMapNodeKind } from './types';

/**
 * Build a compact, privacy-conscious UI structure tree from the static scan.
 *
 * The tree is derived from metadata the scanner already extracts:
 * route -> heading/form/component grouping -> interactive elements.
 * It does not include source code or bundle contents.
 */
export function buildUIMap(
  framework: FrameworkType,
  routes: Route[],
  elements: ScannedElement[],
): UIMap {
  const generatedAt = new Date().toISOString();
  const layoutElements = elements.filter(isLayoutScopedElement);
  const routeScopedElements = elements.filter((element) => !isLayoutScopedElement(element));
  const root: UIMapNode = {
    id: 'app',
    kind: 'app',
    label: 'Application',
    metadata: { framework },
    children: [],
  };

  const routesByKey = new Map(routes.map((route) => [routeKey(route), route]));
  const routeKeys = new Set<string>(routes.map(routeKey));
  for (const element of routeScopedElements) {
    if (element.route_path) routeKeys.add(elementRouteKey(element));
  }

  const sortedRouteKeys = Array.from(routeKeys).sort((a, b) => {
    const pathA = pathFromRouteKey(a);
    const pathB = pathFromRouteKey(b);
    if (pathA === '/' && pathB !== '/') return -1;
    if (pathB === '/' && pathA !== '/') return 1;
    return a.localeCompare(b);
  });
  const hasOrigins = sortedRouteKeys.some((key) => originFromRouteKey(key));
  const domainNodes = new Map<string, UIMapNode>();
  const connections: UIMap['connections'] = [];
  const layoutConnections = layoutShellConnections(layoutElements, routeKeys, routesByKey);

  if (layoutElements.length > 0) {
    root.children.push(buildLayoutNode(layoutElements, routeKeys, layoutConnections));
    connections.push(...layoutConnections);
  }

  for (const key of sortedRouteKeys) {
    const routePath = pathFromRouteKey(key);
    const origin = originFromRouteKey(key);
    const route = routesByKey.get(key) ?? makeSyntheticRoute(routePath, origin);
    const routeNode = buildRouteNode(route);
    const routeElements = routeScopedElements.filter((element) => elementRouteKey(element) === key);
    const routeConnections = buildRouteConnections(key, routeElements, routeKeys, routesByKey);
    routeNode.metadata = {
      ...(routeNode.metadata ?? {}),
      links_to: routeConnections.filter((connection) => connection.kind === 'navigates_to'),
    };
    connections.push(...routeConnections);
    const groups = groupRouteElements(routeElements, routeKeys);

    for (const group of groups) {
      routeNode.children.push(group);
    }

    if (hasOrigins && origin) {
      let domainNode = domainNodes.get(origin);
      if (!domainNode) {
        domainNode = {
          id: stableId('domain', origin),
          kind: 'domain',
          label: route.host || routeHostFromOrigin(origin) || origin,
          route_origin: origin,
          route_host: route.host,
          metadata: { origin },
          children: [],
        };
        domainNodes.set(origin, domainNode);
        root.children.push(domainNode);
      }
      domainNode.children.push(routeNode);
    } else {
      root.children.push(routeNode);
    }
  }

  return {
    version: 1,
    framework,
    root,
    route_count: sortedRouteKeys.length,
    element_count: elements.length,
    connections,
    generated_at: generatedAt,
  };
}

function buildLayoutNode(
  elements: ScannedElement[],
  routeKeys: Set<string>,
  connections: NonNullable<UIMap['connections']>,
): UIMapNode {
  const node: UIMapNode = {
    id: 'layout-shell',
    kind: 'layout',
    label: 'Application Shell',
    metadata: {
      links_to: connections.filter((connection) => connection.kind === 'navigates_to'),
    },
    children: [],
  };

  for (const group of groupRouteElements(elements, routeKeys)) {
    node.children.push(group);
  }

  return node;
}

function makeSyntheticRoute(path: string, origin?: string): Route {
  return {
    path,
    origin,
    host: origin ? routeHostFromOrigin(origin) : undefined,
    dynamic_segments: [],
    auth_required: false,
    headings: [],
  };
}

function buildRouteNode(route: Route): UIMapNode {
  const label = route.page_title || route.component_name || route.path || 'Route';
  return {
    id: stableId('route', route.origin, route.path, route.url),
    kind: 'route',
    label,
    route_path: route.path,
    route_origin: route.origin,
    route_host: route.host,
    route_url: route.url,
    component_name: route.component_name,
    source_file: route.source_file,
    metadata: {
      path: route.path,
      origin: route.origin,
      host: route.host,
      url: route.url,
      dynamic_segments: route.dynamic_segments,
      auth_required: route.auth_required,
      headings: route.headings,
    },
    children: [],
  };
}

function groupRouteElements(elements: ScannedElement[], routeKeys: Set<string>): UIMapNode[] {
  const groups = new Map<string, UIMapNode>();

  for (const element of elements) {
    const group = describeGroup(element);
    const key = `${group.kind}:${group.label}`;
    let groupNode = groups.get(key);

    if (!groupNode) {
      groupNode = {
        id: stableId('group', element.route_origin, element.route_path, element.route_url, group.kind, group.label),
        kind: group.kind,
        label: group.label,
        route_path: element.route_path,
        route_origin: element.route_origin,
        route_host: element.route_host,
        route_url: element.route_url,
        component_name: group.kind === 'component' ? element.component_name : undefined,
        source_file: element.source_file,
        metadata: group.metadata,
        children: [],
      };
      groups.set(key, groupNode);
    }

    groupNode.children.push(buildElementNode(element, routeKeys));
  }

  return Array.from(groups.values()).sort((a, b) => {
    const orderA = groupOrder(a.kind);
    const orderB = groupOrder(b.kind);
    return orderA === orderB ? a.label.localeCompare(b.label) : orderA - orderB;
  });
}

function describeGroup(element: ScannedElement): {
  kind: UIMapNodeKind;
  label: string;
  metadata?: Record<string, unknown>;
} {
  const role = element.role?.toLowerCase();
  const tag = element.tag.toLowerCase();
  const heading = element.fingerprint?.tier4_context?.nearest_heading;
  const label = elementLabel(element);

  if (isDialogElement(element)) {
    return { kind: 'dialog', label: heading || element.component_name || 'Dialog' };
  }

  if (isDrawerElement(element)) {
    return {
      kind: 'drawer',
      label: heading || element.container || element.component_name || 'Drawer',
      metadata: { pattern: 'drawer' },
    };
  }

  if (isTabsElement(element)) {
    return {
      kind: 'tabs',
      label: heading || element.component_name || 'Tabs',
      metadata: { pattern: 'tabs' },
    };
  }

  if (isAccordionElement(element)) {
    return {
      kind: 'accordion',
      label: heading || element.container || element.component_name || 'Accordion',
      metadata: { pattern: 'accordion' },
    };
  }

  if (isDropdownElement(element)) {
    return {
      kind: 'dropdown',
      label: heading || element.component_name || 'Menu',
      metadata: { pattern: 'dropdown' },
    };
  }

  if (element.form_label || ['input', 'select', 'textarea'].includes(tag) || role === 'textbox' || role === 'combobox') {
    return {
      kind: 'form',
      label: looksLikeFilterControl(element) ? (heading || 'Filters') : (element.form_label || heading || 'Form fields'),
      metadata: {
        form_label: element.form_label,
        subtype: looksLikeFilterControl(element) ? 'filters' : 'fields',
      },
    };
  }

  if (role === 'tab' || role === 'menuitem' || role === 'link' || tag === 'a' || tag === 'summary') {
    return {
      kind: 'navigation',
      label: heading || element.component_name || 'Navigation',
    };
  }

  if (isListElement(element)) {
    return {
      kind: 'list',
      label: heading || element.component_name || 'List',
      metadata: {
        subtype: inferListSubtype(element, label),
      },
    };
  }

  if (heading) {
    return {
      kind: 'section',
      label: heading,
      metadata: inferSectionMetadata(element),
    };
  }

  if (element.component_name) {
    return {
      kind: 'component',
      label: element.component_name,
    };
  }

  return { kind: 'section', label: 'Main content' };
}

function buildElementNode(element: ScannedElement, routeKeys: Set<string>): UIMapNode {
  const selector = bestSelector(element);
  const label = elementLabel(element);
  const linkedRoute = linkedRouteForElement(element, routeKeys);
  return {
    id: elementNodeId(element),
    kind: 'element',
    label,
    route_path: element.route_path,
    route_origin: element.route_origin,
    route_host: element.route_host,
    route_url: element.route_url,
    component_name: element.component_name,
    source_file: element.source_file,
    selector: selector || undefined,
    element_id: element.id,
    action_type: element.action_type || inferActionType(element),
    text: element.text,
    metadata: {
      tag: element.tag,
      role: element.role,
      type: element.type,
      href: element.href,
      aria_label: element.aria_label,
      placeholder: element.placeholder,
      name: element.name,
      data_guideai: element.data_guideai,
      data_testid: element.data_testid,
      aria_controls: element.aria_controls,
      aria_expanded: element.aria_expanded,
      aria_haspopup: element.aria_haspopup,
      hidden: element.hidden,
      container: element.container,
      container_state: element.containerState,
      container_toggle_id: element.container_toggle_id,
      container_toggle_selector: element.container_toggle_selector,
      container_toggle_label: element.container_toggle_label,
      fingerprint_score: element.fingerprint?.total_score,
      linked_route_path: linkedRoute ? pathFromRouteKey(linkedRoute) : undefined,
      linked_route_origin: linkedRoute ? originFromRouteKey(linkedRoute) : undefined,
    },
    children: [],
  };
}

function buildRouteConnections(
  sourceKey: string,
  routeElements: ScannedElement[],
  routeKeys: Set<string>,
  routesByKey: Map<string, Route>,
): NonNullable<UIMap['connections']> {
  const connections: NonNullable<UIMap['connections']> = [];
  connections.push(...routeLinkConnections(sourceKey, routeElements, routeKeys, routesByKey));
  connections.push(...semanticConnectionsForElements(routeElements, routeKeys));
  return dedupeConnections(connections);
}

function routeLinkConnections(
  sourceKey: string,
  routeElements: ScannedElement[],
  routeKeys: Set<string>,
  routesByKey: Map<string, Route>,
): NonNullable<UIMap['connections']> {
  const connections: NonNullable<UIMap['connections']> = [];
  const seen = new Set<string>();
  const sourceRoute = routesByKey.get(sourceKey);

  for (const element of routeElements) {
    const targetKey = linkedRouteForElement(element, routeKeys);
    if (!targetKey || targetKey === sourceKey || seen.has(targetKey)) continue;
    seen.add(targetKey);
    const targetRoute = routesByKey.get(targetKey);
    connections.push({
      from_route_path: pathFromRouteKey(sourceKey),
      from_route_origin: originFromRouteKey(sourceKey) || undefined,
      from_route_url: sourceRoute?.url || urlFromRouteKey(sourceKey),
      to_route_path: pathFromRouteKey(targetKey),
      to_route_origin: originFromRouteKey(targetKey) || undefined,
      to_route_url: targetRoute?.url || urlFromRouteKey(targetKey),
      from_node_id: routeNodeIdFromKey(sourceKey),
      from_node_kind: 'route',
      to_node_id: routeNodeIdFromKey(targetKey),
      to_node_kind: 'route',
      kind: 'navigates_to',
      scope: 'route',
      label: elementLabel(element),
      selector: bestSelector(element) || undefined,
      metadata: {
        element_id: element.id,
      },
    });
    if (connections.length >= 30) break;
  }

  return connections;
}

function layoutShellConnections(
  layoutElements: ScannedElement[],
  routeKeys: Set<string>,
  routesByKey: Map<string, Route>,
): NonNullable<UIMap['connections']> {
  const connections: NonNullable<UIMap['connections']> = [];
  const seen = new Set<string>();

  for (const element of layoutElements) {
    const targetKey = linkedRouteForElement(element, routeKeys);
    if (!targetKey || seen.has(targetKey)) continue;
    seen.add(targetKey);
    const targetRoute = routesByKey.get(targetKey);
    connections.push({
      to_route_path: pathFromRouteKey(targetKey),
      to_route_origin: originFromRouteKey(targetKey) || undefined,
      to_route_url: targetRoute?.url || urlFromRouteKey(targetKey),
      from_node_id: 'layout-shell',
      from_node_kind: 'layout',
      to_node_id: routeNodeIdFromKey(targetKey),
      to_node_kind: 'route',
      kind: 'navigates_to',
      scope: 'layout',
      label: elementLabel(element),
      selector: bestSelector(element) || undefined,
      metadata: {
        element_id: element.id,
        href: element.href,
        source_file: element.source_file,
        component_name: element.component_name,
      },
    });
  }

  return connections;
}

function semanticConnectionsForElements(
  routeElements: ScannedElement[],
  routeKeys: Set<string>,
): NonNullable<UIMap['connections']> {
  const connections: NonNullable<UIMap['connections']> = [];
  const targetsByDomId = new Map<string, ScannedElement[]>();
  const semanticTargetsByScope = new Map<string, Map<string, ScannedElement[]>>();

  for (const element of routeElements) {
    if (element.dom_id) {
      const existing = targetsByDomId.get(element.dom_id) ?? [];
      existing.push(element);
      targetsByDomId.set(element.dom_id, existing);
    }
    for (const targetType of inferSemanticTargetTypes(element)) {
      const scope = semanticScopeKey(element);
      let scopeTargets = semanticTargetsByScope.get(scope);
      if (!scopeTargets) {
        scopeTargets = new Map<string, ScannedElement[]>();
        semanticTargetsByScope.set(scope, scopeTargets);
      }
      const existing = scopeTargets.get(targetType) ?? [];
      existing.push(element);
      scopeTargets.set(targetType, existing);
    }
  }

  for (const element of routeElements) {
    const sourceNodeId = elementNodeId(element);
    const selector = bestSelector(element) || undefined;

    if (element.tag.toLowerCase() === 'form' && element.href) {
      const targetKey = linkedRouteForElement(element, routeKeys);
      if (targetKey) {
        connections.push({
          from_route_path: element.route_path,
          from_route_origin: element.route_origin,
          from_route_url: element.route_url,
          to_route_path: pathFromRouteKey(targetKey),
          to_route_origin: originFromRouteKey(targetKey) || undefined,
          to_route_url: urlFromRouteKey(targetKey),
          from_node_id: sourceNodeId,
          from_node_kind: 'element',
          to_node_id: routeNodeIdFromKey(targetKey),
          to_node_kind: 'route',
          kind: 'submits_to',
          scope: 'component',
          label: elementLabel(element),
          selector,
          metadata: {
            element_id: element.id,
            href: element.href,
          },
        });
      }
    }

    const target =
      findControlledTarget(element, targetsByDomId) ??
      findSemanticScopeTarget(element, semanticTargetsByScope);
    if (!target) continue;

    connections.push({
      from_route_path: element.route_path,
      from_route_origin: element.route_origin,
      from_route_url: element.route_url,
      to_route_path: target.route_path,
      to_route_origin: target.route_origin,
      to_route_url: target.route_url,
      from_node_id: sourceNodeId,
      from_node_kind: 'element',
      to_node_id: elementNodeId(target),
      to_node_kind: 'element',
      kind: inferSemanticConnectionKind(element, target),
      scope: 'component',
      label: elementLabel(element),
      selector,
      metadata: {
        element_id: element.id,
        target_element_id: target.id,
        target_dom_id: target.dom_id,
      },
    });
  }

  return dedupeConnections(connections);
}

function linkedRouteForElement(element: ScannedElement, routeKeys: Set<string>): string | undefined {
  const targetKey = routeKeyFromHref(element);
  if (!targetKey) return undefined;
  if (routeKeys.has(targetKey)) return targetKey;

  const targetOrigin = originFromRouteKey(targetKey);
  const targetPath = normalizeRoutePath(pathFromRouteKey(targetKey));
  for (const routeKey of routeKeys) {
    const routeOrigin = originFromRouteKey(routeKey);
    if (routeOrigin !== targetOrigin && routeOrigin !== '') continue;
    if (routePathsMatch(normalizeRoutePath(pathFromRouteKey(routeKey)), targetPath)) {
      return routeKey;
    }
  }

  return undefined;
}

function routeKeyFromHref(element: ScannedElement): string | undefined {
  const href = element.href?.trim();
  if (!href || href.startsWith('#')) return undefined;
  if (/^(javascript|mailto|tel|data):/i.test(href)) return undefined;

  if (href.startsWith('/')) {
    const origin = element.route_origin;
    const url = origin ? `${origin}${href}` : href;
    return makeRouteKey(origin, href, url);
  }

  const base = element.route_url || (element.route_origin ? `${element.route_origin}${element.route_path || '/'}` : undefined);
  if (!base) {
    const routePath = element.route_path || '/';
    try {
      const url = new URL(href, `https://guideai.local${routePath.endsWith('/') ? routePath : `${routePath}/`}`);
      return makeRouteKey(undefined, url.pathname || '/', url.pathname || '/');
    } catch {
      return undefined;
    }
  }

  try {
    const url = new URL(href, base);
    return makeRouteKey(url.origin, url.pathname || '/', canonicalUrl(url));
  } catch {
    return undefined;
  }
}

function normalizeRoutePath(path: string): string {
  return path.replace(/\/+$/, '') || '/';
}

function routePathsMatch(routePath: string, targetPath: string): boolean {
  if (routePath === targetPath) return true;

  const routeSegments = routePath.split('/').filter(Boolean);
  const targetSegments = targetPath.split('/').filter(Boolean);

  let routeIndex = 0;
  let targetIndex = 0;

  while (routeIndex < routeSegments.length && targetIndex < targetSegments.length) {
    const routeSegment = routeSegments[routeIndex];
    const targetSegment = targetSegments[targetIndex];

    if (routeSegment.endsWith('*') || targetSegment.endsWith('*')) {
      return true;
    }

    if (
      routeSegment === targetSegment ||
      routeSegment.startsWith(':') ||
      targetSegment.startsWith(':')
    ) {
      routeIndex += 1;
      targetIndex += 1;
      continue;
    }

    return false;
  }

  return routeIndex === routeSegments.length && targetIndex === targetSegments.length;
}

function urlFromRouteKey(routeKey: string): string | undefined {
  const url = urlKeyFromRouteKey(routeKey);
  if (url) return url;
  const origin = originFromRouteKey(routeKey);
  const path = pathFromRouteKey(routeKey);
  return origin ? `${origin}${path}` : path;
}

function bestSelector(element: ScannedElement): string {
  if (element.data_guideai) return `[data-guideai="${cssAttrEscape(element.data_guideai)}"]`;
  if (element.data_testid) return `[data-testid="${cssAttrEscape(element.data_testid)}"]`;
  const tier1 = element.fingerprint?.tier1_stable;
  const tier3 = element.fingerprint?.tier3_structural;
  if (tier1?.id) return `#${cssIdentEscape(tier1.id)}`;
  if (tier1?.name) return `[name="${cssAttrEscape(tier1.name)}"]`;
  return tier3?.css_path || '';
}

function elementLabel(element: ScannedElement): string {
  const label =
    element.text ||
    element.aria_label ||
    element.placeholder ||
    element.form_label ||
    element.name ||
    element.href ||
    element.tag;
  return normalizeLabel(label, 100);
}

function inferActionType(element: ScannedElement): string {
  const tag = element.tag.toLowerCase();
  if (['a', 'link', 'navlink', 'routerlink'].includes(tag) || Boolean(element.href)) return 'navigate';
  if (tag === 'form') return 'submit';
  if (['input', 'textarea'].includes(tag)) return 'fill';
  if (tag === 'select') return 'select';
  return 'click';
}

function elementNodeId(element: ScannedElement): string {
  return stableId('element', element.route_origin, element.route_path, element.route_url, bestSelector(element) || element.id);
}

function routeNodeIdFromKey(routeKeyValue: string): string {
  return stableId(
    'route',
    originFromRouteKey(routeKeyValue),
    pathFromRouteKey(routeKeyValue),
    urlFromRouteKey(routeKeyValue),
  );
}

function isLayoutScopedElement(element: ScannedElement): boolean {
  const descriptor = `${element.component_name ?? ''} ${element.source_file ?? ''}`.toLowerCase();
  return descriptor.includes('layout') ||
    descriptor.includes('sidebar') ||
    descriptor.includes('navbar') ||
    descriptor.includes('topbar') ||
    descriptor.includes('header') ||
    descriptor.includes('menu') ||
    descriptor.includes('breadcrumb');
}

function isDialogElement(element: ScannedElement): boolean {
  const tag = element.tag.toLowerCase();
  const role = (element.role ?? '').toLowerCase();
  const descriptor = `${element.component_name ?? ''} ${element.aria_label ?? ''} ${element.text ?? ''}`.toLowerCase();
  return tag === 'dialog' || role === 'dialog' || role === 'alertdialog' || descriptor.includes('dialog') || descriptor.includes('modal');
}

function scopeKey(element: ScannedElement): string {
  return `${element.route_origin || ''}|${element.route_path}|${element.component_name || ''}|${element.source_file || ''}`;
}

function semanticScopeKey(element: ScannedElement): string {
  const heading = element.fingerprint?.tier4_context?.nearest_heading || '';
  const container = element.container || '';
  return `${scopeKey(element)}|${heading}|${container}`;
}

function findControlledTarget(
  element: ScannedElement,
  targetsByDomId: Map<string, ScannedElement[]>,
): ScannedElement | undefined {
  const controlId = element.aria_controls;
  if (!controlId) return undefined;
  if (controlId.includes('...') || controlId.includes(':param')) return undefined;
  const candidates = targetsByDomId.get(controlId) ?? [];
  return candidates.find((candidate) => candidate.id !== element.id);
}

function findDialogTarget(
  element: ScannedElement,
  dialogCandidatesByScope: Map<string, ScannedElement[]>,
): ScannedElement | undefined {
  if (element.aria_controls) return undefined;
  if (!looksLikeDialogTrigger(element)) return undefined;
  const candidates = dialogCandidatesByScope.get(scopeKey(element)) ?? [];
  if (candidates.length !== 1) return undefined;
  return candidates[0];
}

function findSemanticScopeTarget(
  element: ScannedElement,
  semanticTargetsByScope: Map<string, Map<string, ScannedElement[]>>,
): ScannedElement | undefined {
  const targetTypes = inferTriggerTargetTypes(element);
  if (targetTypes.length === 0) return undefined;

  const scopeTargets = semanticTargetsByScope.get(semanticScopeKey(element));
  if (!scopeTargets) return undefined;

  for (const targetType of targetTypes) {
    const candidates = (scopeTargets.get(targetType) ?? []).filter(
      (candidate) => candidate.id !== element.id,
    );
    if (candidates.length === 1) {
      return candidates[0];
    }
  }

  return undefined;
}

function looksLikeDialogTrigger(element: ScannedElement): boolean {
  const text = `${element.text ?? ''} ${element.aria_label ?? ''}`.toLowerCase();
  return element.aria_haspopup === 'dialog' || /\b(open|show|launch)\b/.test(text) && /\b(dialog|modal)\b/.test(text);
}

function inferSemanticConnectionKind(
  source: ScannedElement,
  target: ScannedElement,
): NonNullable<NonNullable<UIMap['connections']>[number]['kind']> {
  const targetTypes = inferSemanticTargetTypes(target);
  const sourceText = semanticText(source);

  if (
    targetTypes.includes('dialog') ||
    targetTypes.includes('dropdown') ||
    targetTypes.includes('drawer') ||
    source.aria_haspopup === 'dialog' ||
    /\b(dialog|modal|drawer|menu|sidebar|popover)\b/.test(sourceText)
  ) {
    return 'opens';
  }

  if (
    source.tag.toLowerCase() === 'summary' ||
    targetTypes.includes('tabs') ||
    targetTypes.includes('accordion') ||
    targetTypes.includes('details') ||
    targetTypes.includes('hidden-panel') ||
    source.aria_expanded != null
  ) {
    return 'reveals';
  }

  return 'reveals';
}

function semanticText(element: ScannedElement): string {
  return `${element.text ?? ''} ${element.aria_label ?? ''} ${element.placeholder ?? ''} ${element.name ?? ''}`.toLowerCase();
}

function descriptorText(element: ScannedElement): string {
  return `${element.component_name ?? ''} ${element.source_file ?? ''} ${element.container ?? ''}`.toLowerCase();
}

function isTabsElement(element: ScannedElement): boolean {
  const role = (element.role ?? '').toLowerCase();
  const descriptor = descriptorText(element);
  return role === 'tab' || role === 'tabpanel' || role === 'tablist' || descriptor.includes('tab');
}

function isAccordionElement(element: ScannedElement): boolean {
  const tag = element.tag.toLowerCase();
  const descriptor = descriptorText(element);
  return tag === 'details' ||
    tag === 'summary' ||
    descriptor.includes('accordion') ||
    descriptor.includes('collapse') ||
    descriptor.includes('details') ||
    (Boolean(element.aria_controls) && element.aria_expanded != null && !isDropdownElement(element) && !isDrawerElement(element));
}

function isDropdownElement(element: ScannedElement): boolean {
  const role = (element.role ?? '').toLowerCase();
  const descriptor = descriptorText(element);
  return role === 'menu' ||
    role === 'menuitem' ||
    element.aria_haspopup === 'menu' ||
    element.aria_haspopup === 'listbox' ||
    descriptor.includes('dropdown') ||
    descriptor.includes('popover');
}

function isDrawerElement(element: ScannedElement): boolean {
  const tag = element.tag.toLowerCase();
  const descriptor = descriptorText(element);
  return tag === 'aside' ||
    descriptor.includes('drawer');
}

function isListElement(element: ScannedElement): boolean {
  const descriptor = `${descriptorText(element)} ${semanticText(element)}`;
  return descriptor.includes('list') ||
    descriptor.includes('table') ||
    descriptor.includes('grid') ||
    descriptor.includes('results') ||
    descriptor.includes('pagination') ||
    /\b(previous|next|page \d+)\b/.test(descriptor);
}

function inferListSubtype(element: ScannedElement, label: string): string {
  const descriptor = `${descriptorText(element)} ${label}`.toLowerCase();
  if (descriptor.includes('pagination') || /\b(previous|next|page)\b/.test(descriptor)) {
    return 'pagination';
  }
  if (descriptor.includes('table')) return 'table_controls';
  if (descriptor.includes('grid')) return 'grid_controls';
  return 'list_controls';
}

function inferSectionMetadata(element: ScannedElement): Record<string, unknown> | undefined {
  if (looksLikeFilterControl(element)) return { subtype: 'filters' };
  if (isListElement(element)) return { subtype: inferListSubtype(element, elementLabel(element)) };
  return undefined;
}

function looksLikeFilterControl(element: ScannedElement): boolean {
  const text = semanticText(element);
  return /\b(search|filter|sort|category|status|date range|keyword)\b/.test(text);
}

function inferSemanticTargetTypes(element: ScannedElement): string[] {
  const types: string[] = [];
  const role = (element.role ?? '').toLowerCase();
  const tag = element.tag.toLowerCase();

  if (isDialogElement(element)) types.push('dialog');
  if (isDrawerElement(element)) types.push('drawer');
  if (isDropdownElement(element) && (role === 'menu' || tag === 'div' || tag === 'aside' || Boolean(element.hidden))) {
    types.push('dropdown');
  }
  if (isTabsElement(element) && role === 'tabpanel') types.push('tabs');
  if (tag === 'details') types.push('details');
  if (isAccordionElement(element) && Boolean(element.hidden)) types.push('accordion');
  if (Boolean(element.hidden) && element.dom_id) types.push('hidden-panel');

  return Array.from(new Set(types));
}

function inferTriggerTargetTypes(element: ScannedElement): string[] {
  const role = (element.role ?? '').toLowerCase();
  const tag = element.tag.toLowerCase();
  const text = semanticText(element);
  const types: string[] = [];

  if (role === 'tab' || (element.aria_controls && /\btab\b/.test(text))) {
    types.push('tabs');
  }

  if (tag === 'summary' || isAccordionElement(element) || /\b(show|hide|expand|collapse|toggle|reveal)\b/.test(text)) {
    types.push('details', 'accordion', 'hidden-panel');
  }

  if (element.aria_haspopup === 'menu' || /\b(menu|popover|actions)\b/.test(text)) {
    types.push('dropdown');
  }

  if (looksLikeDialogTrigger(element)) {
    types.push('dialog');
  }

  if (/\b(drawer|sidebar|panel)\b/.test(text) || isDrawerElement(element)) {
    types.push('drawer');
  }

  if (element.aria_controls) {
    types.push('hidden-panel', 'accordion', 'tabs', 'dropdown', 'drawer', 'dialog');
  }

  return Array.from(new Set(types));
}

function dedupeConnections(
  connections: NonNullable<UIMap['connections']>,
): NonNullable<UIMap['connections']> {
  const deduped: NonNullable<UIMap['connections']> = [];
  const seen = new Set<string>();

  for (const connection of connections) {
    const key = [
      connection.kind || 'navigates_to',
      connection.from_node_id || '',
      connection.from_route_path || '',
      connection.to_node_id || '',
      connection.to_route_path || '',
      connection.label || '',
    ].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(connection);
  }

  return deduped;
}

function groupOrder(kind: UIMapNodeKind): number {
  const order: Partial<Record<UIMapNodeKind, number>> = {
    domain: 0,
    navigation: 1,
    tabs: 2,
    accordion: 3,
    dropdown: 4,
    drawer: 5,
    section: 6,
    component: 7,
    form: 8,
    list: 9,
    dialog: 10,
    element: 11,
  };
  return order[kind] ?? 99;
}

function normalizeLabel(value: string | undefined, maxLength: number): string {
  const normalized = (value || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return 'Unnamed';
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}...` : normalized;
}

function stableId(...parts: Array<string | undefined>): string {
  return parts
    .filter(Boolean)
    .join(':')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'node';
}

function routeKey(route: Route): string {
  return makeRouteKey(route.origin, route.path, route.url);
}

function elementRouteKey(element: ScannedElement): string {
  return makeRouteKey(element.route_origin, element.route_path, element.route_url);
}

function makeRouteKey(origin?: string, path?: string, url?: string): string {
  return `${origin || ''}|${path || '/'}|${canonicalUrl(url)}`;
}

function canonicalUrl(url?: string | URL): string {
  if (!url) return '';
  try {
    const parsed = url instanceof URL ? url : new URL(url);
    return `${parsed.origin}${parsed.pathname || '/'}${parsed.search}${parsed.hash}`;
  } catch {
    return '';
  }
}

function originFromRouteKey(key: string): string {
  return key.split('|')[0] || '';
}

function pathFromRouteKey(key: string): string {
  return key.split('|')[1] || '/';
}

function urlKeyFromRouteKey(key: string): string {
  const parts = key.split('|');
  return parts.length >= 3 ? parts.slice(2).join('|') : '';
}

function routeHostFromOrigin(origin: string): string | undefined {
  try {
    return new URL(origin).host;
  } catch {
    return undefined;
  }
}

function cssAttrEscape(value: string): string {
  return value.replace(/["\\]/g, '\\$&');
}

function cssIdentEscape(value: string): string {
  return value.replace(/([^\w-])/g, '\\$1');
}

// ---------------------------------------------------------------------------
// Toggle → Hidden Element Resolution
// ---------------------------------------------------------------------------

/** Regex matching state variable names used in conditional rendering. */
const CONDITIONAL_STATE_RE = /^(is)?_?(open|show|visible|expanded|active|collapsed|toggled|hidden|closed)/i;

/**
 * Post-processing pass that links hidden elements to their toggle controls.
 *
 * After all elements are extracted, this function finds which button/toggle
 * reveals each hidden element, populating `container_toggle_id`,
 * `container_toggle_selector`, and `container_toggle_label`. This enables the
 * LLM to generate proper reveal steps without runtime DOM inspection.
 *
 * Three strategies in priority order:
 * 1. aria_controls → dom_id: Toggle has aria-controls pointing to the container's dom_id
 * 2. Same-scope aria_expanded: Single toggle in same component with aria_expanded
 * 3. Text heuristic: Single button in same component with toggle-like text
 */
export function resolveToggleRelationships(elements: ScannedElement[]): void {
  const byDomId = new Map<string, ScannedElement>();
  const toggleCandidates: ScannedElement[] = [];
  const hiddenByContainer = new Map<string, ScannedElement[]>();

  for (const el of elements) {
    if (el.dom_id) byDomId.set(el.dom_id, el);
    if (el.aria_controls || el.aria_expanded !== undefined) toggleCandidates.push(el);
    if (el.hidden && el.container) {
      const list = hiddenByContainer.get(el.container) || [];
      list.push(el);
      hiddenByContainer.set(el.container, list);
    }
  }

  for (const [containerName, hiddenElements] of hiddenByContainer) {
    const toggle = findToggleForContainer(
      containerName, hiddenElements, toggleCandidates, byDomId, elements,
    );
    if (!toggle) continue;

    const selector = bestSelector(toggle) || toggleFallbackSelector(toggle);
    const label = elementLabel(toggle);

    for (const hidden of hiddenElements) {
      hidden.container_toggle_id = toggle.id;
      hidden.container_toggle_selector = selector || undefined;
      hidden.container_toggle_label = label || undefined;
      // Upgrade container name from state variable to human-readable label
      if (label && CONDITIONAL_STATE_RE.test(containerName)) {
        hidden.container = label;
      }
    }
  }
}

function findToggleForContainer(
  _containerName: string,
  hiddenElements: ScannedElement[],
  toggleCandidates: ScannedElement[],
  byDomId: Map<string, ScannedElement>,
  allElements: ScannedElement[],
): ScannedElement | undefined {
  const sampleHidden = hiddenElements[0];

  // Strategy 1: aria_controls → dom_id
  // Find a toggle whose aria-controls value matches a dom_id in the same scope.
  // The controlled container typically wraps the hidden elements.
  for (const toggle of toggleCandidates) {
    if (!toggle.aria_controls) continue;
    const controlled = byDomId.get(toggle.aria_controls);
    if (!controlled) continue;
    if (sameScope(toggle, sampleHidden)) return toggle;
  }

  // Strategy 2: Single toggle in same scope with aria_expanded
  const scopeToggles = toggleCandidates.filter(
    t => t.aria_expanded !== undefined && !t.hidden && sameScope(t, sampleHidden),
  );
  if (scopeToggles.length === 1) return scopeToggles[0];

  // Strategy 3: Text-based heuristic — single button with toggle-like text
  const TOGGLE_TEXT_RE = /\b(open|close|toggle|show|hide|expand|collapse|menu|hamburger|nav)\b/i;
  const textToggles = allElements.filter(
    el => !el.hidden
      && sameScope(el, sampleHidden)
      && (el.tag === 'button' || el.role === 'button')
      && TOGGLE_TEXT_RE.test(semanticText(el)),
  );
  if (textToggles.length === 1) return textToggles[0];

  return undefined;
}

function sameScope(a: ScannedElement, b: ScannedElement): boolean {
  return a.route_path === b.route_path
    && a.source_file === b.source_file
    && a.component_name === b.component_name;
}

/** Fallback selector when bestSelector() returns empty — uses aria-label or aria-controls. */
function toggleFallbackSelector(element: ScannedElement): string {
  if (element.aria_label && element.aria_label !== 'expression') {
    return `[aria-label="${cssAttrEscape(element.aria_label)}"]`;
  }
  if (element.aria_controls) {
    return `[aria-controls="${cssAttrEscape(element.aria_controls)}"]`;
  }
  return '';
}

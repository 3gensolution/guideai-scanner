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
  const root: UIMapNode = {
    id: 'app',
    kind: 'app',
    label: 'Application',
    metadata: { framework },
    children: [],
  };

  const routesByKey = new Map(routes.map((route) => [routeKey(route), route]));
  const routeKeys = new Set<string>(routes.map(routeKey));
  for (const element of elements) {
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

  for (const key of sortedRouteKeys) {
    const routePath = pathFromRouteKey(key);
    const origin = originFromRouteKey(key);
    const route = routesByKey.get(key) ?? makeSyntheticRoute(routePath, origin);
    const routeNode = buildRouteNode(route);
    const routeElements = elements.filter((element) => elementRouteKey(element) === key);
    const routeConnections = routeLinkConnections(key, routeElements, routeKeys, routesByKey);
    routeNode.metadata = {
      ...(routeNode.metadata ?? {}),
      links_to: routeConnections,
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

  if (tag === 'dialog' || role === 'dialog' || role === 'alertdialog') {
    return { kind: 'dialog', label: heading || element.component_name || 'Dialog' };
  }

  if (element.form_label || ['input', 'select', 'textarea'].includes(tag) || role === 'textbox' || role === 'combobox') {
    return {
      kind: 'form',
      label: element.form_label || heading || 'Form fields',
      metadata: { form_label: element.form_label },
    };
  }

  if (role === 'tab' || role === 'menuitem' || role === 'link' || tag === 'a' || tag === 'summary') {
    return {
      kind: 'navigation',
      label: heading || element.component_name || 'Navigation',
    };
  }

  if (heading) {
    return { kind: 'section', label: heading };
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
    id: stableId('element', element.route_origin, element.route_path, element.route_url, selector || element.id),
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
      fingerprint_score: element.fingerprint?.total_score,
      linked_route_path: linkedRoute ? pathFromRouteKey(linkedRoute) : undefined,
      linked_route_origin: linkedRoute ? originFromRouteKey(linkedRoute) : undefined,
    },
    children: [],
  };
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
      label: elementLabel(element),
      selector: bestSelector(element) || undefined,
    });
    if (connections.length >= 30) break;
  }

  return connections;
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
    if (normalizeRoutePath(pathFromRouteKey(routeKey)) === targetPath) return routeKey;
  }

  return undefined;
}

function routeKeyFromHref(element: ScannedElement): string | undefined {
  const href = element.href?.trim();
  if (!href || href.startsWith('#')) return undefined;
  if (/^(javascript|mailto|tel|data):/i.test(href)) return undefined;

  const base = element.route_url || (element.route_origin ? `${element.route_origin}${element.route_path || '/'}` : undefined);
  if (!base) return undefined;

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
  if (tag === 'a') return 'navigate';
  if (['input', 'textarea'].includes(tag)) return 'fill';
  if (tag === 'select') return 'select';
  return 'click';
}

function groupOrder(kind: UIMapNodeKind): number {
  const order: Partial<Record<UIMapNodeKind, number>> = {
    domain: 0,
    navigation: 1,
    section: 2,
    component: 3,
    form: 4,
    dialog: 5,
    element: 6,
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

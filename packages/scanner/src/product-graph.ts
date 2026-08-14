import type {
  FrameworkType,
  ProductGraph,
  ProductGraphApplication,
  ProductGraphConnection,
  ProductGraphLayout,
  ProductGraphNode,
  Route,
  ScannedElement,
  UIMap,
  ProductGraphModule,
  ProductGraphSection,
  ProductGraphStateFlow,
  ProductGraphState,
  ProductGraphStateTransition,
  ProductGraphUserJourney,
  ProductGraphJourneyStep,
  Confidence,
  Evidence,
} from './types';
import { confidenceFromScore } from './types';

const APPLICATION_KEYWORDS: Array<{
  type: string;
  keywords: string[];
}> = [
  { type: 'crm', keywords: ['customer', 'deal', 'pipeline', 'lead', 'account', 'contact', 'crm'] },
  { type: 'dashboard', keywords: ['dashboard', 'analytics', 'metric', 'report', 'overview'] },
  { type: 'landing_page', keywords: ['landing', 'hero', 'pricing', 'testimonial', 'faq', 'signup'] },
  { type: 'ecommerce', keywords: ['product', 'cart', 'checkout', 'order', 'store', 'catalog'] },
  { type: 'auth', keywords: ['login', 'sign in', 'signup', 'register', 'password', 'reset password'] },
  { type: 'admin', keywords: ['admin', 'users', 'roles', 'settings'] },
  { type: 'support', keywords: ['support', 'inbox', 'ticket', 'conversation', 'help'] },
];

const LAYOUT_KEYWORDS = {
  navbar: ['navbar', 'topbar', 'header', 'navigation', 'menu'],
  sidebar: ['sidebar', 'side nav', 'sidenav', 'drawer', 'aside'],
  footer: ['footer'],
  tabs: ['tab', 'tabs', 'tabpanel'],
  dropdowns: ['dropdown', 'popover', 'menu', 'actions'],
  accordions: ['accordion', 'collapse', 'details'],
  dialogs: ['modal', 'dialog', 'drawer'],
  forms: ['form', 'input', 'select', 'textarea', 'submit'],
};

type RouteGroup = {
  primary: Route;
  aliases: Route[];
  signature: string;
  canonicalPath: string;
};

const PRIMARY_CTA_KEYWORDS = [
  'create',
  'add',
  'new',
  'save',
  'submit',
  'continue',
  'next',
  'start',
  'get started',
  'upgrade',
  'publish',
  'invite',
  'send',
  'confirm',
  'finish',
  'complete',
];

export function buildProductGraph(
  framework: FrameworkType,
  routes: Route[],
  elements: ScannedElement[],
  uiMap: UIMap,
): ProductGraph {
  const application = inferApplication(framework, routes, elements, uiMap);
  const layout = inferLayout(routes, elements, uiMap, application);
  const routeGroups = groupRoutes(routes);
  const root = buildGraphRoot(framework, routeGroups, elements, layout);
  const routeCount = routeGroups.length || uiMap.route_count;

  const connections = buildConnections(routeGroups, uiMap, elements);
  const stateFlows = detectStateFlows(elements, routes);
  const modules = detectModules(routes, elements);
  const sections = detectSections(elements, routes);
  const userJourneys = stitchJourneys(connections, routes);

  return {
    version: 1,
    framework,
    application,
    layout,
    root,
    route_count: routeCount,
    element_count: uiMap.element_count,
    connections,
    generated_at: uiMap.generated_at,
    modules,
    sections,
    stateFlows,
    userJourneys,
  };
}

function inferApplication(
  framework: FrameworkType,
  routes: Route[],
  elements: ScannedElement[],
  uiMap: UIMap,
): ProductGraphApplication {
  const haystack = [
    framework,
    ...routes.map((route) => `${route.path} ${route.page_title ?? ''} ${route.component_name ?? ''}`),
    ...elements.map((element) => `${element.tag} ${element.text ?? ''} ${element.aria_label ?? ''} ${element.placeholder ?? ''} ${element.component_name ?? ''}`),
    JSON.stringify(uiMap.root?.children?.slice(0, 12).map((child) => child.label) ?? []),
  ]
    .join(' ')
    .toLowerCase();

  let bestType = 'general_app';
  let bestScore = 0;
  const signals: string[] = [];

  for (const candidate of APPLICATION_KEYWORDS) {
    let score = 0;
    for (const keyword of candidate.keywords) {
      if (haystack.includes(keyword)) {
        score++;
        if (!signals.includes(keyword)) signals.push(keyword);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = candidate.type;
    }
  }

  const appType =
    bestScore > 0
      ? bestType
      : framework === 'plain-html'
        ? 'website'
        : 'web_app';

  const confidence = Math.min(0.55 + bestScore * 0.08, 0.98);

  return {
    type: appType,
    confidence,
    signals: signals.slice(0, 12),
  };
}

function inferLayout(
  routes: Route[],
  elements: ScannedElement[],
  uiMap: UIMap,
  application: ProductGraphApplication,
): ProductGraphLayout {
  const texts = [
    ...routes.map((route) => `${route.path} ${route.page_title ?? ''} ${route.component_name ?? ''} ${route.source_file ?? ''}`),
    ...elements.map((element) => `${element.tag} ${element.role ?? ''} ${element.text ?? ''} ${element.aria_label ?? ''} ${element.placeholder ?? ''} ${element.component_name ?? ''} ${element.source_file ?? ''} ${element.container ?? ''}`),
    JSON.stringify(uiMap.root?.children?.map((child) => child.label) ?? []),
  ]
    .join(' ')
    .toLowerCase();

  const has = (keywords: string[]) => keywords.some((keyword) => texts.includes(keyword));
  const routeStats = analyzeRouteTopology(routes);
  const layoutElements = elements.filter(isLayoutScopedElement);
  const routeSiblingGroups = countLikelyTabGroups(routes);
  const layoutHeavyApp = ['admin', 'dashboard', 'crm', 'support'].includes(application.type);

  const hasSidebarByTopology =
    layoutHeavyApp &&
    routeStats.topLevelSegmentCount >= 4 &&
    routeStats.topLevelSegmentsWithChildren >= 3;

  const hasNavbarByElements =
    layoutElements.some((element) => isNavigationElement(element)) ||
    elements.some((element) => {
      const name = `${element.component_name ?? ''} ${element.source_file ?? ''}`.toLowerCase();
      return name.includes('navbar') || name.includes('topnav') || name.includes('header');
    });

  return {
    hasNavbar: has(LAYOUT_KEYWORDS.navbar) || hasNavbarByElements,
    hasSidebar:
      has(LAYOUT_KEYWORDS.sidebar) ||
      elements.some((element) => {
        const name = `${element.component_name ?? ''} ${element.source_file ?? ''}`.toLowerCase();
        return name.includes('sidebar') || name.includes('sidenav') || name.includes('drawer');
      }) ||
      hasSidebarByTopology,
    hasTopbar: has(['topbar', 'header']) || layoutElements.some((element) => `${element.component_name ?? ''}`.toLowerCase().includes('header')),
    hasFooter: has(LAYOUT_KEYWORDS.footer) || elements.some((element) => `${element.component_name ?? ''} ${element.source_file ?? ''}`.toLowerCase().includes('footer')),
    hasTabs:
      has(LAYOUT_KEYWORDS.tabs) ||
      routeSiblingGroups > 0 ||
      elements.some((element) => ['tab', 'tabpanel'].includes((element.role ?? '').toLowerCase())),
    hasDropdowns:
      has(LAYOUT_KEYWORDS.dropdowns) ||
      elements.some((element) => {
        const role = (element.role ?? '').toLowerCase();
        const tag = element.tag.toLowerCase();
        const name = `${element.component_name ?? ''} ${element.source_file ?? ''}`.toLowerCase();
        return ['menuitem', 'combobox'].includes(role) || tag === 'select' || name.includes('dropdown') || name.includes('popover');
      }),
    hasAccordions:
      has(LAYOUT_KEYWORDS.accordions) ||
      elements.some((element) => {
        const name = `${element.component_name ?? ''} ${element.source_file ?? ''} ${element.container ?? ''}`.toLowerCase();
        return ['details', 'summary'].includes(element.tag.toLowerCase()) || name.includes('accordion') || name.includes('collapse');
      }),
    hasDialogs:
      has(LAYOUT_KEYWORDS.dialogs) ||
      elements.some((element) => {
        const role = (element.role ?? '').toLowerCase();
        const tag = element.tag.toLowerCase();
        const name = `${element.component_name ?? ''} ${element.source_file ?? ''}`.toLowerCase();
        return tag === 'dialog' || ['dialog', 'alertdialog'].includes(role) || name.includes('modal') || name.includes('drawer');
      }),
    hasForms:
      has(LAYOUT_KEYWORDS.forms) ||
      elements.some((element) => ['input', 'select', 'textarea'].includes(element.tag.toLowerCase()) || Boolean(element.form_label)),
  };
}

function buildGraphRoot(
  framework: FrameworkType,
  routeGroups: RouteGroup[],
  elements: ScannedElement[],
  layout: ProductGraphLayout,
): ProductGraphNode {
  const root: ProductGraphNode = {
    id: 'app',
    kind: 'app',
    label: 'Application',
    metadata: { framework },
    children: [],
  };

  const layoutNode = buildLayoutNode(layout, elements);
  if (layoutNode) {
    root.children.push(layoutNode);
  }

  const routeTreeRoot = buildRouteHierarchy(routeGroups, elements);
  root.children.push(...routeTreeRoot.children);

  return root;
}

function buildLayoutNode(
  layout: ProductGraphLayout,
  elements: ScannedElement[],
): ProductGraphNode | undefined {
  if (!Object.values(layout).some(Boolean)) return undefined;

  const layoutNode: ProductGraphNode = {
    id: 'layout-shell',
    kind: 'layout',
    label: 'Application Shell',
    metadata: { ...layout },
    children: [],
  };

  const globalElements = elements.filter(isLayoutScopedElement);
  const grouped = groupElements(globalElements, undefined, undefined, undefined, 'layout-shell');
  layoutNode.children.push(...grouped);

  return layoutNode;
}

function buildRouteHierarchy(
  routeGroups: RouteGroup[],
  elements: ScannedElement[],
): ProductGraphNode {
  const root: ProductGraphNode = {
    id: 'routes-root',
    kind: 'section',
    label: 'Screens',
    children: [],
  };
  const routeElements = groupElementsByRoute(elements);
  const nodeIndex = new Map<string, ProductGraphNode>([['', root]]);

  for (const group of sortRouteGroups(routeGroups)) {
    const route = group.primary;
    if (group.canonicalPath === '/') {
      root.children.push(buildScreenNode(route, collectRouteGroupElements(group, routeElements), group));
      continue;
    }

    const segments = group.canonicalPath.split('/').filter(Boolean);
    let cursorKey = '';
    let parentNode = root;

    for (let index = 0; index < segments.length - 1; index++) {
      const segment = segments[index];
      cursorKey = cursorKey ? `${cursorKey}/${segment}` : segment;
      let node = nodeIndex.get(cursorKey);
      if (!node) {
        node = {
          id: stableId('section', cursorKey),
          kind: 'navigation',
          label: humanizeSegment(segment),
          route_path: `/${cursorKey}`,
          metadata: { segment },
          children: [],
        };
        nodeIndex.set(cursorKey, node);
        parentNode.children.push(node);
      }
      parentNode = node;
    }

    parentNode.children.push(buildScreenNode(route, collectRouteGroupElements(group, routeElements), group));
  }

  return root;
}

function buildScreenNode(route: Route, elements: ScannedElement[], group?: RouteGroup): ProductGraphNode {
  const groups = groupElements(elements, route.path, route.origin, route.url);
  const aliases = group?.aliases.map((alias) => ({
    path: alias.path,
    url: alias.url,
    page_title: alias.page_title,
    component_name: alias.component_name,
  })) ?? [];

  return {
    id: routeNodeId(route),
    kind: 'screen',
    label: route.page_title || route.component_name || humanizeRoutePath(route.path),
    route_path: route.path,
    route_origin: route.origin,
    route_host: route.host,
    route_url: route.url,
    component_name: route.component_name,
    source_file: route.source_file,
    metadata: {
      path: route.path,
      canonical_path: group?.canonicalPath ?? normalizeRoutePath(route.path),
      aliases,
      dynamic_segments: route.dynamic_segments,
      auth_required: route.auth_required,
      headings: route.headings,
      route_signature: group?.signature,
    },
    children: groups,
  };
}

function groupElementsByRoute(elements: ScannedElement[]): Map<string, ScannedElement[]> {
  const grouped = new Map<string, ScannedElement[]>();

  for (const element of elements) {
    const key = element.route_path || '/';
    const current = grouped.get(key) ?? [];
    current.push(element);
    grouped.set(key, current);
  }

  return grouped;
}

function groupElements(
  elements: ScannedElement[],
  routePath?: string,
  routeOrigin?: string,
  routeUrl?: string,
  scopeSeed?: string,
): ProductGraphNode[] {
  const groups = new Map<string, ProductGraphNode>();

  for (const element of elements) {
    const descriptor = describeElementGroup(element);
    const key = `${descriptor.kind}:${descriptor.label}:${groupScopeKey(element, routePath, routeOrigin, routeUrl, scopeSeed)}`;
    let group = groups.get(key);

    if (!group) {
      group = buildGroupedNode(element, descriptor, routePath, routeOrigin, routeUrl, scopeSeed);
      groups.set(key, group);
    }

    if (descriptor.kind === 'table' || descriptor.kind === 'list') {
      mergeCollectionGroup(group, element, descriptor.kind);
    } else if (descriptor.kind === 'cta') {
      mergeActionGroup(group, element);
    } else if (descriptor.kind === 'breadcrumb') {
      mergeBreadcrumbGroup(group, element);
    } else if (descriptor.kind === 'stepper' || descriptor.kind === 'wizard') {
      mergeStepGroup(group, element, descriptor.kind);
    } else {
      group.children.push(buildElementNode(element));
    }
  }

  return Array.from(groups.values()).sort((left, right) => groupOrder(left.kind) - groupOrder(right.kind) || left.label.localeCompare(right.label));
}

function describeElementGroup(element: ScannedElement): {
  kind: ProductGraphNode['kind'];
  label: string;
  metadata?: Record<string, unknown>;
} {
  const tag = element.tag.toLowerCase();
  const role = (element.role ?? '').toLowerCase();
  const componentName = element.component_name || '';
  const lowerComponent = componentName.toLowerCase();
  const text = semanticText(element);
  const heading = element.fingerprint?.tier4_context?.nearest_heading;
  const container = element.container;
  const lowerContainer = (container ?? '').toLowerCase();

  if (tag === 'dialog' || role === 'dialog' || role === 'alertdialog' || lowerComponent.includes('modal')) {
    return { kind: 'dialog', label: heading || componentName || 'Dialog' };
  }

  if (lowerComponent.includes('drawer') || lowerContainer.includes('drawer')) {
    return { kind: 'drawer', label: heading || container || componentName || 'Drawer' };
  }

  if (isBreadcrumbElement(element)) {
    return {
      kind: 'breadcrumb',
      label: heading || componentName || 'Breadcrumbs',
      metadata: { pattern: 'breadcrumb' },
    };
  }

  if (isListElement(element)) {
    return {
      kind: 'list',
      label: heading || componentName || 'List',
      metadata: {
        subtype: inferListSubtype(element, heading || componentName || elementLabel(element)),
      },
    };
  }

  if (role === 'tab' || role === 'tabpanel' || lowerComponent.includes('tabs') || lowerContainer.includes('tab')) {
    return { kind: 'tabs', label: heading || componentName || 'Tabs' };
  }

  if (isStepperElement(element)) {
    return {
      kind: text.includes('wizard') || lowerComponent.includes('wizard') ? 'wizard' : 'stepper',
      label: heading || componentName || (text.includes('wizard') ? 'Wizard' : 'Stepper'),
      metadata: { pattern: text.includes('wizard') ? 'wizard' : 'stepper' },
    };
  }

  if (tag === 'details' || tag === 'summary' || lowerComponent.includes('accordion') || lowerContainer.includes('accordion') || lowerContainer.includes('details')) {
    return { kind: 'accordion', label: heading || container || componentName || 'Accordion' };
  }

  if (role === 'menuitem' || lowerComponent.includes('dropdown') || lowerComponent.includes('popover') || lowerContainer.includes('dropdown')) {
    return { kind: 'dropdown', label: heading || componentName || 'Actions' };
  }

  if (isTableElement(element)) {
    return {
      kind: 'table',
      label: heading || componentName || 'Table',
      metadata: { subtype: inferListSubtype(element, 'table') },
    };
  }

  if (element.form_label || ['input', 'select', 'textarea'].includes(tag) || role === 'textbox' || role === 'combobox') {
    return {
      kind: 'form',
      label: element.form_label || heading || 'Form fields',
      metadata: { form_label: element.form_label },
    };
  }

  if (isPrimaryCtaElement(element)) {
    return {
      kind: 'cta',
      label: heading || componentName || 'Primary actions',
      metadata: { subtype: 'cta' },
    };
  }

  if (isNavigationElement(element)) {
    return { kind: 'navigation', label: heading || componentName || 'Navigation' };
  }

  if (heading) {
    return { kind: 'section', label: heading };
  }

  if (componentName) {
    return { kind: 'component', label: componentName };
  }

  return { kind: 'section', label: 'Main content' };
}

function buildGroupedNode(
  element: ScannedElement,
  descriptor: { kind: ProductGraphNode['kind']; label: string; metadata?: Record<string, unknown> },
  routePath?: string,
  routeOrigin?: string,
  routeUrl?: string,
  scopeSeed = '',
): ProductGraphNode {
  return {
    id: stableId('group', descriptor.kind, descriptor.label, groupScopeKey(element, routePath, routeOrigin, routeUrl, scopeSeed)),
    kind: descriptor.kind,
    label: descriptor.label,
    route_path: routePath ?? element.route_path,
    route_origin: routeOrigin ?? element.route_origin,
    route_host: element.route_host,
    route_url: routeUrl ?? element.route_url,
    component_name: descriptor.kind === 'component' ? element.component_name : undefined,
    source_file: element.source_file,
    metadata: {
      ...descriptor.metadata,
      scope: groupScopeKey(element, routePath, routeOrigin, routeUrl, scopeSeed),
    },
    children: [],
  };
}

function mergeCollectionGroup(group: ProductGraphNode, element: ScannedElement, kind: 'table' | 'list'): void {
  const rowKey = collectionRowKey(element, kind);
  let rowNode = group.children.find((child) => child.kind === 'row' && child.metadata?.row_key === rowKey);
  if (!rowNode) {
    rowNode = {
      id: stableId('row', group.id, rowKey),
      kind: 'row',
      label: collectionRowLabel(element, kind, group.children.length),
      route_path: element.route_path,
      route_origin: element.route_origin,
      route_host: element.route_host,
      route_url: element.route_url,
      metadata: {
        row_key: rowKey,
        collection_kind: kind,
        container: element.container,
      },
      children: [],
    };
    group.children.push(rowNode);
  }

  const columnKey = collectionColumnKey(element);
  let columnNode = rowNode.children.find((child) => child.kind === 'column' && child.metadata?.column_key === columnKey);
  if (!columnNode) {
    columnNode = {
      id: stableId('column', rowNode.id, columnKey),
      kind: 'column',
      label: collectionColumnLabel(element, kind, rowNode.children.length),
      route_path: element.route_path,
      route_origin: element.route_origin,
      route_host: element.route_host,
      route_url: element.route_url,
      metadata: {
        column_key: columnKey,
        collection_kind: kind,
      },
      children: [],
    };
    rowNode.children.push(columnNode);
  }

  columnNode.children.push(buildElementNode(element));
}

function mergeActionGroup(group: ProductGraphNode, element: ScannedElement): void {
  const actionKey = collectionRowKey(element, 'list');
  let actionNode = group.children.find((child) => child.kind === 'action' && child.metadata?.action_key === actionKey);
  if (!actionNode) {
    actionNode = {
      id: stableId('action', group.id, actionKey),
      kind: 'action',
      label: isPrimaryActionText(element) ? elementLabel(element) : 'Action',
      route_path: element.route_path,
      route_origin: element.route_origin,
      route_host: element.route_host,
      route_url: element.route_url,
      metadata: {
        action_key: actionKey,
        action_type: element.action_type || inferActionType(element),
      },
      children: [],
    };
    group.children.push(actionNode);
  }
  actionNode.children.push(buildElementNode(element));
}

function mergeBreadcrumbGroup(group: ProductGraphNode, element: ScannedElement): void {
  const crumbKey = breadcrumbItemKey(element);
  let crumbNode = group.children.find((child) => child.kind === 'navigation' && child.metadata?.crumb_key === crumbKey);
  if (!crumbNode) {
    crumbNode = {
      id: stableId('breadcrumb', group.id, crumbKey),
      kind: 'navigation',
      label: breadcrumbItemLabel(element, group.children.length),
      route_path: element.route_path,
      route_origin: element.route_origin,
      route_host: element.route_host,
      route_url: element.route_url,
      metadata: {
        crumb_key: crumbKey,
      },
      children: [],
    };
    group.children.push(crumbNode);
  }
  crumbNode.children.push(buildElementNode(element));
}

function mergeStepGroup(group: ProductGraphNode, element: ScannedElement, kind: 'stepper' | 'wizard'): void {
  const stepKey = collectionRowKey(element, kind === 'wizard' ? 'wizard' : 'stepper');
  let stepNode = group.children.find((child) => child.kind === 'section' && child.metadata?.step_key === stepKey);
  if (!stepNode) {
    stepNode = {
      id: stableId(kind, group.id, stepKey),
      kind: 'section',
      label: stepLabel(element, group.children.length, kind),
      route_path: element.route_path,
      route_origin: element.route_origin,
      route_host: element.route_host,
      route_url: element.route_url,
      metadata: {
        step_key: stepKey,
        stepper_kind: kind,
      },
      children: [],
    };
    group.children.push(stepNode);
  }
  stepNode.children.push(buildElementNode(element));
}

function buildElementNode(element: ScannedElement): ProductGraphNode {
  return {
    id: stableId('element', element.route_path, element.source_file, element.data_guideai, element.data_testid, element.dom_id, element.text, element.aria_label, element.tag),
    kind: 'element',
    label: elementLabel(element),
    route_path: element.route_path,
    route_origin: element.route_origin,
    route_host: element.route_host,
    route_url: element.route_url,
    component_name: element.component_name,
    source_file: element.source_file,
    selector: bestSelector(element),
    element_id: element.id,
    action_type: inferActionType(element),
    text: element.text,
    metadata: {
      tag: element.tag,
      role: element.role,
      type: element.type,
      href: element.href,
      aria_controls: element.aria_controls,
      aria_expanded: element.aria_expanded,
      aria_haspopup: element.aria_haspopup,
      aria_label: element.aria_label,
      placeholder: element.placeholder,
      name: element.name,
      hidden: element.hidden,
      container: element.container,
      container_state: element.containerState,
      fingerprint_score: element.fingerprint?.total_score,
    },
    children: [],
  };
}

function buildConnections(
  routeGroups: RouteGroup[],
  uiMap: UIMap,
  elements: ScannedElement[],
): ProductGraphConnection[] {
  const routeIds = new Map<string, string>();
  for (const group of routeGroups) {
    const primaryId = routeNodeId(group.primary);
    routeIds.set(normalizeRoutePath(group.primary.path), primaryId);
    if (group.primary.url) {
      routeIds.set(stripQueryAndHash(group.primary.url), primaryId);
    }
    for (const alias of group.aliases) {
      routeIds.set(normalizeRoutePath(alias.path), primaryId);
      if (alias.url) {
        routeIds.set(stripQueryAndHash(alias.url), primaryId);
      }
    }
  }
  const connections: ProductGraphConnection[] = [];
  const seen = new Set<string>();

  // Build element lookup by selector
  const elementBySelector = new Map<string, ScannedElement>();
  for (const element of elements) {
    const selector = bestSelector(element);
    if (selector) {
      elementBySelector.set(selector, element);
    }
  }

  for (const connection of uiMap.connections ?? []) {
    const normalized = {
      from:
        connection.from_node_id ||
        (connection.from_route_path
          ? routeIds.get(normalizeRoutePath(connection.from_route_path)) ?? stableId('screen', connection.from_route_path)
          : undefined),
      to:
        connection.to_node_id ||
        (connection.to_route_path
          ? routeIds.get(normalizeRoutePath(connection.to_route_path)) ?? stableId('screen', connection.to_route_path)
          : undefined),
      kind: connection.kind ?? ('navigates_to' as const),
      label: connection.label,
      metadata: {
        selector: connection.selector,
        from_route_path: connection.from_route_path,
        to_route_path: connection.to_route_path,
        from_route_origin: connection.from_route_origin,
        to_route_origin: connection.to_route_origin,
        from_node_kind: connection.from_node_kind,
        to_node_kind: connection.to_node_kind,
        scope: connection.scope,
        ...(connection.metadata ?? {}),
      },
    };
    if (!normalized.from || !normalized.to) continue;

    // Add confidence and evidence based on connection type
    const element = connection.selector ? elementBySelector.get(connection.selector) : undefined;
    const fingerprintScore = element?.fingerprint?.total_score ?? 0;

    const { confidence, evidence } = buildConnectionEvidence(
      connection.kind ?? 'navigates_to',
      element,
      connection.from_route_path,
      connection.to_route_path,
      connection.selector,
      fingerprintScore
    );

    const enhancedConnection: ProductGraphConnection = {
      ...normalized,
      confidence,
      evidence,
    };

    pushUniqueConnection(connections, seen, enhancedConnection);
  }

  return connections;
}

function analyzeRouteTopology(routes: Route[]): {
  topLevelSegmentCount: number;
  topLevelSegmentsWithChildren: number;
} {
  const topLevelCounts = new Map<string, number>();

  for (const route of routes) {
    const segments = route.path.split('/').filter(Boolean);
    if (segments.length === 0) continue;
    const topLevel = segments[0];
    topLevelCounts.set(topLevel, (topLevelCounts.get(topLevel) ?? 0) + 1);
  }

  let segmentsWithChildren = 0;
  for (const count of Array.from(topLevelCounts.values())) {
    if (count > 1) segmentsWithChildren++;
  }

  return {
    topLevelSegmentCount: topLevelCounts.size,
    topLevelSegmentsWithChildren: segmentsWithChildren,
  };
}

function countLikelyTabGroups(routes: Route[]): number {
  const parentCounts = new Map<string, number>();

  for (const route of routes) {
    const segments = route.path.split('/').filter(Boolean);
    if (segments.length < 2) continue;
    const parent = segments.slice(0, -1).join('/');
    parentCounts.set(parent, (parentCounts.get(parent) ?? 0) + 1);
  }

  let count = 0;
  for (const siblingCount of Array.from(parentCounts.values())) {
    if (siblingCount >= 2 && siblingCount <= 6) count++;
  }
  return count;
}

function groupRoutes(routes: Route[]): RouteGroup[] {
  const groups = new Map<string, RouteGroup>();

  for (const route of sortRoutes(routes)) {
    const signature = routeScreenSignature(route);
    const current = groups.get(signature);
    if (!current) {
      groups.set(signature, {
        primary: route,
        aliases: [],
        signature,
        canonicalPath: normalizeRoutePath(route.path),
      });
      continue;
    }

    if (compareRoutes(route, current.primary) < 0) {
      current.aliases.push(current.primary);
      current.primary = route;
      current.canonicalPath = normalizeRoutePath(route.path);
    } else {
      current.aliases.push(route);
    }
  }

  return sortRouteGroups(Array.from(groups.values()));
}

function sortRouteGroups(routeGroups: RouteGroup[]): RouteGroup[] {
  return [...routeGroups].sort((left, right) => {
    if (left.canonicalPath === '/' && right.canonicalPath !== '/') return -1;
    if (right.canonicalPath === '/' && left.canonicalPath !== '/') return 1;
    const pathCompare = left.canonicalPath.localeCompare(right.canonicalPath);
    if (pathCompare !== 0) return pathCompare;
    return bestRouteLabel(left.primary).localeCompare(bestRouteLabel(right.primary));
  });
}

function collectRouteGroupElements(group: RouteGroup, routeElements: Map<string, ScannedElement[]>): ScannedElement[] {
  const seen = new Set<string>();
  const collected: ScannedElement[] = [];
  for (const route of [group.primary, ...group.aliases]) {
    for (const element of routeElements.get(route.path) ?? []) {
      if (seen.has(element.id)) continue;
      seen.add(element.id);
      collected.push(element);
    }
  }
  return collected;
}

function compareRoutes(left: Route, right: Route): number {
  const scoreDiff = routePrimaryScore(right) - routePrimaryScore(left);
  if (scoreDiff !== 0) return scoreDiff;

  const leftPath = normalizeRoutePath(left.path);
  const rightPath = normalizeRoutePath(right.path);
  if (leftPath.length !== rightPath.length) return leftPath.length - rightPath.length;
  return leftPath.localeCompare(rightPath);
}

function routePrimaryScore(route: Route): number {
  const path = normalizeRoutePath(route.path);
  const segments = path.split('/').filter(Boolean);
  const dynamicCount = route.dynamic_segments?.length ?? 0;
  const wildcardCount = segments.filter((segment) => segment.includes('*')).length;
  let score = 0;
  if (path === '/') score += 1000;
  if (route.page_title) score += 120;
  if (route.component_name) score += 90;
  if (route.source_file) score += 20;
  score += Math.max(0, 60 - segments.length * 3);
  score += Math.max(0, 40 - dynamicCount * 8);
  score -= wildcardCount * 15;
  score -= Math.max(0, path.length - 30) * 0.5;
  return score;
}

function routeScreenSignature(route: Route): string {
  return [
    normalizeKey(route.page_title || ''),
    normalizeKey(route.component_name || ''),
    normalizeKey(route.source_file || ''),
    routePathShape(route.path),
  ].join('|');
}

function routePathShape(routePath: string): string {
  return normalizeRoutePath(routePath)
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      if (segment.startsWith(':')) return ':param';
      if (segment.includes('*')) return '*';
      return segment.toLowerCase();
    })
    .join('/');
}

function bestRouteLabel(route: Route): string {
  return normalizeLabel(route.page_title || route.component_name || humanizeRoutePath(route.path), 80);
}

function normalizeKey(value: string | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function isListElement(element: ScannedElement): boolean {
  const descriptor = `${descriptorText(element)} ${semanticText(element)}`;
  const tag = element.tag.toLowerCase();
  const role = (element.role ?? '').toLowerCase();
  return tag === 'li' ||
    role === 'listitem' ||
    descriptor.includes('list') ||
    descriptor.includes('table') ||
    descriptor.includes('grid') ||
    descriptor.includes('results') ||
    descriptor.includes('pagination') ||
    /\b(previous|next|page \d+)\b/.test(descriptor);
}

function isBreadcrumbElement(element: ScannedElement): boolean {
  const descriptor = descriptorText(element);
  const text = semanticText(element);
  return descriptor.includes('breadcrumb') ||
    descriptor.includes('breadcrumbs') ||
    descriptor.includes('crumb') ||
    text.includes('breadcrumb') ||
    text.includes('trail');
}

function isStepperElement(element: ScannedElement): boolean {
  const descriptor = `${descriptorText(element)} ${semanticText(element)}`;
  return descriptor.includes('stepper') ||
    descriptor.includes('wizard') ||
    descriptor.includes('progress step') ||
    descriptor.includes('step 1') ||
    descriptor.includes('step 2');
}

function isTableElement(element: ScannedElement): boolean {
  const tag = element.tag.toLowerCase();
  const role = (element.role ?? '').toLowerCase();
  const descriptor = descriptorText(element);
  return tag === 'table' ||
    tag === 'thead' ||
    tag === 'tbody' ||
    tag === 'tr' ||
    tag === 'td' ||
    tag === 'th' ||
    role === 'table' ||
    role === 'grid' ||
    descriptor.includes('table') ||
    descriptor.includes('datatable') ||
    descriptor.includes('grid');
}

function isPrimaryCtaElement(element: ScannedElement): boolean {
  const tag = element.tag.toLowerCase();
  const role = (element.role ?? '').toLowerCase();
  const text = semanticText(element);
  if (!text) return false;
  const actionLike = ['button', 'a', 'link', 'input'].includes(tag) || ['button', 'link'].includes(role) || Boolean(element.href) || element.action_type === 'click' || element.action_type === 'navigate';
  if (!actionLike) return false;
  if (text.length > 64) return false;
  return isPrimaryActionText(text);
}

function isPrimaryActionText(textOrElement: string | ScannedElement): boolean {
  const text = typeof textOrElement === 'string' ? textOrElement : semanticText(textOrElement);
  if (!text) return false;
  return PRIMARY_CTA_KEYWORDS.some((keyword) => text.includes(keyword)) ||
    /^(save|submit|add|create|new|continue|next|start|get started|publish|invite|send|confirm|finish|complete)\b/.test(text);
}

function inferListSubtype(element: ScannedElement, label: string): string {
  const descriptor = `${descriptorText(element)} ${label}`.toLowerCase();
  if (descriptor.includes('pagination') || /\b(previous|next|page)\b/.test(descriptor)) {
    return 'pagination';
  }
  if (descriptor.includes('table')) return 'table_controls';
  if (descriptor.includes('grid')) return 'grid_controls';
  if (descriptor.includes('breadcrumb')) return 'breadcrumb';
  if (descriptor.includes('wizard')) return 'wizard';
  return 'list_controls';
}

function descriptorText(element: ScannedElement): string {
  return [
    element.component_name,
    element.source_file,
    element.container,
    element.form_label,
    element.text,
    element.aria_label,
    element.placeholder,
    element.name,
    element.href,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function semanticText(element: ScannedElement): string {
  return normalizeLabel(
    [
      element.text,
      element.aria_label,
      element.placeholder,
      element.form_label,
      element.name,
      element.component_name,
      element.container,
      element.fingerprint?.tier4_context?.nearest_heading,
      element.fingerprint?.tier4_context?.parent_text,
      element.href,
    ]
      .filter(Boolean)
      .join(' '),
    120,
  ).toLowerCase();
}

function collectionRowKey(element: ScannedElement, kind: 'table' | 'list' | 'wizard' | 'stepper'): string {
  const context = element.fingerprint?.tier4_context;
  return normalizeKey([
    kind,
    element.route_path ?? '',
    element.route_origin ?? '',
    element.container ?? '',
    context?.nearest_heading ?? '',
    context?.parent_text ?? '',
    element.aria_controls ?? '',
    element.dom_id ?? '',
    element.href ?? '',
  ].join('|')) || `${kind}:${element.id}`;
}

function collectionRowLabel(element: ScannedElement, kind: 'table' | 'list', index: number): string {
  const context = element.fingerprint?.tier4_context;
  const raw = context?.parent_text || context?.nearest_heading || elementLabel(element);
  const prefix = kind === 'table' ? 'Row' : 'Item';
  return normalizeLabel(raw || `${prefix} ${index + 1}`, 80);
}

function collectionColumnKey(element: ScannedElement): string {
  return normalizeKey([
    element.tag,
    element.role ?? '',
    element.type ?? '',
    element.name ?? '',
    element.form_label ?? '',
    element.placeholder ?? '',
    element.aria_label ?? '',
    element.href ?? '',
    element.action_type ?? '',
  ].join('|')) || `${element.tag}:${element.id}`;
}

function collectionColumnLabel(element: ScannedElement, kind: 'table' | 'list', index: number): string {
  const text = elementLabel(element);
  if (text !== 'Unnamed') return text;
  return kind === 'table' ? `Column ${index + 1}` : `Item part ${index + 1}`;
}

function breadcrumbItemKey(element: ScannedElement): string {
  return normalizeKey([
    element.route_path ?? '',
    element.container ?? '',
    element.text ?? '',
    element.aria_label ?? '',
    element.href ?? '',
  ].join('|')) || `breadcrumb:${element.id}`;
}

function breadcrumbItemLabel(element: ScannedElement, index: number): string {
  const text = elementLabel(element);
  return text !== 'Unnamed' ? text : `Breadcrumb ${index + 1}`;
}

function stepLabel(element: ScannedElement, index: number, kind: 'stepper' | 'wizard'): string {
  const context = element.fingerprint?.tier4_context;
  const text = context?.nearest_heading || context?.parent_text || elementLabel(element);
  const prefix = kind === 'wizard' ? 'Wizard step' : 'Step';
  return normalizeLabel(text || `${prefix} ${index + 1}`, 80);
}

function groupScopeKey(
  element: ScannedElement,
  routePath?: string,
  routeOrigin?: string,
  routeUrl?: string,
  scopeSeed = '',
): string {
  const context = element.fingerprint?.tier4_context;
  return [
    scopeSeed || 'page',
    routeOrigin ?? element.route_origin ?? '',
    normalizeRoutePath(routePath ?? element.route_path ?? '/'),
    routeUrl ?? element.route_url ?? '',
    element.container ?? '',
    normalizeKey(context?.nearest_heading ?? element.form_label ?? ''),
    normalizeKey(context?.parent_text ?? ''),
    normalizeKey(element.aria_controls ?? ''),
    normalizeKey(element.aria_haspopup ?? ''),
  ].join('|');
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

function isNavigationElement(element: ScannedElement): boolean {
  const tag = element.tag.toLowerCase();
  const role = (element.role ?? '').toLowerCase();
  const descriptor = `${element.component_name ?? ''} ${element.source_file ?? ''}`.toLowerCase();
  return ['a', 'link', 'navlink', 'routerlink', 'summary'].includes(tag) ||
    ['link', 'menuitem'].includes(role) ||
    Boolean(element.href) ||
    descriptor.includes('nav') ||
    descriptor.includes('menu');
}

function bestSelector(element: ScannedElement): string | undefined {
  if (element.data_guideai) return `[data-guideai="${cssEscape(element.data_guideai)}"]`;
  if (element.data_testid) return `[data-testid="${cssEscape(element.data_testid)}"]`;
  if (element.dom_id) return `#${cssEscape(element.dom_id)}`;
  if (element.name) return `[name="${cssEscape(element.name)}"]`;
  return undefined;
}

function elementLabel(element: ScannedElement): string {
  return normalizeLabel(
    element.text ||
      element.aria_label ||
      element.placeholder ||
      element.form_label ||
      element.name ||
      element.href ||
      element.tag,
    100,
  );
}

function inferActionType(element: ScannedElement): string {
  const tag = element.tag.toLowerCase();
  if (['a', 'link', 'navlink', 'routerlink'].includes(tag) || Boolean(element.href)) return 'navigate';
  if (tag === 'form') return 'submit';
  if (['input', 'textarea'].includes(tag)) return 'fill';
  if (tag === 'select') return 'select';
  return 'click';
}

function routeNodeId(route: Pick<Route, 'origin' | 'path' | 'url'>): string {
  return stableId('screen', route.origin, route.path, route.url);
}

function sortRoutes(routes: Route[]): Route[] {
  return [...routes].sort((left, right) => {
    if (left.path === '/' && right.path !== '/') return -1;
    if (right.path === '/' && left.path !== '/') return 1;
    return left.path.localeCompare(right.path);
  });
}

function humanizeRoutePath(routePath: string): string {
  if (routePath === '/') return 'Home';
  const segments = routePath.split('/').filter(Boolean);
  return humanizeSegment(segments[segments.length - 1] || routePath);
}

function humanizeSegment(segment: string): string {
  return normalizeLabel(
    segment
      .replace(/^:/, '')
      .replace(/\*/g, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (match) => match.toUpperCase()),
    60,
  );
}

function groupOrder(kind: ProductGraphNode['kind']): number {
  const order: Partial<Record<ProductGraphNode['kind'], number>> = {
    layout: 0,
    navigation: 1,
    screen: 2,
    section: 3,
    breadcrumb: 4,
    tabs: 5,
    stepper: 6,
    wizard: 7,
    form: 8,
    list: 9,
    table: 10,
    row: 11,
    column: 12,
    cta: 13,
    dropdown: 14,
    accordion: 15,
    dialog: 16,
    drawer: 17,
    component: 18,
    action: 19,
    element: 20,
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

function cssEscape(value: string): string {
  return value.replace(/["\\]/g, '\\$&');
}

function matchRouteByHref(href: string, routes: Route[]): Route | undefined {
  const normalizedTarget = normalizeRoutePath(stripQueryAndHash(href));
  return routes.find((route) => routePathsMatch(route.path, normalizedTarget));
}

function stripQueryAndHash(href: string): string {
  return href.split('#')[0].split('?')[0] || href;
}

function normalizeRoutePath(routePath: string): string {
  return routePath.replace(/\/+$/, '') || '/';
}

function routePathsMatch(routePath: string, targetPath: string): boolean {
  const normalizedRoute = normalizeRoutePath(routePath);
  const normalizedTarget = normalizeRoutePath(targetPath);
  if (normalizedRoute === normalizedTarget) return true;

  const routeSegments = normalizedRoute.split('/').filter(Boolean);
  const targetSegments = normalizedTarget.split('/').filter(Boolean);
  if (routeSegments.length !== targetSegments.length) return false;

  for (let index = 0; index < routeSegments.length; index += 1) {
    const routeSegment = routeSegments[index];
    const targetSegment = targetSegments[index];
    if (routeSegment === targetSegment) continue;
    if (routeSegment.startsWith(':') || targetSegment.startsWith(':')) continue;
    if (routeSegment.endsWith('*') || targetSegment.endsWith('*')) return true;
    return false;
  }

  return true;
}

function pushUniqueConnection(
  connections: ProductGraphConnection[],
  seen: Set<string>,
  connection: ProductGraphConnection,
): void {
  const key = `${connection.from}|${connection.to}|${connection.kind}|${connection.label ?? ''}`;
  if (seen.has(key)) return;
  seen.add(key);
  connections.push(connection);
}

// ============================================================
// Milestone 2: Connection Evidence Builder
// ============================================================

function buildConnectionEvidence(
  kind: string,
  element: ScannedElement | undefined,
  fromRoutePath?: string,
  toRoutePath?: string,
  selector?: string,
  fingerprintScore = 0
): { confidence: Confidence; evidence: Evidence[] } {
  const evidence: Evidence[] = [];
  let confidenceScore = 0.5;

  if (element) {
    // Evidence from element
    evidence.push({
      element_id: element.id,
      source_file: element.source_file,
      route_path: element.route_path,
      route_origin: element.route_origin,
      route_url: element.route_url,
      selector,
      fingerprint_score: fingerprintScore,
      confidence: confidenceFromScore(Math.min(fingerprintScore / 143, 1.0)),
      reason: `Element found with fingerprint score ${fingerprintScore}`,
      evidence_type: 'element_attribute',
    });
  }

  // Calculate confidence based on connection kind
  if (kind === 'navigates_to' && element?.href) {
    confidenceScore = 0.95;
    if (element.source_file) {
      evidence.push({
        element_id: element.id,
        source_file: element.source_file,
        selector,
        confidence: confidenceFromScore(0.95),
        reason: 'Navigation link with href attribute',
        evidence_type: 'element_attribute',
      });
    }
  } else if (kind === 'submits_to') {
    confidenceScore = 0.90;
    if (element) {
      evidence.push({
        element_id: element.id,
        source_file: element.source_file,
        selector,
        confidence: confidenceFromScore(0.90),
        reason: 'Form submission detected',
        evidence_type: 'behavior',
      });
    }
  } else if (kind === 'opens' || kind === 'reveals') {
    confidenceScore = 0.75;
    if (element) {
      evidence.push({
        element_id: element.id,
        source_file: element.source_file,
        selector,
        confidence: confidenceFromScore(0.75),
        reason: `${kind} interaction detected`,
        evidence_type: 'behavior',
      });
    }
  } else if (element) {
    confidenceScore = Math.min(0.6 + (fingerprintScore / 143) * 0.3, 0.95);
  }

  // Add route evidence if available
  if (fromRoutePath && toRoutePath) {
    evidence.push({
      route_path: fromRoutePath,
      confidence: confidenceFromScore(0.85),
      reason: `Connection from ${fromRoutePath} to ${toRoutePath}`,
      evidence_type: 'structure',
    });
  }

  return {
    confidence: confidenceFromScore(confidenceScore),
    evidence: evidence.length > 0 ? evidence : [],
  };
}

// ============================================================
// Milestone 3: State Flow Detection
// ============================================================

function detectStateFlows(
  elements: ScannedElement[],
  routes: Route[]
): ProductGraphStateFlow[] {
  const stateFlows: ProductGraphStateFlow[] = [];
  const processedContainers = new Set<string>();

  // Group elements by container and route
  const elementsByContainer = new Map<string, ScannedElement[]>();
  for (const element of elements) {
    const key = `${element.route_path}:${element.container || 'none'}`;
    const group = elementsByContainer.get(key) || [];
    group.push(element);
    elementsByContainer.set(key, group);
  }

  // Detect dialogs
  const dialogElements = elements.filter(element => {
    const role = (element.role ?? '').toLowerCase();
    const tag = element.tag.toLowerCase();
    const componentName = (element.component_name ?? '').toLowerCase();
    return (
      tag === 'dialog' ||
      role === 'dialog' ||
      role === 'alertdialog' ||
      componentName.includes('modal') ||
      componentName.includes('dialog') ||
      element.aria_controls
    );
  });

  for (const element of dialogElements) {
    const flowId = stableId('stateflow', 'dialog', element.route_path, element.container || element.component_name || element.id);
    if (processedContainers.has(flowId)) continue;
    processedContainers.add(flowId);

    const closedState: ProductGraphState = {
      id: stableId(flowId, 'closed'),
      name: 'Closed',
      visible_element_ids: [],
      metadata: { is_initial: true },
    };

    const openState: ProductGraphState = {
      id: stableId(flowId, 'open'),
      name: 'Open',
      visible_element_ids: [element.id],
      metadata: {},
    };

    const openTransition: ProductGraphStateTransition = {
      id: stableId(flowId, 'transition', 'open'),
      from_state_id: closedState.id,
      to_state_id: openState.id,
      trigger_element_id: element.id,
      trigger_action: 'click',
      confidence: confidenceFromScore(0.85),
      evidence: [{
        element_id: element.id,
        source_file: element.source_file,
        selector: bestSelector(element),
        confidence: confidenceFromScore(0.85),
        reason: 'Dialog trigger detected',
        evidence_type: 'element_attribute',
      }],
      metadata: { label: 'Open', reversible: true },
    };

    const closeTransition: ProductGraphStateTransition = {
      id: stableId(flowId, 'transition', 'close'),
      from_state_id: openState.id,
      to_state_id: closedState.id,
      trigger_action: 'click',
      confidence: confidenceFromScore(0.75),
      evidence: [{
        element_id: element.id,
        confidence: confidenceFromScore(0.75),
        reason: 'Dialog close inferred',
        evidence_type: 'inferred',
      }],
      metadata: { label: 'Close', reversible: true },
    };

    stateFlows.push({
      id: flowId,
      name: element.container || element.component_name || element.aria_label || element.text || 'Dialog',
      screen_id: stableId('screen', element.route_path),
      route_path: element.route_path,
      states: [closedState, openState],
      transitions: [openTransition, closeTransition],
      initial_state_id: closedState.id,
      flow_type: 'dialog',
      confidence: confidenceFromScore(0.85),
      evidence: [{
        element_id: element.id,
        source_file: element.source_file,
        route_path: element.route_path,
        confidence: confidenceFromScore(0.85),
        reason: 'Dialog element detected',
        evidence_type: 'element_attribute',
      }],
      metadata: {
        trigger_element_ids: [element.id],
      },
    });
  }

  // Detect accordions
  const accordionElements = elements.filter(element => {
    const tag = element.tag.toLowerCase();
    const componentName = (element.component_name ?? '').toLowerCase();
    return (
      tag === 'details' ||
      tag === 'summary' ||
      element.aria_expanded !== undefined ||
      componentName.includes('accordion') ||
      componentName.includes('collapse')
    );
  });

  for (const element of accordionElements) {
    const flowId = stableId('stateflow', 'accordion', element.route_path, element.container || element.component_name || element.id);
    if (processedContainers.has(flowId)) continue;
    processedContainers.add(flowId);

    const collapsedState: ProductGraphState = {
      id: stableId(flowId, 'collapsed'),
      name: 'Collapsed',
      visible_element_ids: [element.id],
      metadata: { is_initial: true },
    };

    const expandedState: ProductGraphState = {
      id: stableId(flowId, 'expanded'),
      name: 'Expanded',
      visible_element_ids: [element.id],
      metadata: {},
    };

    const expandTransition: ProductGraphStateTransition = {
      id: stableId(flowId, 'transition', 'expand'),
      from_state_id: collapsedState.id,
      to_state_id: expandedState.id,
      trigger_element_id: element.id,
      trigger_action: 'click',
      confidence: confidenceFromScore(0.85),
      evidence: [{
        element_id: element.id,
        source_file: element.source_file,
        selector: bestSelector(element),
        confidence: confidenceFromScore(0.85),
        reason: 'Accordion with aria-expanded detected',
        evidence_type: 'element_attribute',
      }],
      metadata: { label: 'Expand', reversible: true },
    };

    const collapseTransition: ProductGraphStateTransition = {
      id: stableId(flowId, 'transition', 'collapse'),
      from_state_id: expandedState.id,
      to_state_id: collapsedState.id,
      trigger_element_id: element.id,
      trigger_action: 'click',
      confidence: confidenceFromScore(0.85),
      evidence: [{
        element_id: element.id,
        confidence: confidenceFromScore(0.85),
        reason: 'Accordion collapse inferred',
        evidence_type: 'element_attribute',
      }],
      metadata: { label: 'Collapse', reversible: true },
    };

    stateFlows.push({
      id: flowId,
      name: element.container || element.component_name || element.aria_label || element.text || 'Accordion',
      screen_id: stableId('screen', element.route_path),
      route_path: element.route_path,
      states: [collapsedState, expandedState],
      transitions: [expandTransition, collapseTransition],
      initial_state_id: collapsedState.id,
      flow_type: 'accordion',
      confidence: confidenceFromScore(0.85),
      evidence: [{
        element_id: element.id,
        source_file: element.source_file,
        route_path: element.route_path,
        confidence: confidenceFromScore(0.85),
        reason: 'Accordion element detected',
        evidence_type: 'element_attribute',
      }],
      metadata: {
        trigger_element_ids: [element.id],
      },
    });
  }

  // Detect tabs
  const tabElements = elements.filter(element => {
    const role = (element.role ?? '').toLowerCase();
    // A tabpanel is the content controlled by a tab, not an independently
    // selectable state. Only tab triggers should create states/transitions.
    return role === 'tab';
  });

  const tabGroups = new Map<string, ScannedElement[]>();
  for (const element of tabElements) {
    const groupKey = `${element.route_path}:${element.container || 'tabs'}`;
    const group = tabGroups.get(groupKey) || [];
    group.push(element);
    tabGroups.set(groupKey, group);
  }

  for (const [groupKey, tabs] of Array.from(tabGroups.entries())) {
    if (tabs.length < 2) continue;

    const flowId = stableId('stateflow', 'tabs', groupKey);
    if (processedContainers.has(flowId)) continue;
    processedContainers.add(flowId);

    const states: ProductGraphState[] = [];
    const transitions: ProductGraphStateTransition[] = [];
    const triggerElements: string[] = [];

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const stateName = tab.text || tab.aria_label || `Tab ${i + 1}`;

      const state: ProductGraphState = {
        id: stableId(flowId, 'state', String(i)),
        name: stateName,
        visible_element_ids: [tab.id],
        metadata: { is_initial: i === 0 },
      };
      states.push(state);
      triggerElements.push(tab.id);

      // Create transitions to this state from all other states
      for (let j = 0; j < i; j++) {
        const fromState = states[j];
        transitions.push({
          id: stableId(flowId, 'transition', String(j), String(i)),
          from_state_id: fromState.id,
          to_state_id: state.id,
          trigger_element_id: tab.id,
          trigger_action: 'click',
          confidence: confidenceFromScore(0.90),
          evidence: [{
            element_id: tab.id,
            source_file: tab.source_file,
            confidence: confidenceFromScore(0.90),
            reason: 'Tab switch detected',
            evidence_type: 'element_attribute',
          }],
          metadata: { label: `Switch to ${stateName}` },
        });
      }
    }

    if (states.length > 0) {
      stateFlows.push({
        id: flowId,
        name: tabs[0].container || 'Tabs',
        screen_id: stableId('screen', tabs[0].route_path),
        route_path: tabs[0].route_path,
        states,
        transitions,
        initial_state_id: states[0].id,
        flow_type: 'tabs',
        confidence: confidenceFromScore(0.90),
        evidence: tabs.slice(0, 3).map(tab => ({
          element_id: tab.id,
          source_file: tab.source_file,
          route_path: tab.route_path,
          confidence: confidenceFromScore(0.90),
          reason: 'Tab element detected',
          evidence_type: 'element_attribute',
        })),
        metadata: {
          trigger_element_ids: triggerElements,
        },
      });
    }
  }

  // Detect dropdowns
  const dropdownElements = elements.filter(element => {
    const role = (element.role ?? '').toLowerCase();
    const componentName = (element.component_name ?? '').toLowerCase();
    return (
      element.aria_haspopup !== undefined ||
      role === 'menuitem' ||
      role === 'combobox' ||
      componentName.includes('dropdown') ||
      componentName.includes('popover')
    );
  });

  for (const element of dropdownElements) {
    const flowId = stableId('stateflow', 'dropdown', element.route_path, element.component_name || element.id);
    if (processedContainers.has(flowId)) continue;
    processedContainers.add(flowId);

    const closedState: ProductGraphState = {
      id: stableId(flowId, 'closed'),
      name: 'Closed',
      visible_element_ids: [element.id],
      metadata: { is_initial: true },
    };

    const openState: ProductGraphState = {
      id: stableId(flowId, 'open'),
      name: 'Open',
      visible_element_ids: [element.id],
      metadata: {},
    };

    stateFlows.push({
      id: flowId,
      name: element.component_name || element.aria_label || element.text || 'Dropdown',
      screen_id: stableId('screen', element.route_path),
      route_path: element.route_path,
      states: [closedState, openState],
      transitions: [{
        id: stableId(flowId, 'transition', 'toggle'),
        from_state_id: closedState.id,
        to_state_id: openState.id,
        trigger_element_id: element.id,
        trigger_action: 'click',
        confidence: confidenceFromScore(0.80),
        evidence: [{
          element_id: element.id,
          source_file: element.source_file,
          confidence: confidenceFromScore(0.80),
          reason: 'Dropdown toggle detected',
          evidence_type: 'element_attribute',
        }],
        metadata: { label: 'Toggle', reversible: true },
      }],
      initial_state_id: closedState.id,
      flow_type: 'dropdown',
      confidence: confidenceFromScore(0.80),
      evidence: [{
        element_id: element.id,
        source_file: element.source_file,
        route_path: element.route_path,
        confidence: confidenceFromScore(0.80),
        reason: 'Dropdown element detected',
        evidence_type: 'element_attribute',
      }],
      metadata: {
        trigger_element_ids: [element.id],
      },
    });
  }

  return stateFlows;
}

// ============================================================
// Milestone 4: Module, Section, and Journey Detection
// ============================================================

function detectModules(
  routes: Route[],
  elements: ScannedElement[]
): ProductGraphModule[] {
  const modules: ProductGraphModule[] = [];
  const pathSegmentGroups = new Map<string, Route[]>();

  // Group routes by first path segment
  for (const route of routes) {
    const segments = route.path.split('/').filter(Boolean);
    if (segments.length === 0) continue;

    const firstSegment = segments[0].startsWith(':') ? 'dynamic' : segments[0];
    const group = pathSegmentGroups.get(firstSegment) || [];
    group.push(route);
    pathSegmentGroups.set(firstSegment, group);
  }

  // Create modules from path segments
  for (const [segment, groupRoutes] of Array.from(pathSegmentGroups.entries())) {
    if (groupRoutes.length < 1) continue;

    // Collect text from routes and elements for classification
    const haystack = [
      segment,
      ...groupRoutes.map(r => `${r.path} ${r.page_title ?? ''} ${r.component_name ?? ''}`),
      ...elements
        .filter(e => groupRoutes.some(r => r.path === e.route_path))
        .map(e => `${e.text ?? ''} ${e.aria_label ?? ''}`)
    ].join(' ').toLowerCase();

    // Find matching module type
    let moduleType = 'general';
    let matchScore = 0;
    const signals: string[] = [];

    for (const candidate of APPLICATION_KEYWORDS) {
      let score = 0;
      for (const keyword of candidate.keywords) {
        if (haystack.includes(keyword)) {
          score++;
          if (!signals.includes(keyword)) signals.push(keyword);
        }
      }
      if (score > matchScore) {
        matchScore = score;
        moduleType = candidate.type;
      }
    }

    const moduleName = humanizeSegment(segment);
    const screenIds = groupRoutes.map(r => routeNodeId(r));
    const confidenceScore = matchScore > 0 ? Math.min(0.70 + matchScore * 0.05, 0.95) : 0.65;

    modules.push({
      id: stableId('module', segment),
      name: moduleName,
      description: `${moduleName} module (${groupRoutes.length} screens)`,
      screen_ids: screenIds,
      confidence: confidenceFromScore(confidenceScore),
      evidence: [
        {
          route_path: groupRoutes[0].path,
          source_file: groupRoutes[0].source_file,
          confidence: confidenceFromScore(confidenceScore),
          reason: `Module inferred from ${groupRoutes.length} routes with path segment '${segment}'`,
          evidence_type: 'structure',
        },
        ...signals.slice(0, 2).map(signal => ({
          confidence: confidenceFromScore(0.75),
          reason: `Keyword match: '${signal}'`,
          evidence_type: 'text_content' as const,
        }))
      ],
      metadata: {
        domain_type: moduleType as any,
        entry_screen_ids: [screenIds[0]],
        capabilities: signals.slice(0, 5),
      },
    });
  }

  return modules;
}

function detectSections(
  elements: ScannedElement[],
  routes: Route[]
): ProductGraphSection[] {
  const sections: ProductGraphSection[] = [];
  const sectionGroups = new Map<string, ScannedElement[]>();

  // Group elements by route and component/container
  for (const element of elements) {
    const componentName = element.component_name || element.container || 'content';
    const groupKey = `${element.route_path}:${componentName}`;
    const group = sectionGroups.get(groupKey) || [];
    group.push(element);
    sectionGroups.set(groupKey, group);
  }

  // Create sections from grouped elements
  for (const [groupKey, groupElements] of Array.from(sectionGroups.entries())) {
    if (groupElements.length === 0) continue;

    const [routePath, componentName] = groupKey.split(':');
    const firstElement = groupElements[0];

    // Determine section type from component name
    const lowerName = componentName.toLowerCase();
    let sectionType: ProductGraphSection['section_type'] = 'other';

    if (lowerName.includes('hero')) sectionType = 'hero';
    else if (lowerName.includes('header') || lowerName.includes('navbar') || lowerName.includes('topbar')) sectionType = 'header';
    else if (lowerName.includes('footer')) sectionType = 'footer';
    else if (lowerName.includes('nav') || lowerName.includes('menu')) sectionType = 'navigation';
    else if (lowerName.includes('sidebar') || lowerName.includes('aside')) sectionType = 'sidebar';
    else if (lowerName.includes('form')) sectionType = 'form';
    else if (lowerName.includes('list') || lowerName.includes('table')) sectionType = 'list';
    else if (lowerName.includes('grid')) sectionType = 'grid';
    else if (lowerName.includes('summary')) sectionType = 'summary';
    else if (lowerName.includes('toolbar')) sectionType = 'toolbar';
    else if (lowerName.includes('filter')) sectionType = 'filter';
    else if (groupElements.some(e => ['input', 'select', 'textarea'].includes(e.tag.toLowerCase()))) sectionType = 'form';
    else if (groupElements.some(e => e.tag.toLowerCase() === 'table')) sectionType = 'list';
    else sectionType = 'content';

    const heading = firstElement.fingerprint?.tier4_context?.nearest_heading;
    const sectionName = heading || componentName || 'Section';

    sections.push({
      id: stableId('section', routePath, componentName),
      name: sectionName,
      screen_id: stableId('screen', routePath),
      route_path: routePath,
      element_ids: groupElements.map(e => e.id),
      section_type: sectionType,
      confidence: confidenceFromScore(0.80),
      evidence: [{
        route_path: routePath,
        source_file: firstElement.source_file,
        confidence: confidenceFromScore(0.80),
        reason: `Section detected with ${groupElements.length} elements`,
        evidence_type: 'structure',
      }],
      metadata: {
        heading,
        component_name: firstElement.component_name,
        source_file: firstElement.source_file,
      },
    });
  }

  return sections;
}

function stitchJourneys(
  connections: ProductGraphConnection[],
  routes: Route[]
): ProductGraphUserJourney[] {
  const journeys: ProductGraphUserJourney[] = [];

  // Build route lookup
  const routeById = new Map<string, Route>();
  for (const route of routes) {
    routeById.set(routeNodeId(route), route);
  }

  // Detect checkout journey (cart → checkout → order/confirmation)
  const checkoutPaths = connections.filter(c => {
    const fromRoute = routeById.get(c.from);
    const toRoute = routeById.get(c.to);
    if (!fromRoute || !toRoute) return false;

    const fromPath = fromRoute.path.toLowerCase();
    const toPath = toRoute.path.toLowerCase();

    return (
      (fromPath.includes('cart') && toPath.includes('checkout')) ||
      (fromPath.includes('checkout') && (toPath.includes('order') || toPath.includes('confirm') || toPath.includes('success')))
    );
  });

  if (checkoutPaths.length > 0) {
    const steps: ProductGraphJourneyStep[] = [];
    const seenScreens = new Set<string>();
    let stepNumber = 1;

    for (const connection of checkoutPaths) {
      if (!seenScreens.has(connection.from)) {
        const fromRoute = routeById.get(connection.from);
        if (fromRoute) {
          steps.push({
            id: stableId('journey-step', 'checkout', String(stepNumber)),
            step_number: stepNumber++,
            screen_id: connection.from,
            route_path: fromRoute.path,
            name: fromRoute.page_title || humanizeRoutePath(fromRoute.path),
            next_step_connection_id: connection.from,
            confidence: confidenceFromScore(0.85),
            evidence: [{
              route_path: fromRoute.path,
              confidence: confidenceFromScore(0.85),
              reason: 'Checkout journey step detected',
              evidence_type: 'structure',
            }],
            metadata: {},
          });
          seenScreens.add(connection.from);
        }
      }

      if (!seenScreens.has(connection.to)) {
        const toRoute = routeById.get(connection.to);
        if (toRoute) {
          steps.push({
            id: stableId('journey-step', 'checkout', String(stepNumber)),
            step_number: stepNumber++,
            screen_id: connection.to,
            route_path: toRoute.path,
            name: toRoute.page_title || humanizeRoutePath(toRoute.path),
            confidence: confidenceFromScore(0.85),
            evidence: [{
              route_path: toRoute.path,
              confidence: confidenceFromScore(0.85),
              reason: 'Checkout journey step detected',
              evidence_type: 'structure',
            }],
            metadata: {},
          });
          seenScreens.add(connection.to);
        }
      }
    }

    if (steps.length >= 2) {
      journeys.push({
        id: stableId('journey', 'checkout'),
        name: 'Checkout Flow',
        description: 'User checkout journey from cart to order confirmation',
        steps,
        journey_type: 'purchase',
        goal: 'Complete order',
        confidence: confidenceFromScore(0.85),
        evidence: [{
          confidence: confidenceFromScore(0.85),
          reason: `Checkout journey with ${steps.length} steps detected`,
          evidence_type: 'structure',
        }],
        metadata: {
          typical_steps: steps.length,
        },
      });
    }
  }

  // Detect auth journey (login/signup → home/dashboard)
  const authPaths = connections.filter(c => {
    const fromRoute = routeById.get(c.from);
    const toRoute = routeById.get(c.to);
    if (!fromRoute || !toRoute) return false;

    const fromPath = fromRoute.path.toLowerCase();
    const toPath = toRoute.path.toLowerCase();

    return (
      (fromPath.includes('login') || fromPath.includes('signin') || fromPath.includes('signup') || fromPath.includes('register')) &&
      (toPath.includes('home') || toPath.includes('dashboard') || toPath === '/')
    );
  });

  if (authPaths.length > 0) {
    const steps: ProductGraphJourneyStep[] = [];
    const seenScreens = new Set<string>();
    let stepNumber = 1;

    for (const connection of authPaths.slice(0, 3)) {
      if (!seenScreens.has(connection.from)) {
        const fromRoute = routeById.get(connection.from);
        if (fromRoute) {
          steps.push({
            id: stableId('journey-step', 'auth', String(stepNumber)),
            step_number: stepNumber++,
            screen_id: connection.from,
            route_path: fromRoute.path,
            name: fromRoute.page_title || humanizeRoutePath(fromRoute.path),
            next_step_connection_id: connection.from,
            confidence: confidenceFromScore(0.85),
            evidence: [{
              route_path: fromRoute.path,
              confidence: confidenceFromScore(0.85),
              reason: 'Authentication journey step detected',
              evidence_type: 'structure',
            }],
            metadata: {},
          });
          seenScreens.add(connection.from);
        }
      }

      if (!seenScreens.has(connection.to)) {
        const toRoute = routeById.get(connection.to);
        if (toRoute) {
          steps.push({
            id: stableId('journey-step', 'auth', String(stepNumber)),
            step_number: stepNumber++,
            screen_id: connection.to,
            route_path: toRoute.path,
            name: toRoute.page_title || humanizeRoutePath(toRoute.path),
            confidence: confidenceFromScore(0.85),
            evidence: [{
              route_path: toRoute.path,
              confidence: confidenceFromScore(0.85),
              reason: 'Authentication journey destination detected',
              evidence_type: 'structure',
            }],
            metadata: {},
          });
          seenScreens.add(connection.to);
        }
      }
    }

    if (steps.length >= 2) {
      journeys.push({
        id: stableId('journey', 'auth'),
        name: 'Authentication Flow',
        description: 'User authentication and onboarding journey',
        steps,
        journey_type: 'registration',
        goal: 'Access application',
        confidence: confidenceFromScore(0.85),
        evidence: [{
          confidence: confidenceFromScore(0.85),
          reason: `Authentication journey with ${steps.length} steps detected`,
          evidence_type: 'structure',
        }],
        metadata: {
          typical_steps: steps.length,
        },
      });
    }
  }

  return journeys;
}

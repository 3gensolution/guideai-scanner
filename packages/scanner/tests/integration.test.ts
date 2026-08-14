import { describe, it, expect } from 'vitest';
import { scan } from '../src/scanner';
import { resolve } from 'path';

describe('Integration Tests', () => {
  it('scans demo-app successfully', async () => {
    const demoAppPath = resolve(__dirname, '../../../demo-app');

    const result = await scan({
      dir: demoAppPath,
      dryRun: true
    });

    expect(result.framework).toBe('react-router');
    expect(result.routes.length).toBeGreaterThan(0);
    expect(result.elements.length).toBeGreaterThan(0);
    expect(result.product_graph).toBeDefined();
    expect(result.duration_ms).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for full scan

  it('produces valid product graph structure', async () => {
    const demoAppPath = resolve(__dirname, '../../../demo-app');

    const result = await scan({
      dir: demoAppPath,
      dryRun: true
    });

    const graph = result.product_graph!;

    expect(graph.version).toBe(1);
    expect(graph.framework).toBe('react-router');
    expect(graph.application).toBeDefined();
    expect(graph.application.type).toBeDefined();
    expect(graph.application.confidence).toBeGreaterThan(0);
    expect(graph.layout).toBeDefined();
    expect(graph.root).toBeDefined();
    expect(graph.connections).toBeDefined();
    expect(Array.isArray(graph.connections)).toBe(true);
    expect(graph.modules).toBeDefined();
    expect(graph.sections).toBeDefined();
    expect(graph.stateFlows).toBeDefined();
    expect(graph.userJourneys).toBeDefined();
  }, 30000);

  it('detects multiple modules in demo-app', async () => {
    const demoAppPath = resolve(__dirname, '../../../demo-app');

    const result = await scan({
      dir: demoAppPath,
      dryRun: true
    });

    const modules = result.product_graph?.modules || [];
    expect(modules.length).toBeGreaterThan(0);

    // Check module structure
    modules.forEach(module => {
      expect(module.id).toBeDefined();
      expect(module.name).toBeDefined();
      expect(module.screen_ids).toBeDefined();
      expect(Array.isArray(module.screen_ids)).toBe(true);
      expect(module.confidence).toBeDefined();
      expect(module.evidence).toBeDefined();
    });
  }, 30000);

  it('detects sections in demo-app', async () => {
    const demoAppPath = resolve(__dirname, '../../../demo-app');

    const result = await scan({
      dir: demoAppPath,
      dryRun: true
    });

    const sections = result.product_graph?.sections || [];
    expect(sections.length).toBeGreaterThan(0);

    sections.forEach(section => {
      expect(section.id).toBeDefined();
      expect(section.name).toBeDefined();
      expect(section.section_type).toBeDefined();
      expect(section.element_ids).toBeDefined();
      expect(Array.isArray(section.element_ids)).toBe(true);
    });
  }, 30000);

  it('detects state flows in demo-app', async () => {
    const demoAppPath = resolve(__dirname, '../../../demo-app');

    const result = await scan({
      dir: demoAppPath,
      dryRun: true
    });

    const stateFlows = result.product_graph?.stateFlows || [];

    if (stateFlows.length > 0) {
      stateFlows.forEach(flow => {
        expect(flow.id).toBeDefined();
        expect(flow.name).toBeDefined();
        expect(flow.flow_type).toBeDefined();
        expect(flow.states).toBeDefined();
        expect(Array.isArray(flow.states)).toBe(true);
        expect(flow.transitions).toBeDefined();
        expect(Array.isArray(flow.transitions)).toBe(true);
        expect(flow.initial_state_id).toBeDefined();
      });
    }
  }, 30000);

  it('builds UI map correctly', async () => {
    const demoAppPath = resolve(__dirname, '../../../demo-app');

    const result = await scan({
      dir: demoAppPath,
      dryRun: true
    });

    const uiMap = result.ui_map!;

    expect(uiMap.version).toBe(1);
    expect(uiMap.framework).toBe('react-router');
    expect(uiMap.root).toBeDefined();
    expect(uiMap.root.kind).toBe('app');
    expect(uiMap.route_count).toBeGreaterThan(0);
    expect(uiMap.element_count).toBeGreaterThan(0);
    expect(uiMap.generated_at).toBeDefined();
  }, 30000);

  it('creates proper route hierarchy', async () => {
    const demoAppPath = resolve(__dirname, '../../../demo-app');

    const result = await scan({
      dir: demoAppPath,
      dryRun: true
    });

    const graph = result.product_graph!;

    expect(graph.root.children.length).toBeGreaterThan(0);

    // Check for screen nodes
    const hasScreens = (node: any): boolean => {
      if (node.kind === 'screen') return true;
      if (!node.children) return false;
      return node.children.some((child: any) => hasScreens(child));
    };

    expect(hasScreens(graph.root)).toBe(true);
  }, 30000);

  it('assigns confidence scores throughout the graph', async () => {
    const demoAppPath = resolve(__dirname, '../../../demo-app');

    const result = await scan({
      dir: demoAppPath,
      dryRun: true
    });

    const graph = result.product_graph!;

    // Check modules
    graph.modules?.forEach(module => {
      expect(module.confidence.score).toBeGreaterThanOrEqual(0);
      expect(module.confidence.score).toBeLessThanOrEqual(1);
    });

    // Check sections
    graph.sections?.forEach(section => {
      expect(section.confidence.score).toBeGreaterThanOrEqual(0);
      expect(section.confidence.score).toBeLessThanOrEqual(1);
    });

    // Check state flows
    graph.stateFlows?.forEach(flow => {
      expect(flow.confidence.score).toBeGreaterThanOrEqual(0);
      expect(flow.confidence.score).toBeLessThanOrEqual(1);
    });
  }, 30000);

  it('includes evidence trails throughout the graph', async () => {
    const demoAppPath = resolve(__dirname, '../../../demo-app');

    const result = await scan({
      dir: demoAppPath,
      dryRun: true
    });

    const graph = result.product_graph!;

    // Check modules have evidence
    graph.modules?.forEach(module => {
      expect(Array.isArray(module.evidence)).toBe(true);
      expect(module.evidence.length).toBeGreaterThan(0);
    });

    // Check sections have evidence
    graph.sections?.forEach(section => {
      expect(Array.isArray(section.evidence)).toBe(true);
    });

    // Check state flows have evidence
    graph.stateFlows?.forEach(flow => {
      expect(Array.isArray(flow.evidence)).toBe(true);
      expect(flow.evidence.length).toBeGreaterThan(0);
    });
  }, 30000);

  it('detects layout features correctly', async () => {
    const demoAppPath = resolve(__dirname, '../../../demo-app');

    const result = await scan({
      dir: demoAppPath,
      dryRun: true
    });

    const layout = result.product_graph!.layout;

    expect(typeof layout.hasNavbar).toBe('boolean');
    expect(typeof layout.hasSidebar).toBe('boolean');
    expect(typeof layout.hasFooter).toBe('boolean');
    expect(typeof layout.hasTabs).toBe('boolean');
    expect(typeof layout.hasDropdowns).toBe('boolean');
    expect(typeof layout.hasAccordions).toBe('boolean');
    expect(typeof layout.hasDialogs).toBe('boolean');
    expect(typeof layout.hasForms).toBe('boolean');
  }, 30000);

  it('creates connections between routes', async () => {
    const demoAppPath = resolve(__dirname, '../../../demo-app');

    const result = await scan({
      dir: demoAppPath,
      dryRun: true
    });

    const connections = result.product_graph!.connections;

    expect(Array.isArray(connections)).toBe(true);

    connections.forEach(conn => {
      expect(conn.from).toBeDefined();
      expect(conn.to).toBeDefined();
      expect(conn.kind).toBeDefined();
      expect(['navigates_to', 'opens', 'reveals', 'submits_to', 'toggles', 'selects', 'switches_tab', 'expands', 'collapses', 'shows', 'hides', 'contains', 'contains_route', 'updates'])
        .toContain(conn.kind);
    });
  }, 30000);

  it('generates valid timestamps', async () => {
    const demoAppPath = resolve(__dirname, '../../../demo-app');

    const result = await scan({
      dir: demoAppPath,
      dryRun: true
    });

    expect(result.product_graph!.generated_at).toBeDefined();

    const timestamp = new Date(result.product_graph!.generated_at);
    expect(timestamp.getTime()).toBeGreaterThan(0);
    expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
  }, 30000);
});

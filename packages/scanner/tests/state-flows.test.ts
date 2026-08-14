import { describe, it, expect } from 'vitest';
import { buildProductGraph } from '../src/product-graph';
import type { Route, ScannedElement, UIMap } from '../src/types';

describe('State Flow Detection', () => {
  const mockUIMap: UIMap = {
    version: 1,
    framework: 'react-router',
    root: {
      id: 'app',
      kind: 'app',
      label: 'App',
      children: []
    },
    route_count: 1,
    element_count: 0,
    generated_at: new Date().toISOString()
  };

  const routes: Route[] = [
    { path: '/', source_file: 'home.tsx', dynamic_segments: [], auth_required: false, headings: [] }
  ];

  it('detects dialog state flows', () => {
    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'div',
        aria_label: 'User menu',
        component_name: 'UserMenu',
        source_file: 'menu.tsx',
        role: 'dialog',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'div', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      }
    ];

    const graph = buildProductGraph('react-router', routes, elements, mockUIMap);

    expect(graph.stateFlows).toBeDefined();
    const dialogFlows = graph.stateFlows!.filter(f => f.flow_type === 'dialog');

    expect(dialogFlows.length).toBeGreaterThan(0);

    const dialogFlow = dialogFlows[0];
    expect(dialogFlow.states).toBeDefined();
    expect(dialogFlow.states.length).toBeGreaterThanOrEqual(2);
    expect(dialogFlow.transitions).toBeDefined();
    expect(dialogFlow.initial_state_id).toBeDefined();
  });

  it('detects accordion state flows', () => {
    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'button',
        component_name: 'FAQ',
        source_file: 'faq.tsx',
        aria_expanded: 'false',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'button', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      }
    ];

    const graph = buildProductGraph('react-router', routes, elements, mockUIMap);

    const accordionFlows = graph.stateFlows!.filter(f => f.flow_type === 'accordion');
    expect(accordionFlows.length).toBeGreaterThan(0);

    const accordionFlow = accordionFlows[0];
    expect(accordionFlow.states.length).toBeGreaterThanOrEqual(2);

    const stateNames = accordionFlow.states.map(s => s.name);
    expect(stateNames).toContain('Collapsed');
    expect(stateNames).toContain('Expanded');
  });

  it('detects tab state flows', () => {
    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'button',
        text: 'Tab 1',
        component_name: 'Tabs',
        source_file: 'tabs.tsx',
        role: 'tab',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'button', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      },
      {
        id: '2',
        route_path: '/',
        tag: 'button',
        text: 'Tab 2',
        component_name: 'Tabs',
        source_file: 'tabs.tsx',
        role: 'tab',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'button', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      },
      {
        id: 'panel',
        route_path: '/',
        tag: 'div',
        component_name: 'Tabs',
        source_file: 'tabs.tsx',
        role: 'tabpanel',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'div', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      }
    ];

    const graph = buildProductGraph('react-router', routes, elements, mockUIMap);

    const tabFlows = graph.stateFlows!.filter(f => f.flow_type === 'tabs');
    expect(tabFlows.length).toBeGreaterThan(0);

    const tabFlow = tabFlows[0];
    expect(tabFlow.states.length).toBe(2);
    expect(tabFlow.states.map(state => state.name)).toEqual(['Tab 1', 'Tab 2']);
  });

  it('detects dropdown state flows', () => {
    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'button',
        component_name: 'Dropdown',
        source_file: 'dropdown.tsx',
        aria_haspopup: 'true',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'button', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      }
    ];

    const graph = buildProductGraph('react-router', routes, elements, mockUIMap);

    const dropdownFlows = graph.stateFlows!.filter(f => f.flow_type === 'dropdown');
    expect(dropdownFlows.length).toBeGreaterThan(0);

    const dropdownFlow = dropdownFlows[0];
    expect(dropdownFlow.states.length).toBeGreaterThanOrEqual(2);
  });

  it('includes states and transitions in flows', () => {
    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'div',
        role: 'dialog',
        component_name: 'Modal',
        source_file: 'modal.tsx',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'div', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      }
    ];

    const graph = buildProductGraph('react-router', routes, elements, mockUIMap);

    graph.stateFlows!.forEach(flow => {
      expect(flow.states).toBeDefined();
      expect(Array.isArray(flow.states)).toBe(true);
      expect(flow.states.length).toBeGreaterThan(0);

      expect(flow.transitions).toBeDefined();
      expect(Array.isArray(flow.transitions)).toBe(true);

      expect(flow.initial_state_id).toBeDefined();

      const initialState = flow.states.find(s => s.id === flow.initial_state_id);
      expect(initialState).toBeDefined();
    });
  });

  it('includes confidence and evidence in state flows', () => {
    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'details',
        component_name: 'Accordion',
        source_file: 'accordion.tsx',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'details', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      }
    ];

    const graph = buildProductGraph('react-router', routes, elements, mockUIMap);

    graph.stateFlows!.forEach(flow => {
      expect(flow.confidence).toBeDefined();
      expect(flow.confidence.score).toBeGreaterThanOrEqual(0);
      expect(flow.confidence.score).toBeLessThanOrEqual(1);
      expect(['confirmed', 'likely', 'candidate']).toContain(flow.confidence.level);

      expect(flow.evidence).toBeDefined();
      expect(Array.isArray(flow.evidence)).toBe(true);

      flow.evidence.forEach(evidence => {
        expect(evidence.confidence).toBeDefined();
        expect(evidence.reason).toBeDefined();
      });
    });
  });

  it('sets flow metadata correctly', () => {
    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'dialog',
        component_name: 'ConfirmDialog',
        source_file: 'dialog.tsx',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'dialog', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      }
    ];

    const graph = buildProductGraph('react-router', routes, elements, mockUIMap);

    graph.stateFlows!.forEach(flow => {
      expect(flow.id).toBeDefined();
      expect(flow.name).toBeDefined();
      expect(flow.route_path).toBeDefined();
      expect(flow.flow_type).toBeDefined();
      expect(['dialog', 'drawer', 'dropdown', 'accordion', 'tabs', 'stepper', 'wizard', 'toggle', 'multiselect', 'other'])
        .toContain(flow.flow_type);

      if (flow.metadata?.trigger_element_ids) {
        expect(Array.isArray(flow.metadata.trigger_element_ids)).toBe(true);
      }
    });
  });

  it('creates proper state transitions', () => {
    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'button',
        aria_expanded: 'false',
        component_name: 'ExpandablePanel',
        source_file: 'panel.tsx',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'button', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      }
    ];

    const graph = buildProductGraph('react-router', routes, elements, mockUIMap);

    graph.stateFlows!.forEach(flow => {
      flow.transitions.forEach(transition => {
        expect(transition.id).toBeDefined();
        expect(transition.from_state_id).toBeDefined();
        expect(transition.to_state_id).toBeDefined();
        expect(transition.confidence).toBeDefined();
        expect(transition.evidence).toBeDefined();

        const fromState = flow.states.find(s => s.id === transition.from_state_id);
        const toState = flow.states.find(s => s.id === transition.to_state_id);

        expect(fromState).toBeDefined();
        expect(toState).toBeDefined();
      });
    });
  });

  it('handles multiple tab groups', () => {
    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'button',
        text: 'Tab 1',
        container: 'MainTabs',
        role: 'tab',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'button', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      },
      {
        id: '2',
        route_path: '/',
        tag: 'button',
        text: 'Tab 2',
        container: 'MainTabs',
        role: 'tab',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'button', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      },
      {
        id: '3',
        route_path: '/',
        tag: 'button',
        text: 'Settings Tab',
        container: 'SettingsTabs',
        role: 'tab',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'button', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      },
      {
        id: '4',
        route_path: '/',
        tag: 'button',
        text: 'Profile Tab',
        container: 'SettingsTabs',
        role: 'tab',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'button', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      }
    ];

    const graph = buildProductGraph('react-router', routes, elements, mockUIMap);

    const tabFlows = graph.stateFlows!.filter(f => f.flow_type === 'tabs');
    expect(tabFlows.length).toBeGreaterThanOrEqual(2);
  });
});

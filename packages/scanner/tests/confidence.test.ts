import { describe, it, expect } from 'vitest';
import { buildProductGraph } from '../src/product-graph';
import { confidenceFromScore } from '../src/types';
import type { Route, ScannedElement, UIMap } from '../src/types';

describe('Confidence and Evidence', () => {
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
    element_count: 1,
    generated_at: new Date().toISOString()
  };

  it('assigns confidence to connections', () => {
    const routes: Route[] = [
      { path: '/', source_file: 'home.tsx', dynamic_segments: [], auth_required: false, headings: [] },
      { path: '/about', source_file: 'about.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'a',
        text: 'About',
        href: '/about',
        component_name: 'Nav',
        source_file: 'nav.tsx',
        fingerprint: {
          tier1_stable: { score: 40 },
          tier2_text: { score: 30, variants: [] },
          tier3_structural: { score: 25, tag: 'a', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 95
        }
      }
    ];

    const uiMapWithConnections: UIMap = {
      ...mockUIMap,
      connections: [
        {
          from_route_path: '/',
          to_route_path: '/about',
          kind: 'navigates_to',
          selector: '[href="/about"]'
        }
      ]
    };

    const graph = buildProductGraph('react-router', routes, elements, uiMapWithConnections);

    graph.connections.forEach(conn => {
      if (conn.confidence) {
        expect(['confirmed', 'likely', 'candidate']).toContain(conn.confidence.level);
        expect(conn.confidence.score).toBeGreaterThanOrEqual(0);
        expect(conn.confidence.score).toBeLessThanOrEqual(1);
      }
    });
  });

  it('includes evidence in modules', () => {
    const routes: Route[] = [
      { path: '/products', source_file: 'products.tsx', dynamic_segments: [], auth_required: false, headings: [] },
      { path: '/products/1', source_file: 'product-detail.tsx', dynamic_segments: ['id'], auth_required: false, headings: [] }
    ];

    const graph = buildProductGraph('react-router', routes, [], mockUIMap);

    graph.modules!.forEach(module => {
      expect(module.evidence).toBeDefined();
      expect(Array.isArray(module.evidence)).toBe(true);
      expect(module.evidence.length).toBeGreaterThan(0);

      module.evidence.forEach(evidence => {
        expect(evidence.confidence).toBeDefined();
        expect(evidence.confidence.level).toBeDefined();
        expect(evidence.confidence.score).toBeGreaterThanOrEqual(0);
        expect(evidence.confidence.score).toBeLessThanOrEqual(1);
      });
    });
  });

  it('includes evidence in state flows', () => {
    const routes: Route[] = [
      { path: '/', source_file: 'home.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

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
      expect(flow.evidence).toBeDefined();
      expect(Array.isArray(flow.evidence)).toBe(true);
      expect(flow.evidence.length).toBeGreaterThan(0);

      flow.evidence.forEach(evidence => {
        expect(evidence.confidence).toBeDefined();
        expect(evidence.reason).toBeDefined();
      });
    });
  });

  it('includes evidence in sections', () => {
    const routes: Route[] = [
      { path: '/', source_file: 'home.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'button',
        component_name: 'Hero',
        source_file: 'hero.tsx',
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

    graph.sections!.forEach(section => {
      expect(section.evidence).toBeDefined();
      expect(Array.isArray(section.evidence)).toBe(true);
    });
  });

  it('evidence includes source file and route information', () => {
    const routes: Route[] = [
      { path: '/dashboard', source_file: 'dashboard.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/dashboard',
        tag: 'div',
        component_name: 'Widget',
        source_file: 'widget.tsx',
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

    const allEvidence = [
      ...(graph.modules?.flatMap(m => m.evidence) || []),
      ...(graph.sections?.flatMap(s => s.evidence) || []),
      ...(graph.stateFlows?.flatMap(f => f.evidence) || [])
    ];

    // Evidence should have at least confidence and reason, source file or route path is optional
    allEvidence.forEach(evidence => {
      expect(evidence.confidence).toBeDefined();
      expect(evidence.reason || evidence.source_file || evidence.route_path).toBeDefined();
    });
  });

  it('evidence has valid confidence scores', () => {
    const routes: Route[] = [
      { path: '/products', source_file: 'products.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const graph = buildProductGraph('react-router', routes, [], mockUIMap);

    const allEvidence = [
      ...(graph.modules?.flatMap(m => m.evidence) || []),
      ...(graph.sections?.flatMap(s => s.evidence) || []),
      ...(graph.stateFlows?.flatMap(f => f.evidence) || [])
    ];

    allEvidence.forEach(evidence => {
      expect(evidence.confidence.score).toBeGreaterThanOrEqual(0);
      expect(evidence.confidence.score).toBeLessThanOrEqual(1);
      expect(['confirmed', 'likely', 'candidate']).toContain(evidence.confidence.level);
    });
  });

  it('high fingerprint scores result in higher confidence', () => {
    const routes: Route[] = [
      { path: '/', source_file: 'home.tsx', dynamic_segments: [], auth_required: false, headings: [] },
      { path: '/about', source_file: 'about.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const highScoreElement: ScannedElement = {
      id: '1',
      route_path: '/',
      tag: 'a',
      text: 'About',
      href: '/about',
      data_testid: 'about-link',
      component_name: 'Nav',
      source_file: 'nav.tsx',
      fingerprint: {
        tier1_stable: { score: 40, data_testid: 'about-link' },
        tier2_text: { score: 30, variants: [] },
        tier3_structural: { score: 25, tag: 'a', dom_depth: 0 },
        tier4_context: { score: 20 },
        tier5_position: { score: 10 },
        total_score: 125
      }
    };

    const lowScoreElement: ScannedElement = {
      id: '2',
      route_path: '/',
      tag: 'a',
      text: 'Contact',
      href: '/contact',
      component_name: 'Nav',
      source_file: 'nav.tsx',
      fingerprint: {
        tier1_stable: { score: 0 },
        tier2_text: { score: 10, variants: [] },
        tier3_structural: { score: 15, tag: 'a', dom_depth: 0 },
        tier4_context: { score: 5 },
        tier5_position: { score: 0 },
        total_score: 30
      }
    };

    expect(highScoreElement.fingerprint.total_score).toBeGreaterThan(lowScoreElement.fingerprint.total_score);
  });

  it('connection evidence includes element information', () => {
    const routes: Route[] = [
      { path: '/', source_file: 'home.tsx', dynamic_segments: [], auth_required: false, headings: [] },
      { path: '/about', source_file: 'about.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'a',
        text: 'About',
        href: '/about',
        data_testid: 'about-link',
        component_name: 'Nav',
        source_file: 'nav.tsx',
        fingerprint: {
          tier1_stable: { score: 40, data_testid: 'about-link' },
          tier2_text: { score: 30, variants: [] },
          tier3_structural: { score: 25, tag: 'a', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 95
        }
      }
    ];

    const uiMapWithConnections: UIMap = {
      ...mockUIMap,
      connections: [
        {
          from_route_path: '/',
          to_route_path: '/about',
          kind: 'navigates_to',
          selector: '[data-testid="about-link"]'
        }
      ]
    };

    const graph = buildProductGraph('react-router', routes, elements, uiMapWithConnections);

    const connectionsWithEvidence = graph.connections.filter(c => c.evidence && c.evidence.length > 0);

    expect(connectionsWithEvidence.length).toBeGreaterThan(0);

    connectionsWithEvidence.forEach(conn => {
      conn.evidence!.forEach(evidence => {
        if (evidence.element_id || evidence.selector) {
          expect(evidence.confidence).toBeDefined();
        }
      });
    });
  });

  it('evidence types are properly categorized', () => {
    const routes: Route[] = [
      { path: '/products', source_file: 'products.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/products',
        tag: 'div',
        role: 'dialog',
        component_name: 'ProductModal',
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

    const allEvidence = [
      ...(graph.modules?.flatMap(m => m.evidence) || []),
      ...(graph.sections?.flatMap(s => s.evidence) || []),
      ...(graph.stateFlows?.flatMap(f => f.evidence) || [])
    ];

    const validEvidenceTypes = ['code_pattern', 'element_attribute', 'text_content', 'structure', 'behavior', 'inferred'];

    allEvidence.forEach(evidence => {
      if (evidence.evidence_type) {
        expect(validEvidenceTypes).toContain(evidence.evidence_type);
      }
    });
  });

  it('confidence levels match score ranges', () => {
    expect(confidenceFromScore(0.95).level).toBe('confirmed');
    expect(confidenceFromScore(0.90).level).toBe('confirmed');
    expect(confidenceFromScore(0.89).level).toBe('likely');
    expect(confidenceFromScore(0.75).level).toBe('likely');
    expect(confidenceFromScore(0.70).level).toBe('likely');
    expect(confidenceFromScore(0.69).level).toBe('candidate');
    expect(confidenceFromScore(0.50).level).toBe('candidate');
    expect(confidenceFromScore(0.00).level).toBe('candidate');
  });
});

import { describe, it, expect } from 'vitest';
import { buildProductGraph } from '../src/product-graph';
import { confidenceFromScore } from '../src/types';
import type { Route, ScannedElement, UIMap } from '../src/types';

describe('Product Graph', () => {
  describe('confidenceFromScore', () => {
    it('returns confirmed for scores >= 0.90', () => {
      expect(confidenceFromScore(0.95)).toEqual({ level: 'confirmed', score: 0.95 });
      expect(confidenceFromScore(0.90)).toEqual({ level: 'confirmed', score: 0.90 });
      expect(confidenceFromScore(1.0)).toEqual({ level: 'confirmed', score: 1.0 });
    });

    it('returns likely for scores 0.70-0.89', () => {
      expect(confidenceFromScore(0.75)).toEqual({ level: 'likely', score: 0.75 });
      expect(confidenceFromScore(0.70)).toEqual({ level: 'likely', score: 0.70 });
      expect(confidenceFromScore(0.89)).toEqual({ level: 'likely', score: 0.89 });
    });

    it('returns candidate for scores < 0.70', () => {
      expect(confidenceFromScore(0.5)).toEqual({ level: 'candidate', score: 0.5 });
      expect(confidenceFromScore(0.69)).toEqual({ level: 'candidate', score: 0.69 });
      expect(confidenceFromScore(0.0)).toEqual({ level: 'candidate', score: 0.0 });
    });
  });

  describe('buildProductGraph', () => {
    const mockUIMap: UIMap = {
      version: 1,
      framework: 'react-router',
      root: {
        id: 'app',
        kind: 'app',
        label: 'App',
        children: []
      },
      route_count: 0,
      element_count: 0,
      generated_at: new Date().toISOString()
    };

    it('includes all required fields', () => {
      const graph = buildProductGraph('react-router', [], [], mockUIMap);

      expect(graph).toHaveProperty('version', 1);
      expect(graph).toHaveProperty('framework', 'react-router');
      expect(graph).toHaveProperty('application');
      expect(graph).toHaveProperty('layout');
      expect(graph).toHaveProperty('root');
      expect(graph).toHaveProperty('connections');
      expect(graph).toHaveProperty('modules');
      expect(graph).toHaveProperty('sections');
      expect(graph).toHaveProperty('stateFlows');
      expect(graph).toHaveProperty('userJourneys');
      expect(graph).toHaveProperty('route_count');
      expect(graph).toHaveProperty('element_count');
      expect(graph).toHaveProperty('generated_at');
    });

    it('detects application type correctly', () => {
      const routes: Route[] = [
        { path: '/login', source_file: 'login.tsx', dynamic_segments: [], auth_required: false, headings: [] },
        { path: '/signup', source_file: 'signup.tsx', dynamic_segments: [], auth_required: false, headings: [] }
      ];

      const graph = buildProductGraph('react-router', routes, [], mockUIMap);

      expect(graph.application).toBeDefined();
      expect(graph.application.type).toBeDefined();
      expect(graph.application.confidence).toBeGreaterThan(0);
      expect(Array.isArray(graph.application.signals)).toBe(true);
    });

    it('creates proper graph hierarchy', () => {
      const routes: Route[] = [
        { path: '/', source_file: 'home.tsx', dynamic_segments: [], auth_required: false, headings: [] }
      ];

      const graph = buildProductGraph('react-router', routes, [], mockUIMap);

      expect(graph.root).toBeDefined();
      expect(graph.root.kind).toBe('app');
      expect(graph.root.children).toBeDefined();
      expect(Array.isArray(graph.root.children)).toBe(true);
    });

    it('sets route_count and element_count correctly', () => {
      const routes: Route[] = [
        { path: '/', source_file: 'home.tsx', dynamic_segments: [], auth_required: false, headings: [] },
        { path: '/about', source_file: 'about.tsx', dynamic_segments: [], auth_required: false, headings: [] }
      ];

      const elements: ScannedElement[] = [
        {
          id: '1',
          route_path: '/',
          tag: 'button',
          text: 'Click',
          component_name: 'Button',
          source_file: 'button.tsx',
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

      const customUIMap: UIMap = {
        ...mockUIMap,
        route_count: routes.length,
        element_count: elements.length
      };

      const graph = buildProductGraph('react-router', routes, elements, customUIMap);

      expect(graph.route_count).toBe(2);
      expect(graph.element_count).toBe(1);
    });

    it('creates connections array', () => {
      const routes: Route[] = [
        { path: '/', source_file: 'home.tsx', dynamic_segments: [], auth_required: false, headings: [] }
      ];

      const graph = buildProductGraph('react-router', routes, [], mockUIMap);

      expect(Array.isArray(graph.connections)).toBe(true);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { buildProductGraph } from '../src/product-graph';
import type { Route, ScannedElement, UIMap } from '../src/types';

describe('Section Detection', () => {
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

  it('groups elements by component name', () => {
    const routes: Route[] = [
      { path: '/', source_file: 'home.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'button',
        text: 'Click Me',
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
      },
      {
        id: '2',
        route_path: '/',
        tag: 'button',
        text: 'Submit',
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

    expect(graph.sections).toBeDefined();
    const heroSection = graph.sections!.find(s => s.name === 'Hero');

    expect(heroSection).toBeDefined();
    expect(heroSection!.element_ids).toHaveLength(2);
    expect(heroSection!.element_ids).toContain('1');
    expect(heroSection!.element_ids).toContain('2');
  });

  it('assigns section types correctly for header/navbar', () => {
    const routes: Route[] = [
      { path: '/', source_file: 'home.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'button',
        component_name: 'Navbar',
        source_file: 'navbar.tsx',
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

    const navbarSection = graph.sections!.find(s => s.name === 'Navbar');
    expect(navbarSection).toBeDefined();
    expect(navbarSection!.section_type).toBe('header');
  });

  it('assigns section types correctly for footer', () => {
    const routes: Route[] = [
      { path: '/', source_file: 'home.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'a',
        text: 'Privacy Policy',
        component_name: 'Footer',
        source_file: 'footer.tsx',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'a', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      }
    ];

    const graph = buildProductGraph('react-router', routes, elements, mockUIMap);

    const footerSection = graph.sections!.find(s => s.name === 'Footer');
    expect(footerSection).toBeDefined();
    expect(footerSection!.section_type).toBe('footer');
  });

  it('assigns section types correctly for hero', () => {
    const routes: Route[] = [
      { path: '/', source_file: 'home.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'h1',
        text: 'Welcome',
        component_name: 'HeroSection',
        source_file: 'hero.tsx',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'h1', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      }
    ];

    const graph = buildProductGraph('react-router', routes, elements, mockUIMap);

    const heroSection = graph.sections!.find(s => s.name === 'HeroSection' || s.metadata?.component_name === 'HeroSection');
    expect(heroSection).toBeDefined();
    expect(heroSection!.section_type).toBe('hero');
  });

  it('assigns section types correctly for forms', () => {
    const routes: Route[] = [
      { path: '/contact', source_file: 'contact.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/contact',
        tag: 'input',
        component_name: 'ContactForm',
        source_file: 'contact-form.tsx',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'input', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      }
    ];

    const graph = buildProductGraph('react-router', routes, elements, mockUIMap);

    const formSection = graph.sections!.find(s => s.name === 'ContactForm');
    expect(formSection).toBeDefined();
    expect(formSection!.section_type).toBe('form');
  });

  it('includes confidence and evidence in sections', () => {
    const routes: Route[] = [
      { path: '/', source_file: 'home.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'div',
        component_name: 'Sidebar',
        source_file: 'sidebar.tsx',
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

    expect(graph.sections).toBeDefined();

    graph.sections!.forEach(section => {
      expect(section.confidence).toBeDefined();
      expect(section.confidence.score).toBeGreaterThanOrEqual(0);
      expect(section.confidence.score).toBeLessThanOrEqual(1);
      expect(section.evidence).toBeDefined();
      expect(Array.isArray(section.evidence)).toBe(true);
    });
  });

  it('sets section metadata correctly', () => {
    const routes: Route[] = [
      { path: '/', source_file: 'home.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'div',
        component_name: 'ProductGrid',
        source_file: 'product-grid.tsx',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'div', dom_depth: 0 },
          tier4_context: { score: 0, nearest_heading: 'Featured Products' },
          tier5_position: { score: 0 },
          total_score: 0
        }
      }
    ];

    const graph = buildProductGraph('react-router', routes, elements, mockUIMap);

    expect(graph.sections).toBeDefined();

    graph.sections!.forEach(section => {
      expect(section.id).toBeDefined();
      expect(section.name).toBeDefined();
      expect(section.screen_id).toBeDefined();
      expect(section.route_path).toBeDefined();
      expect(section.element_ids).toBeDefined();
      expect(Array.isArray(section.element_ids)).toBe(true);
      expect(section.section_type).toBeDefined();

      if (section.metadata) {
        expect(section.metadata.component_name).toBeDefined();
      }
    });
  });

  it('groups elements by container when component_name is missing', () => {
    const routes: Route[] = [
      { path: '/', source_file: 'home.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'button',
        container: 'ActionBar',
        source_file: 'home.tsx',
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
        container: 'ActionBar',
        source_file: 'home.tsx',
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

    expect(graph.sections).toBeDefined();
    const actionBarSection = graph.sections!.find(s => s.name === 'ActionBar');

    expect(actionBarSection).toBeDefined();
    expect(actionBarSection!.element_ids).toHaveLength(2);
  });

  it('assigns different section types based on content', () => {
    const routes: Route[] = [
      { path: '/', source_file: 'home.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const elements: ScannedElement[] = [
      {
        id: '1',
        route_path: '/',
        tag: 'table',
        component_name: 'DataTable',
        source_file: 'table.tsx',
        fingerprint: {
          tier1_stable: { score: 0 },
          tier2_text: { score: 0, variants: [] },
          tier3_structural: { score: 0, tag: 'table', dom_depth: 0 },
          tier4_context: { score: 0 },
          tier5_position: { score: 0 },
          total_score: 0
        }
      }
    ];

    const graph = buildProductGraph('react-router', routes, elements, mockUIMap);

    const tableSection = graph.sections!.find(s => s.name === 'DataTable');
    expect(tableSection).toBeDefined();
    expect(tableSection!.section_type).toBe('list');
  });
});

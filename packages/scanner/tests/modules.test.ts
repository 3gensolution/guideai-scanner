import { describe, it, expect } from 'vitest';
import { buildProductGraph } from '../src/product-graph';
import type { Route, ScannedElement, UIMap } from '../src/types';

describe('Module Detection', () => {
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

  it('detects ecommerce module from cart/checkout/products routes', () => {
    const routes: Route[] = [
      { path: '/products', source_file: 'products.tsx', dynamic_segments: [], auth_required: false, headings: [] },
      { path: '/products/1', source_file: 'product-detail.tsx', dynamic_segments: ['id'], auth_required: false, headings: [] },
      { path: '/cart', source_file: 'cart.tsx', dynamic_segments: [], auth_required: false, headings: [] },
      { path: '/checkout', source_file: 'checkout.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const graph = buildProductGraph('react-router', routes, [], mockUIMap);

    expect(graph.modules).toBeDefined();
    expect(graph.modules!.length).toBeGreaterThan(0);

    const ecommerceModules = graph.modules!.filter(m =>
      m.metadata?.domain_type === 'ecommerce' ||
      m.name.toLowerCase().includes('product') ||
      m.name.toLowerCase().includes('cart') ||
      m.name.toLowerCase().includes('checkout')
    );

    expect(ecommerceModules.length).toBeGreaterThan(0);
  });

  it('detects auth module from login/signup routes', () => {
    const routes: Route[] = [
      { path: '/login', source_file: 'login.tsx', dynamic_segments: [], auth_required: false, headings: [] },
      { path: '/signup', source_file: 'signup.tsx', dynamic_segments: [], auth_required: false, headings: [] },
      { path: '/reset-password', source_file: 'reset-password.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const graph = buildProductGraph('react-router', routes, [], mockUIMap);

    expect(graph.modules).toBeDefined();
    const authModules = graph.modules!.filter(m =>
      m.metadata?.domain_type === 'auth' ||
      m.name.toLowerCase().includes('login') ||
      m.name.toLowerCase().includes('signup')
    );

    expect(authModules.length).toBeGreaterThan(0);
  });

  it('assigns confidence scores to modules', () => {
    const routes: Route[] = [
      { path: '/products', source_file: 'products.tsx', dynamic_segments: [], auth_required: false, headings: [] },
      { path: '/products/1', source_file: 'product-detail.tsx', dynamic_segments: ['id'], auth_required: false, headings: [] }
    ];

    const graph = buildProductGraph('react-router', routes, [], mockUIMap);

    expect(graph.modules).toBeDefined();

    graph.modules!.forEach(module => {
      expect(module.confidence).toBeDefined();
      expect(module.confidence.score).toBeGreaterThanOrEqual(0);
      expect(module.confidence.score).toBeLessThanOrEqual(1);
      expect(['confirmed', 'likely', 'candidate']).toContain(module.confidence.level);
    });
  });

  it('includes evidence in modules', () => {
    const routes: Route[] = [
      { path: '/dashboard', source_file: 'dashboard.tsx', dynamic_segments: [], auth_required: false, headings: [] },
      { path: '/dashboard/analytics', source_file: 'analytics.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const graph = buildProductGraph('react-router', routes, [], mockUIMap);

    expect(graph.modules).toBeDefined();

    graph.modules!.forEach(module => {
      expect(module.evidence).toBeDefined();
      expect(Array.isArray(module.evidence)).toBe(true);
      expect(module.evidence.length).toBeGreaterThan(0);

      module.evidence.forEach(evidence => {
        expect(evidence.confidence).toBeDefined();
        expect(evidence.reason).toBeDefined();
      });
    });
  });

  it('groups routes by path segment into modules', () => {
    const routes: Route[] = [
      { path: '/admin', source_file: 'admin.tsx', dynamic_segments: [], auth_required: true, headings: [] },
      { path: '/admin/users', source_file: 'users.tsx', dynamic_segments: [], auth_required: true, headings: [] },
      { path: '/admin/settings', source_file: 'settings.tsx', dynamic_segments: [], auth_required: true, headings: [] }
    ];

    const graph = buildProductGraph('react-router', routes, [], mockUIMap);

    expect(graph.modules).toBeDefined();

    const adminModule = graph.modules!.find(m =>
      m.name.toLowerCase().includes('admin')
    );

    expect(adminModule).toBeDefined();
    expect(adminModule!.screen_ids.length).toBeGreaterThan(0);
  });

  it('sets module metadata correctly', () => {
    const routes: Route[] = [
      { path: '/dashboard', source_file: 'dashboard.tsx', dynamic_segments: [], auth_required: false, headings: [] },
      { path: '/dashboard/reports', source_file: 'reports.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const graph = buildProductGraph('react-router', routes, [], mockUIMap);

    expect(graph.modules).toBeDefined();

    graph.modules!.forEach(module => {
      expect(module.id).toBeDefined();
      expect(module.name).toBeDefined();
      expect(module.description).toBeDefined();
      expect(module.screen_ids).toBeDefined();
      expect(Array.isArray(module.screen_ids)).toBe(true);

      if (module.metadata?.domain_type) {
        expect(['auth', 'ecommerce', 'admin', 'content', 'communication', 'analytics', 'settings', 'workflow', 'crm', 'dashboard', 'landing_page', 'support'])
          .toContain(module.metadata.domain_type);
      }
    });
  });

  it('detects admin module', () => {
    const routes: Route[] = [
      { path: '/admin', source_file: 'admin.tsx', dynamic_segments: [], auth_required: true, headings: [] },
      { path: '/admin/users', source_file: 'users.tsx', dynamic_segments: [], auth_required: true, headings: [] }
    ];

    const graph = buildProductGraph('react-router', routes, [], mockUIMap);

    expect(graph.modules).toBeDefined();

    const adminModule = graph.modules!.find(m =>
      m.metadata?.domain_type === 'admin' ||
      m.name.toLowerCase().includes('admin')
    );

    expect(adminModule).toBeDefined();
  });

  it('handles single route modules', () => {
    const routes: Route[] = [
      { path: '/profile', source_file: 'profile.tsx', dynamic_segments: [], auth_required: false, headings: [] }
    ];

    const graph = buildProductGraph('react-router', routes, [], mockUIMap);

    expect(graph.modules).toBeDefined();

    const profileModule = graph.modules!.find(m =>
      m.name.toLowerCase().includes('profile')
    );

    expect(profileModule).toBeDefined();
    if (profileModule) {
      expect(profileModule.screen_ids.length).toBeGreaterThanOrEqual(1);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { bestMatchingRoutePath, routePathsMatch } from '../src/route-match';

describe('scanner route-family matching', () => {
  it('matches named dynamic segments with underscores', () => {
    expect(routePathsMatch('/pricing/:pricing_id', '/pricing/price_123')).toBe(true);
  });

  it('matches bracket and brace parameter styles', () => {
    expect(routePathsMatch('/orders/[order_id]', '/orders/42')).toBe(true);
    expect(routePathsMatch('/users/{user_id}', '/users/abc')).toBe(true);
  });

  it('does not confuse sibling route families', () => {
    expect(routePathsMatch('/pricing/:pricing_id', '/products/price_123')).toBe(false);
  });

  it('returns the declared dynamic route instead of falling back to root', () => {
    expect(bestMatchingRoutePath('/pricing/123', [
      { path: '/' },
      { path: '/pricing/:pricing_id' },
      { path: '/pricing' },
    ])).toBe('/pricing/:pricing_id');
  });
});

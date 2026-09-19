import { describe, it, expect } from 'vitest';
import { dropAmbiguousSelectors } from '../src/scanner';
import type { ScannedElement } from '../src/types';

/**
 * buildSourceSelector sees one element at a time, so it cannot tell that a
 * sidebar "Overview" link, a header "Home" link and a logo all reduce to
 * a[href="/"]. The player resolves selectors with querySelector and takes the
 * first match, so a shared selector silently highlights the wrong control.
 */
describe('ambiguous selector removal', () => {
  const element = (
    text: string,
    selector: string | undefined,
    route_path = '/',
  ): ScannedElement =>
    ({
      id: `${text}-${route_path}`,
      route_path,
      tag: 'link',
      text,
      selector,
      fingerprint: { total_score: 70 },
    }) as unknown as ScannedElement;

  it('clears a selector shared by several elements on one route', () => {
    const result = dropAmbiguousSelectors([
      element('Overview', 'a[href="/"]'),
      element('Dashboard', 'a[href="/"]'),
      element('Home', 'a[href="/"]'),
    ]);

    expect(result).toHaveLength(3);
    expect(result.every((el) => el.selector === undefined)).toBe(true);
  });

  it('keeps the elements themselves, so fingerprints can still match them', () => {
    const result = dropAmbiguousSelectors([
      element('Overview', 'a[href="/"]'),
      element('Home', 'a[href="/"]'),
    ]);

    expect(result.map((el) => el.text).sort()).toEqual(['Home', 'Overview']);
    expect(result.every((el) => el.fingerprint.total_score === 70)).toBe(true);
  });

  it('leaves a selector only one element owns', () => {
    const result = dropAmbiguousSelectors([
      element('Overview', 'a[href="/"]'),
      element('Settings', 'a[href="/settings"]'),
      element('Home', 'a[href="/"]'),
    ]);

    const settings = result.find((el) => el.text === 'Settings');
    expect(settings?.selector).toBe('a[href="/settings"]');
  });

  it('does not treat the same selector on two routes as a collision', () => {
    // Only one of these pages is ever on screen, so neither is ambiguous.
    const result = dropAmbiguousSelectors([
      element('Save', 'button[aria-label="Save"]', '/settings'),
      element('Save', 'button[aria-label="Save"]', '/profile'),
    ]);

    expect(result.every((el) => el.selector === 'button[aria-label="Save"]')).toBe(true);
  });

  it('leaves a set with no collisions untouched', () => {
    const input = [
      element('Overview', 'a[href="/"]'),
      element('Settings', 'a[href="/settings"]'),
      element('Unsourced', undefined),
    ];

    expect(dropAmbiguousSelectors(input)).toBe(input);
  });
});

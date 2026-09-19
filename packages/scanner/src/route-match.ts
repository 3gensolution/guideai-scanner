/** Normalize a route without changing dynamic segment names. */
export function normalizeRoutePath(routePath: string): string {
  const path = routePath.split('?')[0].split('#')[0];
  return path.replace(/\/+$/, '') || '/';
}

/** True when a segment represents a route parameter or wildcard. */
export function isDynamicRouteSegment(segment: string): boolean {
  return segment === '*'
    || segment.startsWith(':')
    || (segment.startsWith('[') && segment.endsWith(']'))
    || (segment.startsWith('{') && segment.endsWith('}'));
}

/**
 * Match a concrete path to a declared route family.
 *
 * Both operands may contain parameters because source scanners sometimes
 * compare a file-derived pattern with a router-derived pattern.
 */
export function routePathsMatch(pattern: string, candidate: string): boolean {
  const expected = normalizeRoutePath(pattern).split('/');
  const actual = normalizeRoutePath(candidate).split('/');
  if (expected.length !== actual.length) return false;

  return expected.every((segment, index) => (
    segment === actual[index]
    || isDynamicRouteSegment(segment)
    || isDynamicRouteSegment(actual[index])
  ));
}

/** Prefer the most specific declared route that contains the candidate. */
export function bestMatchingRoutePath(
  candidatePath: string,
  routes: Array<{ path: string }>,
): string {
  const candidate = normalizeRoutePath(candidatePath);
  const matches = routes.filter((route) => routePathsMatch(route.path, candidate));
  if (matches.length > 0) {
    matches.sort((left, right) => routeSpecificity(right.path) - routeSpecificity(left.path));
    return matches[0].path;
  }

  // Components can live below a route entry without declaring their own
  // route. Preserve the previous nearest-prefix fallback for those files.
  let bestRoute = '/';
  let bestScore = -1;
  for (const route of routes) {
    const normalized = normalizeRoutePath(route.path);
    if (candidate === normalized
      || candidate.startsWith(`${normalized}/`)
      || normalized.startsWith(`${candidate}/`)) {
      const score = normalized.split('/').filter(Boolean).length;
      if (score > bestScore) {
        bestScore = score;
        bestRoute = route.path;
      }
    }
  }
  return bestRoute;
}

function routeSpecificity(path: string): number {
  return normalizeRoutePath(path)
    .split('/')
    .filter(Boolean)
    .reduce((score, segment) => score + (isDynamicRouteSegment(segment) ? 1 : 4), 0);
}

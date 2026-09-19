import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { extractCustomRouterRoutes } from '../src/detectors';

function makeProject(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guideai-generality-'));
  for (const [rel, contents] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
  }
  return dir;
}

const created: string[] = [];
const project = (files: Record<string, string>) => {
  const dir = makeProject(files);
  created.push(dir);
  return dir;
};

afterAll(() => created.forEach(d => fs.rmSync(d, { recursive: true, force: true })));

describe('does not invent routes from non-route strings', () => {
  it('ignores filesystem paths, MIME types and API URLs', async () => {
    const dir = project({
      'package.json': JSON.stringify({ dependencies: { react: '^18' } }),
      'src/Utils.tsx': `
        import { Viewer } from './Viewer';
        export function Utils({ file, url, mime, apiPath }) {
          if (file.startsWith('/usr/local')) return <Viewer />;
          if (url.includes('/api/v1/users')) return <Viewer />;
          if (mime === '/image/png') return <Viewer />;
          if (apiPath === '/v1/billing/charge') return <Viewer />;
          return null;
        }`,
      'src/Viewer.tsx': `export function Viewer() { return <div />; }`,
    });
    expect(await extractCustomRouterRoutes(dir)).toEqual([]);
  });

  it('ignores a switch over something that is not the path', async () => {
    const dir = project({
      'package.json': JSON.stringify({ dependencies: { react: '^18' } }),
      'src/Status.tsx': `
        import { Panel } from './Panel';
        export function Status({ mimeType }) {
          switch (mimeType) {
            case '/image/png': return <Panel />;
            case '/application/pdf': return <Panel />;
            default: return null;
          }
        }`,
      'src/Panel.tsx': `export function Panel() { return <div />; }`,
    });
    expect(await extractCustomRouterRoutes(dir)).toEqual([]);
  });
});

describe('works across differing custom-router conventions', () => {
  it('handles window.location.pathname read inline, with any variable name', async () => {
    const dir = project({
      'package.json': JSON.stringify({ dependencies: { react: '^18' } }),
      'src/Main.tsx': `
        import { Inbox } from './Inbox';
        export function Main() {
          const currentScreen = window.location.pathname;
          if (currentScreen === '/inbox') return <Inbox />;
          return null;
        }`,
      'src/Inbox.tsx': `export function Inbox() { return <div />; }`,
    });
    const routes = await extractCustomRouterRoutes(dir);
    expect(routes.map(r => r.path)).toEqual(['/inbox']);
    expect(routes[0].component_name).toBe('Inbox');
  });

  it('handles a hook defined in another module and destructured', async () => {
    const dir = project({
      'package.json': JSON.stringify({ dependencies: { react: '^18' } }),
      'src/nav.ts': `
        export function useLocation() {
          return { current: window.location.hash.replace(/^#/, '') };
        }`,
      'src/Shell.tsx': `
        import { useLocation } from './nav';
        import { Billing } from './Billing';
        export function Shell() {
          const { current } = useLocation();
          switch (current) {
            case '/billing': return <Billing />;
            default: return null;
          }
        }`,
      'src/Billing.tsx': `export function Billing() { return <div />; }`,
    });
    expect((await extractCustomRouterRoutes(dir)).map(r => r.path)).toEqual(['/billing']);
  });

  it('derives a dynamic segment from a prefix match only', async () => {
    const dir = project({
      'package.json': JSON.stringify({ dependencies: { react: '^18' } }),
      'src/App.tsx': `
        import { Detail } from './Detail';
        import { List } from './List';
        export function App() {
          const route = window.location.pathname;
          if (route.startsWith('/tickets/')) return <Detail />;
          if (route === '/tickets') return <List />;
          return null;
        }`,
      'src/Detail.tsx': `export function Detail() { return <div />; }`,
      'src/List.tsx': `export function List() { return <div />; }`,
    });
    const routes = await extractCustomRouterRoutes(dir);
    const paths = routes.map(r => r.path).sort();
    expect(paths).toEqual(['/tickets', '/tickets/:id']);
    expect(routes.find(r => r.path === '/tickets')!.dynamic_segments).toEqual([]);
    expect(routes.find(r => r.path === '/tickets/:id')!.dynamic_segments).toEqual(['id']);
  });
});

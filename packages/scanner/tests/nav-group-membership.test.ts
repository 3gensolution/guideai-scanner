import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { extractElements } from '../src/extractors';

/**
 * Nav items declared in a config array carry no trace of the JSX that renders
 * them, so the JSX-walking hidden-container detection never reaches them. A
 * sidebar link inside a collapsible group was therefore stored as if it were
 * always on screen, and generated guides said "click Guide Pro" without ever
 * saying "open the Content menu" first.
 */
describe('nav config group membership', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.splice(0).map((directory) =>
        rm(directory, { recursive: true, force: true }),
      ),
    );
  });

  async function scanSource(source: string, fileName = 'Sidebar.tsx') {
    const directory = await mkdtemp(join(tmpdir(), 'guideai-nav-'));
    temporaryDirectories.push(directory);
    const filePath = join(directory, fileName);
    await writeFile(filePath, source, 'utf8');
    return extractElements(filePath, '/');
  }

  const linkNamed = (elements: any[], text: string) =>
    elements.find((element) => element.tag === 'link' && element.text === text);

  it('attributes a grouped item to the group that holds it', async () => {
    const elements = await scanSource(`
      const groups = [
        { id: 'content', label: 'Content', items: [
          { id: 'guides', to: '/guides', label: 'Guides' },
          { id: 'guide-pro', to: '/guide-pro', label: 'Guide Pro' },
        ] },
      ];
      export function Sidebar() { return <nav>{groups.length}</nav>; }
    `);

    const guidePro = linkNamed(elements, 'Guide Pro');
    expect(guidePro).toBeDefined();
    expect(guidePro.container).toBe('Content');
    expect(guidePro.container_toggle_label).toBe('Content');
    expect(guidePro.container_kind).toBe('menu');
    expect(guidePro.containerState).toBe('collapsed');
    expect(guidePro.hidden).toBe(true);
  });

  it('leaves a top-level item alone', async () => {
    // The critical negative case: wrongly marking a visible link as hidden
    // makes every guide insert a menu-opening step that does nothing.
    const elements = await scanSource(`
      const nav = [
        { id: 'overview', to: '/overview', label: 'Overview' },
        { id: 'settings', to: '/settings', label: 'Settings' },
      ];
      export function Sidebar() { return <nav>{nav.length}</nav>; }
    `);

    const overview = linkNamed(elements, 'Overview');
    expect(overview).toBeDefined();
    expect(overview.container).toBeUndefined();
    expect(overview.container_kind).toBeUndefined();
    expect(overview.hidden).toBeUndefined();
  });

  it('keeps top-level and grouped items apart in the same config', async () => {
    const elements = await scanSource(`
      const nav = [
        { id: 'overview', to: '/overview', label: 'Overview' },
        { id: 'content', label: 'Content', items: [
          { id: 'guide-pro', to: '/guide-pro', label: 'Guide Pro' },
        ] },
      ];
      export function Sidebar() { return <nav>{nav.length}</nav>; }
    `);

    expect(linkNamed(elements, 'Overview').container).toBeUndefined();
    expect(linkNamed(elements, 'Guide Pro').container).toBe('Content');
  });

  it('reports the nearest group for a nested submenu', async () => {
    const elements = await scanSource(`
      const nav = [
        { label: 'Administration', items: [
          { label: 'Billing', items: [
            { to: '/invoices', label: 'Invoices' },
          ] },
        ] },
      ];
      export function Sidebar() { return <nav>{nav.length}</nav>; }
    `);

    // "Open Billing" is the actionable instruction; Administration is one
    // level further out and does not reveal the item by itself.
    expect(linkNamed(elements, 'Invoices').container).toBe('Billing');
  });

  it('a sibling group cannot claim an item it does not hold', async () => {
    const elements = await scanSource(`
      const nav = [
        { label: 'Content', items: [{ to: '/guides', label: 'Guides' }] },
        { label: 'Automation', items: [{ to: '/workflows', label: 'Workflows' }] },
      ];
      export function Sidebar() { return <nav>{nav.length}</nav>; }
    `);

    expect(linkNamed(elements, 'Guides').container).toBe('Content');
    expect(linkNamed(elements, 'Workflows').container).toBe('Automation');
  });

  it('recognises the other common group shapes', async () => {
    const elements = await scanSource(`
      const nav = [
        { title: 'Reports', children: [{ href: '/daily', label: 'Daily' }] },
        { name: 'Account', dropdown: [{ href: '/profile', text: 'Profile' }] },
        { label: 'More', links: [{ href: '/about', label: 'About' }] },
      ];
      export function Menu() { return <nav>{nav.length}</nav>; }
    `, 'Menu.tsx');

    expect(linkNamed(elements, 'Daily').container).toBe('Reports');
    expect(linkNamed(elements, 'Profile').container).toBe('Account');
    expect(linkNamed(elements, 'About').container).toBe('More');
  });

  it('reads a destination named path/route/url, not just href/to/link', async () => {
    // Apps with a hand-rolled router have no library dictating the key name,
    // and routinely call it `path`. Missing these dropped every sidebar link
    // in such an app, leaving guides with nothing to point at.
    const elements = await scanSource(`
      const nav = [
        { label: 'Ops', items: [
          { id: 'overview', label: 'Overview', path: '/' },
          { id: 'runs', label: 'Runs', route: '/runs' },
          { id: 'docs', label: 'Docs', url: '/docs' },
        ] },
      ];
      export function Sidebar() { return <nav>{nav.length}</nav>; }
    `);

    expect(linkNamed(elements, 'Overview').href).toBe('/');
    expect(linkNamed(elements, 'Runs').href).toBe('/runs');
    expect(linkNamed(elements, 'Docs').href).toBe('/docs');
  });

  it('an explicit link key still wins over a path-like one', async () => {
    // `{ to: '/a', path: '/a/:id' }` describes its link with `to`; the `path`
    // is a pattern, and promoting it would point the guide at a URL template.
    const elements = await scanSource(`
      const nav = [
        { label: 'Ops', items: [
          { id: 'order', label: 'Order', to: '/order', path: '/order/:id' },
        ] },
      ];
      export function Sidebar() { return <nav>{nav.length}</nav>; }
    `);

    expect(linkNamed(elements, 'Order').href).toBe('/order');
  });

  it('a path-like key is ignored when it is not a destination', async () => {
    // `path` also holds asset references, SVG geometry and API endpoints.
    // Treating those as nav links would put junk entries in the sidebar.
    const elements = await scanSource(`
      const nav = [
        { label: 'Logo', path: '/assets/logo.svg' },
        { name: 'arc', path: '/M0 0 L10 10' },
        { title: 'Readme', path: '/docs/readme.md' },
        { label: 'Create', path: '/api/v1/users', method: 'POST' },
      ];
      export function Sidebar() { return <nav>{nav.length}</nav>; }
    `);

    expect(elements.filter((element: any) => element.tag === 'link')).toHaveLength(0);
  });

  it('an unlabelled group does not produce a nameless container', async () => {
    // "Open the '' menu" is worse than no reveal step at all.
    const elements = await scanSource(`
      const nav = [
        { id: 'misc', items: [{ to: '/scratch', label: 'Scratch' }] },
      ];
      export function Sidebar() { return <nav>{nav.length}</nav>; }
    `);

    expect(linkNamed(elements, 'Scratch').container).toBeUndefined();
  });
});

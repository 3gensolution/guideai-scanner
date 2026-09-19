import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { detectFramework, extractCustomRouterRoutes } from '../src/detectors';
import { extractElements } from '../src/extractors';

let fixture: string;

function write(relativePath: string, contents: string): void {
  const full = path.join(fixture, relativePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents);
}

beforeAll(() => {
  fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'guideai-custom-router-'));

  // A React app with a hand-rolled router and no routing library.
  write('package.json', JSON.stringify({
    name: 'custom-router-fixture',
    dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
  }));

  write('src/pages/CrmPages.tsx', `
    export function LeadsPage() {
      return <div><h1>Leads</h1><button onClick={() => {}}>New lead</button></div>;
    }
    export function ContactsPage() {
      return (
        <div>
          <h1>Contacts</h1>
          <button onClick={() => {}}>Add contact</button>
          <input name="search" placeholder="Search contacts" />
        </div>
      );
    }
  `);

  write('src/pages/InvoicePages.tsx', `
    export function InvoiceDetailPage() {
      return <div><h1>Invoice</h1><button onClick={() => {}}>Download</button></div>;
    }
  `);

  // A hand-rolled router hook in its own module, as apps normally ship it.
  write('src/lib/router.ts', `
    import { useState } from 'react';
    export function useRouter() {
      const [path, setPath] = useState(window.location.pathname);
      return { path, navigate: setPath };
    }
  `);

  write('src/App.tsx', `
    import { useRouter } from './lib/router';
    import { LeadsPage, ContactsPage } from './pages/CrmPages';
    import { InvoiceDetailPage } from './pages/InvoicePages';

    function App() {
      const { path } = useRouter();
      if (path === '/crm/leads') return <LeadsPage />;
      if (path === '/crm/contacts') return <ContactsPage />;
      if (path.startsWith('/invoices/')) return <InvoiceDetailPage />;
      return null;
    }
  `);
});

afterAll(() => {
  fs.rmSync(fixture, { recursive: true, force: true });
});

describe('react-spa framework detection', () => {
  it('detects a React app with a custom router as react-spa, not plain-html', async () => {
    expect(await detectFramework(fixture)).toBe('react-spa');
  });

  it('still prefers react-router when the library is present', async () => {
    const withLibrary = fs.mkdtempSync(path.join(os.tmpdir(), 'guideai-rr-'));
    fs.writeFileSync(path.join(withLibrary, 'package.json'), JSON.stringify({
      dependencies: { react: '^18.3.1', 'react-router-dom': '^6.0.0' },
    }));
    expect(await detectFramework(withLibrary)).toBe('react-router');
    fs.rmSync(withLibrary, { recursive: true, force: true });
  });

  it('leaves a project with no React dependency as plain-html', async () => {
    const plain = fs.mkdtempSync(path.join(os.tmpdir(), 'guideai-plain-'));
    fs.writeFileSync(path.join(plain, 'package.json'), JSON.stringify({ dependencies: {} }));
    expect(await detectFramework(plain)).toBe('plain-html');
    fs.rmSync(plain, { recursive: true, force: true });
  });
});

describe('custom router route extraction', () => {
  it('recovers routes from equality comparisons', async () => {
    const routes = await extractCustomRouterRoutes(fixture);
    const paths = routes.map((route) => route.path);
    expect(paths).toContain('/crm/leads');
    expect(paths).toContain('/crm/contacts');
  });

  it('turns a startsWith prefix match into a dynamic segment', async () => {
    const routes = await extractCustomRouterRoutes(fixture);
    const detail = routes.find((route) => route.path === '/invoices/:id');
    expect(detail).toBeDefined();
    expect(detail?.dynamic_segments).toEqual(['id']);
  });

  it('attributes each route to the component that renders it', async () => {
    const routes = await extractCustomRouterRoutes(fixture);
    const leads = routes.find((route) => route.path === '/crm/leads');
    expect(leads?.component_name).toBe('LeadsPage');
    expect(leads?.source_file).toContain('CrmPages.tsx');
  });
});

describe('barrel file element scoping', () => {
  const barrel = () => path.join(fixture, 'src/pages/CrmPages.tsx');

  it('returns only the elements belonging to the scoped component', async () => {
    const leads = await extractElements(barrel(), '/crm/leads', 'LeadsPage');
    const texts = leads.map((element) => element.text ?? '');
    expect(texts.some((text) => text.includes('New lead'))).toBe(true);
    expect(texts.some((text) => text.includes('Add contact'))).toBe(false);
  });

  it('separates sibling components exported from the same file', async () => {
    const contacts = await extractElements(barrel(), '/crm/contacts', 'ContactsPage');
    expect(contacts.every((element) => element.route_path === '/crm/contacts')).toBe(true);
    expect(contacts.some((element) => element.placeholder === 'Search contacts')).toBe(true);
    expect(contacts.some((element) => (element.text ?? '').includes('New lead'))).toBe(false);
  });

  it('returns every element when no scope is requested', async () => {
    const all = await extractElements(barrel(), '/crm');
    const scoped = await extractElements(barrel(), '/crm', 'LeadsPage');
    expect(all.length).toBeGreaterThan(scoped.length);
  });

  it('yields nothing rather than the whole file for an unknown scope', async () => {
    expect(await extractElements(barrel(), '/crm', 'NoSuchPage')).toEqual([]);
  });
});

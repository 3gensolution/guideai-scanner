import { afterEach, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { scan } from '../src/scanner';
import { extractReactRouterRoutes } from '../src/detectors/react-router';

const dirs: string[] = [];
afterEach(async () => { await Promise.all(dirs.splice(0).map(d => rm(d, { recursive: true, force: true }))); });
async function fixture(files: Record<string, string>) {
  const root = await mkdtemp(join(tmpdir(), 'guideai-route-ownership-')); dirs.push(root);
  await mkdir(join(root, 'src'));
  await writeFile(join(root, 'package.json'), JSON.stringify({ dependencies: { react: '*', 'react-router-dom': '*' } }));
  for (const [file, source] of Object.entries(files)) await writeFile(join(root, 'src', file), source);
  return root;
}

it('uses rendered components instead of matching editor filenames to public routes', async () => {
  const root = await fixture({
    'App.tsx': `import {Route} from 'react-router-dom'; import Viewer from './Viewer'; import Editor from './Editor'; export default () => <><Route path="/public/:token" element={<Viewer/>}/><Route path="/workspace/:id" element={<Editor/>}/></>;`,
    'Viewer.tsx': `export default () => <button>Play</button>;`,
    'Editor.tsx': `export default () => <button>Publish</button>;`,
  });
  const result = await scan({ dir: root, dryRun: true });
  expect(result.elements.filter(e => e.text === 'Publish').map(e => e.route_path)).toEqual(['/workspace/:id']);
  expect(result.elements.filter(e => e.text === 'Play').map(e => e.route_path)).toEqual(['/public/:token']);
});

it('resolves relative nested routes across all ancestors', async () => {
  const root = await fixture({ 'App.tsx': `import {Route} from 'react-router-dom'; export default () => <Route path="/work"><Route path="teams"><Route path=":id"/></Route></Route>;` });
  expect((await extractReactRouterRoutes(root)).map(r => r.path)).toEqual(['/work', '/work/teams', '/work/teams/:id']);
});

it('retains conditional tab membership for inline and imported controls', async () => {
  const root = await fixture({
    'App.tsx': `import {Route} from 'react-router-dom'; import Settings from './Settings'; export default () => <Route path="/settings" element={<Settings/>}/>;`,
    'Settings.tsx': `import Panel from './Panel'; export default function Settings() { const tab = 'general'; return <><Tabs activeKey={tab} tabs={[{key:'general',label:'General'}, {key:'ai',label:'AI Provider'}]}/>{tab === 'general' && <button>Save profile</button>}{tab === 'ai' && <Panel/>}</>; }`,
    'Panel.tsx': `export default () => <button>Test connection</button>;`,
  });
  const result = await scan({ dir: root, dryRun: true });
  expect(result.elements.find(e => e.text === 'Save profile')?.tab).toBe('General');
  expect(result.elements.find(e => e.text === 'Test connection')).toMatchObject({ route_path: '/settings', tab: 'AI Provider' });
});

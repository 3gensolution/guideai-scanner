import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { extractElements } from '../src/extractors';

describe('Tab extraction', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.splice(0).map((directory) =>
        rm(directory, { recursive: true, force: true }),
      ),
    );
  });

  async function scanSource(source: string, routePath: string) {
    const directory = await mkdtemp(join(tmpdir(), 'guideai-tabs-'));
    temporaryDirectories.push(directory);
    const filePath = join(directory, 'Page.tsx');
    await writeFile(filePath, source, 'utf8');
    return extractElements(filePath, routePath);
  }

  it('expands statically defined elements rendered through map', async () => {
    const elements = await scanSource(
      `
        export function ProfilePage() {
          const tabs = [
            { key: 'account', label: 'Account' },
            { key: 'security', label: 'Security' },
            { key: 'usage', label: 'Usage' },
          ] as const;
          return (
            <div>
              <h1>Profile</h1>
              {tabs.map((tab) => (
                <button
                  role="tab"
                  id={\`profile-tab-\${tab.key}\`}
                  aria-controls="profile-panel"
                >
                  {tab.label}
                </button>
              ))}
              <div id="profile-panel" role="tabpanel" />
            </div>
          );
        }
      `,
      '/profile',
    );

    const tabs = elements.filter((element) => element.role === 'tab');
    expect(tabs.map((tab) => tab.text)).toEqual(['Account', 'Security', 'Usage']);
    expect(tabs.map((tab) => tab.dom_id)).toEqual([
      'profile-tab-account',
      'profile-tab-security',
      'profile-tab-usage',
    ]);
    expect(new Set(tabs.map((tab) => tab.container)).size).toBe(1);
    expect(tabs.every((tab) => tab.route_path === '/profile')).toBe(true);
  });

  it('expands static tab props at a reusable component call site', async () => {
    const elements = await scanSource(
      `
        import { Tabs } from './Tabs';

        export function SettingsPage() {
          return (
            <main>
              <h1>Settings</h1>
              <Tabs
                activeKey="general"
                onChange={() => undefined}
                tabs={[
                  { key: 'general', label: 'General' },
                  { key: 'sdk', label: 'SDK Installation' },
                  { key: 'integrations', label: 'Integrations' },
                ]}
              />
            </main>
          );
        }
      `,
      '/settings',
    );

    const tabs = elements.filter((element) => element.role === 'tab');
    expect(tabs.map((tab) => tab.text)).toEqual([
      'General',
      'SDK Installation',
      'Integrations',
    ]);
    expect(tabs.every((tab) => tab.route_path === '/settings')).toBe(true);
    expect(tabs.every((tab) => tab.fingerprint.tier2_text.score > 0)).toBe(true);
  });
});

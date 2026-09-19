import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { extractElements } from '../src/extractors';

describe('semantic element context', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.splice(0).map((directory) =>
        rm(directory, { recursive: true, force: true }),
      ),
    );
  });

  async function scanSource(source: string) {
    const directory = await mkdtemp(join(tmpdir(), 'guideai-semantic-'));
    temporaryDirectories.push(directory);
    const filePath = join(directory, 'Pricing.tsx');
    await writeFile(filePath, source, 'utf8');
    return extractElements(filePath, '/pricing/:pricing_id');
  }

  it('captures the target, card, section, action, and stable selector separately', async () => {
    const elements = await scanSource(`
      export function Pricing() {
        return (
          <section aria-label="Deployment">
            <h2>Deployment</h2>
            <div className="card">
              <h3>Production</h3>
              <button data-testid="launch-production">Launch</button>
            </div>
          </section>
        );
      }
    `);

    const launch = elements.find((element) => element.text === 'Launch');
    expect(launch).toMatchObject({
      route_path: '/pricing/:pricing_id',
      accessible_name: 'Launch',
      parent_label: 'Production',
      section_label: 'Deployment',
      action_type: 'click',
      enabled: true,
      selector: '[data-testid="launch-production"]',
    });
    expect(launch?.fingerprint.tier4_context).toMatchObject({
      parent_text: 'Production',
      nearest_heading: 'Deployment',
    });
  });

  it('records disabled controls as ineligible candidates', async () => {
    const elements = await scanSource(`
      export function Pricing() {
        return <button aria-label="Launch production" disabled>Launch</button>;
      }
    `);

    expect(elements[0]).toMatchObject({
      accessible_name: 'Launch production',
      enabled: false,
      selector: 'button[aria-label="Launch production"]',
    });
  });

  it('records the label a ternary shows at rest, not both states joined', async () => {
    const elements = await scanSource(`
      export function Pricing({ pending, open, saving }) {
        return (
          <div>
            <button data-testid="blank">{pending ? 'Creating…' : 'Blank Item'}</button>
            <button data-testid="toggle">{open ? 'Hide details' : 'Show details'}</button>
            <button data-testid="save">{saving ? 'Save changes' : 'Saving...'}</button>
          </div>
        );
      }
    `);

    const byTestId = (id: string) =>
      elements.find((element) => element.selector === `[data-testid="${id}"]`);
    expect(byTestId('blank')?.text).toBe('Blank Item');
    expect(byTestId('toggle')?.text).toBe('Show details');
    expect(byTestId('save')?.text).toBe('Save changes');
  });
});

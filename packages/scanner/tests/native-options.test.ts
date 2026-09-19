import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { extractElements } from '../src/extractors';

describe('native dropdown option extraction', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.splice(0).map((directory) =>
        rm(directory, { recursive: true, force: true }),
      ),
    );
  });

  async function scanSource(fileName: string, source: string) {
    const directory = await mkdtemp(join(tmpdir(), 'guideai-options-'));
    temporaryDirectories.push(directory);
    const filePath = join(directory, fileName);
    await writeFile(filePath, source, 'utf8');
    return extractElements(filePath, '/settings');
  }

  it('extracts JSX option rows as hidden dropdown elements', async () => {
    const elements = await scanSource('Settings.tsx', `
      export function Settings() {
        return (
          <select name="status" aria-label="Status">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        );
      }
    `);

    const options = elements.filter((element) => element.tag === 'option');
    expect(options.map((option) => option.text)).toEqual(['Draft', 'Published', 'Archived']);
    expect(options.every((option) => option.hidden)).toBe(true);
    expect(options.every((option) => option.container === 'Status')).toBe(true);
    expect(options.every((option) => option.role === 'option')).toBe(true);
  });

  it('extracts option rows from plain HTML selects', async () => {
    const elements = await scanSource('settings.html', `
      <select name="status">
        <option>Draft</option>
        <option>Published</option>
      </select>
    `);

    expect(elements.filter((element) => element.tag === 'option')).toMatchObject([
      { text: 'Draft', hidden: true, container: 'select dropdown' },
      { text: 'Published', hidden: true, container: 'select dropdown' },
    ]);
  });
});

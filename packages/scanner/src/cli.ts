#!/usr/bin/env node
import { Command } from 'commander';
import { scan } from './scanner';

const program = new Command();

program
  .name('guideai-scan')
  .description('Scan your project and upload knowledge base to GuideAI')
  .requiredOption('--key <key>', 'Site API key (sk_live_...)')
  .option('--dir <dir>', 'Project root directory', process.cwd())
  .option('--api-url <url>', 'GuideAI API URL', 'https://api.guideai.io')
  .option('--dry-run', 'Output JSON without uploading', false)
  .action(async (opts) => {
    if (!opts.key.startsWith('sk_live_')) {
      console.error('Error: API key must start with sk_live_');
      process.exit(1);
    }

    console.log('GuideAI Scanner starting...');
    console.log(`  Directory: ${opts.dir}`);
    console.log(`  API URL: ${opts.apiUrl}`);

    try {
      const result = await scan({
        key: opts.key,
        dir: opts.dir,
        apiUrl: opts.apiUrl,
        dryRun: opts.dryRun,
      });

      console.log(`\nScan complete in ${result.duration_ms}ms`);
      console.log(`  Framework: ${result.framework}`);
      console.log(`  Routes: ${result.routes.length}`);
      console.log(`  Elements: ${result.elements.length}`);

      if (opts.dryRun) {
        console.log('\n--- Dry Run Output ---');
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.error('Scan failed:', error);
      process.exit(1);
    }
  });

program.parse();

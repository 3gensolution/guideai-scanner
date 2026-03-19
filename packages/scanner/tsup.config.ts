import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      cli: 'src/cli.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    clean: true,
    shims: true,
    banner: ({ format }) => {
      if (format === 'cjs') {
        return { js: '#!/usr/bin/env node' };
      }
      return {};
    },
  },
  {
    entry: {
      'plugins/vite': 'src/plugins/vite.ts',
      'plugins/webpack': 'src/plugins/webpack.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
  },
]);

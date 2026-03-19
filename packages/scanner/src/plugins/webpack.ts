import { scan } from '../scanner';

interface GuideAIWebpackOptions {
  siteId: string;
  apiKey?: string;
  only?: string[];
}

class GuideAIWebpackPlugin {
  private options: GuideAIWebpackOptions;

  constructor(options: GuideAIWebpackOptions) {
    this.options = options;
  }

  apply(compiler: { hooks: { beforeCompile: { tapAsync: (name: string, cb: (params: unknown, done: () => void) => void) => void } } }) {
    compiler.hooks.beforeCompile.tapAsync('GuideAIScanner', async (_params, done) => {
      const { only = ['production'] } = this.options;
      const env = process.env.NODE_ENV || 'development';

      if (!only.includes(env)) {
        done();
        return;
      }

      const apiKey = this.options.apiKey || process.env.GUIDEAI_API_KEY;
      if (!apiKey) {
        console.warn('[GuideAI] No API key found.');
        done();
        return;
      }

      console.log('[GuideAI] Scanning project...');
      await scan({ key: apiKey, dir: process.cwd() });
      done();
    });
  }
}

export { GuideAIWebpackPlugin };

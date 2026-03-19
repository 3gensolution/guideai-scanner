import { scan } from '../scanner';

interface GuideAIViteOptions {
  siteId: string;
  apiKey?: string;
  only?: string[];
}

export function guideai(options: GuideAIViteOptions) {
  return {
    name: 'guideai-scanner',
    async buildStart() {
      const { only = ['production'] } = options;
      const env = process.env.NODE_ENV || 'development';

      if (!only.includes(env)) {
        return;
      }

      const apiKey = options.apiKey || process.env.GUIDEAI_API_KEY;
      if (!apiKey) {
        console.warn('[GuideAI] No API key found. Set GUIDEAI_API_KEY or pass apiKey option.');
        return;
      }

      console.log('[GuideAI] Scanning project...');
      await scan({
        key: apiKey,
        dir: process.cwd(),
      });
    },
  };
}

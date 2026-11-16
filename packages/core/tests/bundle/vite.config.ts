import { defineConfig } from 'vite-plus';
import { tiers } from './markers';

// One build per tier, so shared code is not split into chunks and each output is complete.
export default defineConfig({
  pack: Object.keys(tiers).map(tier => ({
    entry: { [tier]: `${tier}.ts` },
    outDir: `dist/${tier}`,
    format: ['esm' as const],
    platform: 'browser' as const,
    dts: false,
    minify: true,
    clean: true,
    deps: { alwaysBundle: [/^@oxform\/core/, /^@tanstack\//] },
  })),
});

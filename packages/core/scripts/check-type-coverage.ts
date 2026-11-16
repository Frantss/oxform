import { checkTypeCoverage } from '../../../scripts/type-coverage.ts';

checkTypeCoverage({
  '@oxform/core': 'dist/index.d.ts',
  '@oxform/core/behaviors': 'dist/behaviors.d.ts',
  '@oxform/core/presets': 'dist/presets.d.ts',
  '@oxform/core/adapter': 'dist/adapter.d.ts',
});

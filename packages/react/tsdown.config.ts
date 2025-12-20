import { defineConfig } from 'tsdown';
import base from '../../tsdown.config';

export default defineConfig({
  ...base,
  entry: {
    index: 'export/index.ts',
    store: 'export/store.ts',
  },
});

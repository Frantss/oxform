import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';
import { base } from '../../vite.config';

export default defineConfig({
  ...base,
  plugins: [react()],
});

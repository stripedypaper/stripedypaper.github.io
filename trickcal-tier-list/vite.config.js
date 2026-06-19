import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/trickcal-tier-list/',
  server: {
    port: 8000
  },
  preview: {
    port: 8000
  },
  plugins: [react()]
});

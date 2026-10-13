import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vitest config lives here too (Vitest reads the `test` block from the Vite config).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Legacy Jest suites under legacy/ stay untouched as reference until T5.
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: './src/test/setup.js',
  },
});

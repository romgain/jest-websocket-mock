import nodePolyfills from 'vite-plugin-node-stdlib-browser';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [nodePolyfills()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'jest-websocket-mock',
      fileName: (format) => `index.${format}.js`,
    },
  },
  test: {
    include: ['src/__tests__/**/*.test.{js,ts}'],
  },
});

import { defineConfig } from 'vitest/config';
import nodePolyfills from 'vite-plugin-node-stdlib-browser';

export default defineConfig({
  plugins: [nodePolyfills()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'jest-websocket-mock',
    },
  },
  test: {
    include: ['src/__tests__/**/*.test.{js,ts}'],
  },
});

import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['tests/setup.js'],
      globals: true,
      include: ['tests/unit/**/*.test.js'],
      css: true
    }
  })
);

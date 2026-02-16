import { defineConfig } from 'vite';
import { resolve } from 'path';

const discoDistEntry = `/@fs${resolve(__dirname, '../dist/discoui.mjs').replace(/\\/g, '/')}`;

const cssInlinePlugin = () => ({
  name: 'css-inline',
  enforce: 'pre',
  async resolveId(source, importer) {
    if (!importer) return null;
    if ((source.endsWith('.scss') || source.endsWith('.css')) && !source.includes('?inline')) {
      const resolved = await this.resolve(`${source}?inline`, importer, { skipSelf: true });
      return resolved?.id ?? `${source}?inline`;
    }
    return null;
  }
});

export default defineConfig({
  plugins: [cssInlinePlugin()],
  root: './',
  base: './',
  define: {
    __DISCOUI_DIST_ENTRY__: JSON.stringify(discoDistEntry)
  },
  resolve: {
    alias: {
      DiscoUI: resolve(__dirname, '../src/index.js')
    }
  },
  server: {
    port: 3001,
    strictPort: true,
    open: '/index.html',
    fs: {
      allow: [resolve(__dirname, '..')]
    }
  },
  build: {
    outDir: '../dist/examples',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        example: resolve(__dirname, 'example.html'),
        stressScroll: resolve(__dirname, 'stress-scroll.html'),
        stressNativeScroll: resolve(__dirname, 'stress-native-scroll.html')
      }
    }
  }
});

import { defineConfig } from 'vite';
import path from 'path';

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
  server: {
    port: 3000,
    open: '/examples/index.html'
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      formats: ['es'],
      fileName: 'index'
    },
    outDir: 'dist',
    sourcemap: true
  }
});

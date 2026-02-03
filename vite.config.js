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

const examplesDistAliasPlugin = () => {
  let isServe = false;
  return {
    name: 'examples-dist-alias',
    enforce: 'pre',
    configResolved(config) {
      isServe = config.command === 'serve';
    },
    resolveId(source, importer) {
      if (!isServe || !importer) return null;
      if (source === './dist/index.js' && importer.endsWith('/examples/index.js')) {
        return path.resolve(__dirname, 'src/index.js');
      }
      return null;
    }
  };
};

export default defineConfig({
  plugins: [cssInlinePlugin(), examplesDistAliasPlugin()],
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

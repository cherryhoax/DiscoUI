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
    transformIndexHtml(html) {
      if (!isServe) return html;
      return html.replace('./dist/discoui.css', '/src/preload.scss');
    },
    resolveId(source, importer) {
      if (!isServe || !importer) return null;
      if (source === './dist/index.js' && importer.endsWith('/examples/index.js')) {
        return path.resolve(__dirname, 'src/index.js');
      }
      if (source === './dist/discoui.mjs' && importer.endsWith('/examples/index.js')) {
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
    rollupOptions: {
      input: {
        discoui: path.resolve(__dirname, 'src/index.js'),
        'discoui.preload': path.resolve(__dirname, 'src/preload.scss')
      }
    },
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      formats: ['es'],
      fileName: 'discoui'
    },
    outDir: 'dist',
    sourcemap: true
  }
});

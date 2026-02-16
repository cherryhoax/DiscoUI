import * as esbuild from 'esbuild-wasm';
import esbuildWasmUrl from 'esbuild-wasm/esbuild.wasm?url';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// AMOLED Black Theme for CodeMirror
const amoledBlackTheme = EditorView.theme({
  '&': {
    backgroundColor: '#000000',
    color: '#e0e0e0'
  },
  '.cm-content': {
    caretColor: '#00ff00'
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#00ff00'
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#003300'
  },
  '.cm-activeLine': {
    backgroundColor: '#0a0a0a'
  },
  '.cm-gutters': {
    backgroundColor: '#000000',
    color: '#555',
    border: 'none'
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#0a0a0a'
  }
}, { dark: true });

const amoledBlackHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#00d4aa' },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: '#e06c75' },
  { tag: [t.function(t.variableName), t.labelName], color: '#61afef' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#d19a66' },
  { tag: [t.definition(t.name), t.separator], color: '#abb2bf' },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#e5c07b' },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#56b6c2' },
  { tag: [t.meta, t.comment], color: '#5c6370' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#56b6c2', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#e06c75' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#d19a66' },
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#98c379' },
  { tag: t.invalid, color: '#ff0000' },
]);

// DiscoUI autocompletion
const discoUICompletions = (context) => {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  
  const completions = [
    { label: 'DiscoApp', type: 'class', info: 'Main application class' },
    { label: 'DiscoFrame', type: 'class', info: 'Navigation frame component' },
    { label: 'DiscoSinglePage', type: 'class', info: 'Single page component' },
    { label: 'DiscoPage', type: 'class', info: 'Page component' },
    { label: 'DiscoButton', type: 'class', info: 'Button component' },
    { label: 'DiscoCheckbox', type: 'class', info: 'Checkbox component' },
    { label: 'DiscoProgressBar', type: 'class', info: 'Progress bar component' },
    { label: 'DiscoComboBox', type: 'class', info: 'Combo box component' },
    { label: 'DiscoComboBoxItem', type: 'class', info: 'Combo box item' },
    { label: 'DiscoScrollView', type: 'class', info: 'Scroll view component' },
    { label: 'DiscoPivot', type: 'class', info: 'Pivot navigation component' },
    { label: 'DiscoDatePicker', type: 'class', info: 'Date picker component' },
    { label: 'DiscoTimePicker', type: 'class', info: 'Time picker component' },
    { label: 'DiscoTimeSpanPicker', type: 'class', info: 'Time span picker component' },
    { label: 'DiscoHub', type: 'class', info: 'Hub navigation component' },
    { label: 'DiscoList', type: 'class', info: 'List view component' },
    { label: 'DiscoAppBar', type: 'class', info: 'App bar component' },
    { label: 'DiscoAppBarIconButton', type: 'class', info: 'App bar icon button' },
    { label: 'DiscoAppBarMenuItem', type: 'class', info: 'App bar menu item' },
    { label: 'DiscoFlipView', type: 'class', info: 'Flip view component' },
    { label: 'DiscoAnimations', type: 'class', info: 'Animation utilities' },
  ];
  
  return {
    from: word.from,
    options: completions
  };
};

const iframe = document.querySelector('#disco-device iframe');
const device = document.getElementById('disco-device');
const backButton = document.querySelector('#disco-device .back-hit');
const homeButton = document.querySelector('#disco-device .home-hit');
const fullscreenToggle = document.getElementById('fullscreenToggle');
const navItems = document.querySelectorAll('.nav-item');
const codeEditor = document.getElementById('code-editor');
const htmlEditor = document.getElementById('html-editor');
const editorHost = document.getElementById('monacoEditor');
const runBtn = document.getElementById('run-code');
const jsTab = document.getElementById('tab-js');
const htmlTab = document.getElementById('tab-html');
const compileProgressBar = document.getElementById('compileProgressBar');
const consoleOutput = document.getElementById('consoleOutput');
const clearConsoleButton = document.getElementById('clearConsole');
const resizeHandle = document.getElementById('resizeHandle');
const editorConsole = document.getElementById('editorConsole');
const exampleUrl = new URL('./example.html', window.location.href).toString();

// Set default playground code
if (codeEditor) {
  codeEditor.value = `import { DiscoApp, DiscoDatePicker, DiscoTimePicker, DiscoTimeSpanPicker } from 'DiscoUI';

const app = new DiscoApp({
    theme: 'dark',
    accent: '#008a00',
    splash: { mode: 'none' }
});

const frame = document.getElementById('playgroundFrame');
const singlePage = document.getElementById('playgroundSinglePage');

const mount = () => {
    app.launch(frame);

    const actionButton = document.createElement('disco-button');
    actionButton.textContent = 'Playground Button';
    singlePage.appendChild(actionButton);

    frame.navigate(singlePage);
};

DiscoApp.ready(mount)`;
}

if (htmlEditor) {
  htmlEditor.value = `<disco-frame id="playgroundFrame">
  <disco-single-page id="playgroundSinglePage" app-title="PLAYGROUND">
  </disco-single-page>
</disco-frame>`;
}

if (window.self !== window.top) {
  const currentPath = new URL(window.location.href).pathname;
  if (currentPath.endsWith('/index.html') || currentPath === '/') {
    window.location.replace(exampleUrl);
  }
}

let currentMode = 'example';
let wasmCompilerReady = false;
let editorView = null;
let languageConf = new Compartment();
let currentTab = 'html';
const discoDistEntryPath = typeof __DISCOUI_DIST_ENTRY__ === 'string'
  ? __DISCOUI_DIST_ENTRY__
  : '/dist/discoui.mjs';

function ensureDeviceShowsExample() {
  const frameUrl = new URL(iframe.getAttribute('src') || '', window.location.href);
  const hostUrl = new URL(window.location.href);
  if (frameUrl.pathname === hostUrl.pathname) {
    iframe.src = exampleUrl;
  }
}

function setMode(mode) {
  currentMode = mode;
  navItems.forEach((item) => item.classList.remove('active'));

  if (mode === 'playground') {
    initEditor();
    document.body.classList.add('playground-active');
    document.getElementById('nav-playground')?.classList.add('active');
    iframe.src = 'about:blank';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  } else {
    document.body.classList.remove('playground-active');
    document.getElementById('nav-example')?.classList.add('active');
    document.getElementById('nav-discoui')?.classList.add('active');
    iframe.src = exampleUrl;
    iframe.removeAttribute('sandbox');
  }
  resize();
}

function setEditorTab(tab) {
  if (!jsTab || !htmlTab || !editorView) return;
  const isJs = tab === 'js';
  jsTab.classList.toggle('active', isJs);
  htmlTab.classList.toggle('active', !isJs);
  currentTab = tab;
  
  const newDoc = isJs ? codeEditor.value : htmlEditor.value;
  const newLang = isJs ? javascript() : html();
  
  editorView.dispatch({
    changes: { from: 0, to: editorView.state.doc.length, insert: newDoc },
    effects: languageConf.reconfigure(newLang)
  });
}

function initEditor() {
  if (editorView) return;
  if (!editorHost || !codeEditor || !htmlEditor) return;

  const startState = EditorState.create({
    doc: htmlEditor.value,
    extensions: [
      basicSetup,
      languageConf.of(html()),
      amoledBlackTheme,
      syntaxHighlighting(amoledBlackHighlight),
      EditorView.lineWrapping,
      autocompletion({ override: [discoUICompletions] }),
      keymap.of(completionKeymap),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const content = update.state.doc.toString();
          if (currentTab === 'js') {
            codeEditor.value = content;
          } else {
            htmlEditor.value = content;
          }
        }
      })
    ]
  });

  editorView = new EditorView({
    state: startState,
    parent: editorHost
  });

  setEditorTab('html');
}

async function ensureWasmCompiler() {
  if (wasmCompilerReady) return;
  setCompileProgress(10);
  await esbuild.initialize({ wasmURL: esbuildWasmUrl, worker: true });
  wasmCompilerReady = true;
}

function setCompileProgress(value) {
  if (!compileProgressBar) return;
  const bounded = Math.max(0, Math.min(100, value));
  compileProgressBar.style.width = `${bounded}%`;
}

function resetCompileProgress(delay = 350) {
  window.setTimeout(() => setCompileProgress(0), delay);
}

function appendConsoleLine(message, type = 'log') {
  if (!consoleOutput) return;
  const line = document.createElement('div');
  line.className = `console-line ${type}`;
  line.textContent = message;
  consoleOutput.appendChild(line);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

async function validateViaWasm(jsCode, htmlCode) {
  await ensureWasmCompiler();
  setCompileProgress(35);

  const forbidden = ['eval', 'fetch', 'XMLHttpRequest', 'WebSocket', 'localStorage', 'cookie'];
  const combined = `${htmlCode}\n${jsCode}`;
  for (const word of forbidden) {
    if (combined.includes(word)) {
      console.error(`Security violation: ${word} is forbidden in playground.`);
      return false;
    }
  }

  try {
    await esbuild.transform(jsCode, {
      loader: 'js',
      format: 'esm',
      minify: false,
      sourcemap: false,
      target: 'es2020'
    });
    return true;
  } catch (error) {
    console.error('WASM compile validation failed:', error);
    appendConsoleLine(`Validation Error: ${error?.message || String(error)}`, 'error');
    return false;
  }
}

async function compileViaWasm(jsCode) {
  await ensureWasmCompiler();
  setCompileProgress(55);
  const discoModuleUrl = new URL(discoDistEntryPath, window.location.origin).toString();

  const httpPlugin = {
    name: 'http-bundle-loader',
    setup(build) {
      build.onResolve({ filter: /^DiscoUI$/ }, () => ({ path: discoModuleUrl, namespace: 'http-url' }));

      build.onResolve({ filter: /^https?:\/\// }, (args) => ({
        path: args.path,
        namespace: 'http-url'
      }));

      build.onResolve({ filter: /^\// }, (args) => ({
        path: new URL(args.path, window.location.origin).toString(),
        namespace: 'http-url'
      }));

      build.onResolve({ filter: /^\.\.?\//, namespace: 'http-url' }, (args) => ({
        path: new URL(args.path, args.importer).toString(),
        namespace: 'http-url'
      }));

      build.onLoad({ filter: /.*/, namespace: 'http-url' }, async (args) => {
        const response = await fetch(args.path);
        if (!response.ok) {
          throw new Error(`Failed to fetch module: ${args.path}`);
        }
        const contents = await response.text();
        const cleanPath = args.path.split('?')[0];
        const extension = cleanPath.slice(cleanPath.lastIndexOf('.') + 1).toLowerCase();
        const loader = extension === 'mjs' ? 'js' : extension;
        return { contents, loader: ['js', 'ts', 'tsx', 'jsx', 'css', 'json'].includes(loader) ? loader : 'js' };
      });
    }
  };

  const result = await esbuild.build({
    stdin: {
      contents: jsCode,
      sourcefile: 'playground-entry.js',
      loader: 'js',
      resolveDir: window.location.origin
    },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    minify: true,
    sourcemap: 'inline',
    target: ['es2020'],
    legalComments: 'none',
    plugins: [httpPlugin]
  });
  setCompileProgress(85);

  const outputFiles = Array.isArray(result.outputFiles) ? result.outputFiles : [];
  const outputFile = outputFiles.find((file) => {
    const path = String(file.path || '').toLowerCase();
    return path.endsWith('.js') || path.includes('stdout');
  }) || outputFiles.find((file) => typeof file.text === 'string' && file.text.length > 0);

  if (!outputFile) {
    const paths = outputFiles.map((file) => String(file.path || '<unknown>')).join(', ');
    throw new Error(`WASM bundler did not produce JS output. outputs=[${paths}]`);
  }

  console.log('Bundled in-browser via WASM (webpack-like) with inline source map and no imports');
  return outputFile.text;
}

function executeInSandbox(bodyHtml, code) {
  const preloadUrl = new URL('../src/preload.scss', window.location.href).toString();
  const baseHref = new URL('./', window.location.href).toString();

  const safeCode = code.replace(/<\/script/gi, '<\\/script');
  const safeBodyHtml = bodyHtml.replace(/<\/script/gi, '<\\/script');

  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.srcdoc = `
<!DOCTYPE html>
<html>
<head>
  <base href="${baseHref}">
  <link rel="stylesheet" href="${preloadUrl}">
  <style>
    body {
      background: #000;
      color: #fff;
      margin: 0;
      padding: 20px;
      font-family: 'Open Sans', system-ui, -apple-system, sans-serif;
    }
    disco-frame {
      display: flex !important;
      width: 100%;
      height: 100%;
      min-height: calc(100vh - 40px);
    }
  </style>
</head>
<body>
  ${safeBodyHtml}
  <script>
    (function () {
      const stringify = (value) => {
        try {
          if (typeof value === 'string') return value;
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      };

      const relay = (type, args) => {
        parent.postMessage({ source: 'disco-playground', type, message: args.map(stringify).join(' ') }, '*');
      };

      const makeProxy = (type, original) => (...args) => {
        relay(type, args);
        return original.apply(console, args);
      };

      console.log = makeProxy('log', console.log.bind(console));
      console.info = makeProxy('info', console.info.bind(console));
      console.warn = makeProxy('warn', console.warn.bind(console));
      console.error = makeProxy('error', console.error.bind(console));

      window.addEventListener('error', (event) => {
        relay('error', [event.message]);
      });

      window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason && event.reason.message ? event.reason.message : event.reason;
        relay('error', ['Unhandled Promise Rejection: ' + reason]);
      });
    })();
  </script>
  <script>${safeCode}</script>
</body>
</html>`;
}

runBtn?.addEventListener('click', async () => {
  setCompileProgress(5);
  appendConsoleLine('Starting compile...', 'info');
  const rawCode = codeEditor?.value || '';
  const rawHtml = htmlEditor?.value || '';

  try {
    const isSafe = await validateViaWasm(rawCode, rawHtml);
    if (!isSafe) {
      alert('WASM: Code validation failed.');
      setCompileProgress(100);
      resetCompileProgress();
      return;
    }

    const compiledCode = await compileViaWasm(rawCode);
    setCompileProgress(95);
    executeInSandbox(rawHtml, compiledCode);
    setCompileProgress(100);
    appendConsoleLine('Compile complete. Executing in sandbox.', 'info');
  } catch (error) {
    appendConsoleLine(`Compile Error: ${error?.message || String(error)}`, 'error');
    setCompileProgress(100);
  } finally {
    resetCompileProgress();
  }
});

clearConsoleButton?.addEventListener('click', () => {
  if (consoleOutput) consoleOutput.textContent = '';
});

window.addEventListener('message', (event) => {
  if (event.source !== iframe.contentWindow) return;
  const payload = event.data;
  if (!payload || payload.source !== 'disco-playground') return;
  const type = payload.type || 'log';
  const message = payload.message || '';
  appendConsoleLine(message, type);
});

document.getElementById('nav-playground')?.addEventListener('click', () => setMode('playground'));
document.getElementById('nav-example')?.addEventListener('click', () => setMode('example'));
document.getElementById('nav-discoui')?.addEventListener('click', () => setMode('example'));
document.getElementById('nav-capacitor')?.addEventListener('click', () => setMode('example'));
jsTab?.addEventListener('click', () => setEditorTab('js'));
htmlTab?.addEventListener('click', () => setEditorTab('html'));

backButton?.addEventListener('click', () => {
  if (currentMode === 'example') {
    iframe.contentWindow?.frame?.goBack?.();
  }
});

homeButton?.addEventListener('click', () => {
  if (currentMode === 'example') {
    const frame = iframe.contentWindow?.frame;
    const homePage = iframe.contentWindow?.homePage;
    if (frame && homePage) frame.navigate(homePage);
  }
});

fullscreenToggle?.addEventListener('click', () => {
  const isFullscreen = document.body.classList.toggle('fullscreen-iframe');
  fullscreenToggle.textContent = isFullscreen ? '⊗ Exit Fullscreen' : '⛶ Fullscreen';
  resize();
});

function resize() {
  if (!device) return;
  const isPlayground = document.body.classList.contains('playground-active');
  const maxWidth = isPlayground ? window.innerWidth * 0.5 : window.innerWidth;
  const scale = Math.min(maxWidth / 600, (window.innerHeight - 80) / 1100, 0.75);

  device.style.transform = `translate(-50%, -50%) scale(${scale})`;
  device.style.top = '50%';
  device.style.left = isPlayground ? '25%' : '50%';
}

// Console resize functionality
let isResizing = false;
let startY = 0;
let startHeight = 0;

resizeHandle?.addEventListener('mousedown', (e) => {
  isResizing = true;
  startY = e.clientY;
  startHeight = editorConsole.offsetHeight;
  document.body.style.cursor = 'ns-resize';
  document.body.style.userSelect = 'none';
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing || !editorConsole) return;
  const deltaY = startY - e.clientY;
  const newHeight = Math.max(40, Math.min(window.innerHeight * 0.6, startHeight + deltaY));
  editorConsole.style.height = `${newHeight}px`;
});

document.addEventListener('mouseup', () => {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
});

window.addEventListener('resize', resize);
ensureDeviceShowsExample();
if (!iframe.getAttribute('src') || iframe.getAttribute('src') === './index.html') {
  iframe.src = exampleUrl;
}
resize();

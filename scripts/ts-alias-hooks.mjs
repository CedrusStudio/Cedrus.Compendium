/**
 * Module hooks that let plain Node run the TypeScript in `scripts/` and `src/`.
 *
 * Two things stand in the way without it:
 *
 * 1. `@/…` is a tsconfig path alias. Node knows nothing about tsconfig, so any
 *    script that reaches into `src/` breaks on the first aliased import — which
 *    is most of them, because the domain modules use the alias internally.
 * 2. `--experimental-strip-types` erases annotations without type information,
 *    so `import { Entity } from '…'` where `Entity` is a type survives into the
 *    output and fails at link time. Running the source through TypeScript's own
 *    transpiler elides those imports the way `tsc` would.
 *
 * Usage:
 *   node --import ./scripts/ts-alias-hooks.mjs scripts/<name>.ts
 */

import { registerHooks, createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const SRC = path.join(ROOT, 'src');
const require = createRequire(import.meta.url);
const ts = require('typescript');

/** `server-only` throws by design; scripts are server code by definition. */
const SERVER_ONLY_STUB = pathToFileURL(path.join(ROOT, 'scripts', 'server-only-stub.mjs')).href;

const EXTENSIONS = ['', '.ts', '.tsx', '.mts', '.js', '.mjs'];

function resolveFile(candidate)
{
  for (const extension of EXTENSIONS) {
    const file = `${candidate}${extension}`;
    try {
      if (fs.statSync(file).isFile()) return file;
    } catch {
      // Not a file; try the next extension.
    }
  }

  for (const indexFile of ['index.ts', 'index.tsx', 'index.js']) {
    const file = path.join(candidate, indexFile);
    try {
      if (fs.statSync(file).isFile()) return file;
    } catch {
      // Not a directory with an index either.
    }
  }

  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'server-only') return { url: SERVER_ONLY_STUB, shortCircuit: true };

    const aliased = specifier.startsWith('@/ui')
      ? path.join(SRC, 'common', 'components', 'ui', specifier.slice('@/ui'.length))
      : specifier.startsWith('@/')
        ? path.join(SRC, specifier.slice(2))
        : null;

    if (aliased !== null) {
      const file = resolveFile(aliased);
      if (file !== null) return { url: pathToFileURL(file).href, shortCircuit: true };
    }

    // Extensionless relative imports are normal in TypeScript and invalid in ESM.
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const file = resolveFile(path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier));
      if (file !== null) return { url: pathToFileURL(file).href, shortCircuit: true };
    }

    return nextResolve(specifier, context);
  },

  load(url, context, nextLoad) {
    if (!url.startsWith('file:') || !/\.tsx?$/.test(url)) return nextLoad(url, context);

    const file = fileURLToPath(url);
    const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      fileName: file,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
        verbatimModuleSyntax: false,
      },
    });

    return { format: 'module', source: outputText, shortCircuit: true };
  },
});

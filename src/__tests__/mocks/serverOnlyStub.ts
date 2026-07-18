/**
 * No-op stand-in for the real `server-only` package, used only inside
 * Vitest (see the `server-only` alias in vitest.config.ts).
 *
 * The real `server-only` package (published by the React/Next.js team)
 * declares a conditional export: under Next.js's `"react-server"` build
 * condition it resolves to an empty module, but under the plain `"default"`
 * condition — which is what Vite/Vitest uses, since they don't set that
 * condition — it resolves to a module that unconditionally throws
 * ("This module cannot be imported from a Client Component module.").
 * That's correct behavior for a real client bundle, but it also fires for
 * every repository/route test that imports a `'use server'` module marked
 * with `import 'server-only'` (e.g. charactersRepository.ts,
 * battlePresetsRepository.ts), which have nothing to do with client
 * components.
 *
 * Aliasing the bare `server-only` specifier to this empty file for the test
 * environment only reproduces the `"react-server"` condition's behavior
 * (a no-op), without touching how Next.js itself resolves the package at
 * build/runtime.
 */
export {};

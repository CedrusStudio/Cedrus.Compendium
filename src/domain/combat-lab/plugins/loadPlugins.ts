/**
 * Idempotently register all built-in plugins into the current context's registry.
 * Called once on the main thread (Combat Lab bootstrap) AND at the top of every
 * Web Worker — each context has its own registry, so both must load.
 */

import { registerPlugin } from "@/domain/combat-lab/plugins/registry";
import { BUILTIN_PLUGINS } from "@/domain/combat-lab/plugins/builtinPlugins";

let loaded = false;

export function loadPlugins(): void
{
  if (loaded) return;
  loaded = true;
  for (const plugin of BUILTIN_PLUGINS)
  {
    registerPlugin(plugin);
  }
}

/**
 * The fixed, ordered list of built-in plugins registered at startup. Order is
 * deterministic (affects scenario/policy ordering and collision detection).
 * Add new in-repo plugins here.
 */

import type { CombatLabPlugin } from "@/domain/combat-lab/plugins/types";
import { lifestealPlugin } from "@/domain/combat-lab/plugins/builtin/lifestealPlugin";

export const BUILTIN_PLUGINS: CombatLabPlugin[] = [
  lifestealPlugin,
];

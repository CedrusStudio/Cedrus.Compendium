/**
 * Combo Analyzer: a directed graph of maneuver sequences observed across many
 * fights. Nodes = maneuvers (with usage counts), edges = "maneuver A was
 * followed by maneuver B by the same combatant" (with frequency). Surfaces the
 * most common chains ("najczęstsze kombinacje").
 *
 * Uses the maneuver/reaction events already in the `CombatLog`. Correlating a
 * combo with fight OUTCOME (most powerful / unprofitable combos) needs per-combo
 * win tracking — future. Pure domain, deterministic.
 */

import type { CombatLog } from "@/domain/combat-lab/engine/CombatLog";

export type ComboNode = { id: string; label: string; count: number };
export type ComboEdge = { id: string; from: string; to: string; count: number };
export type ComboGraph = { nodes: ComboNode[]; edges: ComboEdge[]; fights: number };

export function computeComboGraph(logs: CombatLog[]): ComboGraph
{
  const nodeCounts = new Map<string, number>();
  const edges = new Map<string, ComboEdge>();

  for (const log of logs)
  {
    const lastManeuverByActor = new Map<string, string>();

    for (const event of log.events)
    {
      if (event.kind !== "maneuver" && event.kind !== "reaction") continue;

      const name = event.maneuverName;
      nodeCounts.set(name, (nodeCounts.get(name) ?? 0) + 1);

      const previous = lastManeuverByActor.get(event.actorId);
      if (previous !== undefined)
      {
        const id = `${previous}->${name}`;
        const edge = edges.get(id) ?? { id, from: previous, to: name, count: 0 };
        edge.count += 1;
        edges.set(id, edge);
      }
      lastManeuverByActor.set(event.actorId, name);
    }
  }

  const nodes = [...nodeCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, count]) => ({ id, label: id, count }));

  return { nodes, edges: [...edges.values()], fights: logs.length };
}

/** The most frequent maneuver→maneuver transitions, descending. */
export function topCombos(graph: ComboGraph, limit = 10): ComboEdge[]
{
  return [...graph.edges]
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    .slice(0, limit);
}

/**
 * Reconstruct a scrubbable timeline from a `CombatLog`. Because the log records
 * `remainingHp` on every damaging event and status apply/expire events, replay
 * needs to re-run NOTHING — it just folds the events into one frame per event,
 * each carrying the full combatant view at that moment. This is what powers
 * "przewijanie tura po turze".
 */

import type { CombatLog, CombatEvent } from "@/domain/combat-lab/engine/CombatLog";
import type { StatusId } from "@/domain/combat-lab/effects/Effect";
import { describeEvent } from "@/domain/combat-lab/replay/describeEvent";

export type CombatantView =
{
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  statuses: StatusId[];
};

export type ReplayFrame =
{
  index: number;
  round: number;
  event: CombatEvent;
  label: string;
  combatants: CombatantView[];
};

type MutableView =
{
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  statuses: Set<StatusId>;
};

export function buildReplayFrames(log: CombatLog): ReplayFrame[]
{
  const views = new Map<string, MutableView>();
  const nameOf = (id: string): string => views.get(id)?.name ?? id;

  const frames: ReplayFrame[] = [];
  let round = 0;

  log.events.forEach((event, index) =>
  {
    applyToViews(event, views);
    if (event.kind === "roundStart" || event.kind === "turnStart") round = event.round;

    frames.push({
      index,
      round,
      event,
      label: describeEvent(event, nameOf),
      combatants: snapshotViews(views),
    });
  });

  return frames;
}

function applyToViews(event: CombatEvent, views: Map<string, MutableView>): void
{
  switch (event.kind)
  {
    case "combatStart":
      for (const c of event.combatants)
      {
        views.set(c.id, { id: c.id, name: c.name, hp: c.maxHp, maxHp: c.maxHp, statuses: new Set() });
      }
      break;
    case "attack":
    case "damage":
    case "statusTick":
      setHp(views, event.targetId, event.remainingHp);
      break;
    case "heal":
      setHp(views, event.targetId, event.remainingHp);
      break;
    case "statusApplied":
      views.get(event.targetId)?.statuses.add(event.status);
      break;
    case "statusExpired":
      views.get(event.targetId)?.statuses.delete(event.status);
      break;
    default:
      break;
  }
}

function setHp(views: Map<string, MutableView>, id: string, hp: number): void
{
  const view = views.get(id);
  if (view) view.hp = hp;
}

function snapshotViews(views: Map<string, MutableView>): CombatantView[]
{
  return [...views.values()].map(v => ({
    id: v.id,
    name: v.name,
    hp: v.hp,
    maxHp: v.maxHp,
    statuses: [...v.statuses],
  }));
}

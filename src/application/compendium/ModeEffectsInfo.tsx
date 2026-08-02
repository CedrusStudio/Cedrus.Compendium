"use client";

/**
 * Read-only Combat Lab status of a Stance or State: mapped / to-map /
 * unsupported. Extracted from `StanceView` when States got their own effects
 * editor (ROADMAP 8.9-follow-up) — the two views would otherwise carry the same
 * component twice, and the triage wording has to stay identical between them.
 */

import { Badge } from '@/common/components/ui/badge';
import { type Mode } from "@/domain/characters/combat/Mode";
import { describeManeuver } from "@/domain/combat-lab/effects/describeManeuver";

export default function ModeEffectsInfo({ mode }: { mode: Mode })
{
  const effects = mode.effects ?? [];

  if (mode.simulatable === false)
  {
    return (
      <div className="w-full px-2 text-sm">
        <Badge variant="outline" className="border-amber-500 text-amber-600">Niesymulowalny</Badge>
        {mode.unsupportedReason && <span className="ml-2 text-muted-foreground">{mode.unsupportedReason}</span>}
      </div>
    );
  }

  if (effects.length === 0)
  {
    return (
      <div className="w-full px-2 text-sm text-muted-foreground">
        Efekty: <span className="text-foreground">do zmapowania</span>
      </div>
    );
  }

  // Reuse the maneuver describer with a synthetic definition (a mode has no
  // castTime; supply a placeholder — only `effects` drive the description).
  const description = describeManeuver({ ...mode, effects, castTime: "Standardowa", hardRequirements: [], cost: { castTime: "Standardowa" } });

  return (
    <div className="w-full px-2 text-sm">
      <Badge variant="outline" className="border-emerald-500 text-emerald-600">Zmapowany · {effects.length} efekt(ów)</Badge>
      <div className="mt-1 text-muted-foreground">{description}</div>
    </div>
  );
}

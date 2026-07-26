"use client";

/**
 * Self-contained demo: runs a single deterministic fight between two sample
 * combatants and renders the replay. A seed input lets you scrub different
 * fights. Stands in until the Character picker + persistence land.
 */

import { useMemo, useState } from "react";
import { runCombat } from "@/domain/combat-lab/engine/runCombat";
import { greedyDamagePolicy } from "@/domain/combat-lab/engine/ai/policy";
import { sampleKnight, sampleAssassin } from "@/application/combat-lab/demo/sampleCombatants";
import { CombatReplay } from "@/application/combat-lab/replay/CombatReplay";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";

export function ReplayDemo()
{
  const [seed, setSeed] = useState(2026);

  const log = useMemo(
    () => runCombat(sampleKnight, sampleAssassin, { seed, policyA: greedyDamagePolicy, policyB: greedyDamagePolicy }),
    [seed],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="seed" className="text-sm font-medium">Seed</label>
          <Input
            id="seed"
            type="number"
            value={seed}
            onChange={e => setSeed(Number(e.target.value) || 0)}
            className="w-40"
          />
        </div>
        <Button variant="outline" onClick={() => setSeed(s => s + 1)}>Następna walka</Button>
        <Button variant="outline" onClick={() => setSeed(Math.floor(Math.random() * 1_000_000))}>Losowy seed</Button>
      </div>

      <CombatReplay log={log} />
    </div>
  );
}

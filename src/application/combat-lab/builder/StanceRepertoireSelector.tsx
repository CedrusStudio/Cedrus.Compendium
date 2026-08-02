"use client";

/**
 * Extra stances a combatant may switch INTO during the fight.
 *
 * Changing stance is a move-like action in the rulebook (it costs neither the
 * attack nor a maneuver), but the engine can only offer it when there is
 * somewhere to go — a fighter who brought one stance stands in it all fight.
 * This picker is what fills that repertoire; leaving it empty keeps the old
 * behaviour exactly.
 */

import { useState } from "react";
import { useModeFamilies } from "@/application/combat-lab/hooks/useModeFamilies";
import type { SnapshotMode } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { ModeFamily } from "@/domain/combat-lab/effects/ModeDefinition";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Button } from "@/common/components/ui/button";
import { X } from "lucide-react";

type StanceRepertoireSelectorProps =
{
  /** The starting stance — excluded from the list, it is always reachable. */
  active: SnapshotMode | undefined;
  value: SnapshotMode[];
  onChange: (stances: SnapshotMode[]) => void;
};

export function StanceRepertoireSelector({ active, value, onChange }: StanceRepertoireSelectorProps)
{
  const [search, setSearch] = useState("");
  const { families } = useModeFamilies("stance", search);

  const taken = new Set([...(active ? [active.name] : []), ...value.map((stance) => stance.name)]);
  const shown = families.filter((family) => !taken.has(family.name));

  const add = (family: ModeFamily, grade: number) =>
  {
    onChange([...value, { name: family.name, baseGrade: grade, variantsByGrade: family.variantsByGrade, tags: family.tags }]);
    setSearch("");
  };

  const remove = (name: string) => onChange(value.filter((stance) => stance.name !== name));

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">Postawy do zmiany w walce</Label>

      {value.length === 0
        ? <p className="text-xs text-muted-foreground">Brak — postawa nie będzie zmieniana.</p>
        : (
          <div className="flex flex-wrap gap-1">
            {value.map((stance) => (
              <span key={stance.name} className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
                {stance.name} <span className="text-muted-foreground">r{stance.baseGrade}</span>
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => remove(stance.name)} aria-label={`Usuń ${stance.name} z repertuaru`}>
                  <X className="h-3 w-3" />
                </Button>
              </span>
            ))}
          </div>
        )}

      <Input placeholder="Dodaj postawę…" value={search} onChange={(event) => setSearch(event.target.value)} className="h-8" />

      {search.trim().length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded border">
          {shown.length === 0 && <p className="px-3 py-1.5 text-xs text-muted-foreground">Brak wyników.</p>}
          {shown.map((family) => (
            <button
              key={family.name}
              type="button"
              className="block w-full px-3 py-1 text-left text-sm hover:bg-muted/60"
              onClick={() => add(family, family.grades[0] ?? 1)}
            >
              {family.name} <span className="text-xs text-muted-foreground">(rangi {family.grades.join(", ")})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

/**
 * Pick a starting stance or state (with its grade) from the shared library for a
 * simulated combatant. Families are loaded by name; picking one resolves it to a
 * `SnapshotMode` carrying every rank's effects so a rank-up can swap variants.
 */

import { useState } from "react";
import { useModeFamilies, type ModeKind } from "@/application/combat-lab/hooks/useModeFamilies";
import type { SnapshotMode } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { ModeFamily } from "@/domain/combat-lab/effects/ModeDefinition";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Button } from "@/common/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";

const KIND_LABEL: Record<ModeKind, string> = { stance: "Postawa", state: "Stan" };

export function ModeSelector({ kind, value, onChange }: { kind: ModeKind; value: SnapshotMode | undefined; onChange: (mode: SnapshotMode | undefined) => void })
{
  const [search, setSearch] = useState("");
  const { families } = useModeFamilies(kind, search);

  const toMode = (family: ModeFamily, grade: number): SnapshotMode =>
    ({ name: family.name, baseGrade: grade, variantsByGrade: family.variantsByGrade });

  const current = value ? families.find(f => f.name === value.name) : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{KIND_LABEL[kind]} (na symulację)</Label>

      {value ? (
        <div className="flex items-center gap-2">
          <span className="text-sm">{value.name} <span className="text-muted-foreground">g{value.baseGrade}</span></span>
          {current && current.grades.length > 1 && (
            <Select value={String(value.baseGrade)} onValueChange={(g) => onChange(toMode(current, Number(g)))}>
              <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
              <SelectContent>{current.grades.map(g => <SelectItem key={g} value={String(g)}>ranga {g}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Button variant="ghost" size="sm" onClick={() => onChange(undefined)} aria-label="Usuń tryb">×</Button>
        </div>
      ) : (
        <>
          <Input placeholder={`Szukaj: ${KIND_LABEL[kind].toLowerCase()}…`} value={search} onChange={e => setSearch(e.target.value)} className="h-8" />
          {search.trim().length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded border">
              {families.length === 0 && <p className="px-3 py-1.5 text-xs text-muted-foreground">Brak wyników.</p>}
              {families.map(f => (
                <button
                  key={f.name}
                  type="button"
                  className="block w-full px-3 py-1 text-left text-sm hover:bg-muted/60"
                  onClick={() => onChange(toMode(f, f.grades[0] ?? 1))}
                >
                  {f.name} <span className="text-xs text-muted-foreground">(rangi {f.grades.join(", ")})</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

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
import { Checkbox } from "@/common/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";
import { X } from "lucide-react";

const KIND_LABEL: Record<ModeKind, string> = { stance: "Postawa", state: "Stan" };

export type OwnMode = { name: string; grade: number };

export function ModeSelector({ kind, value, onChange, ownModes }: { kind: ModeKind; value: SnapshotMode | undefined; onChange: (mode: SnapshotMode | undefined) => void; ownModes?: OwnMode[] })
{
  const [search, setSearch] = useState("");
  // When the character has its own stances/states on the sheet, default to
  // showing only those (the whole library is long); a toggle re-expands it.
  const ownByName = new Map((ownModes ?? []).filter(m => m.name).map(m => [m.name, m.grade] as const));
  const hasOwn = ownByName.size > 0;
  const [onlyOwn, setOnlyOwn] = useState(true);
  const { families } = useModeFamilies(kind, search);

  const shownFamilies = onlyOwn && hasOwn ? families.filter(f => ownByName.has(f.name)) : families;

  const toMode = (family: ModeFamily, grade: number): SnapshotMode =>
    ({ name: family.name, baseGrade: grade, variantsByGrade: family.variantsByGrade });

  const current = value ? families.find(f => f.name === value.name) : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{KIND_LABEL[kind]} (na symulację)</Label>

      {value ? (
        <div className="flex items-center gap-2">
          {/* Rank is shown by the "ranga N" select below; only annotate it inline
              for single-rank modes where no select is rendered. */}
          <span className="text-sm">
            {value.name}
            {!(current && current.grades.length > 1) && (
              <span className="text-muted-foreground"> ranga {value.baseGrade}</span>
            )}
          </span>
          {current && current.grades.length > 1 && (
            <Select value={String(value.baseGrade)} onValueChange={(g) => onChange(toMode(current, Number(g)))}>
              <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
              <SelectContent>{current.grades.map(g => <SelectItem key={g} value={String(g)}>ranga {g}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange(undefined)} aria-label="Usuń tryb">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          {hasOwn && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox checked={onlyOwn} onCheckedChange={(c) => setOnlyOwn(c === true)} />
              Tylko z karty postaci
            </label>
          )}
          <Input placeholder={`Szukaj: ${KIND_LABEL[kind].toLowerCase()}…`} value={search} onChange={e => setSearch(e.target.value)} className="h-8" />
          {(search.trim().length > 0 || (onlyOwn && hasOwn)) && (
            <div className="max-h-40 overflow-y-auto rounded border">
              {shownFamilies.length === 0 && <p className="px-3 py-1.5 text-xs text-muted-foreground">Brak wyników.</p>}
              {shownFamilies.map(f => {
                // Suggest the rank the character actually has on their sheet
                // (when it's a valid rank for this family), not just the first available.
                const ownGrade = ownByName.get(f.name);
                const suggestedGrade = ownGrade !== undefined && f.grades.includes(ownGrade) ? ownGrade : (f.grades[0] ?? 1);
                return (
                  <button
                    key={f.name}
                    type="button"
                    className="block w-full px-3 py-1 text-left text-sm hover:bg-muted/60"
                    onClick={() => onChange(toMode(f, suggestedGrade))}
                  >
                    {f.name} <span className="text-xs text-muted-foreground">(rangi {f.grades.join(", ")}{ownGrade !== undefined ? ` · na karcie: ${ownGrade}` : ""})</span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

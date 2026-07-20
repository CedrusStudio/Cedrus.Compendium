"use client";

/**
 * Pick a real character for a simulation: search + select, choose the attack
 * mode, and toggle which of the character's buff profiles are active FOR THIS
 * RUN (per-simulation buffs, point 6). Controlled via `value` / `onChange`.
 */

import { useState } from "react";
import { emptyUlid } from "@/common/global/pagination";
import { useSearchCharactersSummary } from "@/application/characters/hooks/useSearchCharactersSummary";
import { useCharacterById } from "@/application/combat-lab/hooks/useCharacterById";
import {
  createSelection,
  createTempBuff,
  TEMP_BUFF_LABELS,
  type CombatantSelection,
  type TempBuffKind,
} from "@/application/combat-lab/builder/combatantSelection";
import type { AttackKind } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Checkbox } from "@/common/components/ui/checkbox";
import { Label } from "@/common/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";

const ATTACK_KIND_LABELS: Record<AttackKind, string> = {
  melee: "Zwarcie",
  rangedPhysical: "Dystans fizyczny (łuk/kusza)",
  rangedMagic: "Dystans magiczny",
};

export type CombatantPickerProps =
{
  title: string;
  value: CombatantSelection | null;
  onChange: (selection: CombatantSelection | null) => void;
};

export function CombatantPicker({ title, value, onChange }: CombatantPickerProps)
{
  const [search, setSearch] = useState("");
  const [tempKind, setTempKind] = useState<TempBuffKind>("damage");
  const [tempValue, setTempValue] = useState(1);
  const { characters } = useSearchCharactersSummary(search, emptyUlid);
  const { character } = useCharacterById(value?.characterId);

  const toggleBuff = (profileId: string, checked: boolean) =>
  {
    if (!value) return;
    const active = new Set(value.activeBuffProfileIds);
    if (checked) active.add(profileId);
    else active.delete(profileId);
    onChange({ ...value, activeBuffProfileIds: [...active] });
  };

  const addTempBuff = () =>
  {
    if (!value || tempValue === 0) return;
    onChange({ ...value, extraBuffProfiles: [...value.extraBuffProfiles, createTempBuff(tempKind, tempValue)] });
  };

  const removeTempBuff = (id: string) =>
  {
    if (!value) return;
    onChange({ ...value, extraBuffProfiles: value.extraBuffProfiles.filter(p => p.id !== id) });
  };

  return (
    <Card className="flex-1 min-w-[280px]">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!value && (
          <>
            <Input placeholder="Szukaj postaci…" value={search} onChange={e => setSearch(e.target.value)} />
            <div className="max-h-48 overflow-y-auto rounded border">
              {characters.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">Brak wyników.</p>
              )}
              {characters.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted/60"
                  onClick={() => onChange(createSelection(c.id, c.name))}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </>
        )}

        {value && (
          <>
            <div className="flex items-center justify-between">
              <span className="font-medium">{value.characterName}</span>
              <Button variant="ghost" size="sm" onClick={() => onChange(null)}>Zmień</Button>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Rodzaj ataku</Label>
              <Select
                value={value.attackKind}
                onValueChange={(kind) => onChange({ ...value, attackKind: kind as AttackKind })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ATTACK_KIND_LABELS) as AttackKind[]).map(kind => (
                    <SelectItem key={kind} value={kind}>{ATTACK_KIND_LABELS[kind]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {character && character.buffProfiles.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Profile postaci na symulację</Label>
                {character.buffProfiles.map(profile => (
                  <label key={profile.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={value.activeBuffProfileIds.includes(profile.id)}
                      onCheckedChange={(checked) => toggleBuff(profile.id, checked === true)}
                    />
                    {profile.name}
                  </label>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Tymczasowe wzmocnienia (na symulację)</Label>
              {value.extraBuffProfiles.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {value.extraBuffProfiles.map(profile => (
                    <li key={profile.id} className="flex items-center justify-between rounded border px-2 py-1 text-sm">
                      <span>{profile.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeTempBuff(profile.id)} aria-label="Usuń wzmocnienie">×</Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-end gap-2">
                <Select value={tempKind} onValueChange={(k) => setTempKind(k as TempBuffKind)}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TEMP_BUFF_LABELS) as TempBuffKind[]).map(kind => (
                      <SelectItem key={kind} value={kind}>{TEMP_BUFF_LABELS[kind]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  className="w-20"
                  value={tempValue}
                  onChange={e => setTempValue(Number(e.target.value) || 0)}
                  aria-label="Wartość wzmocnienia"
                />
                <Button variant="outline" size="sm" onClick={addTempBuff}>Dodaj</Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

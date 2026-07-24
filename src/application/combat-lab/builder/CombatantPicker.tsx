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
import { usePowerSpecifications } from "@/application/combat-lab/hooks/usePowerSpecifications";
import { ModeSelector } from "@/application/combat-lab/builder/ModeSelector";
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
  const { specifications } = usePowerSpecifications(character);

  // Powers that have castable spells AND a specification offering >1 offense —
  // only these need a PowerOffense choice.
  const spellPowers = (character?.powers ?? []).filter(p =>
    p.spells.length > 0 && (specifications[p.powerSpecificationId]?.offenses.length ?? 0) > 1);

  const setSpellOffense = (powerId: string, index: number) =>
  {
    if (!value) return;
    onChange({ ...value, spellOffenseSelection: { ...value.spellOffenseSelection, [powerId]: index } });
  };

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

            {character && character.offenses.length > 1 && (
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Ofensywa</Label>
                <Select
                  value={value.offenseId ?? character.defaultOffenseId ?? character.offenses[0]?.id}
                  onValueChange={(id) => onChange({ ...value, offenseId: id })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {character.offenses.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.name || "Ofensywa"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {character && character.defenses.length > 1 && (
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Obrona</Label>
                <Select
                  value={value.defenseId ?? character.defaultDefenseId ?? character.defenses[0]?.id}
                  onValueChange={(id) => onChange({ ...value, defenseId: id })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {character.defenses.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name || "Obrona"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {spellPowers.map(power =>
            {
              const spec = specifications[power.powerSpecificationId]!;
              const current = value.spellOffenseSelection?.[power.id] ?? 0;
              return (
                <div key={power.id} className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Ofensywa zaklęć: {power.name}</Label>
                  <Select value={String(current)} onValueChange={(v) => setSpellOffense(power.id, Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {spec.offenses.map((o, i) => (
                        <SelectItem key={i} value={String(i)}>{o.description || `Ofensywa ${i + 1}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}

            <ModeSelector kind="stance" value={value.stance} onChange={(stance) => onChange({ ...value, stance })} />
            <ModeSelector kind="state" value={value.state} onChange={(state) => onChange({ ...value, state })} />

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

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Startowa pula zasobów (na symulację)</Label>
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px] text-muted-foreground">esencja</Label>
                  <Input
                    type="number"
                    className="w-20"
                    value={value.startingResources?.essence ?? ""}
                    onChange={e => onChange({ ...value, startingResources: { ...value.startingResources, essence: e.target.value === "" ? undefined : Math.max(0, Number(e.target.value) || 0) } })}
                    aria-label="Startowa esencja"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px] text-muted-foreground">mana</Label>
                  <Input
                    type="number"
                    className="w-20"
                    value={value.startingResources?.mana ?? ""}
                    onChange={e => onChange({ ...value, startingResources: { ...value.startingResources, mana: e.target.value === "" ? undefined : Math.max(0, Number(e.target.value) || 0) } })}
                    aria-label="Startowa mana"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

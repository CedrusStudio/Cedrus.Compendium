"use client";

/**
 * Single structured-requirement editor (Wave 5, 5.3). Bound to a form path
 * holding one `Requirement` (e.g. "structuredRequirements.0"). A "type" select
 * switches between free text (`rankless`) and the ranked target groups; a local
 * cache remembers each mode's input so toggling never loses data.
 */

import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useRef } from "react";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";
import { SKILLS } from "@/domain/characters/statistics/skills";
import {
  DERIVED_TARGETS,
  ENTITY_GROUP_LABELS,
  ENTITY_REQUIREMENT_GROUPS,
  EQUIPMENT_TARGETS,
  type AnyOfOption,
  type Requirement,
  type RankedRequirement,
  type StatisticTarget,
  type EntityRequirementGroup,
  isDerivedGroup,
  isEquipmentGroup,
  isPowerGroup,
  isStatisticGroup,
} from "@/domain/requirements/Requirement";
import EntityNameCombobox from "@/application/common/requirements/EntityNameCombobox";
import RequirementNumberInput from "@/application/common/requirements/RequirementNumberInput";
import {
  POWER_TYPE_ITEMS,
  REQUIREMENT_TYPE_LABELS,
  REQUIREMENT_TYPE_ORDER,
  type RequirementPickerType,
  buildRequirementForType,
  defaultDraftCache,
  defaultTargetKeyForGroup,
  skillLabel,
  typeOfRequirement,
  updateCache,
} from "@/application/common/requirements/requirementPickerModel";

const DEFAULT_REQUIREMENT: Requirement = { kind: "rankless", text: "" };

export default function RequirementPicker({ name, onRemove }: { name: string; onRemove?: () => void })
{
  const { control, setValue } = useFormContext();
  const current = (useWatch({ control, name }) ?? DEFAULT_REQUIREMENT) as Requirement;

  // Remember each mode's input across type switches (ref, not state — no re-render needed).
  const cacheRef = useRef(defaultDraftCache());
  cacheRef.current = updateCache(cacheRef.current, current);

  const selectedType = typeOfRequirement(current);

  const handleTypeChange = (type: RequirementPickerType) =>
  {
    setValue(name, buildRequirementForType(type, cacheRef.current), { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center gap-2">
        <Select value={selectedType} onValueChange={(t) => handleTypeChange(t as RequirementPickerType)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {REQUIREMENT_TYPE_ORDER.map((t) => <SelectItem key={t} value={t}>{REQUIREMENT_TYPE_LABELS[t]}</SelectItem>)}
          </SelectContent>
        </Select>

        {onRemove && (
          <Button type="button" variant="ghost" size="sm" className="ml-auto" aria-label="Usuń wymaganie" onClick={onRemove}>✕</Button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        {current.kind === "rankless" && (
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Wymaganie (tekst)</Label>
            <Controller
              control={control}
              name={`${name}.text`}
              render={({ field }) => (
                <Input className="w-72" placeholder="np. Zapał Wojownika" value={field.value ?? ""} onChange={field.onChange} />
              )}
            />
          </div>
        )}

        {current.kind === "ranked" && <RankedFields name={name} requirement={current} />}

        {current.kind === "anyOf" && (
          <AnyOfFields
            name={name}
            options={current.options}
            onChange={(options) => setValue(name, { kind: "anyOf", options }, { shouldDirty: true, shouldValidate: true })}
          />
        )}

        {current.kind === "sum" && (
          <SumFields
            name={name}
            requirement={current}
            onChange={(next) => setValue(name, next, { shouldDirty: true, shouldValidate: true })}
          />
        )}

        {current.kind === "count" && (
          <CountFields
            name={name}
            requirement={current}
            onChange={(next) => setValue(name, next, { shouldDirty: true, shouldValidate: true })}
          />
        )}
      </div>
    </div>
  );
}

/** Target + minimum rank for a single `ranked` requirement, bound to form paths. */
function RankedFields({ name, requirement }: { name: string; requirement: RankedRequirement })
{
  const { control } = useFormContext();

  return (
    <>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Cel</Label>
        {isStatisticGroup(requirement.group) ? (
          <Controller
            control={control}
            name={`${name}.targetKey`}
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger className="w-44"><SelectValue placeholder="wybierz" /></SelectTrigger>
                <SelectContent>
                  {SKILLS.filter(([g]) => g === requirement.group).map(([, key, pl]) => (
                    <SelectItem key={key} value={key}>{pl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        ) : isDerivedGroup(requirement.group) || isEquipmentGroup(requirement.group) ? (
          <Controller
            control={control}
            name={`${name}.targetKey`}
            render={({ field }) => {
              const targets = isDerivedGroup(requirement.group) ? DERIVED_TARGETS : EQUIPMENT_TARGETS;
              return (
                // The value must NOT fall back to the first target for display:
                // Radix skips `onValueChange` when you pick what is already
                // selected, so the picker showed „lekka zbroja" while the stored
                // targetKey stayed empty and the save was rejected.
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="wybierz" /></SelectTrigger>
                  <SelectContent>
                    {targets.map((target) => <SelectItem key={target.key} value={target.key}>{target.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              );
            }}
          />
        ) : isPowerGroup(requirement.group) ? (
          <Controller
            control={control}
            name={`${name}.targetKey`}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger className="w-44"><SelectValue placeholder="wybierz" /></SelectTrigger>
                <SelectContent>
                  {POWER_TYPE_ITEMS.map((item) => <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        ) : (
          <Controller
            control={control}
            name={`${name}.targetKey`}
            render={({ field }) => (
              <EntityNameCombobox group={requirement.group as EntityRequirementGroup} value={field.value ?? ""} onChange={field.onChange} />
            )}
          />
        )}
      </div>

      {/* A rank only means something where there IS a scale. „Lekka zbroja" and
          „walka dwiema broniami" are yes/no, so the input was pure noise. */}
      {hasRank(requirement) && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">{rankLabel(requirement)}</Label>
          <Controller
            control={control}
            name={`${name}.value`}
            render={({ field }) => (
              <RequirementNumberInput
                name={`${name}.value`}
                className="w-20 text-center"
                value={field.value ?? 0}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      )}
    </>
  );
}

/** Does this target sit on a scale, or is it a plain yes/no? */
function hasRank(requirement: RankedRequirement): boolean
{
  if (isEquipmentGroup(requirement.group))
  {
    const target = EQUIPMENT_TARGETS.find((entry) => entry.key === requirement.targetKey);
    return Boolean(target?.tierLabels);
  }

  if (isDerivedGroup(requirement.group))
  {
    return !DERIVED_TARGETS.find((entry) => entry.key === requirement.targetKey)?.boolean;
  }

  return true;
}

function rankLabel(requirement: RankedRequirement): string
{
  return isEquipmentGroup(requirement.group) ? "Rozmiar (min.)" : "Ranga (min.)";
}

/**
 * Alternative editor (Wave 7.3). Edits the whole `options` array through one
 * `setValue` instead of per-index form paths — the array is short, and rebuilding
 * it wholesale keeps react-hook-form from holding stale indices when an option
 * is removed.
 */
function AnyOfFields({ name, options, onChange }: { name: string; options: AnyOfOption[]; onChange: (options: AnyOfOption[]) => void })
{
  const replace = (index: number, option: AnyOfOption) =>
    onChange(options.map((existing, i) => (i === index ? option : existing)));

  /** Switching an option's type, preserving the rank where it still applies. */
  const changeType = (index: number, option: AnyOfOption, type: RequirementPickerType) =>
  {
    if (type === "text")
    {
      replace(index, { kind: "rankless", text: "" });
      return;
    }

    const value = option.kind === "rankless" ? 1 : option.value;
    replace(index, { kind: "ranked", group: type as RankedRequirement["group"], targetKey: defaultTargetKeyForGroup(type as RankedRequirement["group"]), value });
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <Label className="text-xs text-muted-foreground">Spełnione, gdy zachodzi którykolwiek z celów</Label>

      {options.map((option, index) => (
        <div key={index} className="flex flex-wrap items-end gap-2">
          <Select
            value={option.kind === "rankless" ? "text" : option.kind === "sum" ? "sum" : option.group}
            onValueChange={(type) => changeType(index, option, type as RequirementPickerType)}
          >
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {/* Free text is offered because the library really writes
                  "Lekka lub średnia zbroja" — neither side is a structured
                  target. Nested composites are not: see `AnyOfOption`. */}
              {/* Composite variants cannot nest inside an alternative — see
                  `AnyOfOption`. „count" was still listed here by mistake and
                  picking it produced `group: "count"`, which is not a target
                  group at all and was rejected on save. */}
              {REQUIREMENT_TYPE_ORDER
                .filter((type) => type !== "anyOf" && type !== "sum" && type !== "count")
                .map((type) => <SelectItem key={type} value={type}>{REQUIREMENT_TYPE_LABELS[type]}</SelectItem>)}
            </SelectContent>
          </Select>

          {option.kind === "rankless" ? (
            <Input
              className="w-64"
              placeholder="np. Lekka zbroja"
              value={option.text}
              onChange={(e) => replace(index, { kind: "rankless", text: e.target.value })}
            />
          ) : option.kind === "sum" ? (
            <span className="text-sm text-muted-foreground">suma cech (edytuj jako osobne wymaganie)</span>
          ) : (
            <>
              {isStatisticGroup(option.group) ? (
                <Select value={option.targetKey} onValueChange={(targetKey) => replace(index, { ...option, targetKey })}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="wybierz" /></SelectTrigger>
                  <SelectContent>
                    {SKILLS.filter(([g]) => g === option.group).map(([, key, pl]) => <SelectItem key={key} value={key}>{pl}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : isPowerGroup(option.group) ? (
                <Select value={option.targetKey} onValueChange={(targetKey) => replace(index, { ...option, targetKey })}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="wybierz" /></SelectTrigger>
                  <SelectContent>
                    {POWER_TYPE_ITEMS.map((item) => <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : isDerivedGroup(option.group) || isEquipmentGroup(option.group) ? (
                // Equipment used to fall through to the entity combobox below,
                // which showed the raw key („armor.lekka") as if it were a name.
                // The value must also NOT fall back to the first target: Radix
                // skips `onValueChange` for an already-selected item, so the row
                // displayed a target it had never actually stored, and the save
                // was rejected for an empty `targetKey`.
                <Select value={option.targetKey} onValueChange={(targetKey) => replace(index, { ...option, targetKey })}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="wybierz" /></SelectTrigger>
                  <SelectContent>
                    {(isDerivedGroup(option.group) ? DERIVED_TARGETS : EQUIPMENT_TARGETS)
                      .map((target) => <SelectItem key={target.key} value={target.key}>{target.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <EntityNameCombobox
                  group={option.group as EntityRequirementGroup}
                  value={option.targetKey}
                  onChange={(targetKey) => replace(index, { ...option, targetKey })}
                />
              )}

              {hasRank(option) && (
                <RequirementNumberInput
                  name={`${name}.options.${index}.value`}
                  className="w-20 text-center"
                  value={option.value}
                  onChange={(value) => replace(index, { ...option, value })}
                />
              )}
            </>
          )}

          {/* Two options are the minimum a meaningful alternative can have. */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={options.length <= 2}
            aria-label="Usuń alternatywę"
            onClick={() => onChange(options.filter((_, i) => i !== index))}
          >
            ✕
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => onChange([...options, { kind: "ranked", group: "powers", targetKey: "wiez", value: 1 }])}
      >
        Dodaj alternatywę
      </Button>
    </div>
  );
}

/**
 * Count editor (Wave 8.1) — "own at least N of a kind". Groups are toggled, the
 * tag and the minimum rank are optional refinements; leaving both empty gives a
 * plain "ilość postaw 4".
 */
function CountFields(
  { name, requirement, onChange }: { name: string; requirement: Extract<Requirement, { kind: "count" }>; onChange: (next: Requirement) => void },
)
{
  const toggleGroup = (group: EntityRequirementGroup) =>
  {
    const next = requirement.groups.includes(group)
      ? requirement.groups.filter((existing) => existing !== group)
      : [...requirement.groups, group];

    // At least one group, otherwise the requirement counts nothing at all.
    if (next.length > 0) onChange({ ...requirement, groups: next });
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <Label className="text-xs text-muted-foreground">Liczy posiadane elementy z zaznaczonych grup</Label>

      <div className="flex flex-wrap gap-1">
        {ENTITY_REQUIREMENT_GROUPS.map((group) => (
          <Button
            key={group}
            type="button"
            size="sm"
            variant={requirement.groups.includes(group) ? "default" : "outline"}
            aria-pressed={requirement.groups.includes(group)}
            onClick={() => toggleGroup(group)}
          >
            {ENTITY_GROUP_LABELS[group]}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Tag (opcjonalnie)</Label>
          <Input
            className="w-44"
            placeholder="np. widmowy"
            value={requirement.tag ?? ""}
            onChange={(e) => onChange({ ...requirement, tag: e.target.value === "" ? undefined : e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Ranga ≥ (opcjonalnie)</Label>
          <Input
            type="number"
            className="w-24 text-center"
            value={requirement.minGrade ?? ""}
            onChange={(e) => onChange({ ...requirement, minGrade: e.target.value === "" ? undefined : Number(e.target.value) })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Co najmniej</Label>
          <RequirementNumberInput
            name={`${name}.value`}
            className="w-20 text-center"
            value={requirement.value}
            onChange={(value) => onChange({ ...requirement, value })}
          />
        </div>
      </div>
    </div>
  );
}

/** Additive requirement editor (Wave 7.4) — statistics only, `≥` only. */
function SumFields(
  { name, requirement, onChange }: { name: string; requirement: Extract<Requirement, { kind: "sum" }>; onChange: (next: Requirement) => void },
)
{
  const setTargets = (targets: StatisticTarget[]) => onChange({ ...requirement, targets });

  return (
    <div className="flex w-full flex-col gap-2">
      <Label className="text-xs text-muted-foreground">Suma wartości testowych musi wynosić co najmniej…</Label>

      {requirement.targets.map((target, index) => (
        <div key={index} className="flex flex-wrap items-end gap-2">
          <Select
            value={`${target.group}:${target.targetKey}`}
            onValueChange={(composite) => {
              const [group, targetKey] = composite.split(":") as [StatisticTarget["group"], string];
              setTargets(requirement.targets.map((item, i) => (i === index ? { group, targetKey } : item)));
            }}
          >
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SKILLS.map(([group, key]) => (
                <SelectItem key={`${group}:${key}`} value={`${group}:${key}`}>{skillLabel(key)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={requirement.targets.length <= 2}
            aria-label="Usuń cechę z sumy"
            onClick={() => setTargets(requirement.targets.filter((_, i) => i !== index))}
          >
            ✕
          </Button>
        </div>
      ))}

      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setTargets([...requirement.targets, { group: "characteristics", targetKey: "strength" }])}
        >
          Dodaj cechę
        </Button>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Suma ≥</Label>
          <RequirementNumberInput
            name={`${name}.value`}
            className="w-20 text-center"
            value={requirement.value}
            onChange={(value) => onChange({ ...requirement, value })}
          />
        </div>
      </div>
    </div>
  );
}

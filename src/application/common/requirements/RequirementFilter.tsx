"use client";

/**
 * Compendium requirement filter control (Wave 5, extended in Wave 6.2 to hold
 * several filters at once — combined with AND, so an entity must satisfy every
 * one of them). Each filter is one of:
 *  - a ranked target (stat/attribute/entity) with a value `<= X` — "what a
 *    character at this rank already satisfies";
 *  - "Dowolny tekst" — a substring match against the free-text requirements,
 *    for unstructured entries like "Lekka zbroja" that were never mapped.
 * Emits the whole `RequirementSearchFilter[]`, handled server-side by
 * `searchEntity`'s aggregateRaw path.
 */

import { useState } from "react";
import { Filter, Plus, X } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";
import { SKILLS } from "@/domain/characters/statistics/skills";
import {
  REQUIREMENT_TARGET_GROUPS,
  type RequirementTargetGroup,
  type EntityRequirementGroup,
  isStatisticGroup,
} from "@/domain/requirements/Requirement";
import EntityNameCombobox from "@/application/common/requirements/EntityNameCombobox";
import type { RequirementSearchFilter } from "@/common/global/SearchPayloads";

const TEXT_MODE = "text" as const;
type FilterMode = typeof TEXT_MODE | RequirementTargetGroup;

const MODE_LABELS: Record<FilterMode, string> = {
  text: "Dowolny tekst",
  characteristics: "Cecha",
  attributes: "Atrybut",
  talents: "Umiejętność",
  powers: "Moc / Więź",
  derived: "Wartość pochodna",
  equipment: "Sprzęt",
  maneuvers: "Manewr",
  stances: "Postawa",
  states: "Stan",
  spells: "Zaklęcie",
  perks: "Atut",
};

const MODE_ORDER: readonly FilterMode[] = [TEXT_MODE, ...REQUIREMENT_TARGET_GROUPS];

function skillLabel(key: string): string
{
  return SKILLS.find(([, k]) => k === key)?.[2] ?? key;
}

export function summarize(filter: RequirementSearchFilter): string
{
  if (filter.kind === "text")
  {
    return `„${filter.text}"`;
  }

  const target = isStatisticGroup(filter.group) ? skillLabel(filter.targetKey) : filter.targetKey;
  return `${target} ≤ ${filter.maxValue}`;
}

/** Identity for de-duplication and for the remove buttons — filters carry no id. */
export function requirementFilterKey(filter: RequirementSearchFilter): string
{
  return filter.kind === "text"
    ? `text:${filter.text.toLowerCase()}`
    : `ranked:${filter.group}:${filter.targetKey}:${filter.maxValue}`;
}

type RequirementFilterProps = {
  value: RequirementSearchFilter[];
  onChange: (filters: RequirementSearchFilter[]) => void;
};

export default function RequirementFilter({ value, onChange }: RequirementFilterProps)
{
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<FilterMode>("characteristics");
  const [targetKey, setTargetKey] = useState<string>("strength");
  const [maxValue, setMaxValue] = useState<string>("");
  const [text, setText] = useState<string>("");

  const handleModeChange = (next: FilterMode) =>
  {
    setMode(next);
    if (next !== TEXT_MODE)
    {
      // Reset the target to a sensible default for the new group.
      setTargetKey(isStatisticGroup(next) ? (SKILLS.find(([g]) => g === next)?.[1] ?? "") : "");
    }
  };

  const canAdd = mode === TEXT_MODE
    ? text.trim() !== ""
    : targetKey.trim() !== "" && maxValue.trim() !== "" && Number.isFinite(Number(maxValue));

  const add = () =>
  {
    if (!canAdd) return;

    const next: RequirementSearchFilter = mode === TEXT_MODE
      ? { kind: "text", text: text.trim() }
      : { kind: "ranked", group: mode, targetKey: targetKey.trim(), maxValue: Number(maxValue) };

    // Adding the same filter twice would only narrow the query to itself.
    if (!value.some((existing) => requirementFilterKey(existing) === requirementFilterKey(next)))
    {
      onChange([...value, next]);
    }

    // The popover stays open: adding several filters in a row is the point.
    setText("");
    setMaxValue("");
  };

  const remove = (filter: RequirementSearchFilter) =>
  {
    onChange(value.filter((existing) => requirementFilterKey(existing) !== requirementFilterKey(filter)));
  };

  const clearAll = () =>
  {
    onChange([]);
    setMaxValue("");
    setText("");
    setOpen(false);
  };

  const triggerLabel = value.length === 0
    ? "Wymagania"
    : value.length === 1 ? summarize(value[0]!) : `Wymagania · ${value.length}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant={value.length > 0 ? "default" : "outline"} className="justify-between gap-2">
          <Filter className="h-4 w-4" />
          {triggerLabel}
          {value.length > 0 && (
            <span
              role="button"
              aria-label="Wyczyść filtry wymagań"
              className="ml-1 opacity-70 hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 space-y-3">
        {
          value.length > 0 && (
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Aktywne — encja musi spełniać wszystkie</Label>
              <div className="flex flex-wrap gap-1">
                {
                  value.map((filter) => (
                    <span
                      key={requirementFilterKey(filter)}
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                    >
                      {summarize(filter)}
                      <button
                        type="button"
                        aria-label={`Usuń filtr ${summarize(filter)}`}
                        className="opacity-70 hover:opacity-100"
                        onClick={() => remove(filter)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                }
              </div>
            </div>
          )
        }

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Typ</Label>
          <Select value={mode} onValueChange={(m) => handleModeChange(m as FilterMode)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODE_ORDER.map((m) => <SelectItem key={m} value={m}>{MODE_LABELS[m]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {mode === TEXT_MODE ? (
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Fragment wymagania</Label>
            <Input
              placeholder="np. Lekka zbroja"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") add(); }}
            />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Cel</Label>
              {isStatisticGroup(mode) ? (
                <Select value={targetKey} onValueChange={setTargetKey}>
                  <SelectTrigger><SelectValue placeholder="wybierz" /></SelectTrigger>
                  <SelectContent>
                    {SKILLS.filter(([g]) => g === mode).map(([, key, pl]) => <SelectItem key={key} value={key}>{pl}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <EntityNameCombobox group={mode as EntityRequirementGroup} value={targetKey} onChange={setTargetKey} />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Wartość ≤ (co spełnia postać)</Label>
              <Input
                type="number"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") add(); }}
                placeholder="np. 3"
              />
            </div>
          </>
        )}

        <div className="flex justify-between gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={clearAll} disabled={value.length === 0}>Wyczyść</Button>
          <Button type="button" size="sm" disabled={!canAdd} onClick={add}>
            <Plus className="h-3.5 w-3.5" />
            Dodaj
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

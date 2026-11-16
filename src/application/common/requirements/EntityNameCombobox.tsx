"use client";

/**
 * Searchable name picker for a Kompendium entity name
 * (maneuver/stance/state/spell/perk). Suggests existing names via
 * `useEntityNames`, but still allows a custom value (a requirement may reference
 * something not in the current library).
 *
 * Used by the requirement picker (where free text is the norm and a name outside
 * the library is unremarkable) AND by the `replaces` editor (where it means a
 * relation to an entity, so a name matching nothing is worth flagging —
 * `unknownWarning`).
 */

import { useMemo, useState } from "react";
import { ChevronsUpDown, TriangleAlert } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { useEntityNames } from "@/common/hooks/useEntityNames";
import type { EntityRequirementGroup } from "@/domain/requirements/Requirement";

const MAX_SUGGESTIONS = 50;

type EntityNameComboboxProps = {
  group: EntityRequirementGroup;
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
  triggerClassName?: string;
  /** Flag a value that matches no entity in the library. Off by default — free text is fine for requirements. */
  unknownWarning?: boolean;
  /** Names kept out of the suggestions (e.g. the edited entity itself). */
  excludeNames?: readonly string[];
};

export default function EntityNameCombobox({
  group,
  value,
  onChange,
  placeholder = "nazwa z Kompendium",
  triggerClassName = "w-56",
  unknownWarning = false,
  excludeNames,
}: EntityNameComboboxProps)
{
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { names, isLoading } = useEntityNames(group);

  const query = search.trim().toLowerCase();

  const selectable = useMemo(() => {
    const excluded = new Set((excludeNames ?? []).map((name) => name.trim().toLowerCase()).filter(Boolean));
    return excluded.size === 0 ? names : names.filter((name) => !excluded.has(name.toLowerCase()));
  }, [names, excludeNames]);

  const filtered = useMemo(() => {
    const base = query ? selectable.filter((name) => name.toLowerCase().includes(query)) : selectable;
    return base.slice(0, MAX_SUGGESTIONS);
  }, [selectable, query]);

  const showCustom = search.trim() !== "" && !selectable.some((name) => name.toLowerCase() === query);

  // Warn only once the list is in — mid-fetch every value looks unknown.
  const isUnknown = unknownWarning
    && !isLoading
    && value.trim() !== ""
    && !names.some((name) => name.toLowerCase() === value.trim().toLowerCase());

  const select = (name: string) => {
    onChange(name);
    setSearch("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setSearch(""); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          title={isUnknown ? "Brak encji o tej nazwie w Kompendium" : undefined}
          className={`${triggerClassName} justify-between font-normal ${isUnknown ? "border-amber-500 text-amber-600" : ""}`}
        >
          <span className="truncate">{value || placeholder}</span>
          {isUnknown
            ? <TriangleAlert aria-label="Brak encji o tej nazwie w Kompendium" className="ml-2 h-4 w-4 shrink-0" />
            : <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-56 p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Szukaj nazwy..." value={search} onValueChange={setSearch} />
          <CommandList>
            {isLoading && <div className="px-3 py-2 text-sm text-muted-foreground">Ładowanie...</div>}
            {!isLoading && filtered.length === 0 && !showCustom && <CommandEmpty>Brak nazw.</CommandEmpty>}
            <CommandGroup>
              {filtered.map((name) => (
                <CommandItem key={name} value={name} onSelect={() => select(name)}>{name}</CommandItem>
              ))}
              {showCustom && (
                <CommandItem value={`__custom__:${search}`} onSelect={() => select(search.trim())}>
                  Użyj: „{search.trim()}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

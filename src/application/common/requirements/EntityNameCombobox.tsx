"use client";

/**
 * Searchable name picker for a ranked requirement targeting a Kompendium entity
 * (maneuver/stance/state/spell/perk). Suggests existing names via
 * `useEntityNames`, but still allows a custom value (a requirement may reference
 * something not in the current library).
 */

import { useMemo, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
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
};

export default function EntityNameCombobox({ group, value, onChange, placeholder = "nazwa z Kompendium", triggerClassName = "w-56" }: EntityNameComboboxProps)
{
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { names, isLoading } = useEntityNames(group);

  const query = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    const base = query ? names.filter((name) => name.toLowerCase().includes(query)) : names;
    return base.slice(0, MAX_SUGGESTIONS);
  }, [names, query]);

  const showCustom = search.trim() !== "" && !names.some((name) => name.toLowerCase() === query);

  const select = (name: string) => {
    onChange(name);
    setSearch("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setSearch(""); }}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} className={`${triggerClassName} justify-between font-normal`}>
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                  Użyj: „{search.trim()}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

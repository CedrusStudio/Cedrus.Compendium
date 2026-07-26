"use client";

/**
 * ROADMAP 2.2 — "Filtrowanie Postaw i Stanów wg wybranej postaci": lets a
 * Kompendium list of Postawy/Stany be narrowed down to only the ones a chosen
 * character actually has on their sheet. Search-and-pick a character (same
 * pattern as the Combat Lab combatant picker), then toggle the filter on/off
 * without losing the selection.
 */

import { useEffect, useState } from "react";
import { User, X } from "lucide-react";
import { useSearchCharactersSummary } from "@/application/characters/hooks/useSearchCharactersSummary";
import { useCharacterById } from "@/application/combat-lab/hooks/useCharacterById";
import { emptyUlid } from "@/common/global/pagination";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Checkbox } from "@/common/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";

export type CharacterModeFilterKind = "stances" | "states";

export function CharacterModeFilter({ kind, onOwnNamesChange }: { kind: CharacterModeFilterKind; onOwnNamesChange: (ownNames: Set<string> | null) => void })
{
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [characterId, setCharacterId] = useState<string | undefined>(undefined);
  const [enabled, setEnabled] = useState(true);

  const { characters } = useSearchCharactersSummary(search, emptyUlid);
  const { character } = useCharacterById(characterId);

  const ownNames = character ? new Set((kind === "stances" ? character.stances : character.states).map(m => m.name)) : null;

  // Re-notify the parent list whenever the effective filter changes (selection,
  // the on/off toggle, or the character's own data resolving after selection).
  useEffect(() =>
  {
    onOwnNamesChange(enabled ? ownNames : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId, enabled, character]);

  const clearSelection = () =>
  {
    setCharacterId(undefined);
    setSearch("");
  };

  if (character)
  {
    return (
      <div className="flex items-center gap-2 text-sm">
        <label className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs">
          <Checkbox checked={enabled} onCheckedChange={c => setEnabled(c === true)} />
          <span className="whitespace-nowrap">Tylko posiadane przez: <span className="font-medium capitalize">{character.name}</span></span>
        </label>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearSelection} aria-label="Usuń filtr postaci" title="Usuń filtr postaci">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          Filtruj wg postaci
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2">
        <Input placeholder="Szukaj postaci…" value={search} onChange={e => setSearch(e.target.value)} className="h-8" autoFocus />
        <div className="mt-2 max-h-48 overflow-y-auto rounded border">
          {characters.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">Brak wyników.</p>
          )}
          {characters.map(c => (
            <button
              key={c.id}
              type="button"
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted/60"
              onClick={() => { setCharacterId(c.id); setEnabled(true); setOpen(false); }}
            >
              <span className="font-medium capitalize">{c.name}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

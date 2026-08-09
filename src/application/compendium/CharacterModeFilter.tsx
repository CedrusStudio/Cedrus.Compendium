"use client";

/**
 * ROADMAP 2.2 — "tylko to, co ma ta postac": narrows a compendium list to the
 * entries a chosen character actually carries on their sheet. Search-and-pick a
 * character (same pattern as the Combat Lab combatant picker), then toggle the
 * filter on/off without losing the selection.
 *
 * Emits an `OwnedFilter` for the QUERY, not a set for client-side filtering —
 * see `characterOwnership.ts` for why that distinction is the whole feature.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, User, X } from "lucide-react";
import { useSearchCharactersSummary } from "@/application/characters/hooks/useSearchCharactersSummary";
import { useCharacterById } from "@/application/combat-lab/hooks/useCharacterById";
import { emptyUlid } from "@/common/global/pagination";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Checkbox } from "@/common/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { ownedFilterFor, ownedFilterKey, type CharacterOwnedKind, type OwnedFilter } from "@/application/compendium/characterOwnership";

export type CharacterModeFilterKind = CharacterOwnedKind;

export function CharacterModeFilter({ kind, onOwnedChange }: { kind: CharacterOwnedKind; onOwnedChange: (owned: OwnedFilter | null) => void })
{
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [characterId, setCharacterId] = useState<string | undefined>(undefined);
  const [enabled, setEnabled] = useState(true);

  const { characters } = useSearchCharactersSummary(search, emptyUlid);
  const { character } = useCharacterById(characterId);

  /*
   * Both halves of the old "Maximum update depth exceeded" loop lived here: the
   * effect below pushes this value into the parent's state, so anything built
   * fresh on every render (a `new Set`, or `toCharacter` re-running inside
   * `useCharacterById`) fed itself. The memo key is a flat string, so it changes
   * only when the owned entries genuinely change.
   */
  const raw = character ? ownedFilterFor(character, kind) : null;
  const key = ownedFilterKey(raw);
  const owned = useMemo(() => raw, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() =>
  {
    onOwnedChange(enabled ? owned : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owned, enabled]);

  // Zdjecie filtra musi wyczyscic tez stan rodzica - inaczej lista zostaje
  // zawezona do postaci, ktorej juz nie widac w UI.
  const clearSelection = () =>
  {
    setCharacterId(undefined);
    setSearch("");
    onOwnedChange(null);
  };

  if (character)
  {
    return (
      <div className="flex items-center gap-1 text-sm">
        <div className="flex h-9 items-center gap-2 rounded-md border px-2 text-xs">
          {/* Checkbox i nazwa maja WLASNE etykiety, bo robia co innego: jedno
              wlacza filtr, drugie otwiera karte postaci. Wspolny <label>
              przechwytywalby klikniecie w link. */}
          <label className="flex cursor-pointer items-center gap-2" title={enabled ? "Wylacz zawezenie" : "Wlacz zawezenie"}>
            <Checkbox checked={enabled} onCheckedChange={c => setEnabled(c === true)} />
            <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </label>

          {/* Prawdziwy <a href>, nie onClick: ma dzialac srodkowy przycisk,
              Ctrl+klik i „otworz w nowej karcie" z menu kontekstowego. */}
          <Link
            href={`/characters/${character.id}`}
            className="flex max-w-[10rem] items-center gap-1 truncate font-medium capitalize hover:underline"
            title={`Otworz karte: ${character.name}`}
          >
            <span className="truncate">{character.name}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
          </Link>

          {owned && owned.values.length === 0 && <span className="text-muted-foreground">(nic tutaj)</span>}
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={clearSelection} aria-label="Usun filtr postaci" title="Usun filtr postaci">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* Sam ludek, w rozmiarze pozostalych kontrolek paska (h-9). Podpis
            jedzie do `title`/`aria-label`, zeby nie rozpychal wiersza filtrow. */}
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-label="Filtruj wg postaci" title="Filtruj wg postaci">
          <User className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2">
        <Input placeholder="Szukaj postaci..." value={search} onChange={e => setSearch(e.target.value)} className="h-8" autoFocus />
        <div className="mt-2 max-h-48 overflow-y-auto rounded border">
          {characters.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">Brak wynikow.</p>
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

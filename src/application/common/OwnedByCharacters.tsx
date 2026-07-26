"use client";

/**
 * "Posiadane przez postacie" — reverse lookup shown on a compendium element's
 * detail view. Opens in a bottom drawer (same pattern as the bestiary's
 * maneuver preview, `CharacterManeuversViewDrawer`); only fetches once opened.
 * Each result shows the character's full name (no shortName) and links
 * straight to that character's sheet.
 */

import { useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/ui/drawer";
import { useOwningCharacters } from "@/application/common/hooks/useOwningCharacters";
import { type OwningEntity } from "@/common/global/owningEntity";

export default function OwnedByCharacters({ entity, id }: { entity: OwningEntity; id: string })
{
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useOwningCharacters(entity, id, open);

  const characters = data ?? [];

  return (
    <div className="w-full px-2">
      <Button variant="ghost" size="sm" className="h-8 gap-2 px-2 text-sm text-muted-foreground" onClick={() => setOpen(true)}>
        <Users className="h-4 w-4" />
        Posiadane przez postacie
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader className="flex flex-col place-content-center place-items-center flex-wrap">
            <div className="flex items-center gap-2">
              <DrawerTitle>Posiadane przez postacie</DrawerTitle>
              {!isLoading && !isError && (
                <Badge variant="outline">{characters.length}</Badge>
              )}
            </div>

            {isLoading && <p className="px-2 py-4 text-xs text-muted-foreground">Ładowanie…</p>}
            {isError && <p className="px-2 py-4 text-xs text-destructive">Nie udało się pobrać listy.</p>}
            {!isLoading && !isError && characters.length === 0 && (
              <p className="px-2 py-4 text-xs text-muted-foreground">Żadna postać nie ma tego elementu.</p>
            )}
            {!isLoading && !isError && characters.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {characters.map(character => (
                  <Button key={character.id} asChild variant="outline" size="sm" className="h-8">
                    <Link href={`/characters/${character.id}`}>
                      <span className="font-medium capitalize">{character.name}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            )}
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

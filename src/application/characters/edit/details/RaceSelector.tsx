"use client";

import { useState, useCallback, useMemo, Activity } from "react";
import { Control, useController } from "react-hook-form";
import { Label } from "@/common/components/ui/label";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { displayedText } from "@/presentation/translations";
import { useQuery } from "@tanstack/react-query";
import { createKeysetSearchRacesKey } from "@/persistence/cacheKeys";
import searchClient from "@/infrastructure/clients/searchClient";
import { Race } from "@/domain/Race";
import { emptyUlid } from "@/common/global/pagination";
import { Input } from "@/common/components/ui/input";
import { useDebounce } from "use-debounce";
import { Search } from "lucide-react";
import RaceCreateSheet from "@/application/characters/edit/details/RaceCreateSheet";
import { DetailsDto } from "@/persistence/schemas/characters/headerSchema";
import { createRaceKeysetQuery } from "@/infrastructure/searchQueries/races/createRaceKeysetQuery";
import { deleteIcon } from "@/presentation/icons";

type RaceSelectorProps = 
{
  control: Control<DetailsDto>;
  currentRaceId?: string | null | undefined;
};

export default function RaceSelector({ control }: RaceSelectorProps) 
{
  const { field } = useController
  ({
    name: "raceId",
    control,
  });

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebounce(searchInput, 300);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const queryKey = createKeysetSearchRacesKey(debouncedSearch, emptyUlid, [], 20);
  const { data: races = [] } = useQuery
  ({
    queryKey,
    queryFn: async () => {
      const raceQuery = createRaceKeysetQuery(debouncedSearch, emptyUlid, [], 20);
      return await searchClient.search<Race[]>(raceQuery);
    },
    staleTime: 30_000,
  });

  // Get currently selected race
  const selectedRace = useMemo(() => 
  {
    if (!field.value) return null;
    return races.find(r => r.id === field.value) ?? null;
  }, [field.value, races]);

  const handleSelectRace = useCallback((raceId: string) => 
  {
    field.onChange(raceId);
    setIsSearchOpen(false);
    setSearchInput("");
  }, [field]);

  const handleRemoveRace = useCallback(() => 
  {
    field.onChange(null);
  }, [field]);

  const handleRaceCreated = useCallback((newRaceId: string) => 
  {
    field.onChange(newRaceId);
  }, [field]);

  return (
    <div className="flex flex-col gap-4">

      <div className="flex flex-row gap-3 ml-1 place-items-center">
        <Label className="text-base capitalize">
          {displayedText.race}
        </Label>

        {/* Current Race Display */}
        {
          selectedRace ? (
            <div className="flex items-center">

              <Badge variant="outline" className="p-2">
                {selectedRace.name}
              </Badge>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemoveRace}
                >
                {deleteIcon}
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {"Brak wybranej rasy"}
            </div>
          )
        }
        
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setIsSearchOpen(!isSearchOpen)}>
          <Search className="h-4 w-4" />
          {"Wybierz rasę"}
        </Button>

        <Activity mode={selectedRace ? "hidden" : "visible"}>
          <RaceCreateSheet onRaceCreated={handleRaceCreated} />
        </Activity>
      </div>

      {/* Race Search/Selection */}
      {isSearchOpen && (
        <div className="border rounded-lg p-4 space-y-3">
          <Input
            placeholder={displayedText.searchRaces || "Szukaj rasy..."}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoFocus
          />

          <div className="h-64 overflow-y-auto border-t">
            <div className="space-y-2 p-2">
              {races.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  {displayedText.noRacesFound || "Nie znaleziono ras"}
                </div>
              ) : (
                races.map((race) => (
                  <Button
                    key={race.id}
                    type="button"
                    variant={field.value === race.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleSelectRace(race.id)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{race.name}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {race.description}
                      </span>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

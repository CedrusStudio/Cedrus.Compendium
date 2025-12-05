"use client";

import { useState, useCallback, useMemo, Activity } from "react";
import { Control, useController } from "react-hook-form";
import { Label } from "@/common/components/ui/label";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { displayedText } from "@/common/translations";
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
import { deleteIcon } from "@/common/icons";
import { useEntityTags } from '@/common/hooks/useEntityTags';
import TagFilter from "@/common/components/filters/TagFilter";

type RaceSelectorProps = 
{
  control: Control<DetailsDto>;
  currentRaceId?: string | null | undefined;
};

const EMPTY_ARRAY: string[] = [];

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
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('races');

  const queryKey = createKeysetSearchRacesKey(debouncedSearch, emptyUlid, searchTags, 20, excludedTags);
  const { data: races = [] } = useQuery
  ({
    queryKey,
    queryFn: async () => {
      const raceQuery = createRaceKeysetQuery(debouncedSearch, emptyUlid, searchTags, 20, excludedTags);
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
    setSearchTags(EMPTY_ARRAY);
    setExcludedTags(EMPTY_ARRAY);
  }, [field]);

  const handleRemoveRace = useCallback(() => 
  {
    field.onChange(null);
  }, [field]);

  const handleRaceCreated = useCallback((newRaceId: string) => 
  {
    field.onChange(newRaceId);
  }, [field]);

  const handleSearchTagsChange = useCallback((tags: string[]) => 
  {
    setSearchTags(tags);
  }, []);

  const handleExcludedTagsChange = useCallback((tags: string[]) => 
  {
    setExcludedTags(tags);
  }, []);

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

        <Activity mode={isSearchOpen ? "visible" : "hidden"}>
          <div className="border rounded-lg p-4 space-y-3">

            <div className="flex flex-col sm:flex-row gap-2">

              <Input
                placeholder={displayedText.searchRaces}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                autoFocus
                className="w-fit"
              />

              <TagFilter 
                includedTags={searchTags} 
                onIncludedTagsChange={handleSearchTagsChange} 
                excludedTags={excludedTags}
                onExcludedTagsChange={handleExcludedTagsChange}
                availableTags={availableTags} 
                isLoading={tagsLoading} 
              />

            </div>

            <div className="h-64 overflow-y-auto border-t space-y-2 p-2">
              <Activity mode={races.length === 0 ? "visible" : "hidden"}>
                <div className="text-sm text-muted-foreground text-center py-4">
                  {displayedText.noRacesFound}
                </div>
              </Activity>

              {
                races.length > 0 && (
                  races.map(race => (
                    <Button
                      key={race.id}
                      type="button"
                      variant={field.value === race.id ? "default" : "ghost"}
                      className="w-full justify-start p-3 h-auto"
                      onClick={() => handleSelectRace(race.id)}
                    >
                      <div className="flex flex-row gap-1 w-full">

                        <div className="mr-2">
                          <span className="text-base">{race.name}</span>
                        </div>

                        <div className="flex flex-col place-items-start place-content-center gap-2 w-full">
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {race.description}
                          </span>
                        </div>

                        {
                          race.tags && race.tags.length > 0 && (
                            <div className="flex flex-row gap-1 mt-1">
                            {
                              race.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                                  {tag}
                                </Badge>
                              ))
                            }
                            </div>
                          )
                        }

                      </div>
                    </Button>
                  ))
                )
              }
            </div>
          </div>
        </Activity>
    </div>
  );
}

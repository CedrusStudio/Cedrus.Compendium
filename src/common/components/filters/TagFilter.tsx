"use client";

import { useState } from "react";
import { Button } from "@/common/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { isValidTag } from "@/domain/Tag";
import { banIcon, tagSearchIcon } from "@/presentation/icons";

type TagFilterProps = 
{
  includedTags: string[];
  onIncludedTagsChange: (tags: string[]) => void;
  excludedTags: string[];
  onExcludedTagsChange: (tags: string[]) => void;
  availableTags?: string[]; // Optional: when provided, show dropdown
  isLoading?: boolean;
};

export default function TagFilter
(
  { 
    includedTags, 
    onIncludedTagsChange, 
    excludedTags,
    onExcludedTagsChange,
    availableTags,
    isLoading = false
  }
  : TagFilterProps
) 
{
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'include' | 'exclude'>('include');


  const addTag = (tag?: string, addMode?: 'include' | 'exclude') => 
  {
    const tagToAdd = (tag || inputValue).trim();
    if (!tagToAdd) return;

    if (!isValidTag(tagToAdd)) 
    {
      setError("Tag musi być małymi literami i nie może zawierać spacji");
      return;
    }

    const targetMode = addMode || mode;

    if (includedTags.includes(tagToAdd)) 
    {
      setError("Tag jest już w filtrach dołączających");
      return;
    }

    if (excludedTags.includes(tagToAdd)) 
    {
      setError("Tag jest już w filtrach wykluczających");
      return;
    }

    setInputValue("");
    setError("");
    setOpen(false);

    if (targetMode === 'include') 
    {
      onIncludedTagsChange([...includedTags, tagToAdd]);
      return;
    }

    onExcludedTagsChange([...excludedTags, tagToAdd]);
  };

  const removeIncludedTag = (tagToRemove: string) => 
  {
    onIncludedTagsChange(includedTags.filter(tag => tag !== tagToRemove));
  };

  const removeExcludedTag = (tagToRemove: string) => 
  {
    onExcludedTagsChange(excludedTags.filter(tag => tag !== tagToRemove));
  };

  const hasAnyTags = includedTags.length > 0 || excludedTags.length > 0;

  return (
    <div className="flex flex-col gap-2 w-full max-w-md min-w-[200px]">
      <div className="flex gap-2 items-center flex-wrap">

        <div className="flex gap-2 place-items-center">
          <Popover open={open} onOpenChange={setOpen}>

            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="justify-between"
                disabled={isLoading}
              >
                {isLoading ? "Ładowanie..." : mode === 'include' ? "Dołącz tag" : "Wyklucz tag"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            {error && <div className="text-red-600 px-2 py-1">{error}</div>}

            <PopoverContent className="w-[300px] p-0">

              <Command>
                <CommandInput placeholder="Szukaj tagu..." />
                <CommandList>
                  <CommandEmpty>Nie znaleziono tagów.</CommandEmpty>
                  <CommandGroup>
                  {
                    availableTags && availableTags
                      .filter(tag => !includedTags.includes(tag))
                      .filter(tag => !excludedTags.includes(tag))
                      .map(tag => (
                        <CommandItem 
                          key={tag} 
                          value={tag} 
                          onSelect={() => addTag(tag)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              (mode === 'include' ? includedTags : excludedTags).includes(tag) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {tag}
                        </CommandItem>
                      ))
                    }
                  </CommandGroup>
                </CommandList>
              </Command>
              
            </PopoverContent>
          </Popover>

          <Button
            variant={mode === 'include' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setMode('include')}
            type="button"
            >
            {tagSearchIcon()}
          </Button>
          <Button
            variant={mode === 'exclude' ? 'destructive' : 'outline'}
            size="icon"
            onClick={() => setMode('exclude')}
            type="button"
            >
            {banIcon()}
          </Button>
        </div>

        {
          hasAnyTags && (
            <div className="flex flex-row flex-wrap gap-2">
            {
              includedTags.map(tag => (
                <Button 
                  onClick={() => removeIncludedTag(tag)} 
                  type="button" 
                  key={`inc-${tag}`} 
                  variant="default" 
                  size="sm"
                >
                  <span>{tag}</span>
                </Button>
              ))
            }
            {
              excludedTags.map(tag => (
                <Button 
                  onClick={() => removeExcludedTag(tag)} 
                  type="button" 
                  key={`exc-${tag}`} 
                  variant="destructive" 
                  size="sm"
                >
                  <span>{tag}</span>
                </Button>
              ))
            }
            </div>
          )
        }
      </div>
    </div>
  );
}
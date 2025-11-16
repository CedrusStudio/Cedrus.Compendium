"use client";

import { useState, KeyboardEvent } from "react";
import { Input } from "@/common/components/ui/input";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { isValidTag } from "@/domain/Tag";

type TagFilterProps = 
{
  includedTags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags?: string[]; // Optional: when provided, show dropdown
  isLoading?: boolean;
};

export default function TagFilter({ 
  includedTags, 
  onTagsChange, 
  availableTags,
  isLoading = false 
}: TagFilterProps) 
{
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string>("");
  const [open, setOpen] = useState(false);

  // If availableTags provided, use dropdown mode
  const hasDropdown = availableTags && availableTags.length > 0;

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => 
  {
    if (e.key === "Enter" && inputValue.trim()) 
    {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = (tag?: string) => 
  {
    const tagToAdd = (tag || inputValue).trim();
    if (!tagToAdd) return;

    if (!isValidTag(tagToAdd)) 
    {
      setError("Tag musi być małymi literami i nie może zawierać spacji");
      return;
    }

    if (includedTags.includes(tagToAdd))
    {
        setError("Tag jest już dodany");
        return;
    }

    onTagsChange([...includedTags, tagToAdd]);
    setInputValue("");
    setError("");
    setOpen(false);
  };

  const removeIncludedTag = (tagToRemove: string) => 
  {
    onTagsChange(includedTags.filter(tag => tag !== tagToRemove));
  };

  const hasAnyTags = includedTags.length > 0;

  // Dropdown mode with available tags
  if (hasDropdown) {
    return (
      <div className="flex flex-col gap-2 min-w-[200px]">
        <div className="flex gap-2 items-center">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="justify-between flex-1"
                disabled={isLoading}
              >
                {isLoading ? "Ładowanie..." : "Wybierz tagi..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Szukaj tagu..." />
                <CommandList>
                  <CommandEmpty>Nie znaleziono tagów.</CommandEmpty>
                  <CommandGroup>
                    {availableTags
                      .filter(tag => !includedTags.includes(tag))
                      .map((tag) => (
                        <CommandItem
                          key={tag}
                          value={tag}
                          onSelect={() => addTag(tag)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              includedTags.includes(tag) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {tag}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {hasAnyTags && (
            <div className="flex flex-row flex-wrap gap-2">
              {includedTags.map(tag => (
                <Button 
                  onClick={() => removeIncludedTag(tag)} 
                  type="button" 
                  key={tag} 
                  variant="default" 
                  size="sm"
                >
                  <Badge variant="default" className="gap-1">
                    <span>{tag}</span>
                  </Badge>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Manual input mode (original behavior)
  return (
    <div className="flex flex-col gap-2 min-w-[200px]">

      <div className="flex gap-2 items-center">

        <Input type="text" placeholder={"Szukaj po tagu..."} value={inputValue} onChange={e => 
          {
            setInputValue(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          className={`flex-1 ${error ? "border-red-500" : ""}`}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => addTag()} disabled={!inputValue.trim()}>
          Add
        </Button>
        {
            hasAnyTags && (
                <div className="flex flex-row flex-wrap gap-2">
                {
                    includedTags.map(tag => (
                        <Button onClick={() => removeIncludedTag(tag)} type="button" key={tag} variant="default" size="sm">
                            <Badge variant="default" className="gap-1">
                                <span>{tag}</span>
                            </Badge>
                        </Button>
                    ))
                }
                </div>
            )
        }
      </div>

      { error &&  <p className="text-xs text-red-500">{error}</p> }
    </div>
  );
}
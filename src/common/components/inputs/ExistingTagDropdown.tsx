"use client";

import { useState, useMemo } from "react";
import { Button } from "@/common/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/ui/command";
import { ChevronsUpDown, Tag } from "lucide-react";
import { useEntityTags, EntityType } from "@/common/hooks/useEntityTags";
import { displayedText } from "@/common/translations";

type ExistingTagDropdownProps = 
{
  entityType: EntityType;
  currentTags: string[];
  maxTags: number;
  onSelectTag: (tag: string) => void;
  disabled?: boolean;
};

export default function ExistingTagDropdown({ entityType, currentTags, maxTags, onSelectTag, disabled = false }: ExistingTagDropdownProps) 
{
  const [open, setOpen] = useState(false);
  const { tags: allTags, isLoading } = useEntityTags(entityType);

  const availableTags = useMemo(() => 
  {
    return allTags
      .filter(tag => !currentTags.includes(tag))
      .sort();
  }, [allTags, currentTags]);

  const handleSelectTag = (tag: string) => 
  {
    if (currentTags.length >= maxTags) 
    {
      return;
    }
    onSelectTag(tag);
    setOpen(false);
  };

  const isDisabled = disabled || isLoading || currentTags.length >= maxTags || availableTags.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between"
          disabled={isDisabled}
        >
          <Tag className="h-4 w-4 mr-2" />
          {isLoading ? displayedText.loading : displayedText.selectExistingTag}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder={displayedText.searchTags} />
          <CommandList>
            <CommandEmpty>{displayedText.noTagsFound}</CommandEmpty>
            <CommandGroup>
            {
              availableTags.map(tag => (
                <CommandItem 
                  key={tag} 
                  value={tag} 
                  onSelect={() => handleSelectTag(tag)}
                >
                  {tag}
                </CommandItem>
              ))
            }
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

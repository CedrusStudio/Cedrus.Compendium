"use client";

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { displayedText } from '@/common/translations';
import { cn } from '@/lib/utils';

type ExistingTagSelectProps = {
  availableTags: string[];
  selectedTags: string[];
  onSelectTag: (tag: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  selectorId?: string;
  triggerClassName?: string;
};

export default function ExistingTagSelect({
  availableTags,
  selectedTags,
  onSelectTag,
  disabled = false,
  isLoading = false,
  selectorId,
  triggerClassName,
}: ExistingTagSelectProps)
{
  const [open, setOpen] = useState(false);
  const selectableTags = useMemo(
    () => availableTags.filter(tag => !selectedTags.includes(tag)).sort((left, right) => left.localeCompare(right)),
    [availableTags, selectedTags],
  );

  const isDisabled = disabled || isLoading || selectableTags.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={selectorId}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={displayedText.selectExistingTag}
          className={cn('justify-between', triggerClassName)}
          disabled={isDisabled}
        >
          {isLoading ? 'Ładowanie...' : displayedText.selectExistingTag}
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
                selectableTags.map(tag => (
                  <CommandItem
                    key={tag}
                    value={tag}
                    onSelect={() => {
                      onSelectTag(tag);
                      setOpen(false);
                    }}
                  >
                    <Check className="mr-2 h-4 w-4 opacity-0" />
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
"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDown, ListChecks } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { displayedText } from "@/common/translations";
import { RequirementEntityType, useEntityRequirements } from "@/common/hooks/useEntityRequirements";

type ExistingRequirementDropdownProps =
{
  entityType: RequirementEntityType;
  currentRequirements: string[];
  maxCount: number;
  onSelectRequirement: (requirement: string) => void;
  disabled?: boolean;
};

export default function ExistingRequirementDropdown({ entityType, currentRequirements, maxCount, onSelectRequirement, disabled = false }: ExistingRequirementDropdownProps)
{
  const [open, setOpen] = useState(false);
  const { requirements: allRequirements, isLoading } = useEntityRequirements(entityType);

  const availableRequirements = useMemo(() =>
  {
    return allRequirements
      .filter(requirement => !currentRequirements.includes(requirement))
      .sort();
  }, [allRequirements, currentRequirements]);

  const handleSelectRequirement = (requirement: string) =>
  {
    if (currentRequirements.length >= maxCount)
    {
      return;
    }

    onSelectRequirement(requirement);
    setOpen(false);
  };

  const isDisabled = disabled || isLoading || currentRequirements.length >= maxCount || availableRequirements.length === 0;

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
          <ListChecks className="h-4 w-4 mr-2" />
          {isLoading ? displayedText.loading : displayedText.selectExistingRequirement}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder={displayedText.searchRequirements} />
          <CommandList>
            <CommandEmpty>{displayedText.noRequirementsFound}</CommandEmpty>
            <CommandGroup>
            {
              availableRequirements.map(requirement => (
                <CommandItem
                  key={requirement}
                  value={requirement}
                  onSelect={() => handleSelectRequirement(requirement)}
                >
                  {requirement}
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
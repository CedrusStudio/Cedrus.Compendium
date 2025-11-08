"use client";

import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/ui/item";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { CreateDefaultPerk, pathToPerkField, Perk } from "@/domain/characters/Perk";
import { FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove } from "react-hook-form";
import RemoveFromArrayButton from "@/common/components/form/RemoveFromArrayButton";
import { Button } from "@/common/components/ui/button";
import { editIcon } from "@/presentation/icons";
import { displayedText } from "@/presentation/translations";
import { Label } from "@/common/components/ui/label";
import { InputFormField } from "@/common/components/form/InputFormField";
import { DetailsDto } from "@/persistence/schemas/characters/headerSchema";
import AppendToArrayButton from "@/common/components/form/AppendToArrayButton";
import { FormTagsInput } from "@/common/components/inputs/FormTagsInput";
import { FormStringsInput } from "@/common/components/inputs/FormStringsInput";
import TagsView from "@/common/components/tags/TagsView";
import ImportItemsSheet from "@/common/components/import/ImportItemSheet";
import { useSearchPerks } from "@/application/characters/edit/details/hooks/useSearchPerks";
import PerkView from "@/application/compendium/perks/PerkView";
import SelectableItemWrapper from "@/common/components/import/SelectableItemWrapper";
import { useState, useEffect, useRef } from "react";
import ImportedBadge from "@/common/components/labels/ImportedBadge";

type EditPerksListProps =
{
  isPending: boolean;
  perks: FieldArrayWithId<DetailsDto, "perks">[];
  append: UseFieldArrayAppend<DetailsDto, "perks">;
  remove: UseFieldArrayRemove;
}

export default function EditPerksList({ isPending, perks, append, remove }: EditPerksListProps)
{
  const [importedPerkIds, setImportedPerkIds] = useState<Set<string>>(new Set());
  const prevIsPendingRef = useRef(isPending);

  useEffect(() =>
  {
    // Clear imported IDs when submission completes (isPending: true → false)
    if (prevIsPendingRef.current && !isPending)
    {
      setImportedPerkIds(new Set());
    }
    prevIsPendingRef.current = isPending;
  }, [isPending]);

  const handleImportPerks = (importedPerks: Perk[]) => 
  {
    importedPerks.forEach(perk => 
    {
      append
      ({ 
        id: perk.id,
        name: perk.name,
        grade: perk.grade,
        description: perk.description,
        requirements: [...perk.requirements],
        price: perk.price,
        tags: [...perk.tags]
      });
    });
    
    setImportedPerkIds(prev => 
    {
      const newSet = new Set(prev);
      importedPerks.forEach(perk => newSet.add(perk.id));
      return newSet;
    });
  };

  const renderPerkItem = (perk: Perk, isSelected: boolean, onToggle: (id: string) => void) => 
  {
    return (
      <SelectableItemWrapper isSelected={isSelected} onToggle={() => onToggle(perk.id)}>
        <PerkView perk={perk} disableEdit={true} />
      </SelectableItemWrapper>
    );
  };

  return (
    <>
      <div className="flex flex-row justify-center items-center gap-4">

        <h3 className="text-lg font-semibold text-primary capitalize">
          {displayedText.perks}
        </h3>

        <div className="flex gap-2">
          <AppendToArrayButton<DetailsDto, "perks"> 
            isPending={isPending}
            append={append}
            toAdd={CreateDefaultPerk}
          />

          <ImportItemsSheet
            importTitle={displayedText.import_perks}
            importDescription={displayedText.select_perks_to_import}
            notFoundText={displayedText.no_perks_found}
            onImport={handleImportPerks}
            isPending={isPending}
            currentItemsIds={perks.map(perk => perk.id)}
            useSearchItems={useSearchPerks}
            renderItem={renderPerkItem}
          />
        </div>
        
      </div>

      <ul className="list-inside grid grid-cols-2 gap-2">
      {
        perks.map((perk, index) => (
          <li key={index} className="text-md text-primary">
            <EditPerkView perk={perk} index={index} remove={remove} isImported={importedPerkIds.has(perk.id)} />
          </li>
        ))
      }
      </ul>
    </>
  );
}

type EditPerkViewProps = 
{
  perk: Perk;
  index: number;
  remove: UseFieldArrayRemove;
  isImported: boolean;
};

function EditPerkView({ perk, index, remove, isImported }: EditPerkViewProps)
{
  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>
          {perk.name} {perk.grade} <TagsView tags={perk.tags} />
          <ImportedBadge isImported={isImported} />
        </ItemTitle>
        <ItemDescription>
            {perk.description}
        </ItemDescription>
      </ItemContent>

      <ItemActions>
        <RemoveFromArrayButton remove={remove} index={index} />
        {!isImported && <EditPerkSheet index={index} />}
      </ItemActions>
    </Item>
  );
};

type EditPerkSheetProps = 
{
  index: number;
};

function EditPerkSheet({ index }: EditPerkSheetProps)
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{editIcon}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.editPerk}</SheetTitle>
          <SheetDescription>
           {displayedText.clickSave}
          </SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="flex justify-around">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.name}</Label>
              <InputFormField<DetailsDto> path={pathToPerkField(index, 'name')} inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.grade}</Label>
              <InputFormField<DetailsDto> path={pathToPerkField(index, 'grade')} inputClassName="w-11 h-10 text-center font-medium" />
            </div>

          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <InputFormField<DetailsDto> path={pathToPerkField(index, 'description')} inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<DetailsDto> path={pathToPerkField(index, 'tags')} />
          <FormStringsInput<DetailsDto> path={pathToPerkField(index, 'requirements')} placeholder={displayedText.addRequirement} />

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='justify-center capitalize'>{displayedText.price}</Label>
            <InputFormField<DetailsDto> path={pathToPerkField(index, 'price')} inputClassName='w-14 h-10 text-center font-medium' />
          </div>

        </div>

        <SheetFooter>
          <SheetClose className="capitalize" asChild>
            <Button variant="outline" type='button'>{displayedText.close}</Button>
          </SheetClose>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}
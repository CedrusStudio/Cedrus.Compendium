"use client";

import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/ui/item";
import { CreateDefaultPerk, pathToPerk, Perk } from "@/domain/characters/Perk";
import { FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove } from "react-hook-form";
import RemoveFromArrayButton from "@/common/components/form/RemoveFromArrayButton";
import { displayedText } from "@/presentation/translations";
import { DetailsDto } from "@/persistence/schemas/characters/headerSchema";
import AppendToArrayButton from "@/common/components/form/AppendToArrayButton";
import TagsView from "@/common/components/tags/TagsView";
import ImportItemsSheet from "@/common/components/import/ImportItemSheet";
import PerkView from "@/application/compendium/perks/PerkView";
import SelectableItemWrapper from "@/common/components/import/SelectableItemWrapper";
import { useState, useEffect, useRef } from "react";
import ImportedBadge from "@/common/components/labels/ImportedBadge";
import PerkEditableFields from "@/application/common/PerkEditableFields";
import { createPerkKeysetQuery } from "@/infrastructure/searchQueries/perks/createPerkKeysetQuery";
import { createKeysetSearchPerksKey } from "@/persistence/cacheKeys";
import { EditSheet } from "@/common/components/sheets/EditSheet";

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
      <SelectableItemWrapper key={perk.id} isSelected={isSelected} onToggle={() => onToggle(perk.id)} cannotSelect={perks.map(perk => perk.id).includes(perk.id)}>
        <PerkView perk={perk} disableEdit={true} />
      </SelectableItemWrapper>
    );
  };

  return (
    <>
      <div className="flex flex-row place-items-center place-content-center gap-4">

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
            onImport={handleImportPerks}
            isPending={isPending}
            currentItemsIds={perks.map(perk => perk.id)}
            renderItem={renderPerkItem}
            createKeysetQuery={createPerkKeysetQuery}
            createKeysetSearchKey={createKeysetSearchPerksKey}
            entityType="perks"
          />
        </div>
        
      </div>

      <ul className="list-inside grid grid-cols-1 md:grid-cols-2 gap-2">
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
  const type = pathToPerk(index);

  return (
    <EditSheet
      isPending={false}
      formId=""
      title={displayedText.editPerk}
      triggerVariant="outline"
      hasSubmitButton={false}
    >
      <PerkEditableFields pathPrefix={`${type}.`} />
    </EditSheet>
  );
}
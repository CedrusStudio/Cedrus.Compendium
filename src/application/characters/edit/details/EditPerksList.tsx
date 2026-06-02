"use client";

import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/ui/item";
import { CreateDefaultPerk, pathToPerk, Perk } from "@/domain/characters/Perk";
import { FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove } from "react-hook-form";
import RemoveFromArrayButton from "@/common/components/form/RemoveFromArrayButton";
import { displayedText } from "@/common/translations";
import { DetailsDto } from "@/persistence/schemas/characters/headerSchema";
import AppendToArrayButton from "@/common/components/form/AppendToArrayButton";
import TagsView from "@/common/components/tags/TagsView";
import ImportItemsSheet from "@/common/components/import/ImportItemSheet";
import PerkView from "@/application/compendium/perks/PerkView";
import SelectableItemWrapper from "@/common/components/import/SelectableItemWrapper";
import { useState } from "react";
import ImportedBadge from "@/common/components/labels/ImportedBadge";
import RemovedBadge from '@/common/components/labels/RemovedBadge';
import PerkEditableFields from "@/application/common/PerkEditableFields";
import { createPerkKeysetQuery } from "@/infrastructure/searchQueries/perks/createPerkKeysetQuery";
import { createKeysetSearchPerksKey } from "@/persistence/cacheKeys";
import { EditSheet } from "@/common/components/sheets/EditSheet";
import { normalizeGradeFilterInput, parseGradeFilterInput } from '@/common/global/gradeFilter';
import RestoreItemButton from '@/common/components/form/RestoreItemButton';
import { useDraftRemovableItems } from '@/application/characters/edit/hooks/useDraftRemovableItems';

type EditPerksListProps =
{
  isPending: boolean;
  isSuccess: boolean;
  initialPerks: Perk[];
  perks: FieldArrayWithId<DetailsDto, "perks">[];
  append: UseFieldArrayAppend<DetailsDto, "perks">;
  remove: UseFieldArrayRemove;
}

const clonePerk = (perk: Perk): Perk =>
({
  id: perk.id,
  name: perk.name,
  grade: perk.grade,
  description: perk.description,
  requirements: [...perk.requirements],
  price: perk.price,
  tags: [...perk.tags]
});

export default function EditPerksList({ isPending, isSuccess, initialPerks, perks, append, remove }: EditPerksListProps)
{
  const [gradeFilter, setGradeFilter] = useState("");
  const selectedGrade = parseGradeFilterInput(gradeFilter);
  const {
    importedIds,
    registerImportedItems,
    removedItemIds,
    removedItems,
    removeItemAtIndex,
    removeItemById,
    restoreRemovedItem,
  } = useDraftRemovableItems<Perk>
  ({
    items: perks,
    initialItems: initialPerks,
    isPending,
    isSuccess,
    append,
    remove,
    cloneItem: clonePerk,
  });

  const handleImportPerks = (importedPerks: Perk[]) => 
  {
    registerImportedItems(importedPerks);
  };

  const renderPerkItem = (perk: Perk, isSelected: boolean, onToggle: (id: string) => void, itemState: 'available' | 'selected' | 'owned' | 'removed') => 
  {
    return (
      <SelectableItemWrapper key={perk.id} isSelected={isSelected} onToggle={() => onToggle(perk.id)} state={itemState}>
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
            removedItemsIds={removedItemIds}
            onToggleCurrentItem={removeItemById}
            onToggleRemovedItem={restoreRemovedItem}
            renderItem={renderPerkItem}
            gradeFilter={gradeFilter}
            onGradeFilterChange={value => setGradeFilter(normalizeGradeFilterInput(value))}
            createKeysetQuery={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
              createPerkKeysetQuery(searchQuery, cursor, includeTags, pageSize, excludeTags, selectedGrade)
            }
            createKeysetSearchKey={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
              createKeysetSearchPerksKey(searchQuery, cursor, includeTags, pageSize, excludeTags, selectedGrade)
            }
            entityType="perks"
          />
        </div>
        
      </div>

      <ul className="list-inside grid grid-cols-1 md:grid-cols-2 gap-2">
      {
        perks.map((perk, index) => (
          <li key={index} className="text-md text-primary">
            <EditPerkView perk={perk} index={index} onRemove={() => removeItemAtIndex(index)} isImported={importedIds.has(perk.id)} isRemoved={false} />
          </li>
        ))
      }
      {
        removedItems.map(perk => (
          <li key={perk.id} className="text-md text-primary">
            <EditPerkView perk={perk} index={-1} onRestore={() => restoreRemovedItem(perk.id)} isImported={false} isRemoved={true} />
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
  isImported: boolean;
  isRemoved: boolean;
  onRemove?: () => void;
  onRestore?: () => void;
};

function EditPerkView({ perk, index, isImported, isRemoved, onRemove, onRestore }: EditPerkViewProps)
{
  return (
    <Item variant="muted" className={isRemoved ? 'opacity-70' : undefined}>
      <ItemContent>
        <ItemTitle>
          {perk.name} {perk.grade} <TagsView tags={perk.tags} />
          {isRemoved ? <RemovedBadge /> : <ImportedBadge isImported={isImported} />}
        </ItemTitle>
        <ItemDescription>
            {perk.description}
        </ItemDescription>
      </ItemContent>

      <ItemActions>
        {isRemoved ? <RestoreItemButton onRestore={onRestore ?? (() => {})} /> : <RemoveFromArrayButton onRemove={onRemove} />}
        {!isRemoved && !isImported && <EditPerkSheet index={index} />}
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
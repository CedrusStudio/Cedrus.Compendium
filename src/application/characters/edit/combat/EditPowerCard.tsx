"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import { UseFieldArrayRemove, useFormContext, useWatch } from "react-hook-form";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { SelectFormField } from '@/common/components/form/SelectFormField';
import AreaInputFormField from '@/common/components/form/AreaInputFormField';
import AppendToArrayButton from '@/common/components/form/AppendToArrayButton';
import RemoveFromArrayButton from '@/common/components/form/RemoveFromArrayButton';
import { displayedText } from '@/common/translations';
import { allowedPowerTypes, CreateDefaultSpell, pathToPowerField, pathToSpell, powerFieldOrder, Spell, type Power, PowerSpecification } from '@/domain/characters/combat/Power';
import { Separator } from '@/common/components/ui/separator';
import { PowerDto } from '@/persistence/schemas/characters/combat/powerSchema';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';
import ImportItemsSheet from '@/common/components/import/ImportItemSheet';
import ImportFromCharacterSheet from '@/common/components/import/ImportFromCharacterSheet';
import SpellView from "@/application/compendium/spells/SpellView";
import SelectableItemWrapper from "@/common/components/import/SelectableItemWrapper";
import { useState } from 'react';
import ImportedBadge from "@/common/components/labels/ImportedBadge";
import RemovedBadge from '@/common/components/labels/RemovedBadge';
import SummaryView from '@/application/common/SummaryView';
import EditCharacterCombatPerkSheet from '@/application/characters/edit/combat/EditCharacterCombatPerkSheet';
import SpellEditableFields from '@/application/common/combat/SpellEditableFields';
import { battleIcon, cooldownIcon, costIcon, importIcon } from '@/common/icons';
import { Badge } from '@/common/components/ui/badge';
import { getBadgeVariant } from '@/common/colors';
import { createSpellKeysetQuery } from '@/infrastructure/searchQueries/spells/createSpellKeysetQuery';
import { createKeysetSearchSpellsKey } from '@/persistence/cacheKeys';
import PerkableEditView from '@/application/characters/edit/combat/PerkableEditView';
import { SelectPowerSpecificationSheet } from '@/application/characters/combat/SelectPowerSpecificationSheet';
import { Button } from '@/ui/button';
import PowerSpecificationViewFields from '@/application/common/combat/PowerSpecificationViewFields';
import powerSpecificationsClient from '@/infrastructure/clients/powerSpecificationsClient';
import { useQuery } from '@tanstack/react-query';
import { FormField, FormItem, FormMessage } from '@/ui/form';
import CastTimeFilter from '@/common/components/filters/CastTimeFilter';
import { normalizeGradeFilterInput, parseGradeFilterInput } from '@/common/global/gradeFilter';
import { type CastTime } from '@/domain/characters/Castable';
import RestoreItemButton from '@/common/components/form/RestoreItemButton';
import { useDraftRemovableItems } from '@/application/characters/edit/hooks/useDraftRemovableItems';
import { calculateSpellCost, formatSpellCost, normalizeSpellCost } from '@/domain/characters/combat/SpellCost';
import { Character } from '@/domain/characters/Character';

type EditPowersCardProps =
{
  index: number;
  power: Power;
  remove: UseFieldArrayRemove;
  isPending: boolean;
  isSuccess: boolean;
  currentCharacterId: string;
  currentCharacterName: string;
}

// Spells live on individual Powers, but "import from another character" flattens
// all of the source character's spells across every one of their Powers — spells
// are a shared library entity (like maneuvers/perks), so which Power they were
// attached to on the source character isn't meaningful once imported.
const selectAllSpellsAcrossPowers = (character: Character): Spell[] =>
{
  const seenIds = new Set<string>();

  return character.powers
    .flatMap(sourcePower => sourcePower.spells)
    .filter(spell =>
    {
      if (seenIds.has(spell.id)) return false;
      seenIds.add(spell.id);
      return true;
    });
};

const cloneSpell = (spell: Spell): Spell =>
({
  id: spell.id,
  name: spell.name,
  grade: spell.grade,
  description: spell.description,
  requirements: [...spell.requirements],
  price: spell.price,
  tags: [...spell.tags],
  castTime: spell.castTime,
  cooldown: spell.cooldown,
  cost: normalizeSpellCost(spell.cost)
});

export default function EditPowerCard({ index, power, remove, isPending, isSuccess, currentCharacterId, currentCharacterName }: EditPowersCardProps)
{
  const { control, setValue } = useFormContext<CombatDto>();
  const powerSpecificationFieldPath = pathToPowerField(index, 'powerSpecificationId');
  const { remove: removeSpell, watchedArray: spells, append: appendSpell } = useWatchedFormArray(pathToPowerField(index, 'spells'), control);
  const [selectSpecOpen, setSelectSpecOpen] = useState(false);
  const [spellGradeFilter, setSpellGradeFilter] = useState("");
  const [selectedSpellCastTimes, setSelectedSpellCastTimes] = useState<CastTime[]>([]);
  const selectedSpellGrade = parseGradeFilterInput(spellGradeFilter);
  const {
    importedIds,
    registerImportedItems,
    removedItemIds,
    removedItems,
    removeItemAtIndex,
    removeItemById,
    restoreRemovedItem,
  } = useDraftRemovableItems<Spell>
  ({
    items: spells,
    initialItems: power.spells,
    isPending,
    isSuccess,
    append: appendSpell,
    remove: removeSpell,
    cloneItem: cloneSpell,
  });

  // Watch the powerSpecificationId field to react to form changes
  const watchedPowerSpecId = useWatch
  ({
    control,
    name: powerSpecificationFieldPath
  });

  // Fetch the PowerSpecification when component mounts or powerSpecificationId changes
  const { data: selectedSpecification } = useQuery
  ({
    queryKey: ['powerSpecification', watchedPowerSpecId],
    queryFn: () => powerSpecificationsClient.get(watchedPowerSpecId as string),
    enabled: !!watchedPowerSpecId && (watchedPowerSpecId as string).length > 0,
    staleTime: 5_000
  });

  const handleSelectSpecification = (spec: PowerSpecification) => 
  {
    setValue(powerSpecificationFieldPath, spec.id, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
  };

  const handleImportSpells = (importedSpells: Spell[]) => 
  {
    registerImportedItems(importedSpells);
  };

  const renderSpellItem = (spell: Spell, isSelected: boolean, onToggle: (id: string) => void, itemState: 'available' | 'selected' | 'owned' | 'removed') => 
  {
    return (
      <SelectableItemWrapper key={spell.id} isSelected={isSelected} onToggle={() => onToggle(spell.id)} state={itemState}>
        <SpellView spell={spell} disableEdit={true} />
      </SelectableItemWrapper>
    );
  };

  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3'>
          
          <div className='flex flex-row flex-wrap item-center justify-center gap-4 mx-auto'>

            <div key={power.name} className="flex flex-col items-center gap-2">
              <Label className="text-center capitalize">{displayedText.name}</Label>
              <InputFormField<CombatDto> path={pathToPowerField(index, "name")} inputClassName='w-full h-10 text-center font-medium' />
            </div>

            <div className="grid grid-cols-3 justify-center items-center gap-3">
            { 
              (Object.keys(power) as (keyof PowerDto)[])
                .filter(NotNameOrTypeOrId)
                .sort(powerFieldOrder)
                .map(key => InputFormWithLabel(index, key as keyof PowerDto)) 
            }
            </div>

          </div>

          <div className='flex items-end justify-center gap-6 sm:mt-4'>
            <SelectFormField<CombatDto> path={pathToPowerField(index, "type")} items={allowedPowerTypes} />
            <RemoveFromArrayButton remove={remove} index={index} />
          </div>

        </CardTitle>
      </CardHeader>

      <CardContent>

        <div className='mb-4'>
          <Label className='mb-2 block text-center capitalize'>{displayedText.description}</Label>
          <AreaInputFormField<CombatDto>
            path={pathToPowerField(index, 'description')}
            inputPlaceholder={displayedText.changeDescription}
          />
        </div>

        <div className='mb-4'>
          <div className='flex flex-row items-center justify-between gap-3 mb-2'>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setSelectSpecOpen(true)}
            >
              {importIcon}
              <span className='ml-2'>{selectedSpecification ? 'Zmień' : 'Wybierz'}</span>
            </Button>
          </div>
          
          {
            selectedSpecification ? <PowerSpecificationViewFields powerSpecification={selectedSpecification} collapsible={true} defaultOpen={false} tagsVariant='default' />
             : (
              <div className='p-4 border-2 border-dashed rounded-md text-center text-muted-foreground'>
                Nie wybrano specyfikacji mocy. Kliknij &quot;Wybierz&quot;
              </div>
              )
          }

          <FormField
            control={control}
            name={powerSpecificationFieldPath}
            render={() => (
              <FormItem className='mt-2'>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <SelectPowerSpecificationSheet
          open={selectSpecOpen}
          onOpenChange={setSelectSpecOpen}
          onSelect={handleSelectSpecification}
          currentSpecificationId={watchedPowerSpecId}
        />

        <Separator className='mb-5 col-span-full' />

        <div className='flex flex-col sm:flex-row items-center justify-center gap-6'>

          <div className='flex flex-row items-center gap-3'>
            <h2 className='text-2xl font-semibold text-primary capitalize'>{displayedText.spells}</h2>
            <AppendToArrayButton append={appendSpell} isPending={isPending} toAdd={CreateDefaultSpell} />

            <ImportItemsSheet
              importTitle={displayedText.import_spells}
              importDescription={displayedText.select_spells_to_import}
              onImport={handleImportSpells}
              isPending={isPending}
              currentItemsIds={spells.map(spell => spell.id)}
              removedItemsIds={removedItemIds}
              onToggleCurrentItem={removeItemById}
              onToggleRemovedItem={restoreRemovedItem}
              renderItem={renderSpellItem}
              gradeFilter={spellGradeFilter}
              onGradeFilterChange={value => setSpellGradeFilter(normalizeGradeFilterInput(value))}
              renderHeaderContent={({ clearResults }) => (
                <CastTimeFilter
                  selectedCastTimes={selectedSpellCastTimes}
                  onSelectedCastTimesChange={castTimes =>
                  {
                    clearResults();
                    setSelectedSpellCastTimes(castTimes);
                  }}
                />
              )}
              createKeysetQuery={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
                createSpellKeysetQuery(searchQuery, cursor, includeTags, pageSize, excludeTags, selectedSpellCastTimes, selectedSpellGrade)
              }
              createKeysetSearchKey={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
                createKeysetSearchSpellsKey(searchQuery, cursor, includeTags, pageSize, excludeTags, selectedSpellCastTimes, selectedSpellGrade)
              }
              entityType="spells"
            />

            <ImportFromCharacterSheet<Spell>
              categoryLabel={displayedText.spells}
              currentCharacterId={currentCharacterId}
              currentCharacterName={currentCharacterName}
              currentItemsIds={spells.map(spell => spell.id)}
              removedItemsIds={removedItemIds}
              onToggleCurrentItem={removeItemById}
              onToggleRemovedItem={restoreRemovedItem}
              itemsSelector={selectAllSpellsAcrossPowers}
              renderItem={renderSpellItem}
              onImport={handleImportSpells}
              isPending={isPending}
            />

          </div>

          <div className='grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'>
          {
            spells.map((spell, spellIndex) => <EditSpellView key={spell.id} spell={spell} powerIndex={index} powerStrength={power.level + power.bonus} spellIndex={spellIndex} onRemove={() => removeItemAtIndex(spellIndex)} isImported={importedIds.has(spell.id)} isRemoved={false} />) 
          }
          {
            removedItems.map(spell => <EditSpellView key={spell.id} spell={spell} powerIndex={index} powerStrength={power.level + power.bonus} spellIndex={-1} onRestore={() => restoreRemovedItem(spell.id)} isImported={false} isRemoved={true} />)
          }
          </div>
        </div>
      </CardContent>

    </Card>
  );
};

function NotNameOrTypeOrId(key: keyof PowerDto): boolean
{
  return key !== 'name' && key !== 'description' && key !== 'type' && key !== 'id' && key !== 'spells' && key !== 'powerSpecificationId';
}

function InputFormWithLabel(index: number, powerFieldName: keyof PowerDto)
{   
  const fieldPath = pathToPowerField(index, powerFieldName);

  return (
    <div key={powerFieldName} className="flex flex-col items-center gap-2">
      <Label className="text-center capitalize">{displayedText[powerFieldName as keyof typeof displayedText]}</Label>
      <InputFormField<CombatDto> path={fieldPath} inputClassName='w-16 h-10 text-center font-medium' />
    </div>
  );
}

type EditSpellViewProps =
{
  spell: Spell;
  powerIndex: number;
  powerStrength: number;
  spellIndex: number;
  isImported: boolean;
  isRemoved: boolean;
  onRemove?: () => void;
  onRestore?: () => void;
}

function EditSpellView({ spell, powerIndex, powerStrength, spellIndex, isImported, isRemoved, onRemove, onRestore }: EditSpellViewProps)
{
  const actualSpellCost = calculateSpellCost(spell.cost, powerStrength);
  const formattedSpellCost = formatSpellCost(spell.cost);

  return (
    <PerkableEditView>

      <SummaryView entity={spell} tagsVariant="outline" />
      {isRemoved ? <RemovedBadge /> : <ImportedBadge isImported={isImported} />}

      <div className="flex flex-row gap-2">
        <Badge variant="cost" className="h-9 w-14 capitalize " title={formattedSpellCost}>
          <div>{costIcon}</div>
          <div>{actualSpellCost}</div>
        </Badge>
        <Badge className='flex p-2 items-center justify-center rounded-r-md pointer-events-none' variant={getBadgeVariant(spell.castTime)}>
          {cooldownIcon()}
          <span>{spell.cooldown || battleIcon("scale-80")}</span>
        </Badge>
        {isRemoved ? <RestoreItemButton onRestore={onRestore ?? (() => {})} /> : <RemoveFromArrayButton onRemove={onRemove} />}
        {!isRemoved && !isImported && <EditSpellSheet spellIndex={spellIndex} powerIndex={powerIndex} />}
      </div>

    </PerkableEditView>
  );
}

type EditSpellSheetProps = 
{
  powerIndex: number;
  spellIndex: number;
};

function EditSpellSheet({ powerIndex, spellIndex }: EditSpellSheetProps)
{
  const type = pathToSpell(powerIndex, spellIndex);

  return (
    <EditCharacterCombatPerkSheet type={type} displayedTitle={displayedText.editSpell} >
      <SpellEditableFields pathPrefix={type + "."}  />
    </EditCharacterCombatPerkSheet>
  )
}
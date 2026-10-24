"use client";

import { CharacterMembershipAction } from '@/application/compendium/character-scope/CharacterMembershipAction';
import client from "@/infrastructure/clients/racesClient";
import { type Race } from "@/domain/Race";
import { displayedText } from '@/common/translations';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { RaceDto, raceSchema } from "@/persistence/schemas/characters/raceSchema";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { EditSheet } from "@/common/components/sheets/EditSheet";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";
import PerkableBadgeView from "@/application/compendium/PerkableBadgeView";
import { Table, TableBody, TableCell, TableRow } from "@/common/components/ui/table";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import AreaInputFormField from '@/common/components/form/AreaInputFormField';
import FormTagsInput from '@/common/components/inputs/FormTagsInput';
import { FieldPath } from 'react-hook-form';

type RaceViewProps =
{
  race: Race;
  disableEdit?: boolean;
  characterScope?: boolean;
  onDelete?: (id: string) => void;
}

export default function RaceView({ race, disableEdit = false, characterScope = false, onDelete }: RaceViewProps)
{
  const { deleteEntity: deleteRace, isPending } = useDeleteEntity
  ({
    client,
    queryKey: ['races'],
    redirectPath: onDelete ? undefined : '/compendium/races',
    onOptimisticDelete: onDelete
  });

  const getModifierColorClass = (modifier: number): string => 
  {
    if (modifier > 0) return "text-green-600 dark:text-green-400 font-semibold";
    if (modifier < 0) return "text-red-600 dark:text-red-400 font-semibold";
    return "text-muted-foreground";
  };

  const formatModifier = (modifier: number): string => 
{
    if (modifier > 0) return `+${modifier}`;
    return modifier.toString();
  };

  const characteristicsLeft = 
  [
    { name: displayedText.strength, modifier: race.strengthModifier },
    { name: displayedText.dexterity, modifier: race.dexterityModifier },
    { name: displayedText.constitution, modifier: race.constitutionModifier },
  ];

  const characteristicsRight = 
  [
    { name: displayedText.mind, modifier: race.mindModifier },
    { name: displayedText.charisma, modifier: race.charismaModifier },
    { name: displayedText.spellborn, modifier: race.spellbornModifier }
  ];

  const renderCharacteristicsTable = (chars: { name: string; modifier: number }[]) => (
    <div className="p-2 rounded-md border flex-1">
      <Table>
        <TableBody>
        {
          chars.map(char => (
            <TableRow key={char.name}>
              <TableCell className="font-medium capitalize">{char.name}</TableCell>
              <TableCell className={`text-right ${getModifierColorClass(char.modifier)}`}>
              {formatModifier(char.modifier)}
              </TableCell>
            </TableRow>
          ))
        }
        </TableBody>
      </Table>
    </div>
  );

  return (
    <CompendiumView characterActions={characterScope ? <CharacterMembershipAction kind="races" entityId={race.id} label={race.name} /> : undefined}>

      <SummaryView entity={race} />

      <div className="flex flex-row place-items-center place-content-center gap-2">

        <div className="flex flex-row gap-2 w-full">
          {renderCharacteristicsTable(characteristicsLeft)}
          {renderCharacteristicsTable(characteristicsRight)}
        </div>

        <PerkableBadgeView>
        {
          !disableEdit && (
            <CompendiumEditView>
            <DeleteButton id={race.id} isPending={isPending} deleteAction={deleteRace} />
            
            <EditFormForSheet<RaceDto> 
              entityId={race.id}
              defaultValues={race}
              schema={raceSchema}
              updateFn={client.update}
              formId={createCompendiumFormId.race(race.id)}
              renderSheetContent=
              {
                (isPending, formId) => (
                  <EditSheet
                    isPending={isPending}
                    formId={formId}
                    title={displayedText.editRace}
                  >
                    <div className="grid auto-rows-min gap-3">
                      <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.name}</span></Label>
                      <InputFormField<Race> 
                        path={'name' as FieldPath<Race>}  
                        inputPlaceholder={displayedText.changeName} 
                        inputClassName='w-full' 
                      />
                    </div>

                    <div className="grid auto-rows-min gap-3">
                      <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.description}</span></Label>
                      <AreaInputFormField<Race> 
                        path={'description' as FieldPath<Race>} 
                        inputPlaceholder={displayedText.changeDescription} 
                        inputClassName='w-full' 
                      />
                    </div>

                    <FormTagsInput<Race> path={'tags' as FieldPath<Race>} entityType="races" />

                    <div className="grid auto-rows-min gap-3 place-content-center place-items-center">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid auto-rows-min gap-2">
                          <Label className='text-xs capitalize'>{displayedText.strength}</Label>
                          <InputFormField<Race> 
                            path={'strengthModifier' as FieldPath<Race>} 
                            numeric inputClassName='w-20 h-10 text-center font-medium'
                          />
                        </div>
                        <div className="grid auto-rows-min gap-2">
                          <Label className='text-xs capitalize'>{displayedText.dexterity}</Label>
                          <InputFormField<Race> 
                            path={'dexterityModifier' as FieldPath<Race>} 
                            numeric inputClassName='w-20 h-10 text-center font-medium'
                          />
                        </div>
                        <div className="grid auto-rows-min gap-2">
                          <Label className='text-xs capitalize'>{displayedText.constitution}</Label>
                          <InputFormField<Race> 
                            path={'constitutionModifier' as FieldPath<Race>} 
                            numeric inputClassName='w-20 h-10 text-center font-medium'
                          />
                        </div>
                        <div className="grid auto-rows-min gap-2">
                          <Label className='text-xs capitalize'>{displayedText.mind}</Label>
                          <InputFormField<Race> 
                            path={'mindModifier' as FieldPath<Race>} 
                            numeric inputClassName='w-20 h-10 text-center font-medium'
                          />
                        </div>
                        <div className="grid auto-rows-min gap-2">
                          <Label className='text-xs capitalize'>{displayedText.charisma}</Label>
                          <InputFormField<Race> 
                            path={'charismaModifier' as FieldPath<Race>} 
                            numeric inputClassName='w-20 h-10 text-center font-medium'
                          />
                        </div>
                        <div className="grid auto-rows-min gap-2">
                          <Label className='text-xs capitalize'>{displayedText.spellborn}</Label>
                          <InputFormField<Race> 
                            path={'spellbornModifier' as FieldPath<Race>} 
                            numeric inputClassName='w-20 h-10 text-center font-medium'
                          />
                        </div>
                      </div>
                    </div>
                  </EditSheet>
                )
              }
              cacheKeys={['races']}
            />

            </CompendiumEditView>
          )
        }
        </PerkableBadgeView>
      </div>
    </CompendiumView>
  );
}

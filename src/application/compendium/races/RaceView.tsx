"use client";

import client from "@/infrastructure/clients/racesClient";
import { type Race } from "@/domain/Race";
import { displayedText } from '@/presentation/translations';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { RaceDto, raceSchema } from "@/persistence/schemas/characters/raceSchema";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import RaceEditSheet from "@/application/compendium/races/RaceEditSheet";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";
import PerkableBadgeView from "@/application/compendium/PerkableBadgeView";
import { Table, TableBody, TableCell, TableRow } from "@/common/components/ui/table";

type RaceViewProps =
{
  race: Race;
  disableEdit?: boolean;
}

export default function RaceView({ race, disableEdit = false }: RaceViewProps)
{
  const { deleteEntity: deleteRace, isPending } = useDeleteEntity
  ({
    client,
    queryKey: ['races'],
    redirectPath: '/compendium/races'
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

  const characteristics = 
  [
    { name: displayedText.strength, modifier: race.strengthModifier },
    { name: displayedText.dexterity, modifier: race.dexterityModifier },
    { name: displayedText.constitution, modifier: race.constitutionModifier },
    { name: displayedText.mind, modifier: race.mindModifier },
    { name: displayedText.charisma, modifier: race.charismaModifier },
    { name: displayedText.spellborn, modifier: race.spellbornModifier }
  ];

  return (
    <CompendiumView>

      <SummaryView entity={race} />

      <div className="flex flex-row place-items-center place-content-center">


        <div className="p-2 rounded-md w-full border">
          <Table>
            <TableBody>
            {
              characteristics.map(char => (
                <TableRow key={char.name}>
                  <TableCell className="font-medium capitalize">{char.name}</TableCell>
                  <TableCell className={`text-right ${getModifierColorClass(char.modifier)}`}>
                  {formatModifier(char.modifier)}
                  </TableCell>
                </TableRow>
                )
              )
            }
            </TableBody>
          </Table>
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
                  <RaceEditSheet
                    isPending={isPending}
                    formId={formId}
                    displayedTitle={displayedText.editRace}
                  />
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

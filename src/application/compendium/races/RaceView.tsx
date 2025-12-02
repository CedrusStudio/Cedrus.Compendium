"use client";

import client from "@/infrastructure/clients/racesClient";
import { type Race } from "@/domain/Race";
import { displayedText } from '@/presentation/translations';
import { Badge } from '@/common/components/ui/badge';
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

type RaceViewProps =
{
  race: Race;
  disableEdit?: boolean;
}

export default function RaceView({ race, disableEdit = false }: RaceViewProps)
{
  const { deleteEntity: deleteRace, isPending } = useDeleteEntity({
    client,
    queryKey: ['races'],
    redirectPath: '/compendium/races'
  });

  const getModifierBadgeVariant = (modifier: number): "default" | "secondary" | "destructive" => {
    if (modifier > 0) return "default";
    if (modifier < 0) return "destructive";
    return "secondary";
  };

  const formatModifier = (modifier: number): string => {
    if (modifier > 0) return `+${modifier}`;
    return modifier.toString();
  };

  return (
    <CompendiumView>

      <SummaryView entity={race} />

      <div className="p-2 rounded-md w-full">
        <div className="grid grid-cols-2 gap-2">
          <Badge variant={getModifierBadgeVariant(race.strengthModifier)} className="h-9 justify-center capitalize">
            <div>{displayedText.strength}: {formatModifier(race.strengthModifier)}</div>
          </Badge>
          <Badge variant={getModifierBadgeVariant(race.dexterityModifier)} className="h-9 justify-center capitalize">
            <div>{displayedText.dexterity}: {formatModifier(race.dexterityModifier)}</div>
          </Badge>
          <Badge variant={getModifierBadgeVariant(race.constitutionModifier)} className="h-9 justify-center capitalize">
            <div>{displayedText.constitution}: {formatModifier(race.constitutionModifier)}</div>
          </Badge>
          <Badge variant={getModifierBadgeVariant(race.mindModifier)} className="h-9 justify-center capitalize">
            <div>{displayedText.mind}: {formatModifier(race.mindModifier)}</div>
          </Badge>
          <Badge variant={getModifierBadgeVariant(race.charismaModifier)} className="h-9 justify-center capitalize">
            <div>{displayedText.charisma}: {formatModifier(race.charismaModifier)}</div>
          </Badge>
          <Badge variant={getModifierBadgeVariant(race.spellbornModifier)} className="h-9 justify-center capitalize">
            <div>{displayedText.spellborn}: {formatModifier(race.spellbornModifier)}</div>
          </Badge>
        </div>
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

    </CompendiumView>
  );
}

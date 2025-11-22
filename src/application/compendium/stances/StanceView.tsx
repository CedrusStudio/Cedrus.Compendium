"use client";

import client from "@/infrastructure/clients/stancesClient";
import { type Mode } from "@/domain/characters/combat/Mode";
import { displayedText } from '@/presentation/translations';
import { priceIcon } from '@/presentation/icons';
import { Badge } from '@/common/components/ui/badge';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { ModeDto, modeSchema } from "@/persistence/schemas/characters/combat/modeSchema";
import RequirementsView from "@/application/common/RequirementsView";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { PerkableEditSheet } from "@/application/common/PerkableEditSheet";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";

type StanceViewProps =
{
  stance: Mode;
  disableEdit?: boolean;
}

export default function StanceView({ stance, disableEdit = false }: StanceViewProps)
{
  const { deleteEntity: deleteStance, isPending } = useDeleteEntity({
    client,
    queryKey: ['stances'],
    redirectPath: '/compendium/stances'
  });

  return (
    <CompendiumView>

      <SummaryView entity={stance} />

      <div className="p-2 rounded-md w-full">
        <RequirementsView entityWithRequirements={stance} />
      </div>
      
      <div className="flex flex-row items-center gap-2">

        <Badge variant="secondary" className="h-9 w-10 capitalize">
          <div>{priceIcon}</div>
          <div>{stance.price}</div>
        </Badge>
        {
          !disableEdit && (
            <CompendiumEditView>
              <DeleteButton id={stance.id} isPending={isPending} deleteAction={deleteStance} />

              <EditFormForSheet<ModeDto> 
                entityId={stance.id}
                defaultValues={stance}
                schema={modeSchema}
                updateFn={client.update}
                formId={createCompendiumFormId.stance(stance.id)}
                renderSheetContent=
                {
                  (isPending, formId) => (
                    <PerkableEditSheet
                      isPending={isPending}
                      formId={formId}
                      displayedTitle={displayedText.editStance}
                    />
                  )
                }
                cacheKeys={['stances']}
              />

            </CompendiumEditView>
          )
        }
      </div>

    </CompendiumView>
  );
}
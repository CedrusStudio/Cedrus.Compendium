"use client";

import client from "@/infrastructure/clients/powerSpecificationsClient";
import { type PowerSpecification } from "@/domain/characters/combat/Power";
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { PowerSpecificationDto, powerSpecificationSchema } from "@/persistence/schemas/characters/combat/powerSchema";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";
import PowerSpecificationEditableFields from "@/application/common/combat/PowerSpecificationEditableFields";
import PowerSpecificationViewFields from "@/application/common/combat/PowerSpecificationViewFields";
import SubmitButton from "@/common/components/form/SubmitButton";
import { Button } from '@/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { displayedText } from '@/presentation/translations';
import { editIcon } from '@/presentation/icons';

type PowersSpecificationViewProps =
{
  powerSpecification: PowerSpecification;
  disableEdit?: boolean;
}

export default function PowersSpecificationView({ powerSpecification, disableEdit = false }: PowersSpecificationViewProps)
{
  const { deleteEntity: deletePowerSpecification, isPending } = useDeleteEntity
  ({
    client,
    queryKey: ['powerSpecifications'],
    redirectPath: '/compendium/powers'
  });

  return (
    <CompendiumView>

      <PowerSpecificationViewFields powerSpecification={powerSpecification} collapsible={true} defaultOpen={false} />
      
      {
        !disableEdit && (
          <CompendiumEditView>
            <DeleteButton id={powerSpecification.id} isPending={isPending} deleteAction={deletePowerSpecification} />

            <EditFormForSheet<PowerSpecificationDto> 
              entityId={powerSpecification.id}
              defaultValues={powerSpecification}
              schema={powerSpecificationSchema}
              updateFn={client.update}
              formId={createCompendiumFormId.spell(powerSpecification.id)}
              renderSheetContent=
              {
                (isPending, formId) => <EditPowerSpecificationSheet isPending={isPending} formId={formId} />
              }
              cacheKeys={['powerSpecifications']}
            />

          </CompendiumEditView>
        )
      }

    </CompendiumView>
  );
}

function EditPowerSpecificationSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{editIcon}</Button>
      </SheetTrigger>

      <SheetContent className="w-full">
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>Edycja specyfikacji mocy</SheetTitle>
          <SheetDescription>
           {displayedText.clickSave}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4">
          <PowerSpecificationEditableFields  />
        </div>

        <SheetFooter>
          <SubmitButton isPending={isPending} className="w-full" formName={formId} />
          <SheetClose className="capitalize" asChild>
            <Button variant="outline" type='button'>{displayedText.close}</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>

    </Sheet>
  )
}
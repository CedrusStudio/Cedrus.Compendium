import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/ui/sheet";
import SubmitButton from '@/ui/SubmitButton';
import { InputFormField } from '@/ui/InputFormField';
import { PropsWithChildren } from 'react';
import { Button } from "@/ui/button"
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import { EquipmentItemTypes } from "@/domain/characters/Character";
import { Label } from "@/ui/label";
import { TbEdit } from "react-icons/tb";
import AreaInputFormField from "@/common/components/ui/AreaInputFormField";
import { IoTrashOutline } from "react-icons/io5";

type EditItemSheetProps = 
{
  equipmentFormName: string;
  item: { name: string; description: string; type: EquipmentItemTypes };
  isPending: boolean;
};

export default function EditItemSheet({ item, isPending, children, equipmentFormName }: PropsWithChildren<EditItemSheetProps>)
{
  return (
      <Sheet>

        <div className="flex justify-end items-center mt-4 gap-3">
          <Button variant="destructive" type="button"><IoTrashOutline /></Button>
          <SheetTrigger asChild>
            <Button variant="edit"><TbEdit /></Button>
          </SheetTrigger>
        </div>

        <SheetContent>
          
          <SheetHeader>
            <SheetTitle>Edytujesz przedmiot</SheetTitle>
            <SheetDescription>
              Kliknij zapisz, gdy skończysz.
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-6">

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Nazwa</Label>
                
                <InputFormField<UpsertCharacterEquipmentType> 
                  path={`${item.type}.name`}
                  inputPlaceholder="edytuj nazwę..." 
                  inputClassName='w-80'
                />
            </div>

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Opis</Label>
                
                <AreaInputFormField<UpsertCharacterEquipmentType> 
                  path={`${item.type}.description`}
                  inputPlaceholder="edytuj opis..." 
                />
            </div>

            {children}

          </div>

          <SheetFooter>
            <SubmitButton isPending={isPending} className='w-full' formName={equipmentFormName} />
            <SheetClose asChild>
              <Button variant="outline">Zamknij</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>

      </Sheet>
    )
}
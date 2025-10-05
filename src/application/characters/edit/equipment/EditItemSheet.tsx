
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
import { useFormContext } from "react-hook-form";
import { ItemTypes } from "@/domain/characters/Character";
import { Label } from "@/ui/label";
import { TbEdit } from "react-icons/tb";

type EditItemSheetProps = 
{
  equipmentFormName: string;
  item: { name: string; description: string; type: ItemTypes };
  isPending: boolean;
};

export default function EditItemSheet({ item, isPending, children, equipmentFormName }: PropsWithChildren<EditItemSheetProps>)
{
  const { control } = useFormContext<UpsertCharacterEquipmentType>();

  return (
      <Sheet>

        <SheetTrigger asChild className='mt-4'>
          <Button variant="edit"><TbEdit /></Button>
        </SheetTrigger>

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
                    name={`${item.type}.name`}
                    control={control}
                    inputPlaceholder="edytuj nazwę..." 
                    inputClassName='w-80'
                />
            </div>

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Opis</Label>
                
                <InputFormField<UpsertCharacterEquipmentType> 
                    name={`${item.type}.description`}
                    control={control}
                    inputPlaceholder="edytuj opis..." 
                    inputClassName='w-80'
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

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import SubmitButton from '@/components/ui/SubmitButton';
import { InputFormField } from '@/components/ui/InputFormField';
import { PropsWithChildren } from 'react';
import { Button } from "@/components/ui/button"
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import { ItemTypes } from "@/domain/Character";
import { Label } from "@/components/ui/label";
import { TbEdit } from "react-icons/tb";

type EditItemSheetProps = 
{
  equipmentFormName: string;
  item: { name: string; description: string; type: ItemTypes };
  control: Control<UpsertCharacterEquipmentType>;
  isPending: boolean;
};

export default function EditItemSheet({ item, control, isPending, children, equipmentFormName }: PropsWithChildren<EditItemSheetProps>)
{
  return (
      <Sheet>

        <SheetTrigger asChild className='mt-4'>
          <Button variant="edit"><TbEdit /></Button>
        </SheetTrigger>

        <SheetContent>
          
          <SheetHeader>
            <SheetTitle>Edit {item.type}</SheetTitle>
            <SheetDescription>
              Click save when you&apos;re done.
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-6">

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Name</Label>
                
                <InputFormField<UpsertCharacterEquipmentType> 
                    name={`${item.type}.name`}
                    control={control}
                    inputPlaceholder="edit name..." 
                    inputClassName='w-80'
                />
            </div>

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Description</Label>
                
                <InputFormField<UpsertCharacterEquipmentType> 
                    name={`${item.type}.description`}
                    control={control}
                    inputPlaceholder="edit description..." 
                    inputClassName='w-80'
                />
            </div>

            {children}

          </div>

          <SheetFooter>
            <SubmitButton isPending={isPending} className='w-full' formName={equipmentFormName} />
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>

      </Sheet>
    )
}
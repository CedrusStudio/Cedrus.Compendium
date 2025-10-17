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
import { InputFormField } from '@/common/components/form/InputFormField';
import { PropsWithChildren } from 'react';
import { Button } from "@/ui/button"
import { type EquipmentDto } from "@/persistence/schemas/characters/equipment/equipmentSchema";
import { EquipmentItemTypes, splitEquipmentItemTypes } from "@/domain/characters/equipment/Equipment";
import { Label } from "@/ui/label";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import { useFieldArray } from "react-hook-form";
import RemoveFromArrayButton from "@/common/components/form/RemoveFromArrayButton";
import { displayedText } from "@/presentation/translations";
import { editIcon } from "@/presentation/icons";


type EditItemSheetProps = 
{
  item: { name: string; description: string; type: EquipmentItemTypes };
};

export default function EditItemSheet({ item, children }: PropsWithChildren<EditItemSheetProps>)
{
  const { name, index } = splitEquipmentItemTypes(item.type);
  const { remove } = useFieldArray<EquipmentDto>({ name });

  return (
    <Sheet>

      <div className="flex justify-end items-center mt-4 gap-3">
        <RemoveFromArrayButton remove={remove} index={index} />
        <SheetTrigger asChild>
          <Button variant="edit">{editIcon}</Button>
        </SheetTrigger>
      </div>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className="first-letter:uppercase">{displayedText.editingItem}</SheetTitle>
          <SheetDescription>{displayedText.clickSave}</SheetDescription>
        </SheetHeader>

        <div className="grid gap-6">

          <div className="grid auto-rows-min gap-3 px-4">

            <Label className="px-6 capitalize">{displayedText.name}</Label>
            
            <InputFormField<EquipmentDto> 
              path={`${item.type}.name`}
              inputPlaceholder={displayedText.changeName}
              inputClassName='w-80'
            />
              
          </div>

          <div className="grid auto-rows-min gap-3 px-4">

            <Label className="capitalize">{displayedText.description}</Label>
            
            <AreaInputFormField<EquipmentDto> 
              path={`${item.type}.description`}
              inputPlaceholder={displayedText.changeDescription}
            />
            
          </div>

          {children}

        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" className="capitalize">{displayedText.close}</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>

    </Sheet>
  )
}
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
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import { EquipmentItemTypes, splitEquipmentItemTypes } from "@/domain/characters/equipment/Equipment";
import { Label } from "@/ui/label";
import { TbEdit } from "react-icons/tb";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import { useFieldArray } from "react-hook-form";
import RemoveFromArrayButton from "@/common/components/form/RemoveFromArrayButton";
import { translate } from "@/domain/data/translations";

type EditItemSheetProps = 
{
  item: { name: string; description: string; type: EquipmentItemTypes };
};

export default function EditItemSheet({ item, children }: PropsWithChildren<EditItemSheetProps>)
{
  const { name, index } = splitEquipmentItemTypes(item.type);
  const { remove } = useFieldArray<UpsertCharacterEquipmentType>({ name });

  return (
      <Sheet>

        <div className="flex justify-end items-center mt-4 gap-3">
          <RemoveFromArrayButton remove={remove} index={index} />
          <SheetTrigger asChild>
            <Button variant="edit"><TbEdit /></Button>
          </SheetTrigger>
        </div>

        <SheetContent>
          
          <SheetHeader>
            <SheetTitle className="capitalize">{translate("editingItem")}</SheetTitle>
            <SheetDescription>{translate("clickSave")}</SheetDescription>
          </SheetHeader>

          <div className="grid gap-6">

            <div className="grid auto-rows-min gap-3 px-4">

              <Label className="px-6 capitalize">{translate("name")}</Label>
              
              <InputFormField<UpsertCharacterEquipmentType> 
                path={`${item.type}.name`}
                inputPlaceholder={translate("changeName")}
                inputClassName='w-80'
              />
                
            </div>

            <div className="grid auto-rows-min gap-3 px-4">

              <Label className="capitalize">{translate("description")}</Label>
              
              <AreaInputFormField<UpsertCharacterEquipmentType> 
                path={`${item.type}.description`}
                inputPlaceholder={translate("changeDescription")}
              />
              
            </div>

            {children}

          </div>

          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline" className="capitalize">{translate("close")}</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>

      </Sheet>
    )
}
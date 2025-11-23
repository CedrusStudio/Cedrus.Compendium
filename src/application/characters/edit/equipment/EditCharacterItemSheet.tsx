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
import { PropsWithChildren } from 'react';
import { Button } from "@/ui/button"
import { EquipmentItemTypes } from "@/domain/characters/equipment/Equipment";
import { displayedText } from "@/presentation/translations";
import { editIcon } from "@/presentation/icons";
import ItemEditableFields from "@/application/common/equipment/EditSheets/ItemEditableFields";

type EditItemSheetProps = 
{
  type: EquipmentItemTypes;
};

export default function EditCharacterItemSheet({ type, children }: PropsWithChildren<EditItemSheetProps>)
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="edit" size='icon'>{editIcon}</Button>
      </SheetTrigger>

      <SheetContent className="w-full">
        
        <SheetHeader>
          <SheetTitle className="first-letter:uppercase">{displayedText.editingItem}</SheetTitle>
          <SheetDescription>{displayedText.clickSave}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col flex-wrap place-content-center gap-3">
          <ItemEditableFields pathPrefix={`${type}.`} />
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